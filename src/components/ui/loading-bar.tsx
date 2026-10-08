import { memo, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export type LoadingStatus = 'active' | 'success' | 'error';

export type LoadingBarProps = {
  /** 0–1 fill. Ignored while `indeterminate` is active. */
  progress?: number;
  /** Unknown-duration wait. Loops until `status` flips to success/error. */
  indeterminate?: boolean;
  /** active = working, success = filled + green, error = filled + red. */
  status?: LoadingStatus;
  /** 'bar' = continuous pill, 'segments' = stepped pills (onboarding, uploads in N parts). */
  variant?: 'bar' | 'segments';
  /** Number of pills when variant="segments". */
  segments?: number;
  size?: 'sm' | 'md' | 'lg';
  /** Fill color while active. Defaults to street gold. */
  fill?: string;
  /** Track color. Defaults to border. */
  track?: string;
  testID?: string;
  accessibilityLabel?: string;
};

const HEIGHT = { sm: 6, md: 10, lg: 14 } as const;
const SUCCESS = '#2E9E5B';
const DANGER = '#D32F2F';
const FILL_MS = 450;
const LOOP_MS = 1300;
const SEGMENT_RATIO = 0.35;
const LABEL: Record<LoadingStatus, string> = {
  active: 'Loading',
  success: 'Completed',
  error: 'Failed',
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Pill progress bar, two looks:
 *  - bar:      continuous fill with a soft gloss and a travelling sheen
 *  - segments: stepped pills; indeterminate becomes a wave running through them
 * Settles into success (green) / error (red) with a colour cross-fade.
 */
export function LoadingBar({
  progress = 0,
  indeterminate = false,
  status = 'active',
  variant = 'bar',
  segments = 5,
  size = 'md',
  fill,
  track,
  testID,
  accessibilityLabel,
}: LoadingBarProps) {
  const { theme } = useUnistyles();
  const reduceMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);

  const height = HEIGHT[size];
  const radius = height / 2;
  const activeColor = fill ?? theme.colors.street;
  const trackColor = track ?? theme.colors.border;

  const settled = status !== 'active';
  const looping = indeterminate && !settled && !reduceMotion;
  const sheenOn = variant === 'bar' && !settled && !looping && !reduceMotion && progress > 0;

  // Reduced motion: indeterminate shows a calm static 40% instead of looping.
  const target =
    status === 'success' ? 1 : indeterminate ? (settled ? 1 : 0.4) : clamp01(progress);
  const statusIndex = status === 'success' ? 1 : status === 'error' ? 2 : 0;

  const fillProgress = useSharedValue(target);
  const head = useSharedValue(0);
  const sheen = useSharedValue(0);
  const statusAnim = useSharedValue(statusIndex);

  useEffect(() => {
    if (!looping) {
      fillProgress.value = withTiming(target, {
        duration: FILL_MS,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [target, looping, fillProgress]);

  useEffect(() => {
    statusAnim.value = withTiming(statusIndex, { duration: 250 });
  }, [statusIndex, statusAnim]);

  useEffect(() => {
    if (!looping) {
      cancelAnimation(head);
      head.value = 0;
      return;
    }
    head.value = 0;
    head.value = withRepeat(
      withTiming(1, {
        duration: LOOP_MS,
        easing: variant === 'bar' ? Easing.inOut(Easing.quad) : Easing.linear,
      }),
      -1,
      false,
    );
    return () => cancelAnimation(head);
  }, [looping, variant, head]);

  useEffect(() => {
    if (!sheenOn) {
      cancelAnimation(sheen);
      sheen.value = 0;
      return;
    }
    sheen.value = withRepeat(
      withDelay(600, withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) })),
      -1,
      false,
    );
    return () => cancelAnimation(sheen);
  }, [sheenOn, sheen]);

  /* ------------------------------ bar variant ------------------------------ */
  const fillStyle = useAnimatedStyle(() => {
    const w = fillProgress.value * trackWidth;
    return {
      // never thinner than a dot, so the first bit of progress reads as a pill
      width: fillProgress.value > 0 ? Math.max(w, height) : 0,
      backgroundColor: interpolateColor(
        statusAnim.value,
        [0, 1, 2],
        [activeColor, SUCCESS, DANGER],
      ),
    };
  });

  const segmentStyle = useAnimatedStyle(() => {
    const w = trackWidth * SEGMENT_RATIO;
    return {
      width: w,
      transform: [{ translateX: interpolate(head.value, [0, 1], [-w, trackWidth]) }],
      backgroundColor: interpolateColor(
        statusAnim.value,
        [0, 1, 2],
        [activeColor, SUCCESS, DANGER],
      ),
    };
  });

  const sheenStyle = useAnimatedStyle(() => {
    const fw = fillProgress.value * trackWidth;
    const bw = Math.max(24, fw * 0.35);
    return {
      width: bw,
      transform: [{ translateX: interpolate(sheen.value, [0, 1], [-bw, fw]) }],
    };
  });

  /* --------------------------------- render -------------------------------- */
  const a11y = {
    accessibilityRole: 'progressbar' as const,
    accessibilityLabel: accessibilityLabel ?? LABEL[status],
    accessibilityValue:
      indeterminate && !settled
        ? undefined
        : { min: 0, max: 100, now: Math.round(target * 100) },
  };

  if (variant === 'segments') {
    return (
      <View style={styles.segments} testID={testID} {...a11y}>
        {Array.from({ length: segments }).map((_, i) => (
          <Cell
            key={i}
            index={i}
            count={segments}
            height={height}
            looping={looping}
            fillProgress={fillProgress}
            head={head}
            statusAnim={statusAnim}
            activeColor={activeColor}
            trackColor={trackColor}
          />
        ))}
      </View>
    );
  }

  return (
    <View
      style={[styles.track, { height, borderRadius: radius, backgroundColor: trackColor }]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      testID={testID}
      {...a11y}
    >
      {looping ? (
        <Animated.View style={[styles.layer, { height, borderRadius: radius }, segmentStyle]}>
          <View style={styles.gloss} />
        </Animated.View>
      ) : (
        <Animated.View style={[styles.layer, { height, borderRadius: radius }, fillStyle]}>
          <View style={styles.gloss} />
          {sheenOn && <Animated.View style={[styles.sheen, sheenStyle]} />}
        </Animated.View>
      )}
    </View>
  );
}

/* ---------------------------- segments: one pill ---------------------------- */

const Cell = memo(function Cell({
  index,
  count,
  height,
  looping,
  fillProgress,
  head,
  statusAnim,
  activeColor,
  trackColor,
}: {
  index: number;
  count: number;
  height: number;
  looping: boolean;
  fillProgress: SharedValue<number>;
  head: SharedValue<number>;
  statusAnim: SharedValue<number>;
  activeColor: string;
  trackColor: string;
}) {
  const style = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      statusAnim.value,
      [0, 1, 2],
      [activeColor, SUCCESS, DANGER],
    );
    if (looping) {
      // a soft "playhead" runs through the pills
      const h = head.value * (count + 2) - 1;
      const intensity = Math.max(0, 1 - Math.abs(index - h) / 1.6);
      return { width: '100%', opacity: 0.15 + 0.85 * intensity, backgroundColor };
    }
    const f = Math.min(1, Math.max(0, fillProgress.value * count - index));
    return { width: `${f * 100}%`, opacity: 1, backgroundColor };
  });

  return (
    <View
      style={[styles.cell, { height, borderRadius: height / 2, backgroundColor: trackColor }]}
    >
      <Animated.View style={[{ height, borderRadius: height / 2 }, style]} />
    </View>
  );
});

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  segments: {
    width: '100%',
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    flex: 1,
    overflow: 'hidden',
  },
});

/*
  <LoadingBar progress={0.62} />
  <LoadingBar variant="segments" segments={5} progress={0.6} size="lg" />
  <LoadingBar indeterminate />                       // looping segment
  <LoadingBar variant="segments" indeterminate />    // wave through the pills
  <LoadingBar indeterminate status={ok ? 'success' : 'error'} />  // settles + colour fade
*/