import { Button } from './ui/button';
import { Text } from './ui/text';

export function AnswerModeToggle({ mode, onChange }: { mode: 'text' | 'voice'; onChange: (m: 'text' | 'voice') => void }) {
  return (<><Text variant="label">How do you want to answer?</Text><Button label="Text" variant={mode === 'text' ? 'primary' : 'outline'} onPress={() => onChange('text')} /><Button label="Voice" variant={mode === 'voice' ? 'primary' : 'outline'} onPress={() => onChange('voice')} /></>);
}
