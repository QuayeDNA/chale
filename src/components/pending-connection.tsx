import { Card } from './ui/card';
import { Text } from './ui/text';
export function PendingConnection({ inviteCode }: { inviteCode: string }) {
  return <Card><Text variant="title">{"You're connected on your side."}</Text><Text variant="body">{"We're waiting for them to join with code "}{inviteCode}{". This is pending, not broken."}</Text></Card>;
}
