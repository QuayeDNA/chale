/**
 * Mic button → expands into a recording pill (live waveform + timer) →
 * settles into a playback pill (tap-to-seek waveform, play/pause, discard,
 * send).
 *
 * Give it a width (inside a flex:1 row or a full-width container) — the pill
 * expands to fill it.
 *
 * `onSend` may be async (upload, then persist): the pill stays in a sending
 * state until it settles, so the recording can't be lost or double-sent.
 */
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeOut,
  cancelAnimation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AnimatedIcon, LucideIcon } from './ui/icon';
import { Text } from './ui/text';
import {
  LiveWaveform,
  SeekWaveform,
  useLiveWaveform,
  clamp01,
  formatDuration,
  type LiveWaveformStream,
} from './ui/waveform';

const BUTTON = 56; // collapsed mic button
const INNER = 40; // buttons inside the expanded pill
const SAMPLE_MS = 70;
const MIN_RECORDING_MS = 600; // shorter than this = accidental tap, discard
const DANGER = '#D32F2F';
const DB_FLOOR = -55;
const DB_CEIL = -8;

export type VoiceRecording = {
  uri: string;
  durationMs: number;
  /** 0–1 loudness samples (~every 70ms) — persist these to redraw the waveform later. */
  levels: number[];
};

type Phase = 'idle' | 'recording' | 'recorded' | 'sending';

const levelFromDb = (db: number) => Math.pow(clamp01((db - DB_FLOOR) / (DB_CEIL - DB_FLOOR)), 1.4);

type Props = {
  /** Called when the user taps send. May be async — the pill waits for it. */
  onSend?: (recording: VoiceRecording) => void | Promise<void>;
  onDiscard?: () => void;
  /**
   * Reports the clip as it becomes ready, and null when it is discarded.
   *
   * This is how a parent owns the send button. The answer panel needs its send
   * to sit under the whole panel with a label that explains why it is disabled,
   * which the pill's own button cannot do — so the panel passes
   * `showSend={false}` and keeps the clip itself.
   */
  onRecorded?: (recording: VoiceRecording | null) => void;
  /** Set false when a parent renders the send control itself. */
  showSend?: boolean;
  /**
   * Which half of the pill is showing. The answer panel needs this for the line
   * above the recorder, which reads "Recording…" or "Ready to send" while the
   * clip itself is still being taken — neither of which `onRecorded` can tell
   * it, because that only fires once a clip exists.
   */
  onPhaseChange?: (phase: Phase) => void;
  onPermissionDenied?: () => void;
  maxDurationMs?: number;
  align?: 'start' | 'end';
  style?: StyleProp<ViewStyle>;
  /** Shown under the pill when a send fails. */
  onError?: (message: string) => void;
  /** Rendered when idle and permission has been denied. */
  permissionDeniedHint?: string;
};

