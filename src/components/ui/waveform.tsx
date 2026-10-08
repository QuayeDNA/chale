/**
 * Waveform primitives shared by the recorder and the player.
 *
 * Loudness arrives as 0–1 samples (~70ms apart). Two rules keep both ends
 * consistent:
 *
 *  1. Each waveform measures its own width, so nothing has to thread a width
 *     down from a parent that may not have been laid out yet.
 *  2. Live and playback render the same shape for the same samples — live
 *     slides continuously through the sample stream, playback rescales the
 *     finished stream. Handing off between them therefore doesn't re-flow the
 *     bars.
 *
 * Bar heights interpolate between neighbouring samples rather than snapping to
 * whichever sample happened to land on the tick, which is what makes the live
 * view read as a flowing wave instead of a ticking bar chart.
 */
import { memo, useMemo, useState } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export const BAR_W = 3;
export const BAR_GAP = 3;
export const BAR_MIN = 4;
export const WAVE_H = 28;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** How many bars fit in `width`. */
export const barCount = (width: number) =>
  width > 0 ? Math.max(8, Math.floor((width + BAR_GAP) / (BAR_W + BAR_GAP))) : 0;

export function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Rescale loudness samples to `count` bars, normalised so the loudest bar is
 * full height. Blends mean and peak so a quiet passage still reads as speech
 * rather than a flat line.
 */
export function resampleLevels(levels: number[], count: number) {
  if (count <= 0) return [];
  if (levels.length === 0) return new Array(count).fill(0);
  const out: number[] = new Array(count);
  const size = levels.length / count;
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * size);
    const end = Math.max(start + 1, Math.floor((i + 1) * size));
    let sum = 0;
    let max = 0;
    let n = 0;
    for (let j = start; j < end && j < levels.length; j++) {
      sum += levels[j];
      max = Math.max(max, levels[j]);
      n++;
    }
    out[i] = n ? (sum / n) * 0.6 + max * 0.4 : 0;
  }
  const peak = Math.max(...out, 0.05);
  return out.map((v) => v / peak);
}

/**
 * Shape for answers recorded before levels were persisted. Derived from the
 * answer id, so it's stable per answer but still reads as speech — a
 * placeholder, not captured audio.
 */
export function placeholderLevels(seed: string, count: number) {
  if (count <= 0) return [];
  let h = 31;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const r = (h >>> 8) / 0xffffff;
    const shape = Math.abs(Math.sin(i * 0.7)) * 0.55 + Math.abs(Math.sin(i * 0.23 + 1.4)) * 0.35;
    out.push(clamp01(shape + r * 0.22) * 0.85 + 0.08);
  }
  const peak = Math.max(...out, 0.05);
  return out.map((v) => v / peak);
}

/** Measured width of a waveform slot row. */
export function useWaveWidth(onWidth?: (w: number) => void) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: { nativeEvent: { layout: { width: number } } }) => {
    const w = e.nativeEvent.layout.width;
    setWidth(w);
    onWidth?.(w);
  };
  return { width, onLayout };
}

/** Static bars, centred on the baseline. */
export const WaveBars = memo(function WaveBars({
  bars,
  color,
  width,
}: {
  bars: number[];
  color: string;
  width: number;
}) {
  return (
    <View style={[styles.bars, { width }]}>
      {bars.map((v, i) => (
        <View
          key={i}
          style={[styles.bar, { height: Math.max(BAR_MIN, v * WAVE_H), backgroundColor: color }]}
        />
      ))}
    </View>
  );
});

/**
 * Owns the live sample stream. Pushes happen on the audio tick; the waveform
 * reads the array on the UI thread, so recording doesn't re-render React.
 */
export function useLiveWaveform(sampleIntervalMs = 70) {
  const stream = useSharedValue<number[]>([]);
  const pos = useSharedValue(0);

  // Plain functions rather than useCallback: Reanimated shared values are
  // deliberately mutable, and capturing them in a memoised callback trips
  // react-hooks/immutability.
  const push = (level: number) => {
    const next = [...stream.value, clamp01(level)];
    stream.value = next;
    pos.value = withTiming(next.length, {
      duration: sampleIntervalMs,
      easing: Easing.linear,
    });
  };

  const reset = () => {
    stream.value = [];
    pos.value = 0;
  };

  return { stream, pos, push, reset };
}

