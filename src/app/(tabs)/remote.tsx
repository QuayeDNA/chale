import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { QuestionCard } from '@/components/question-card';
import { AnswerComposer } from '@/components/answer-composer';
import { AnswerModeToggle } from '@/components/answer-mode-toggle';
import { VoiceRecorder, type VoiceRecording } from '@/components/voice-recorder';
import { WaitingState } from '@/components/waiting-state';
import { Screen } from '@/components/screen';
import { useAuth } from '@/hooks/use-auth';
import { useConnection } from '@/hooks/use-connection';
import { useMyAnswer } from '@/hooks/use-my-answer';
import { useTodayPrompt } from '@/hooks/use-today-prompt';
import { submitTextAnswer, submitVoiceAnswer } from '@/lib/answers';
import { uploadVoiceAsync } from '@/lib/voice-upload';

export default function RemoteScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const conn = useConnection();
  const connectionId = conn.data?.id ?? null;
  const prompt = useTodayPrompt(connectionId);
  const myAnswer = useMyAnswer(prompt.data?.promptId ?? null, user?.id ?? null);
  if (conn.isLoading) return <Screen><Card><Text variant="body">Loading…</Text></Card></Screen>;
  if (!conn.data) return <Screen><Card><Text variant="title">A question a day with your person</Text><Button label="Start with your person" onPress={() => router.push('/start')} /></Card></Screen>;
  if (prompt.isLoading) return <Screen><Card><Text variant="body">Loading today&apos;s question…</Text></Card></Screen>;
  if (prompt.error) return <Screen><Card><Text variant="body">Couldn&apos;t load today&apos;s question.</Text></Card></Screen>;
  if (!prompt.data) return <Screen><Card><Text variant="body">Loading today&apos;s question…</Text></Card></Screen>;
  if (myAnswer.data) return (
    <Screen>
      <QuestionCard question={prompt.data.text} hideNavigation />
      {/* A reveal button only appears once there is something to reveal. Before
          that, linking through to the reveal screen was a dead end — it only
          ever renders the same waiting copy. */}
      {prompt.data.reveal_state === 'revealed' ? (
        <Button label="Open reveal" onPress={() => router.push({ pathname: '/prompt/[id]', params: { id: prompt.data.promptId } })} />
      ) : (
        <WaitingState />
      )}
    </Screen>
  );
  return (<Screen><QuestionCard question={prompt.data.text} hideNavigation /><AnswerWithMode promptId={prompt.data.promptId} kind={prompt.data.kind} /></Screen>);
}

function AnswerWithMode({ promptId, kind }: { promptId: string; kind: string }) {
  const [mode, setMode] = useState<'text' | 'voice'>(kind === 'voice' ? 'voice' : 'text');
  const queryClient = useQueryClient();
  const handleSubmit = async (t: string) => {
    await submitTextAnswer(promptId, t);
    await queryClient.invalidateQueries({ queryKey: ['answers', 'mine', promptId] });
  };
  const handleVoiceSend = async ({ uri }: VoiceRecording) => {
    const key = `${promptId}-${Date.now()}`;
    const url = await uploadVoiceAsync(uri, key);
    await submitVoiceAnswer(promptId, url);
    await queryClient.invalidateQueries({ queryKey: ['answers', 'mine', promptId] });
  };
  if (kind === 'voice') return <VoiceRecorder onSend={handleVoiceSend} />;
  if (kind === 'text') return <AnswerComposer onSubmit={handleSubmit} />;
  return (<><AnswerModeToggle mode={mode} onChange={setMode} />{mode === 'text' ? <AnswerComposer onSubmit={handleSubmit} /> : <VoiceRecorder onSend={handleVoiceSend} />}</>);
}
