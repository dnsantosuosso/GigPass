import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  MapPin,
  Ticket,
  Search,
  Filter,
  Sparkles,
  ListFilter,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePersonalizedEvents } from '@/hooks/usePersonalizedEvents';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

type ViewType = 'for-you' | 'all';

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [availableEventTypes, setAvailableEventTypes] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [activeView, setActiveView] = useState<ViewType>('all');
  const { role } = useUserRole(session);
  const { displayName } = useUserProfile(user);

  // Personalized events hook
  const {
    events: personalizedEvents,
    loading: personalizedLoading,
    hasInteractionData,
  } = usePersonalizedEvents({ pageSize: 20 });

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

  // Set default view based on user data
  useEffect(() => {
    if (user && hasInteractionData) {
      setActiveView('for-you');
    }
  }, [user, hasInteractionData]);

  useEffect(() => {
    fetchAvailableEventTypes();
  }, []);

  useEffect(() => {
    // Reset to page 1 when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchEvents();
    }
  }, [selectedEventType, searchQuery]);

  useEffect(() => {
    // Fetch when page changes
    fetchEvents();
  }, [currentPage]);

  const fetchAvailableEventTypes = async () => {
    try {
      // Get distinct event types from upcoming events
      const { data, error } = await supabase
        .from('events')
        .select('event_type')
        .gte('event_date', new Date().toISOString())
        .not('event_type', 'is', null);

      if (error) throw error;

      // Get unique event types and filter out empty strings
      const uniqueTypes = Array.from(
        new Set(
          data?.map((event) => event.event_type).filter((type) => type && type.trim())
        )
      ) as string[];

      // Map to event type objects with labels
      const types = uniqueTypes.map((type) => ({
        value: type,
        label: type,
      }));

      // Add "All Events" option at the beginning
      setAvailableEventTypes([{ value: 'all', label: 'All Events' }, ...types]);
    } catch (error) {
      console.error('Error fetching event types:', error);
      // Fallback to just "All Events"
      setAvailableEventTypes([{ value: 'all', label: 'All Events' }]);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Build query with filters applied server-side
      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .gte('event_date', new Date().toISOString());

      // Apply event type filter server-side
      if (selectedEventType !== 'all') {
        query = query.eq('event_type', selectedEventType);
      }

      // Apply search filter server-side
      if (searchQuery.trim()) {
        const searchTerm = searchQuery.trim();
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,venue.ilike.%${searchTerm}%,genre.ilike.%${searchTerm}%`
        );
      }

      // Get total count with filters applied
      const { count, error: countError } = await query;
      if (countError) throw countError;
      setTotalCount(count || 0);

      // Fetch paginated data with filters
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await query
        .order('event_date', { ascending: true })
        .range(from, to);

      if (error) throw error;

      setEvents(data || []);
      setFilteredEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter personalized events based on search and type
  const getFilteredPersonalizedEvents = () => {
    let filtered = personalizedEvents;

    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title?.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.venue?.toLowerCase().includes(searchLower) ||
          event.genre?.toLowerCase().includes(searchLower)
      );
    }

    if (selectedEventType !== 'all') {
      filtered = filtered.filter((event) => event.event_type === selectedEventType);
    }

    return filtered;
  };

  const formatVenueAddress = (venue: string, address: string) => {
    // Extract street number and name from address
    // Example: "123 Main Street, Toronto, ON" -> "123 Main Street"
    const streetPart = address.split(',')[0].trim();
    return `${venue}, ${streetPart}`;
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

  const EventImage = ({
    imageUrl,
    title,
  }: {
    imageUrl: string | null;
    title: string;
  }) => {
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
    const isFewTicketsLeft = spotsPercentage >= 75;
    const isFull = spotsLeft === 0;

    // Determine status label
    const getStatusLabel = () => {
      if (isFull) return 'No Tickets Left';
      if (isFewTicketsLeft) return 'Few Tickets Left';
      return 'Tickets Available';
    };

    const getStatusVariant = () => {
      if (isFull) return 'destructive';
      if (isFewTicketsLeft) return 'default';
      return 'outline';
    };

    return (
      <Link to={`/events/${event.id}`} className="block h-full">
        <Card className="overflow-hidden h-full transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 group flex flex-col cursor-pointer">
          {/* Image with Overlay */}
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
            <Badge
              variant={getStatusVariant()}
              className="absolute top-3 left-3 text-xs backdrop-blur-sm"
            >
              {getStatusLabel()}
            </Badge>

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-bold text-lg text-white line-clamp-2 drop-shadow-lg group-hover:text-primary transition-colors">
                {event.title}
              </h3>
            </div>
          </div>

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
                {event.description || ''}
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
                <span className="text-foreground truncate text-xs">
                  {formatVenueAddress(event.venue, event.address)}
                </span>
              </div>
            </div>

            {/* Action Button - View Details Only */}
            <div className="mt-auto pt-4">
              <Button variant="default" className="w-full" size="sm">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const ForYouContent = () => {
    const displayEvents = getFilteredPersonalizedEvents();

    if (personalizedLoading) {
      return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <Card className="overflow-hidden">
                <div className="h-48 bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                  <div className="h-9 bg-muted rounded" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      );
    }

    if (displayEvents.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {searchQuery || selectedEventType !== 'all'
                ? 'No Matching Events'
                : 'Building Your Recommendations'}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {searchQuery || selectedEventType !== 'all'
                ? 'Try adjusting your search or filters to find more events.'
                : hasInteractionData
                  ? "We're finding events that match your interests."
                  : 'Explore events and claim tickets to help us personalize your recommendations.'}
            </p>
            {(searchQuery || selectedEventType !== 'all') && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedEventType('all');
                }}
                variant="outline"
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {/* Personalization hint */}
        {!hasInteractionData && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>
                Showing popular and upcoming events. Your recommendations will improve as you
                explore and claim tickets.
              </span>
            </p>
          </div>
        )}
        {hasInteractionData && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Based on your interests and activity</span>
            </p>
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {displayEvents.map((event) => (
            <EventCard key={event.id} event={event as Event} />
          ))}
        </div>
      </>
    );
  };

  const AllEventsContent = () => {
    if (loading) {
      return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <Card className="overflow-hidden">
                <div className="h-48 bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                  <div className="h-9 bg-muted rounded" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      );
    }

    if (filteredEvents.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {searchQuery || selectedEventType !== 'all'
                ? 'No Events Found'
                : 'No Events Available'}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {searchQuery || selectedEventType !== 'all'
                ? 'Try adjusting your search or filters to find more events.'
                : 'There are no upcoming events at the moment. Check back soon for new exciting events!'}
            </p>
            {(searchQuery || selectedEventType !== 'all') && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedEventType('all');
                }}
                variant="outline"
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
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
    );
  };

  const eventsList = (
    <div className="container mx-auto px-4 md:px-6 pt-8 pb-6 md:py-8">
      {/* Header with City Context */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gradient mb-2">
              {activeView === 'for-you' ? 'For You' : 'Upcoming Events'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeView === 'for-you'
                ? 'Events curated based on your interests'
                : 'Discover exclusive live music experiences and claim your tickets'}
            </p>
          </div>
        </div>

        {/* View Toggle Tabs - Only show for logged in users */}
        {user && (
          <Tabs
            value={activeView}
            onValueChange={(value) => setActiveView(value as ViewType)}
            className="mb-4"
          >
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="for-you" className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                For You
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-1.5">
                <ListFilter className="h-3.5 w-3.5" />
                All Events
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events, venues, genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Event Type Filter */}
          {availableEventTypes.length > 1 && (
            <Select value={selectedEventType} onValueChange={setSelectedEventType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                {availableEventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Content based on active view */}
      {activeView === 'for-you' ? <ForYouContent /> : <AllEventsContent />}
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
