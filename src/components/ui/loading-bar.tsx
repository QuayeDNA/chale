import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

type LoadingBarProps = {
  /** 0–1 fill. Ignored when `indeterminate` is true. */
  progress?: number;
  /** Looping ping-pong segment for unknown-duration waits. */
  indeterminate?: boolean;
  size?: 'sm' | 'md';
  /** Fill color. Defaults to street gold. */
  fill?: string;
  /** Track color. Defaults to border. */
  track?: string;
  testID?: string;
  accessibilityLabel?: string;
};

const SEGMENT_RATIO = 0.4;
const INDETERMINATE_DURATION = 1300;
const FILL_DURATION = 400;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

/**
 * Rounded progress bar — board language (pill shapes, street gold).
 * Determinate by default; `indeterminate` loops a segment for
 * unknown waits (splash, sending, waiting on partner).
 */
export function LoadingBar({
  progress = 0,
  indeterminate = false,
  size = 'md',
  fill,
  track,
  testID,
  accessibilityLabel,
}: LoadingBarProps) {
  const { theme } = useUnistyles();
  const [trackWidth, setTrackWidth] = useState(0);

  const height = size === 'sm' ? 6 : 10;
  const fillColor = fill ?? theme.colors.street;
  const trackColor = track ?? theme.colors.border;

  const clamped = clamp01(progress);
  const fillProgress = useSharedValue(clamped);
  const head = useSharedValue(0);

  useEffect(() => {
    if (!indeterminate) {
      fillProgress.value = withTiming(clamped, {
        duration: FILL_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [clamped, fillProgress, indeterminate]);

  useEffect(() => {
    if (indeterminate && trackWidth > 0) {
      head.value = withRepeat(
        withTiming(1, {
          duration: INDETERMINATE_DURATION,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      );
    }
  }, [head, indeterminate, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillProgress.value * 100}%`,
  }));

  const segmentStyle = useAnimatedStyle(() => {
    const segment = trackWidth * SEGMENT_RATIO;
    return {
      width: segment,
      transform: [{ translateX: head.value * (trackWidth - segment) }],
    };
  });

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: trackColor,
          height,
          borderRadius: height / 2,
        },
      ]}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? 'Loading'}
      accessibilityValue={
        indeterminate ? undefined : { min: 0, max: 100, now: Math.round(clamped * 100) }
      }
    >
      {indeterminate ? (
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: fillColor, height, borderRadius: height / 2 },
            segmentStyle,
          ]}
        />
      ) : (
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: fillColor, height, borderRadius: height / 2 },
            fillStyle,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    minWidth: 0,
  },
});
