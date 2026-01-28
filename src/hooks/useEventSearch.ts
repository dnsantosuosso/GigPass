import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type DbEvent = Tables<'events'>;

interface UseEventSearchOptions {
  pageSize?: number;
}

export function useEventSearch({ pageSize = 10 }: UseEventSearchOptions = {}) {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounce search query
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch events when debounced query changes
  useEffect(() => {
    setEvents([]);
    setHasMore(true);
    fetchEvents(true);
  }, [debouncedQuery]);

  const fetchEvents = async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const offset = reset ? 0 : events.length;

      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .order('event_date', { ascending: false })
        .range(offset, offset + pageSize - 1);

      // Add search filter if query exists
      if (debouncedQuery.trim()) {
        query = query.or(
          `title.ilike.%${debouncedQuery}%,venue.ilike.%${debouncedQuery}%,genre.ilike.%${debouncedQuery}%`
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const newEvents = data || [];
      setEvents((prev) => (reset ? newEvents : [...prev, ...newEvents]));
      setHasMore(offset + newEvents.length < (count || 0));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load events',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchEvents(false);
    }
  };

  const refetch = () => {
    setEvents([]);
    setHasMore(true);
    fetchEvents(true);
  };

  return {
    events,
    searchQuery,
    setSearchQuery,
    loading,
    loadingMore,
    hasMore,
    handleLoadMore,
    refetch,
  };
}
