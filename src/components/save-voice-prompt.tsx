// src/components/save-voice-prompt.tsx
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Text } from './ui/text';

export function SaveVoicePrompt({ onSave, onSkip }: { onSave: () => Promise<void>; onSkip: () => void }) {
  return <Card><Text variant="label">Kai this one?</Text><Text variant="body">You both listened. Save this one?</Text><Button label="Save" onPress={onSave} /><Button label="Let it expire" variant="ghost" onPress={onSkip} /></Card>;
}
