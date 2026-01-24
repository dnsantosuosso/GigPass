import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Calendar, MapPin, Ticket, ChevronRight, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { TicketListSkeleton } from '@/components/ui/event-skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const TICKETS_PER_PAGE = 8;

type TabType = 'upcoming' | 'past';

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
  };
}

interface MemberDashboardProps {
  user: User;
  isAdmin?: boolean;
}

export default function MemberDashboard({
  user,
  isAdmin = false,
}: MemberDashboardProps) {
  const { displayName } = useUserProfile(user);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [tickets, setTickets] = useState<TicketClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [pastCount, setPastCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const totalPages = Math.ceil(totalCount / TICKETS_PER_PAGE);

  const processClaimsData = (data: any[]): TicketClaim[] => {
    return (data || [])
      .filter(
        (
          claim
        ): claim is typeof claim & {
          event: NonNullable<typeof claim.event>;
        } => claim.event !== null
      )
      .map((claim) => ({
        id: claim.id,
        claimed_at: claim.claimed_at || '',
        event: {
          id: claim.event.id,
          title: claim.event.title,
          venue: claim.event.venue,
          address: claim.event.address,
          event_date: claim.event.event_date,
          event_type: claim.event.event_type,
          genre: claim.event.genre,
          image_url: claim.event.image_url,
        },
      }));
  };

  const fetchCounts = useCallback(async () => {
    const now = new Date().toISOString();

    const [upcomingResult, pastResult] = await Promise.all([
      supabase
        .from('ticket_claims')
        .select('*, event:events!inner(*)', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('event.event_date', now),
      supabase
        .from('ticket_claims')
        .select('*, event:events!inner(*)', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lt('event.event_date', now),
    ]);

    if (upcomingResult.error) throw upcomingResult.error;
    if (pastResult.error) throw pastResult.error;

    setUpcomingCount(upcomingResult.count || 0);
    setPastCount(pastResult.count || 0);

    return {
      upcoming: upcomingResult.count || 0,
      past: pastResult.count || 0,
    };
  }, [user.id]);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const now = new Date().toISOString();

      // Fetch counts first
      const counts = await fetchCounts();
      const currentCount = activeTab === 'upcoming' ? counts.upcoming : counts.past;
      setTotalCount(currentCount);

      // Fetch paginated tickets
      const from = (currentPage - 1) * TICKETS_PER_PAGE;
      const to = from + TICKETS_PER_PAGE - 1;

      const isUpcoming = activeTab === 'upcoming';
      const dateFilter = isUpcoming ? 'gte' : 'lt';
      const sortOrder = isUpcoming; // ascending for upcoming, descending for past

      let query = supabase
        .from('ticket_claims')
        .select(
          `
          id,
          claimed_at,
          event:events!inner (
            id,
            title,
            venue,
            address,
            event_date,
            event_type,
            genre,
            image_url
          )
        `
        )
        .eq('user_id', user.id);

      if (isUpcoming) {
        query = query.gte('event.event_date', now);
      } else {
        query = query.lt('event.event_date', now);
      }

      const { data, error: fetchError } = await query
        .order('event(event_date)', { ascending: sortOrder })
        .range(from, to);

      if (fetchError) throw fetchError;
      setTickets(processClaimsData(data));
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load tickets',
      });
    } finally {
      setLoading(false);
    }
  }, [user.id, activeTab, currentPage, fetchCounts, toast]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Fetch tickets when tab or page changes
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleTabChange = (tab: TabType) => {
    if (loading) return;
    setActiveTab(tab);
  };

  const getPageNumbers = (currentPage: number, totalPages: number) => {
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

  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />
          </PaginationItem>

          {getPageNumbers(currentPage, totalPages).map((page, index) =>
            page === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => onPageChange(page)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const TicketCard = ({
    claim,
    isPast = false,
  }: {
    claim: TicketClaim;
    isPast?: boolean;
  }) => (
    <Link
      to={`/ticket/${claim.id}`}
      className="block group"
    >
      <Card
        className={`overflow-hidden transition-all duration-200 h-full ${
          isPast
            ? 'opacity-60 hover:opacity-80'
            : 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'
        }`}
      >
        {/* Image */}
        {claim.event.image_url && (
          <div className="relative h-28 sm:h-32 overflow-hidden bg-muted">
            <img
              src={claim.event.image_url}
              alt={claim.event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <Badge
              className={`absolute top-2 right-2 text-xs ${
                isPast
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-green-500/90 text-white'
              }`}
            >
              {isPast ? 'Past' : 'Claimed'}
            </Badge>
          </div>
        )}

        <CardContent className={`p-3 ${!claim.event.image_url ? 'pt-3' : ''}`}>
          {!claim.event.image_url && (
            <Badge
              className={`mb-2 text-xs ${
                isPast
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-green-500/90 text-white'
              }`}
            >
              {isPast ? 'Past' : 'Claimed'}
            </Badge>
          )}

          <h3 className="font-semibold text-sm leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {claim.event.title}
          </h3>

          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {format(
                  new Date(claim.event.event_date),
                  'MMM d, yyyy • h:mm a'
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{claim.event.venue}</span>
            </div>
          </div>

          {!isPast && (
            <div className="flex items-center justify-end mt-3 text-xs text-primary font-medium">
              View Details
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );

  const SegmentedControl = () => (
    <div 
      className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4 md:-mx-6 md:px-6"
      role="tablist"
      aria-label="Filter tickets by time"
    >
      <div className="flex w-full rounded-lg bg-muted p-1 gap-1">
        <button
          role="tab"
          aria-selected={activeTab === 'upcoming'}
          aria-controls="ticket-list"
          onClick={() => handleTabChange('upcoming')}
          disabled={loading}
          className={`
            flex-1 min-h-[44px] px-4 py-2.5 rounded-md text-sm font-medium
            transition-all duration-200 focus:outline-none focus-visible:ring-2 
            focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
            disabled:cursor-not-allowed disabled:opacity-50
            ${activeTab === 'upcoming'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }
          `}
        >
          Upcoming ({upcomingCount})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'past'}
          aria-controls="ticket-list"
          onClick={() => handleTabChange('past')}
          disabled={loading}
          className={`
            flex-1 min-h-[44px] px-4 py-2.5 rounded-md text-sm font-medium
            transition-all duration-200 focus:outline-none focus-visible:ring-2 
            focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
            disabled:cursor-not-allowed disabled:opacity-50
            ${activeTab === 'past'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }
          `}
        >
          Past ({pastCount})
        </button>
      </div>
    </div>
  );

  const EmptyState = () => {
    const isUpcoming = activeTab === 'upcoming';
    const hasAnyTickets = upcomingCount > 0 || pastCount > 0;

    if (hasAnyTickets) {
      // Empty state for current tab only
      return (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Ticket className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">
              {isUpcoming ? 'No upcoming events' : 'No past events yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isUpcoming
                ? 'Browse events and claim tickets for upcoming shows!'
                : 'Events you attended will appear here.'}
            </p>
            {isUpcoming && (
              <Link to="/events" className="inline-block mt-4">
                <Button size="sm" className="h-8">
                  Browse Events
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      );
    }

    // Empty state for no tickets at all
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Ticket className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No tickets yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Browse events and claim your first ticket!
          </p>
          <Link to="/events">
            <Button size="sm" className="h-8">
              Browse Events
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  };

  const ErrorState = () => (
    <Card className="border-destructive/50">
      <CardContent className="py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <Ticket className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="font-semibold mb-1">Failed to load tickets</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button size="sm" onClick={fetchTickets} className="h-8 gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <ModernSidebar
        userEmail={user.email}
        displayName={displayName || undefined}
        isAdmin={isAdmin}
      />

      <main className="flex-1 md:ml-0 pt-14 md:pt-0">
        <div className="h-full overflow-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8">
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gradient mb-1">
                My Tickets
              </h1>
              <p className="text-sm text-muted-foreground">
                View and manage your claimed tickets
              </p>
            </div>

            {/* Segmented Control - Always visible */}
            <SegmentedControl />

            {/* Content */}
            <div 
              id="ticket-list" 
              role="tabpanel" 
              aria-label={`${activeTab === 'upcoming' ? 'Upcoming' : 'Past'} events`}
              className="animate-fade-in"
            >
              {loading ? (
                <TicketListSkeleton />
              ) : error ? (
                <ErrorState />
              ) : tickets.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  {/* Section Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {activeTab === 'upcoming' ? 'Upcoming Events' : 'Past Events'}
                    </h2>
                    <Badge
                      variant={activeTab === 'upcoming' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {totalCount}
                    </Badge>
                  </div>

                  {/* Ticket Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {tickets.map((claim) => (
                      <TicketCard
                        key={claim.id}
                        claim={claim}
                        isPast={activeTab === 'past'}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
