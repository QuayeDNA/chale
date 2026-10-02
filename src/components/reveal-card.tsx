import { Card } from './ui/card';
import { Text } from './ui/text';
import { VoiceMessage } from './voice-message';

export type RevealAnswerView = {
  answerId: string;
  kind: string;
  content: string;
};

function isVoice(a: RevealAnswerView): boolean {
  return a.kind === 'voice';
}

export function RevealCard({ question, mine, theirs }: { question: string; mine: RevealAnswerView; theirs: RevealAnswerView }) {
  return (
    <Card variant="hero">
      <Text variant="label">The reveal</Text>
      <Text variant="body">{question}</Text>
      <Text variant="label">Their answer</Text>
      {isVoice(theirs) ? (
        <VoiceMessage url={theirs.content} answerId={theirs.answerId} label="Their voice answer" />
      ) : (
        <Text variant="body">{theirs.content}</Text>
      )}
      <Text variant="label">Your answer</Text>
      {isVoice(mine) ? (
        <VoiceMessage url={mine.content} answerId={mine.answerId} label="Your voice answer" />
      ) : (
        <Text variant="body">{mine.content}</Text>
      )}
    </Card>
  );
}
