import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, ArrowLeft, Clock, Ticket, Lock, Info } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserProfile } from '@/hooks/useUserProfile';

interface TicketClaim {
  id: string;
  claimed_at: string;
  event: {
    id: string;
    title: string;
    venue: string;
    address: string;
    event_date: string;
    event_type: string | null;
    genre: string | null;
    image_url: string | null;
    description: string | null;
  };
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticketClaim, setTicketClaim] = useState<TicketClaim | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(false);
  const { role } = useUserRole(session);
  const { displayName } = useUserProfile(user);

  useEffect(() => {
    checkAuth();
    if (id) {
      fetchTicketClaim();
    }
  }, [id]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);

    if (!session?.user) {
      navigate('/auth');
    }
  };

  const handleReturnTicket = async () => {
    if (!ticketClaim || !user) return;

    const confirmReturn = window.confirm(
      'Are you sure you want to return this ticket? This action cannot be undone.'
    );

    if (!confirmReturn) return;

    setReturning(true);

    try {
      // Get the claim with ticket_id
      const { data: claimData, error: claimError } = await supabase
        .from('ticket_claims')
        .select('ticket_id, event_id')
        .eq('id', ticketClaim.id)
        .single();

      if (claimError) throw claimError;

      // Delete the claim
      const { error: deleteError } = await supabase
        .from('ticket_claims')
        .delete()
        .eq('id', ticketClaim.id);

      if (deleteError) throw deleteError;

      // If there's a ticket_id, mark it as unclaimed
      if (claimData.ticket_id) {
        const { error: ticketError } = await supabase
          .from('tickets')
          .update({
            is_claimed: false,
            claimed_by: null,
            claimed_at: null,
          })
          .eq('id', claimData.ticket_id);

        if (ticketError) throw ticketError;
      }

      // Decrement the event's claimed_count
      await supabase.rpc('decrement_event_claimed_count', {
        event_id: claimData.event_id,
      });

      toast({
        title: 'Ticket returned',
        description: 'Your ticket has been returned successfully.',
      });

      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error returning ticket:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to return ticket. Please try again.',
      });
    } finally {
      setReturning(false);
    }
  };

  const fetchTicketClaim = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_claims')
        .select(
          `
          id,
          claimed_at,
          event:events (
            id,
            title,
            venue,
            address,
            event_date,
            event_type,
            genre,
            image_url,
            description
          )
        `
        )
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (data && data.event) {
        setTicketClaim({
          id: data.id,
          claimed_at: data.claimed_at || '',
          event: {
            id: data.event.id,
            title: data.event.title,
            venue: data.event.venue,
            address: data.event.address,
            event_date: data.event.event_date,
            event_type: data.event.event_type,
            genre: data.event.genre,
            image_url: data.event.image_url,
            description: data.event.description,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load ticket',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <ModernSidebar
          userEmail={user?.email}
          displayName={displayName || undefined}
          isAdmin={role === 'admin'}
        />
        <div className="flex-1 md:ml-0 pt-14 md:pt-0">
          <div className="container mx-auto px-4 py-16 text-center">
            <p className="text-muted-foreground">Loading ticket...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ticketClaim || !user) {
    return (
      <div className="flex min-h-screen bg-background">
        <ModernSidebar
          userEmail={user?.email}
          displayName={displayName || undefined}
          isAdmin={role === 'admin'}
        />
        <div className="flex-1 md:ml-0 pt-14 md:pt-0">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold mb-4">Ticket not found</h1>
            <Link to="/dashboard">
              <Button>Back to My Tickets</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const eventDate = new Date(ticketClaim.event.event_date);
  const now = new Date();
  const daysUntilEvent = differenceInDays(eventDate, now);
  const isEventPast = eventDate < now;
  const isTicketAvailable = daysUntilEvent <= 1 && !isEventPast;

  return (
    <div className="flex min-h-screen bg-background">
      <ModernSidebar
        userEmail={user.email}
        displayName={displayName || undefined}
        isAdmin={role === 'admin'}
      />
      <main className="flex-1 md:ml-0 pt-14 md:pt-0">
        <div className="h-full overflow-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
            {/* Back Button */}
            <Link
              to="/dashboard"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Tickets
            </Link>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="h-6 w-6 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold">My Ticket</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {isTicketAvailable
                  ? 'Your ticket is ready!'
                  : isEventPast
                  ? 'This event has passed'
                  : `Ticket will be available 1 day before the event`}
              </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
              {/* Ticket Card - Main Section */}
              <div className="lg:col-span-3 space-y-4">
                {/* Ticket Preview */}
                <Card className="overflow-hidden border-2 border-primary/20">
                  <CardContent className="p-0">
                    {/* Ticket Header with Image */}
                    <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
                      {ticketClaim.event.image_url && (
                        <img
                          src={ticketClaim.event.image_url}
                          alt={ticketClaim.event.title}
                          className={`absolute inset-0 w-full h-full object-cover ${
                            !isTicketAvailable
                              ? 'blur-xl opacity-30'
                              : 'opacity-40'
                          }`}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                      {/* Locked Overlay */}
                      {!isTicketAvailable && !isEventPast && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                          <div className="p-6 rounded-full bg-background/90 backdrop-blur-sm mb-4">
                            <Lock className="w-12 h-12 text-primary" />
                          </div>
                          <h3 className="text-xl font-bold text-center px-4">
                            Ticket Locked
                          </h3>
                          <p className="text-sm text-muted-foreground text-center px-4 mt-2">
                            Available 1 day before the event
                          </p>
                        </div>
                      )}

                      {/* Event Badge */}
                      <div className="absolute top-4 right-4 z-20">
                        <Badge
                          className={`text-xs ${
                            isEventPast
                              ? 'bg-muted text-muted-foreground'
                              : isTicketAvailable
                              ? 'bg-green-500 text-white'
                              : 'bg-primary/90 text-primary-foreground'
                          }`}
                        >
                          {isEventPast
                            ? 'Past Event'
                            : isTicketAvailable
                            ? 'Active'
                            : 'Upcoming'}
                        </Badge>
                      </div>

                      {/* Genre Badge */}
                      {ticketClaim.event.genre && (
                        <div className="absolute top-4 left-4 z-20">
                          <Badge
                            variant="outline"
                            className="bg-background/80 backdrop-blur-sm"
                          >
                            {ticketClaim.event.genre}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Ticket Content */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">
                          {ticketClaim.event.title}
                        </h2>
                        {ticketClaim.event.event_type && (
                          <p className="text-sm text-muted-foreground uppercase tracking-wide">
                            {ticketClaim.event.event_type}
                          </p>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              {format(eventDate, 'EEEE, MMMM d, yyyy')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(eventDate, 'h:mm a')}
                            </p>
                          </div>
                        </div>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${ticketClaim.event.venue}, ${ticketClaim.event.address}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 group cursor-pointer"
                        >
                          <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                          <div>
                            <p className="font-medium group-hover:text-primary transition-colors">
                              {ticketClaim.event.venue}
                            </p>
                            <p className="text-sm text-muted-foreground group-hover:text-primary/70 transition-colors">
                              {ticketClaim.event.address}
                            </p>
                          </div>
                        </a>

                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Claimed</p>
                            <p className="text-sm text-muted-foreground">
                              {format(
                                new Date(ticketClaim.claimed_at),
                                'MMM d, yyyy'
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {isTicketAvailable && (
                        <div className="pt-4">
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                              <p className="text-sm font-semibold">
                                Ticket Active
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Present this ticket at the venue entrance. A
                              confirmation email has been sent to {user?.email}.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ticket Stub/Tear Line */}
                    <div className="relative h-8 bg-muted/30">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-dashed border-border" />
                      </div>
                      <div className="absolute -left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background border border-border" />
                      <div className="absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background border border-border" />
                    </div>

                    {/* Ticket Footer */}
                    <div className="p-4 bg-muted/30 text-center">
                      <p className="text-xs text-muted-foreground font-mono">
                        TICKET ID: {ticketClaim.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="lg:col-span-2 space-y-4">
                {/* Event Description */}
                {ticketClaim.event.description && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                        About Event
                      </h3>
                      <p className="text-sm leading-relaxed">
                        {ticketClaim.event.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Ticket Details */}
                <Card className="border-primary/20">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                        <Info className="h-4 w-4 text-primary" />
                        Access Details
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        A PDF Digital Ticket will be emailed to you on the day of the show. Please present this ticket at the venue entrance for admission.
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Important Information:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Tickets are non-transferable</li>
                        <li>Valid ID may be required at entry</li>
                        <li>Arrive 30 minutes before show time</li>
                        <li>Check your email spam folder if you don't receive the ticket</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    disabled={!isTicketAvailable}
                  >
                    {isTicketAvailable
                      ? 'Download Ticket'
                      : 'Not Available Yet'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <Link to={`/events/${ticketClaim.event.id}`}>
                      View Event Details
                    </Link>
                  </Button>
                  {!isEventPast && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleReturnTicket}
                      disabled={returning}
                    >
                      {returning ? 'Returning...' : 'Return Ticket'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
