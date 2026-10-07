import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { QuestionCard } from '@/components/question-card';
import { AnswerComposer } from '@/components/answer-composer';
import { AnswerModeToggle } from '@/components/answer-mode-toggle';
import { VoiceRecorder } from '@/components/voice-recorder';
import { WaitingState } from '@/components/waiting-state';
import { Screen } from '@/components/screen';
import { useConnection } from '@/hooks/use-connection';
import { useTodayPrompt } from '@/hooks/use-today-prompt';
import { supabase } from '@/lib/supabase';
import { submitTextAnswer, submitVoiceAnswer } from '@/lib/answers';
import { uploadVoiceAsync } from '@/lib/voice-upload';

export default function RemoteScreen() {
  const router = useRouter();
  const conn = useConnection();
  const connectionId = conn.data?.id ?? null;
  const prompt = useTodayPrompt(connectionId);
  const myAnswer = useQuery({
    queryKey: ['answers', 'mine', prompt.data?.promptId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('answers').select('id').eq('prompt_id', prompt.data!.promptId).eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!prompt.data,
  });
  if (conn.isLoading) return <Screen><Card><Text variant="body">Loading…</Text></Card></Screen>;
  if (!conn.data) return <Screen><Card><Text variant="title">A question a day with your person</Text><Button label="Start with your person" onPress={() => router.push('/start')} /></Card></Screen>;
  if (prompt.isLoading) return <Screen><Card><Text variant="body">Loading today&apos;s question…</Text></Card></Screen>;
  if (prompt.error) return <Screen><Card><Text variant="body">Couldn&apos;t load today&apos;s question.</Text></Card></Screen>;
  if (!prompt.data) return <Screen><Card><Text variant="body">Loading today&apos;s question…</Text></Card></Screen>;
  if (myAnswer.data) return (<Screen><QuestionCard question={prompt.data.text} hideNavigation /><WaitingState /><Button label="Open reveal" variant="outline" onPress={() => router.push({ pathname: '/prompt/[id]', params: { id: prompt.data.promptId } })} /></Screen>);
  return (<Screen><QuestionCard question={prompt.data.text} hideNavigation /><AnswerWithMode promptId={prompt.data.promptId} kind={prompt.data.kind} /></Screen>);
}

function AnswerWithMode({ promptId, kind }: { promptId: string; kind: string }) {
  const [mode, setMode] = useState<'text' | 'voice'>(kind === 'voice' ? 'voice' : 'text');
  const queryClient = useQueryClient();
  const handleSubmit = async (t: string) => {
    await submitTextAnswer(promptId, t);
    await queryClient.invalidateQueries({ queryKey: ['answers', 'mine', promptId] });
  };
  const handleVoiceSend = async (localUri: string) => {
    const key = `${promptId}-${Date.now()}`;
    const url = await uploadVoiceAsync(localUri, key);
    await submitVoiceAnswer(promptId, url);
    await queryClient.invalidateQueries({ queryKey: ['answers', 'mine', promptId] });
  };
  if (kind === 'voice') return <VoiceRecorder onSend={handleVoiceSend} />;
  if (kind === 'text') return <AnswerComposer onSubmit={handleSubmit} />;
  return (<><AnswerModeToggle mode={mode} onChange={setMode} />{mode === 'text' ? <AnswerComposer onSubmit={handleSubmit} /> : <VoiceRecorder onSend={handleVoiceSend} />}</>);
}
