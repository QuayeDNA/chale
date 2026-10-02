import { Card } from './ui/card';
import { Text } from './ui/text';

export function QuestionCard({ text, kind }: { text: string; kind: string }) {
  return <Card variant="hero"><Text variant="label">Today&apos;s question</Text><Text variant="title">{text}</Text><Text variant="caption">{kind}</Text></Card>;
}
