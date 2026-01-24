import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Calendar,
  MapPin,
  User,
  Ticket,
  Download,
  TrendingUp,
  Filter,
  X,
} from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';

interface TicketClaim {
  id: string;
  claimed_at: string;
  user: {
    email: string;
    full_name: string | null;
  };
  event: {
    id: string;
    title: string;
    venue: string;
    event_date: string;
    image_url: string | null;
  };
}

export default function ClaimsManagement() {
  const [claims, setClaims] = useState<TicketClaim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<TicketClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<'date' | 'event' | 'user'>('date');

  useEffect(() => {
    fetchClaims();
  }, []);

  useEffect(() => {
    filterAndSortClaims();
  }, [claims, searchQuery, statusFilter, sortBy]);

  const fetchClaims = async () => {
    try {
      setLoading(true);

      // First get all claims with user IDs
      const { data: claimsData, error: claimsError } = await supabase
        .from('ticket_claims')
        .select('id, claimed_at, user_id, event_id')
        .order('claimed_at', { ascending: false });

      if (claimsError) throw claimsError;

      // Get user profiles
      const userIds = [...new Set(claimsData?.map((c) => c.user_id) || [])];
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      // Get events
      const eventIds = [...new Set(claimsData?.map((c) => c.event_id) || [])];
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, venue, event_date, image_url')
        .in('id', eventIds);

      // Map the data together
      const processedClaims = (claimsData || [])
        .map((claim) => {
          const user = usersData?.find((u) => u.id === claim.user_id);
          const event = eventsData?.find((e) => e.id === claim.event_id);

          if (!user || !event) return null;

          return {
            id: claim.id,
            claimed_at: claim.claimed_at,
            user: {
              email: user.email,
              full_name: user.full_name,
            },
            event: {
              id: event.id,
              title: event.title,
              venue: event.venue,
              event_date: event.event_date,
              image_url: event.image_url,
            },
          };
        })
        .filter((claim): claim is NonNullable<typeof claim> => claim !== null);

      setClaims(processedClaims);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortClaims = () => {
    let filtered = [...claims];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (claim) =>
          claim.event.title.toLowerCase().includes(query) ||
          claim.user.email.toLowerCase().includes(query) ||
          claim.user.full_name?.toLowerCase().includes(query) ||
          claim.event.venue.toLowerCase().includes(query)
      );
    }

    // Status filter
    const now = new Date();
    if (statusFilter === 'upcoming') {
      filtered = filtered.filter((claim) =>
        isAfter(new Date(claim.event.event_date), now)
      );
    } else if (statusFilter === 'past') {
      filtered = filtered.filter((claim) =>
        isBefore(new Date(claim.event.event_date), now)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return (
          new Date(b.claimed_at).getTime() - new Date(a.claimed_at).getTime()
        );
      } else if (sortBy === 'event') {
        return a.event.title.localeCompare(b.event.title);
      } else {
        return a.user.email.localeCompare(b.user.email);
      }
    });

    setFilteredClaims(filtered);
  };

  const getStatistics = () => {
    const now = new Date();
    const upcoming = claims.filter((c) =>
      isAfter(new Date(c.event.event_date), now)
    );
    const past = claims.filter((c) =>
      isBefore(new Date(c.event.event_date), now)
    );
    const uniqueUsers = new Set(claims.map((c) => c.user.email)).size;
    const uniqueEvents = new Set(claims.map((c) => c.event.id)).size;

    return {
      total: claims.length,
      upcoming: upcoming.length,
      past: past.length,
      uniqueUsers,
      uniqueEvents,
    };
  };

  const stats = getStatistics();

  const exportToCSV = () => {
    const headers = [
      'Claim Date',
      'Event',
      'Venue',
      'Event Date',
      'User Email',
      'User Name',
    ];
    const rows = filteredClaims.map((claim) => [
      format(new Date(claim.claimed_at), 'yyyy-MM-dd HH:mm:ss'),
      claim.event.title,
      claim.event.venue,
      format(new Date(claim.event.event_date), 'yyyy-MM-dd HH:mm:ss'),
      claim.user.email,
      claim.user.full_name || 'N/A',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-claims-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={i}
              className="animate-pulse"
            >
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Total Claims
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Upcoming
                </p>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Unique Users
                </p>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Events
                </p>
                <p className="text-2xl font-bold">{stats.uniqueEvents}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by event, user, or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(v: 'all' | 'upcoming' | 'past') =>
                setStatusFilter(v)
              }
            >
              <SelectTrigger className="w-full sm:w-[140px] h-9">
                <Filter className="h-3.5 w-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Claims</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(v: 'date' | 'event' | 'user') => setSortBy(v)}
            >
              <SelectTrigger className="w-full sm:w-[140px] h-9">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Claim Date</SelectItem>
                <SelectItem value="event">Event Name</SelectItem>
                <SelectItem value="user">User Email</SelectItem>
              </SelectContent>
            </Select>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="h-9"
            >
              <Download className="h-3.5 w-3.5 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Ticket className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'No claims match your filters'
                : 'No ticket claims yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">
            Showing {filteredClaims.length} of {claims.length} claims
          </p>
          {filteredClaims.map((claim) => {
            const isPast = isBefore(
              new Date(claim.event.event_date),
              new Date()
            );
            return (
              <Card
                key={claim.id}
                className="overflow-hidden hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 p-3">
                    {/* Event Image */}
                    {claim.event.image_url && (
                      <div className="hidden sm:block h-12 w-12 rounded overflow-hidden bg-muted shrink-0">
                        <img
                          src={claim.event.image_url}
                          alt={claim.event.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    {/* Claim Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm truncate">
                          {claim.event.title}
                        </h4>
                        <Badge
                          variant={isPast ? 'secondary' : 'default'}
                          className="shrink-0 text-xs"
                        >
                          {isPast ? 'Past' : 'Upcoming'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {claim.user.full_name || claim.user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(
                            new Date(claim.event.event_date),
                            'MMM d, yyyy'
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {claim.event.venue}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Claimed{' '}
                        {format(
                          new Date(claim.claimed_at),
                          'MMM d, yyyy • h:mm a'
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
