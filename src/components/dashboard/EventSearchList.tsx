import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Calendar,
  MapPin,
  Users,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';
import { useEventSearch } from '@/hooks/useEventSearch';

type DbEvent = Tables<'events'>;

interface EventSearchListProps {
  onSelectEvent: (event: DbEvent) => void;
  pageSize?: number;
  height?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

export default function EventSearchList({
  onSelectEvent,
  pageSize = 10,
  height = '280px',
  showSearch = true,
  searchPlaceholder = 'Search events by name, venue, or genre...',
}: EventSearchListProps) {
  const {
    events,
    searchQuery,
    setSearchQuery,
    loading,
    loadingMore,
    hasMore,
    handleLoadMore,
  } = useEventSearch({ pageSize });

  return (
    <div className="space-y-3">
      {/* Search Input */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Events List */}
      <ScrollArea className="rounded-md border" style={{ height }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No events match your search' : 'No events found'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-start gap-3">
                  {event.image_url && (
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {event.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.event_date), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.venue}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.claimed_count}/{event.capacity}
                      </span>
                    </div>
                    {event.genre && (
                      <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-muted">
                        {event.genre}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-2 pb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full text-xs h-8"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                      Loading...
                    </>
                  ) : (
                    'Load more events'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
