// src/components/voice-recorder.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Text } from './ui/text';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';

export function VoiceRecorder({ onSend }: { onSend: (localUri: string) => Promise<void> }) {
  const rec = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [uri, setUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError('Microphone access is needed to record a voice answer.');
        return;
      }
      await rec.prepareToRecordAsync();
      rec.record();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Microphone access is needed to record a voice answer.');
    }
  };

  return (<>
    {!rec.isRecording && !uri ? <Button label="Say am — record" onPress={start} /> : null}
    {rec.isRecording ? (<><Text variant="label">Recording…</Text><Button label="Stop" onPress={async () => { try { await rec.stop(); setUri(rec.uri ?? null); } catch (e) { setError(e instanceof Error ? e.message : 'Could not send voice answer.'); } }} /></>) : null}
    {uri && !rec.isRecording ? (<>
      <Text variant="caption">{uri}</Text>
      <Button label="Re-record" variant="outline" onPress={() => setUri(null)} />
      <Button label={busy ? 'Sending…' : 'Send voice'} disabled={busy} onPress={async () => { setBusy(true); setError(null); try { await onSend(uri); setUri(null); } catch (e) { setError(e instanceof Error ? e.message : 'Could not send voice answer.'); } finally { setBusy(false); } }} />
    </>) : null}
    {error ? <Text variant="caption">{error}</Text> : null}
  </>);
}
