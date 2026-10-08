/**
 * Read-only voice answer pill — tap to play, drag/tap the waveform to seek.
 * On playback completion, records a listen for whoever played (speaker
 * included) so save_own_clip's 2-listen gate is reachable from both sides.
 *
 * Pass `levels` for the real captured waveform. Answers recorded before
 * levels were persisted fall back to a shape derived from the answer id, so
 * the pill still reads as speech rather than a flat line.
 */
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { recordListen } from '@/lib/answers';

import { LucideIcon } from './ui/icon';
import { Text } from './ui/text';
import { SeekWaveform, clamp01, formatDuration } from './ui/waveform';

const PLAY_SIZE = 40;

type Props = {
  url: string;
  answerId: string;
  label: string;
  /** 0–1 loudness samples from the recorder, when available. */
  levels?: number[];
  durationMs?: number;
  onError?: (message: string) => void;
};

export function VoiceMessage({ url, answerId, label, levels, durationMs, onError }: Props) {
  const { theme } = useUnistyles();
  const player = useAudioPlayer(url, { updateInterval: 80 });
  const status = useAudioPlayerStatus(player);
  const listenedRef = useRef(false);
  const progress = useSharedValue(0);

  const { playing, currentTime, didJustFinish } = status;
  const total = status.duration > 0 ? status.duration : (durationMs ?? 0) / 1000;

  // One writer for the shared value so the effect and the seek handler share
  // it. Plain function, not useCallback: memoising a Reanimated shared value
  // trips react-hooks/immutability.
  const setProgress = (value: number | typeof withTiming) => {
    progress.value = value as number;
  };

  useEffect(() => {
    if (didJustFinish && !listenedRef.current) {
      listenedRef.current = true;
      recordListen(answerId).catch((e) =>
        onError?.(e instanceof Error ? e.message : 'Could not record listen.'),
      );
    }
  }, [didJustFinish, answerId, onError]);

  // Reset the once-per-viewer guard when a different clip loads.
  useEffect(() => {
    listenedRef.current = false;
    player.seekTo(0);
  }, [answerId, player]);

  // expo-audio doesn't rewind when playback ends — do it ourselves.
  useEffect(() => {
    if (didJustFinish) {
      setProgress(0);
      player.seekTo(0);
      return;
    }
    const p = total > 0 ? clamp01(currentTime / total) : 0;
    setProgress(playing ? withTiming(p, { duration: 90, easing: Easing.linear }) : p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, playing, didJustFinish]);

  const seek = (ratio: number) => {
    if (total <= 0) return;
    setProgress(ratio);
    player.seekTo(ratio * total);
  };

  const shown = playing || currentTime > 0.1 ? currentTime : total;

  return (
    <View style={styles.wrap}>
      <Text variant="label">{label}</Text>

      <View style={styles.pill}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause voice message' : 'Play voice message'}
          onPress={() => {
            try {
              if (playing) player.pause();
              else player.play();
            } catch (e) {
              onError?.(e instanceof Error ? e.message : 'Could not play voice answer.');
            }
          }}
          style={[styles.play, { backgroundColor: theme.colors.street }]}
        >
          <LucideIcon name={playing ? 'pause' : 'play'} size={18} color={theme.colors.ink} />
        </Pressable>

        <SeekWaveform
          levels={levels}
          seed={answerId}
          progress={progress}
          onSeek={seek}
          dimColor={theme.colors.border}
          fillColor={theme.colors.street}
        />

        <Text variant="smallBold" style={styles.time}>
          {formatDuration(shown * 1000)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  wrap: {
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 7,
    borderRadius: 28,
  },
  play: {
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: PLAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontVariant: ['tabular-nums'],
    minWidth: 34,
    textAlign: 'right',
  },
}));
