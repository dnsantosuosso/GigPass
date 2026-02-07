import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type InteractionType = 'view' | 'like' | 'claim';

export function useEventInteractions() {
  /**
   * Record a user interaction with an event
   */
  const recordInteraction = useCallback(
    async (eventId: string, interactionType: InteractionType) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Upsert to avoid duplicates (user can only have one of each interaction type per event)
        const { error } = await supabase.from('user_event_interactions').upsert(
          {
            user_id: user.id,
            event_id: eventId,
            interaction_type: interactionType,
          },
          {
            onConflict: 'user_id,event_id,interaction_type',
            ignoreDuplicates: true,
          }
        );

        if (error) {
          console.error('Error recording interaction:', error);
        }
      } catch (error) {
        console.error('Error recording interaction:', error);
      }
    },
    []
  );

  /**
   * Check if user has liked an event
   */
  const hasLiked = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return false;

      const { data } = await supabase
        .from('user_event_interactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .eq('interaction_type', 'like')
        .maybeSingle();

      return !!data;
    } catch {
      return false;
    }
  }, []);

  /**
   * Toggle like on an event
   */
  const toggleLike = useCallback(
    async (eventId: string): Promise<boolean> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return false;

        const isLiked = await hasLiked(eventId);

        if (isLiked) {
          // Unlike
          await supabase
            .from('user_event_interactions')
            .delete()
            .eq('user_id', user.id)
            .eq('event_id', eventId)
            .eq('interaction_type', 'like');
          return false;
        } else {
          // Like
          await recordInteraction(eventId, 'like');
          return true;
        }
      } catch (error) {
        console.error('Error toggling like:', error);
        return false;
      }
    },
    [hasLiked, recordInteraction]
  );

  return {
    recordInteraction,
    hasLiked,
    toggleLike,
  };
}
