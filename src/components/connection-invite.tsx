import { Button } from './ui/button';
import { Card } from './ui/card';
import { Text } from './ui/text';
import * as Clipboard from 'expo-clipboard';
export function ConnectionInvite({ inviteCode, onShare }: { inviteCode: string; onShare: () => void }) {
  return (
    <Card>
      <Text variant="label">Your invite code</Text>
      <Text variant="title">{inviteCode}</Text>
      <Button label="Copy code" variant="outline" onPress={() => Clipboard.setStringAsync(inviteCode)} />
      <Button label="Share link" onPress={onShare} />
      <Text variant="caption">Waiting on them — this is pending, not broken.</Text>
    </Card>
  );
}
