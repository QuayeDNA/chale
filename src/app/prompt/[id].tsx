import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { WaitingState } from '@/components/waiting-state';
import { RevealCard } from '@/components/reveal-card';
import { useRealtimePrompt } from '@/hooks/use-realtime-prompt';
import { supabase } from '@/lib/supabase';
export default function PromptDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useRealtimePrompt(id ?? null);
  const q = useQuery({
    queryKey: ['prompt', 'detail', id],
    queryFn: async () => {
      const { data: p } = await supabase.from('prompts').select('id,reveal_state,question_id').eq('id', id!).single();
      const { data: question } = await supabase.from('questions').select('text').eq('id', p!.question_id).single();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: answers } = await supabase.from('answers').select('user_id,content').eq('prompt_id', id!);
      return { reveal: p!.reveal_state as string, text: question!.text as string, mine: (answers ?? []).find((a) => a.user_id === user!.id)?.content ?? '', theirs: (answers ?? []).find((a) => a.user_id !== user!.id)?.content ?? '' };
    },
    enabled: !!id,
  });
  if (!q.data) return <Card><Text variant="body">Loading…</Text></Card>;
  if (q.data.reveal !== 'revealed') return <WaitingState />;
  return <RevealCard question={q.data.text} mine={q.data.mine} theirs={q.data.theirs} />;
}
