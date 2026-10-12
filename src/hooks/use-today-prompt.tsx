import { useQuery } from '@tanstack/react-query';
import { getTodayPrompt, readTodayPrompt } from '@/lib/prompts';

/** The Remote tab's question: assigns today's if nobody has yet. */
export function useTodayPrompt(connectionId: string | null) {
  return useQuery({ queryKey: ['prompt', 'today', connectionId], queryFn: () => getTodayPrompt(connectionId!), enabled: !!connectionId });
}

/**
 * A passive peek at today's question for surfaces that only report on the day
 * (Home). It never assigns one, so `null` is a real answer meaning "nobody has
 * drawn today yet" rather than an error — which is why this is a separate key
 * from the get-or-create above and does not share its cache entry.
 */
export function useTodayPromptPeek(connectionId: string | null) {
  return useQuery({
    queryKey: ['prompt', 'today-peek', connectionId],
    queryFn: () => readTodayPrompt(connectionId!),
    enabled: !!connectionId,
    // Nothing about the day changes on its own, so a stale value would only be
    // noise. Realtime invalidation is what makes this fresh.
    staleTime: 60_000,
  });
}