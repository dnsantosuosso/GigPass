import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Ticket, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
  address: string;
  event_date: string;
  event_type: string;
  genre: string;
  capacity: number;
  claimed_count: number;
  image_url: string | null;
}

const ITEMS_PER_PAGE = 9;

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { role } = useUserRole(session);
  const { displayName } = useUserProfile(user);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [currentPage]);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Get total count first
      const { count, error: countError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('event_date', new Date().toISOString());

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Fetch paginated data
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .range(from, to);

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const navigate = useNavigate();
  const { toast } = useToast();
  const [claimingEventId, setClaimingEventId] = useState<string | null>(null);

  const handleClaimTicket = async (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/auth');
      return;
    }

    setClaimingEventId(eventId);

    try {
      // Check if user already has a ticket for this event
      const { data: existingClaim } = await supabase
        .from('ticket_claims')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingClaim) {
        toast({
          title: 'Already Claimed',
          description: 'You already have a ticket for this event.',
          variant: 'destructive',
        });
        return;
      }

      // Find an available ticket
      const { data: availableTicket, error: ticketError } = await supabase
        .from('tickets')
        .select('id')
        .eq('event_id', eventId)
        .eq('is_claimed', false)
        .limit(1)
        .maybeSingle();

      if (ticketError) throw ticketError;

      if (!availableTicket) {
        // Check if there are any tickets at all for this event
        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);

        const message = count === 0 
          ? 'Tickets have not been uploaded for this event yet.'
          : 'Sorry, all tickets have been claimed.';
          
        toast({
          title: 'No Tickets Available',
          description: message,
          variant: 'destructive',
        });
        return;
      }

      // Mark ticket as claimed
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          is_claimed: true,
          claimed_by: user.id,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', availableTicket.id);

      if (updateError) throw updateError;

      // Create ticket claim record
      const { error: claimError } = await supabase
        .from('ticket_claims')
        .insert({
          ticket_id: availableTicket.id,
          event_id: eventId,
          user_id: user.id,
        });

      if (claimError) throw claimError;

      // Increment claimed_count using RPC function
      await supabase.rpc('increment_event_claimed_count', { event_id: eventId });

      // Refresh events to show updated count
      fetchEvents();

      toast({
        title: 'Ticket Claimed!',
        description: 'Your ticket has been successfully claimed.',
      });
    } catch (error: any) {
      console.error('Error claiming ticket:', error);
      toast({
        title: 'Claim Failed',
        description: error.message || 'Failed to claim ticket. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setClaimingEventId(null);
    }
  };

  const EventImage = ({ imageUrl, title }: { imageUrl: string | null; title: string }) => {
    const [imageError, setImageError] = useState(false);

    if (!imageUrl || imageError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
          <Ticket className="h-12 w-12 text-primary/40" />
        </div>
      );
    }

    return (
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={() => setImageError(true)}
      />
    );
  };

  const EventCard = ({ event }: { event: Event }) => {
    const spotsLeft = event.capacity - event.claimed_count;
    const spotsPercentage = (event.claimed_count / event.capacity) * 100;
    const isAlmostFull = spotsPercentage >= 80;
    const isFull = spotsLeft === 0;
    const isClaiming = claimingEventId === event.id;

    return (
      <Card className="overflow-hidden h-full transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 group flex flex-col">
        {/* Image with Overlay */}
        <Link to={`/events/${event.id}`} className="block">
        <div className="relative h-44 sm:h-48 overflow-hidden bg-muted">
            <EventImage imageUrl={event.image_url} title={event.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />

            {/* Genre Badge */}
            {event.genre && (
              <Badge className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-xs">
                {event.genre}
              </Badge>
            )}

            {/* Availability Badge */}
            {(isAlmostFull || isFull) && (
              <Badge
                variant={isFull ? 'destructive' : 'default'}
                className="absolute top-3 left-3 text-xs backdrop-blur-sm"
              >
                {isFull ? 'Sold Out' : `${spotsLeft} left`}
              </Badge>
            )}

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-bold text-lg text-white line-clamp-2 drop-shadow-lg group-hover:text-primary transition-colors">
                {event.title}
              </h3>
            </div>
          </div>
        </Link>

        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Event Type - fixed height area */}
          <div className="h-5 mb-2">
            {event.event_type && (
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {event.event_type}
              </p>
            )}
          </div>

          {/* Description - fixed height area for consistent alignment */}
          <div className="h-10 mb-3">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {event.description || '\u00A0'}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground">
                {format(new Date(event.event_date), 'EEE, MMM d')}
                <span className="text-muted-foreground mx-1">•</span>
                {format(new Date(event.event_date), 'h:mm a')}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground truncate">{event.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground">
                {event.claimed_count} / {event.capacity} claimed
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-auto pt-4">
            <Button
              variant="outline"
              className="flex-1"
              size="sm"
              asChild
            >
              <Link to={`/events/${event.id}`}>View Details</Link>
            </Button>
            <Button
              variant="default"
              className="flex-1"
              size="sm"
              disabled={isFull || isClaiming}
              onClick={(e) => handleClaimTicket(e, event.id)}
            >
              {isClaiming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isFull ? (
                'Sold Out'
              ) : (
                'Claim Ticket'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const eventsList = (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gradient">
            Upcoming Events
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Discover exclusive live music experiences and claim your tickets
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse"
            >
              <Card className="overflow-hidden">
                <div className="h-48 bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-9 bg-muted rounded" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No Events Available</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              There are no upcoming events at the moment. Check back soon for
              new exciting events!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>

                {getPageNumbers().map((page, index) =>
                  page === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );

  // If user is logged in, show with sidebar
  if (user) {
    return (
      <div className="flex min-h-screen bg-background">
        <ModernSidebar
          userEmail={user.email}
          displayName={displayName || undefined}
          isAdmin={role === 'admin'}
        />
        <main className="flex-1 md:ml-0 pt-14 md:pt-0">
          <div className="h-full overflow-auto">{eventsList}</div>
        </main>
      </div>
    );
  }

  // If not logged in, show with navbar and footer
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {eventsList}
      <Footer />
    </div>
  );
}
