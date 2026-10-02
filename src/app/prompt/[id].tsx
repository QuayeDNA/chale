import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { WaitingState } from '@/components/waiting-state';
import { RevealCard } from '@/components/reveal-card';
import { SaveVoicePrompt } from '@/components/save-voice-prompt';
import { useRealtimePrompt } from '@/hooks/use-realtime-prompt';
import { supabase } from '@/lib/supabase';
import { saveOwnClip } from '@/lib/answers';

export default function PromptDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [skipped, setSkipped] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useRealtimePrompt(id ?? null);
  const q = useQuery({
    queryKey: ['prompt', 'detail', id],
    queryFn: async () => {
      const { data: p } = await supabase.from('prompts').select('id,reveal_state,question_id').eq('id', id!).single();
      const { data: question } = await supabase.from('questions').select('text').eq('id', p!.question_id).single();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: answers } = await supabase.from('answers').select('id,user_id,kind,content,expiry_state').eq('prompt_id', id!);
      const mine = (answers ?? []).find((a) => a.user_id === user!.id);
      const theirs = (answers ?? []).find((a) => a.user_id !== user!.id);
      return {
        reveal: p!.reveal_state as string,
        text: question!.text as string,
        mine: { answerId: mine?.id ?? '', kind: mine?.kind ?? 'text', content: mine?.content ?? '' },
        theirs: { answerId: theirs?.id ?? '', kind: theirs?.kind ?? 'text', content: theirs?.content ?? '' },
        myAnswerId: (mine?.id ?? null) as string | null,
        myKind: (mine?.kind ?? null) as string | null,
        myExpiry: (mine?.expiry_state ?? null) as string | null,
      };
    },
    enabled: !!id,
  });
  const listens = useQuery({
    queryKey: ['prompt', 'listens', q.data?.myAnswerId],
    queryFn: async () => {
      const { count } = await supabase.from('voice_listens').select('answer_id', { count: 'exact', head: true }).eq('answer_id', q.data!.myAnswerId!);
      return count ?? 0;
    },
    enabled: !!q.data?.myAnswerId && q.data?.myKind === 'voice' && q.data?.reveal === 'revealed',
    refetchInterval: 5000,
  });
  if (!q.data) return <Card><Text variant="body">Loading…</Text></Card>;
  if (q.data.reveal !== 'revealed') return <WaitingState />;
  const showSave = q.data.myKind === 'voice' && q.data.myExpiry !== 'saved' && (listens.data ?? 0) >= 2 && !skipped;
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveOwnClip(q.data.myAnswerId!);
      await queryClient.invalidateQueries({ queryKey: ['prompt', 'detail', id] });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save this voice answer.');
    } finally {
      setSaving(false);
    }
  };
  return (<>
    <RevealCard question={q.data.text} mine={q.data.mine} theirs={q.data.theirs} />
    {showSave ? <SaveVoicePrompt onSave={handleSave} onSkip={() => setSkipped(true)} /> : null}
    {saving ? <Card><Text variant="body">Saving…</Text></Card> : null}
    {saveError ? <Card><Text variant="body">{saveError}</Text></Card> : null}
    {q.data.myKind === 'voice' && q.data.myExpiry === 'saved' ? <Card><Text variant="body">Saved — this one stays.</Text></Card> : null}
    {q.data.myKind === 'voice' && q.data.myExpiry !== 'saved' && !showSave && !skipped ? (
      <Card><Text variant="caption">Play your voice answer above so it counts as listened — once you both have listened you can save it.</Text><Button label="Refresh" variant="outline" onPress={() => { void listens.refetch(); void q.refetch(); }} /></Card>
    ) : null}
  </>);
}
