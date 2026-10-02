import { Card } from './ui/card';
import { Text } from './ui/text';

export function WaitingState() {
  return <Card><Text variant="title">You answered.</Text><Text variant="body">Your answer is tucked away until they answer too. We&apos;ll let you know when the reveal is ready.</Text></Card>;
}
