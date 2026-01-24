import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, MapPin, ArrowLeft, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Tables } from '@/integrations/supabase/types';

type DbEvent = Tables<'events'>;

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  tiers: string[];
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [claimedTicketIds, setClaimedTicketIds] = useState<Set<string>>(
    new Set(),
  );
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { role } = useUserRole(session);
  const { displayName } = useUserProfile(user);

  useEffect(() => {
    checkAuth();
    if (id) {
      fetchEvent();
      fetchTicketTypes();
    }
  }, [id]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);

    if (session?.user && id) {
      fetchClaimedTickets(session.user.id);
    }
  };

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load event',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketTypes = async () => {
    try {
      const { data: types, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', id);

      if (error) throw error;

      const mappedTypes = (types || []).map((type) => {
        const tierCriteria = type.tier_criteria as string[] | null;
        return {
          id: type.id,
          name: type.name,
          description: type.description,
          price: Number(type.price),
          quantity: type.quantity,
          tiers: tierCriteria || [],
        };
      });

      setTicketTypes(mappedTypes);
    } catch (error) {
      console.error('Error fetching ticket types:', error);
    }
  };

  const fetchClaimedTickets = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_claims')
        .select('event_id')
        .eq('user_id', userId)
        .eq('event_id', id);

      if (error) throw error;

      // For simplicity, track if user has claimed any ticket for this event
      const claimed = new Set(
        data?.map((claim) => claim.event_id).filter(Boolean) || [],
      );
      setClaimedTicketIds(claimed);
    } catch (error) {
      console.error('Error fetching claimed tickets:', error);
    }
  };

  const handleClaimTicket = async (ticketTypeId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    console.log('[EventDetail] Starting ticket claim process');
    console.log('[EventDetail] Event ID:', id);
    console.log('[EventDetail] User ID:', user.id);
    console.log('[EventDetail] Ticket Type ID:', ticketTypeId);

    try {
      // Check if already claimed for this event
      if (claimedTicketIds.has(id!)) {
        console.log(
          '[EventDetail] User has already claimed a ticket for this event',
        );
        toast({
          variant: 'destructive',
          title: 'Already claimed',
          description: 'You have already claimed a ticket for this event',
        });
        return;
      }

      // Check event capacity
      if (!event) {
        console.error('[EventDetail] Event data not loaded');
        return;
      }

      console.log('[EventDetail] Event capacity:', event.capacity);
      console.log('[EventDetail] Event claimed count:', event.claimed_count);

      if (event.claimed_count >= event.capacity) {
        console.log('[EventDetail] Event is at full capacity');
        toast({
          variant: 'destructive',
          title: 'Event full',
          description: 'This event has reached maximum capacity',
        });
        return;
      }

      // Get the ticket type to verify it exists and user has access
      const ticketType = ticketTypes.find((tt) => tt.id === ticketTypeId);
      if (!ticketType) {
        console.error('[EventDetail] Ticket type not found:', ticketTypeId);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Invalid ticket type',
        });
        return;
      }

      console.log('[EventDetail] Ticket type:', ticketType.name);

      // Find an available ticket for this event
      const { data: availableTicket, error: ticketError } = await supabase
        .from('tickets')
        .select('id')
        .eq('event_id', id!)
        .eq('is_claimed', false)
        .limit(1)
        .maybeSingle();

      if (ticketError) {
        console.error(
          '[EventDetail] Error finding available ticket:',
          ticketError,
        );
        throw ticketError;
      }

      if (!availableTicket) {
        toast({
          variant: 'destructive',
          title: 'No tickets available',
          description: 'All tickets for this event have been claimed',
        });
        return;
      }

      // Create the ticket claim
      const { error: claimError } = await supabase
        .from('ticket_claims')
        .insert({
          user_id: user.id,
          event_id: id!,
          ticket_id: availableTicket.id,
        });

      if (claimError) {
        console.error('[EventDetail] Error creating ticket claim:', claimError);
        throw claimError;
      }

      // Mark the ticket as claimed
      const { error: markClaimedError } = await supabase
        .from('tickets')
        .update({
          is_claimed: true,
          claimed_by: user.id,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', availableTicket.id);

      if (markClaimedError) {
        console.error(
          '[EventDetail] Error marking ticket as claimed:',
          markClaimedError,
        );
      }

      console.log('[EventDetail] Ticket claim created successfully');

      // Increment claimed count using RPC function
      await supabase.rpc('increment_event_claimed_count', { event_id: id });
      console.log('[EventDetail] Event claimed count incremented');

      toast({
        title: 'Ticket claimed!',
        description:
          "You'll receive your ticket via email 1 day before the event",
      });

      fetchClaimedTickets(user.id);
      fetchEvent();
    } catch (error: any) {
      console.error('[EventDetail] Error claiming ticket:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to claim ticket',
      });
    }
  };

  const handleUnclaimTicket = async () => {
    if (!user) return;

    console.log('[EventDetail] Starting unclaim process');
    console.log('[EventDetail] Event ID:', id);
    console.log('[EventDetail] User ID:', user.id);

    try {
      // Delete the ticket claim
      const { error: deleteError } = await supabase
        .from('ticket_claims')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', id);

      if (deleteError) {
        console.error(
          '[EventDetail] Error deleting ticket claim:',
          deleteError,
        );
        throw deleteError;
      }

      console.log('[EventDetail] Ticket claim deleted successfully');

      // Decrement claimed count using RPC function
      await supabase.rpc('decrement_event_claimed_count', { event_id: id });
      console.log('[EventDetail] Event claimed count decremented');

      toast({
        title: 'Ticket unclaimed',
        description: 'Your ticket has been released',
      });

      fetchClaimedTickets(user.id);
      fetchEvent();
    } catch (error: any) {
      console.error('[EventDetail] Error unclaiming ticket:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to unclaim ticket',
      });
    }
  };

  const hasClaimedEvent = claimedTicketIds.has(id!);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {user ? (
          <div className="flex min-h-screen">
            <ModernSidebar
              userEmail={user.email}
              displayName={displayName || undefined}
              isAdmin={role === 'admin'}
            />
            <div className="flex-1">
              <div className="container mx-auto px-4 py-16 text-center">
                <p className="text-muted-foreground">Loading event...</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Navbar />
            <div className="container mx-auto px-4 py-16 text-center">
              <p className="text-muted-foreground">Loading event...</p>
            </div>
            <Footer />
          </>
        )}
      </div>
    );
  }

  if (!event) {
    const notFoundContent = (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <Link to="/events">
          <Button>Back to Events</Button>
        </Link>
      </div>
    );

    if (user) {
      return (
        <div className="flex min-h-screen bg-background">
          <ModernSidebar
            userEmail={user.email}
            isAdmin={role === 'admin'}
          />
          <div className="flex-1">{notFoundContent}</div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        {notFoundContent}
        <Footer />
      </div>
    );
  }

  const eventContent = (
    <>
      <div className="container mx-auto px-8 py-16">
        <Link
          to="/events"
          className="inline-flex items-center text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {event.image_url && (
            <div className="rounded-lg overflow-hidden h-96">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className={event.image_url ? '' : 'lg:col-span-2'}>
            <Badge className="mb-4">{event.genre}</Badge>
            <h1 className="text-5xl font-bold mb-4 text-primary">
              {event.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              {event.event_type}
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-lg">
                <Calendar className="w-6 h-6 text-primary" />
                <span>{format(new Date(event.event_date), 'PPPP p')}</span>
              </div>
              <div className="flex items-center gap-3 text-lg">
                <MapPin className="w-6 h-6 text-primary" />
                <div>
                  <div>{event.venue}</div>
                  <div className="text-sm text-muted-foreground">
                    {event.address}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-lg leading-relaxed">{event.description}</p>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Ticket Types</CardTitle>
            <CardDescription>
              {user
                ? 'Select a ticket type to claim'
                : 'Sign in to claim tickets'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!user && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please{' '}
                  <Link
                    to="/auth"
                    className="underline"
                  >
                    sign in
                  </Link>{' '}
                  to claim tickets
                </AlertDescription>
              </Alert>
            )}

            {ticketTypes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No ticket types available for this event yet
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {ticketTypes.map((ticketType) => {
                  const availableCount = ticketType.quantity;

                  return (
                    <Card
                      key={ticketType.id}
                      className="bg-muted/50 border-border"
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {ticketType.name}
                        </CardTitle>
                        <CardDescription>
                          {ticketType.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold">
                            ${ticketType.price}
                          </span>
                          <Badge variant="default">
                            {availableCount} available
                          </Badge>
                        </div>

                        {hasClaimedEvent ? (
                          <Button
                            onClick={handleUnclaimTicket}
                            variant="outline"
                            className="w-full"
                            size="lg"
                          >
                            Unclaim Ticket
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleClaimTicket(ticketType.id)}
                            disabled={!user}
                            className="w-full"
                            size="lg"
                          >
                            {!user ? 'Sign In to Claim' : 'Claim Ticket'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );

  if (user) {
    return (
      <div className="flex min-h-screen bg-background">
        <ModernSidebar
          userEmail={user.email}
          displayName={displayName || undefined}
          isAdmin={role === 'admin'}
        />
        <div className="flex-1">{eventContent}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {eventContent}
      <Footer />
    </div>
  );
}