export function VoiceRecorder({
  onSend,
  onDiscard,
  onRecorded,
  showSend = true,
  onPhaseChange,
  onPermissionDenied,
  maxDurationMs = 120_000,
  align = 'end',
  style,
  onError,
  permissionDeniedHint,
}: Props) {
  const { theme } = useUnistyles();

  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recState = useAudioRecorderState(recorder, SAMPLE_MS);

  const [phase, setPhase] = useState<Phase>('idle');
  const [width, setWidth] = useState(0);
  const [result, setResult] = useState<VoiceRecording | null>(null);

  const wave = useLiveWaveform(SAMPLE_MS);
  const { push: pushLevel, reset: resetWave } = wave;

  const samples = useRef<number[]>([]);
  const durationRef = useRef(0);
  const expand = useSharedValue(0);

  const reset = useCallback(() => {
    samples.current = [];
    durationRef.current = 0;
    resetWave();
    setResult(null);
    setPhase('idle');
  }, [resetWave]);

  const start = useCallback(async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        onPermissionDenied?.();
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      samples.current = [];
      durationRef.current = 0;
      resetWave();
      recorder.record();
      setPhase('recording');
    } catch {
      reset();
    }
  }, [recorder, onPermissionDenied, reset, resetWave]);

  const stop = useCallback(async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri;
      const durationMs = durationRef.current;
      if (!uri || durationMs < MIN_RECORDING_MS) {
        reset();
        return;
      }
      setResult({ uri, durationMs, levels: samples.current.slice() });
      setPhase('recorded');
    } catch {
      reset();
    }
  }, [recorder, reset]);

  // Collect one loudness sample per recorder tick. Pushed straight into the
  // shared stream the waveform reads on the UI thread — no React render per
  // sample, and the waveform's position advances over the sample interval.
  useEffect(() => {
    if (phase !== 'recording' || !recState.isRecording) return;
    const level = levelFromDb(recState.metering ?? DB_FLOOR);
    durationRef.current = recState.durationMillis;
    samples.current.push(level);
    pushLevel(level);
    // Auto-stop at the cap. Deferred so it lands outside this tick's update.
    if (recState.durationMillis >= maxDurationMs) {
      const timer = setTimeout(stop, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recState.durationMillis]);

  // Morph: circle ⇄ full-width pill.
  useEffect(() => {
    expand.value = withTiming(phase === 'idle' ? 0 : 1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [phase, expand]);

  const pillStyle = useAnimatedStyle(() => ({
    width: interpolate(expand.value, [0, 1], [BUTTON, Math.max(width, BUTTON)]),
    backgroundColor: interpolateColor(expand.value, [0, 1], [theme.colors.street, theme.colors.surface]),
    borderColor: interpolateColor(expand.value, [0, 1], [theme.colors.street, theme.colors.border]),
  }));

  const micStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expand.value, [0, 0.4], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(expand.value, [0, 1], [1, 0.6]) }],
  }));

  const handleSend = useCallback(async () => {
    if (!result) return;
    if (!onSend) {
      reset();
      return;
    }
    setPhase('sending');
    try {
      await onSend(result);
      reset();
    } catch (e) {
      // Keep the recording so the user can retry instead of losing it.
      setPhase('recorded');
      onError?.(e instanceof Error ? e.message : 'Could not send voice message.');
    }
  }, [result, onSend, reset, onError]);

  const handleDiscard = useCallback(() => {
    reset();
    onDiscard?.();
  }, [reset, onDiscard]);

  // Mirror the callback into a ref so the notify effect below cannot be
  // re-triggered by a parent passing a fresh closure every render. Declared
  // first so it has already been written by the time the effect below runs.
  const onRecordedRef = useRef(onRecorded);
  useEffect(() => {
    onRecordedRef.current = onRecorded;
  });
  useEffect(() => {
    onRecordedRef.current?.(result ?? null);
  }, [result]);

  // Same mirror-and-notify shape for the phase. The recorder is the only thing
  // that knows whether it is mid-clip, and a parent that renders its own send
  // control needs to say so out loud.
  const onPhaseRef = useRef(onPhaseChange);
  useEffect(() => {
    onPhaseRef.current = onPhaseChange;
  });
  useEffect(() => {
    onPhaseRef.current?.(phase);
  }, [phase]);

  return (
    <View
      style={[styles.wrap, { alignItems: align === 'end' ? 'flex-end' : 'flex-start' }, style]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.pill, pillStyle]}>
        <Animated.View
          style={[styles.micLayer, micStyle]}
          pointerEvents={phase === 'idle' ? 'auto' : 'none'}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Record voice message"
            onPress={start}
            style={styles.micPress}
          >
            <LucideIcon name="mic" size={24} color={theme.colors.ink} />
          </Pressable>
        </Animated.View>

        {phase === 'recording' && (
          <RecordingView wave={wave} durationMs={recState.durationMillis} width={width} onStop={stop} />
        )}
        {(phase === 'recorded' || phase === 'sending') && result && (
          <PlaybackView
            result={result}
            width={width}
            sending={phase === 'sending'}
            onDiscard={handleDiscard}
            onSend={handleSend}
            showSend={showSend}
          />
        )}
      </Animated.View>

      {permissionDeniedHint && phase === 'idle' ? (
        <Text variant="caption" style={styles.hint} muted>
          {permissionDeniedHint}
        </Text>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Recording state                                                           */
/* -------------------------------------------------------------------------- */

const RecordingView = memo(function RecordingView({
  wave,
  durationMs,
  width,
  onStop,
}: {
  wave: LiveWaveformStream;
  durationMs: number;
  width: number;
  onStop: () => void;
}) {
  const dot = useSharedValue(1);

  useEffect(() => {
    dot.value = withRepeat(
      withSequence(withTiming(0.25, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false,
    );
    return () => cancelAnimation(dot);
  }, [dot]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: dot.value }));

  return (
    <Animated.View
      entering={FadeIn.duration(180).delay(120)}
      exiting={FadeOut.duration(100)}
      style={[styles.content, { width }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Stop recording"
        onPress={onStop}
        style={[styles.circle, { backgroundColor: DANGER }]}
      >
        <View style={styles.stopGlyph} />
      </Pressable>

      <LiveWaveform wave={wave} />

      <View style={styles.timerRow}>
        <Animated.View style={[styles.recDot, dotStyle]} />
        <Text variant="smallBold" style={styles.timer}>
          {formatDuration(durationMs)}
        </Text>
      </View>
    </Animated.View>
  );
});

/* -------------------------------------------------------------------------- */
/*  Playback state                                                            */
/* -------------------------------------------------------------------------- */

const PlaybackView = memo(function PlaybackView({
  result,
  width,
  sending,
  onDiscard,
  onSend,
  showSend,
}: {
  result: VoiceRecording;
  width: number;
  sending: boolean;
  onDiscard: () => void;
  onSend: () => void;
  showSend: boolean;
}) {
  const { theme } = useUnistyles();
  const player = useAudioPlayer(result.uri, { updateInterval: 80 });
  const status = useAudioPlayerStatus(player);
  const progress = useSharedValue(0);

  const { playing, currentTime, didJustFinish } = status;
  const total = status.duration > 0 ? status.duration : result.durationMs / 1000;

  // One writer for the shared value, shared by the sync effect and seek.
  // Plain function, not useCallback: memoising a Reanimated shared value trips
  // react-hooks/immutability.
  const setProgress = (value: number | typeof withTiming) => {
    progress.value = value as number;
  };

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
    <Animated.View
      entering={FadeIn.duration(180).delay(120)}
      exiting={FadeOut.duration(100)}
      style={[styles.content, { width }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause voice message' : 'Play voice message'}
        disabled={sending}
        onPress={() => (playing ? player.pause() : player.play())}
        style={[styles.circle, { backgroundColor: theme.colors.street }]}
      >
        <LucideIcon name={playing ? 'pause' : 'play'} size={18} color={theme.colors.ink} />
      </Pressable>

      <SeekWaveform
        levels={result.levels}
        seed={result.uri}
        progress={progress}
        onSeek={seek}
        dimColor={theme.colors.border}
        fillColor={theme.colors.street}
      />

      <Text variant="smallBold" style={[styles.timer, styles.time]}>
        {formatDuration(shown * 1000)}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Discard recording"
        onPress={onDiscard}
        disabled={sending}
        hitSlop={6}
        style={styles.ghost}
      >
        <LucideIcon name="trash-2" size={18} color={theme.colors.ink} />
      </Pressable>

      {sending ? (
        <View style={[styles.circle, { backgroundColor: theme.colors.ink }]}>
          <AnimatedIcon name="loader" size={18} color={theme.colors.surface} />
        </View>
      ) : showSend ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send voice message"
          onPress={onSend}
          style={[styles.circle, { backgroundColor: theme.colors.ink }]}
        >
          <LucideIcon name="send" size={18} color={theme.colors.surface} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
});

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create((theme) => ({
  wrap: {
    width: '100%',
  },
  hint: {
    marginTop: 8,
    textAlign: 'center',
  },
  pill: {
    height: BUTTON,
    borderRadius: BUTTON / 2,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  micLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: BUTTON,
    height: BUTTON,
  },
  micPress: {
    width: BUTTON,
    height: BUTTON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 7,
  },
  circle: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopGlyph: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  ghost: {
    width: 32,
    height: INNER,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DANGER,
  },
  timer: {
    fontVariant: ['tabular-nums'],
  },
  time: {
    minWidth: 34,
    textAlign: 'right',
  },
}));
