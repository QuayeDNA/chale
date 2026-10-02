// src/components/voice-message.tsx
// Tap-to-play voice answer. On playback completion, records a listen for
// whoever played (speaker included) so save_own_clip's 2-listen gate is
// reachable from both sides.
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Text } from './ui/text';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { recordListen } from '@/lib/answers';

export function VoiceMessage({ url, answerId, label }: { url: string; answerId: string; label: string }) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState<string | null>(null);
  const listenedRef = useRef(false);

  useEffect(() => {
    if (status.didJustFinish && !listenedRef.current) {
      listenedRef.current = true;
      recordListen(answerId).catch((e) => setError(e instanceof Error ? e.message : 'Could not record listen.'));
    }
  }, [status.didJustFinish, answerId]);

  // Reset the once-per-viewer guard when a different clip loads.
  useEffect(() => {
    listenedRef.current = false;
  }, [answerId]);

  return (<>
    <Text variant="label">{label}</Text>
    <Button
      label={status.playing ? 'Pause' : 'Play voice'}
      variant="outline"
      onPress={() => {
        setError(null);
        try {
          if (status.playing) player.pause();
          else player.play();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not play voice answer.');
        }
      }}
    />
    {error ? <Text variant="caption">{error}</Text> : null}
  </>);
}
