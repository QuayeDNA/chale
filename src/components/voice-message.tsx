/**
 * Read-only voice answer pill — tap to play, drag/tap the waveform to seek.
 * On playback completion, records a listen for whoever played (speaker
 * included) so save_own_clip's 2-listen gate is reachable from both sides.
 *
 * Pass `levels` for the real captured waveform. Answers recorded before
 * levels were persisted fall back to a shape derived from the answer id, so
 * the pill still reads as speech rather than a flat line.
 *
 * The audio player is only mounted while a clip is loaded. expo-audio's status
 * event fires on a fixed `updateInterval` whether or not anything is playing,
 * so a player left mounted idles at ~12 renders a second for every answer on
 * screen. Unmounting on finish means a resting list of voice answers costs
 * nothing.
 */
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
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

export function VoiceMessage({ label, onError, ...clip }: Props) {
  // Derived, not stored: a new answerId simply doesn't match, so the pill
  // reads as idle again without a reset effect.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const loaded = loadedFor === clip.answerId;

  // Once per viewer per clip — keyed by id, so it survives unmount cycles.
  const listenedFor = useRef<string | null>(null);

  const handleFinished = useCallback(() => {
    if (listenedFor.current === clip.answerId) return;
    listenedFor.current = clip.answerId;
    recordListen(clip.answerId).catch((e) =>
      onError?.(e instanceof Error ? e.message : 'Could not record listen.'),
    );
  }, [clip.answerId, onError]);

  return (
    <View style={styles.wrap}>
      <Text variant="label">{label}</Text>
      {loaded ? (
        <ClipPill
          {...clip}
          onError={onError}
          onFinished={handleFinished}
          onRetire={() => setLoadedFor(null)}
        />
      ) : (
        <IdlePill {...clip} onLoad={() => setLoadedFor(clip.answerId)} />
      )}
    </View>
  );
}

/** No player mounted — a still pill that only costs a tap to wake up. */
function IdlePill({
  levels,
  durationMs,
  answerId,
  onLoad,
}: Pick<Props, 'url' | 'levels' | 'durationMs' | 'answerId'> & { onLoad: () => void }) {
  const progress = useSharedValue(0);

  return (
    <PillShell
      playing={false}
      onToggle={onLoad}
      time={formatDuration(durationMs ?? 0)}
      progress={progress}
      levels={levels}
      answerId={answerId}
    />
  );
}

/** Player mounted: real playback, seeking and the once-per-viewer listen. */
function ClipPill({
  url,
  answerId,
  levels,
  durationMs,
  onError,
  onFinished,
  onRetire,
}: Omit<Props, 'label'> & {
  onFinished: () => void;
  onRetire: () => void;
}) {
  const player = useAudioPlayer(url, { updateInterval: 80 });
  const status = useAudioPlayerStatus(player);
  const progress = useSharedValue(0);

  const { playing, currentTime, didJustFinish } = status;
  const total = status.duration > 0 ? status.duration : (durationMs ?? 0) / 1000;

  // One writer for the shared value so the effect and the seek handler share
  // it. Plain function, not useCallback: memoising a Reanimated shared value
  // trips react-hooks/immutability.
  const setProgress = (value: number | typeof withTiming) => {
    progress.value = value as number;
  };

  // expo-audio doesn't rewind when playback ends — do it ourselves, then hand
  // the pill back so the player (and its status timer) can go away.
  useEffect(() => {
    if (didJustFinish) {
      setProgress(0);
      player.seekTo(0);
      onFinished();
      onRetire();
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
    <PillShell
      playing={playing}
      onToggle={() => {
        try {
          if (playing) player.pause();
          else player.play();
        } catch (e) {
          onError?.(e instanceof Error ? e.message : 'Could not play voice answer.');
          onRetire();
        }
      }}
      time={formatDuration(shown * 1000)}
      progress={progress}
      onSeek={seek}
      levels={levels}
      answerId={answerId}
    />
  );
}

/** Shared chrome so the idle and playing pills can't drift apart. */
function PillShell({
  playing,
  onToggle,
  time,
  progress,
  onSeek,
  levels,
  answerId,
}: {
  playing: boolean;
  onToggle: () => void;
  time: string;
  progress: ReturnType<typeof useSharedValue<number>>;
  onSeek?: (ratio: number) => void;
  levels?: number[];
  answerId: string;
}) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.pill}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause voice message' : 'Play voice message'}
        onPress={onToggle}
        style={[styles.play, { backgroundColor: theme.colors.street }]}
      >
        <LucideIcon name={playing ? 'pause' : 'play'} size={18} color={theme.colors.ink} />
      </Pressable>

      <SeekWaveform
        levels={levels}
        seed={answerId}
        progress={progress}
        onSeek={onSeek}
        dimColor={theme.colors.border}
        fillColor={theme.colors.street}
      />

      <Text variant="smallBold" style={styles.time}>
        {time}
      </Text>
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
