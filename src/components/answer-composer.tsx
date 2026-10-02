import { useState } from 'react';
import { Button } from './ui/button';
import { TextInput } from './ui/text-input';

export function AnswerComposer({ onSubmit }: { onSubmit: (t: string) => Promise<void> }) {
  const [v, setV] = useState(''); const [busy, setBusy] = useState(false);
  return (<><TextInput placeholder="Say am…" multiline value={v} onChangeText={setV} /><Button label={busy ? 'Sending…' : 'Send answer'} disabled={!v.trim() || busy} onPress={async () => { setBusy(true); try { await onSubmit(v); setV(''); } finally { setBusy(false); } }} /></>);
}
