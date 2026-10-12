import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/**
 * Keeps the deck list live.
 *
 * Decks change rarely, but they change from somewhere the player never sees —
 * someone publishing a new pack, a count going up after a seed — so a stale
 * home is a home that hides content that already exists. The invalidation is
 * cheap because list_packs_with_counts is a single round trip.
 *
 * Requires question_packs and questions to be in the supabase_realtime
 * publication; migration 0010 adds them. Without it the subscription stays open
 * and silent, so this is strictly an improvement over polling.
 */
export function useRealtimeDecks() {
  const qc = useQueryClient();

  useEffect(() => {
    const invalidate = () => qc.invalidateQueries({ queryKey: ['decks'] });

    const channel = supabase
      .channel('decks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'question_packs' }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, invalidate)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}