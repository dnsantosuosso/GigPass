import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type DbEvent = Tables<'events'>;

interface UsePersonalizedEventsOptions {
  pageSize?: number;
}

interface PersonalizedEventsResult {
  events: DbEvent[];
  loading: boolean;
  error: string | null;
  hasInteractionData: boolean;
  refetch: () => Promise<void>;
}

export function usePersonalizedEvents({
  pageSize = 20,
}: UsePersonalizedEventsOptions = {}): PersonalizedEventsResult {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInteractionData, setHasInteractionData] = useState(false);

  const fetchPersonalizedEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in - return empty
        setEvents([]);
        setHasInteractionData(false);
        setLoading(false);
        return;
      }

      // Get user's interactions to understand preferences
      const { data: interactions, error: interactionsError } = await supabase
        .from('user_event_interactions')
        .select('event_id, interaction_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (interactionsError) throw interactionsError;

      // Get user's claimed tickets
      const { data: claims, error: claimsError } = await supabase
        .from('ticket_claims')
        .select('event_id')
        .eq('user_id', user.id);

      if (claimsError) throw claimsError;

      const interactedEventIds = new Set([
        ...(interactions?.map((i) => i.event_id) || []),
        ...(claims?.map((c) => c.event_id) || []),
      ]);

      const hasData = interactedEventIds.size > 0;
      setHasInteractionData(hasData);

      // Get genres and event types from interacted events
      let preferredGenres: string[] = [];
      let preferredEventTypes: string[] = [];

      if (hasData) {
        const { data: interactedEvents } = await supabase
          .from('events')
          .select('genre, event_type')
          .in('id', Array.from(interactedEventIds));

        if (interactedEvents) {
          preferredGenres = [
            ...new Set(
              interactedEvents
                .map((e) => e.genre)
                .filter((g): g is string => !!g)
            ),
          ];
          preferredEventTypes = [
            ...new Set(
              interactedEvents
                .map((e) => e.event_type)
                .filter((t): t is string => !!t)
            ),
          ];
        }
      }

      // Fetch upcoming events
      const now = new Date().toISOString();

      if (hasData && (preferredGenres.length > 0 || preferredEventTypes.length > 0)) {
        // Build filter for preferred genres/types
        const filters: string[] = [];
        if (preferredGenres.length > 0) {
          filters.push(`genre.in.(${preferredGenres.join(',')})`);
        }
        if (preferredEventTypes.length > 0) {
          filters.push(`event_type.in.(${preferredEventTypes.join(',')})`);
        }

        // Fetch events matching preferences
        const { data: matchingEvents, error: matchingError } = await supabase
          .from('events')
          .select('*')
          .gte('event_date', now)
          .or(filters.join(','))
          .order('event_date', { ascending: true })
          .limit(pageSize);

        if (matchingError) throw matchingError;

        // If we have enough matching events, use them
        if (matchingEvents && matchingEvents.length >= pageSize / 2) {
          setEvents(matchingEvents);
        } else {
          // Supplement with popular/upcoming events
          const existingIds = matchingEvents?.map((e) => e.id) || [];
          const needed = pageSize - (matchingEvents?.length || 0);

          const { data: supplementEvents } = await supabase
            .from('events')
            .select('*')
            .gte('event_date', now)
            .not('id', 'in', `(${existingIds.join(',') || 'null'})`)
            .order('claimed_count', { ascending: false })
            .limit(needed);

          setEvents([...(matchingEvents || []), ...(supplementEvents || [])]);
        }
      } else {
        // No interaction data - show popular + upcoming mix
        const { data: popularEvents, error: popularError } = await supabase
          .from('events')
          .select('*')
          .gte('event_date', now)
          .order('claimed_count', { ascending: false })
          .limit(Math.ceil(pageSize / 2));

        if (popularError) throw popularError;

        const popularIds = popularEvents?.map((e) => e.id) || [];

        const { data: upcomingEvents } = await supabase
          .from('events')
          .select('*')
          .gte('event_date', now)
          .not('id', 'in', `(${popularIds.join(',') || 'null'})`)
          .order('event_date', { ascending: true })
          .limit(Math.floor(pageSize / 2));

        // Merge and sort by date
        const allEvents = [...(popularEvents || []), ...(upcomingEvents || [])];
        allEvents.sort(
          (a, b) =>
            new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        );

        setEvents(allEvents);
      }
    } catch (err) {
      console.error('Error fetching personalized events:', err);
      setError('Failed to load personalized events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchPersonalizedEvents();
  }, [fetchPersonalizedEvents]);

  return {
    events,
    loading,
    error,
    hasInteractionData,
    refetch: fetchPersonalizedEvents,
  };
}
