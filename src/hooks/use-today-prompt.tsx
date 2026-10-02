import { useQuery } from '@tanstack/react-query';
import { getTodayPrompt } from '@/lib/prompts';

export function useTodayPrompt(connectionId: string | null) {
  return useQuery({ queryKey: ['prompt', 'today', connectionId], queryFn: () => getTodayPrompt(connectionId!), enabled: !!connectionId });
}
