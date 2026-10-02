import { Button } from './ui/button';
import { Card } from './ui/card';
import { Text } from './ui/text';
export function RelationshipPicker({ value, onChange }: { value: 'partner'; onChange: (v: 'partner') => void }) {
  return (
    <Card>
      <Text variant="label">Who is this connection with?</Text>
      <Button label="Partner" onPress={() => onChange('partner')} />
      <Button label="Friend — soon" disabled onPress={() => {}} />
      <Button label="Family — soon" disabled onPress={() => {}} />
    </Card>
  );
}
