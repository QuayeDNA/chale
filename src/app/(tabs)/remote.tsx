import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { QuestionCard } from '@/components/question-card';
import { AnswerPanel } from '@/components/answer-panel';
import type { VoiceRecording } from '@/components/voice-recorder';
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
  return (<Screen><QuestionCard question={prompt.data.text} hideNavigation /><AnswerSection promptId={prompt.data.promptId} kind={prompt.data.kind} /></Screen>);
}

/**
 * The answer half of today's prompt. It owns the network and the failure copy
 * and hands the panel two plain callbacks, so the panel never has to know that
 * a voice answer is an upload followed by a submit.
 *
 * The recorded clip is kept when a send fails, which is the one rule that
 * matters here: losing someone's answer to a dropped connection is the worst
 * thing this screen can do.
 */
function AnswerSection({ promptId, kind }: { promptId: string; kind: string }) {
  const [sendError, setSendError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleSubmit = async (text: string) => {
    setSendError(null);
    try {
      await submitTextAnswer(promptId, text);
      await queryClient.invalidateQueries({ queryKey: ['answers', 'mine', promptId] });
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'That did not send. Try again.');
    }
  };

  const handleVoiceSend = async ({ uri }: VoiceRecording) => {
    setSendError(null);
    try {
      const key = `${promptId}-${Date.now()}`;
      const url = await uploadVoiceAsync(uri, key);
      await submitVoiceAnswer(promptId, url);
      await queryClient.invalidateQueries({ queryKey: ['answers', 'mine', promptId] });
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'That clip did not send. Try again.');
    }
  };

  return (
    <AnswerPanel
      kind={kind === 'text' || kind === 'voice' ? kind : 'either'}
      onSubmitText={handleSubmit}
      onSubmitVoice={handleVoiceSend}
      sendError={sendError ?? undefined}
    />
  );
}
