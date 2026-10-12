import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type MyAnswer = { id: string } | null;

/**
 * "Have I answered this prompt yet" — the boolean every surface branches on,
 * but fetched as one small row rather than the answer itself, so the daily
 * prompt card and the Remote tab never pull down content the other person is
 * not allowed to see yet.
 *
 * The user id is passed in rather than fetched here: the session is already in
 * memory, and one extra round trip per home focus is one too many.
 */
export function useMyAnswer(promptId: string | null, userId: string | null) {
  return useQuery({
    queryKey: ['answers', 'mine', promptId],
    queryFn: async (): Promise<MyAnswer> => {
      const { data, error } = await supabase
        .from('answers')
        .select('id')
        .eq('prompt_id', promptId!)
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!promptId && !!userId,
  });
}