export type LiveWaveformStream = ReturnType<typeof useLiveWaveform>;

/**
 * One live bar. Reads the sample stream at a continuous, animating position
 * and interpolates between the two neighbouring samples, so growth is smooth
 * instead of stepping once per sample.
 */
const LiveBar = memo(function LiveBar({
  index,
  count,
  samples,
  pos,
  dimColor,
  liveColor,
}: {
  /** 0 = leftmost. */
  index: number;
  count: number;
  samples: SharedValue<number[]>;
  pos: SharedValue<number>;
  dimColor: string;
  liveColor: string;
}) {
  const style = useAnimatedStyle(() => {
    'worklet';
    const arr = samples.value;
    // Stream index this bar is currently showing.
    const stream = pos.value - (count - 1 - index);
    const at = Math.max(0, stream);
    const lo = Math.floor(at);
    const frac = at - lo;
    const a = arr[lo];
    const b = arr[Math.min(arr.length - 1, lo + 1)];
    const v = a === undefined ? 0 : (a + ((b ?? a) - a) * frac);
    // Bars to the left of the stream start as the flat baseline, then tint in.
    const t = Math.min(1, Math.max(0, stream + 1));
    return {
      height: Math.max(BAR_MIN, v * WAVE_H),
      backgroundColor: interpolateColor(t, [0, 1], [dimColor, liveColor]),
    };
  });

  return <Animated.View style={[styles.bar, style]} />;
});

/**
 * Scrolling waveform for the recording state. Newest sample enters on the
 * right; the position animates over the sample interval so the wave glides.
 */
export const LiveWaveform = memo(function LiveWaveform({
  wave,
}: {
  wave: LiveWaveformStream;
}) {
  const { theme } = useUnistyles();
  const { width, onLayout } = useWaveWidth();
  const count = barCount(width);

  return (
    <View style={styles.row} onLayout={onLayout}>
      {count > 0
        ? Array.from({ length: count }, (_, i) => (
            <LiveBar
              key={i}
              index={i}
              count={count}
              samples={wave.stream}
              pos={wave.pos}
              dimColor={theme.colors.border}
              liveColor={theme.colors.ink}
            />
          ))
        : null}
    </View>
  );
});

/**
 * Tap-to-seek waveform. Renders the bars twice — a dim layer and a filled
 * layer clipped by `progress` — so playback scrolls without re-rendering
 * every frame.
 */
export function SeekWaveform({
  levels,
  seed,
  progress,
  onSeek,
  dimColor,
  fillColor,
}: {
  levels?: number[];
  /** Used to shape the placeholder when `levels` is absent. */
  seed?: string;
  progress: SharedValue<number>;
  onSeek: (ratio: number) => void;
  dimColor: string;
  fillColor: string;
}) {
  const { width, onLayout } = useWaveWidth();
  const count = barCount(width);

  const bars = useMemo(() => {
    if (count === 0) return [];
    return levels && levels.length > 0
      ? resampleLevels(levels, count)
      : placeholderLevels(seed ?? 'waveform', count);
  }, [levels, seed, count]);

  const fillStyle = useAnimatedStyle(() => ({ width: progress.value * width }));

  const handlePress = (e: GestureResponderEvent) => {
    if (width <= 0) return;
    onSeek(clamp01(e.nativeEvent.locationX / width));
  };

  return (
    <Pressable
      accessibilityRole="adjustable"
      accessibilityLabel="Seek within voice message"
      onPress={handlePress}
      onLayout={onLayout}
      style={styles.hit}
    >
      <View pointerEvents="none" style={styles.stack}>
        <WaveBars bars={bars} color={dimColor} width={width} />
        <Animated.View style={[styles.fill, fillStyle]}>
          <WaveBars bars={bars} color={fillColor} width={width} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flex: 1,
    height: WAVE_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: BAR_GAP,
    overflow: 'hidden',
  },
  hit: {
    flex: 1,
    height: WAVE_H + 12,
    justifyContent: 'center',
  },
  stack: {
    height: WAVE_H,
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  bars: {
    height: WAVE_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bar: {
    width: BAR_W,
    borderRadius: BAR_W / 2,
    backgroundColor: theme.colors.ink,
  },
}));
