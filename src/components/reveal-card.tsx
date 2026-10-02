import { Card } from './ui/card';
import { Text } from './ui/text';
export function RevealCard({ question, mine, theirs }: { question: string; mine: string; theirs: string }) {
  return (
    <Card variant="hero">
      <Text variant="label">The reveal</Text>
      <Text variant="body">{question}</Text>
      <Text variant="label">Their answer</Text><Text variant="body">{theirs}</Text>
      <Text variant="label">Your answer</Text><Text variant="body">{mine}</Text>
    </Card>
  );
}
