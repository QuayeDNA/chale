import React, { useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useColorScheme,
  type DimensionValue,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
// Bare RN? Swap for: import LinearGradient from 'react-native-linear-gradient';
import { LinearGradient } from 'expo-linear-gradient';

/* -------------------------------------------------------------------------- */
/*  Theme                                                                     */
/* -------------------------------------------------------------------------- */

const PALETTE = {
  light: {
    base: '#E8EAEF',
    highlight: 'rgba(255,255,255,0.70)',
    clear: 'rgba(255,255,255,0)',
  },
  dark: {
    base: '#22252C',
    highlight: 'rgba(255,255,255,0.07)',
    clear: 'rgba(255,255,255,0)',
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Skeleton (base primitive)                                                 */
/* -------------------------------------------------------------------------- */

export type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  /** Corner radius. Use a large number (or half the size) for circles. */
  radius?: number;
  /** 'shimmer' sweeps a soft highlight; 'pulse' fades opacity (no gradient needed). */
  variant?: 'shimmer' | 'pulse';
  /** Duration of one sweep/pulse in ms. */
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  variant = 'shimmer',
  duration = 1300,
  style,
}: SkeletonProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = PALETTE[scheme];
  const reduceMotion = useReducedMotion();

  const [measuredWidth, setMeasuredWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;

    progress.value = 0;
    progress.value =
      variant === 'shimmer'
        ? withRepeat(
            withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
            -1,
            false,
          )
        : withRepeat(
            withTiming(1, { duration: duration * 0.7, easing: Easing.inOut(Easing.ease) }),
            -1,
            true, // reverse → smooth in/out
          );

    return () => cancelAnimation(progress);
  }, [variant, duration, reduceMotion, progress]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== measuredWidth) setMeasuredWidth(w);
  };

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-measuredWidth, measuredWidth]) },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0.45]),
  }));

  const isShimmer = variant === 'shimmer' && !reduceMotion && measuredWidth > 0;

  return (
    <Animated.View
      onLayout={onLayout}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[
        styles.base,
        { width, height, borderRadius: radius, backgroundColor: colors.base },
        variant === 'pulse' && !reduceMotion ? pulseStyle : null,
        style,
      ]}
    >
      {isShimmer && (
        <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
          <LinearGradient
            colors={[colors.clear, colors.highlight, colors.clear]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Composed helpers                                                          */
/* -------------------------------------------------------------------------- */

export function SkeletonAvatar({ size = 48, variant }: { size?: number; variant?: SkeletonProps['variant'] }) {
  return <Skeleton width={size} height={size} radius={size / 2} variant={variant} />;
}

export function SkeletonText({
  lines = 3,
  lineHeight = 12,
  gap = 8,
  variant,
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  variant?: SkeletonProps['variant'];
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          radius={lineHeight / 2}
          // last line shorter so it reads like a paragraph
          width={i === lines - 1 && lines > 1 ? '60%' : '100%'}
          variant={variant}
        />
      ))}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Example: card skeleton                                                    */
/* -------------------------------------------------------------------------- */

export function CardSkeleton() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: dark ? '#16181D' : '#FFFFFF',
          borderColor: dark ? '#2A2D35' : '#EEF0F4',
        },
      ]}
    >
      <View style={styles.row}>
        <SkeletonAvatar size={44} />
        <View style={styles.headerText}>
          <Skeleton width="55%" height={14} radius={7} />
          <Skeleton width="35%" height={10} radius={5} />
        </View>
      </View>

      <Skeleton height={160} radius={14} />

      <SkeletonText lines={3} />

      <View style={styles.row}>
        <Skeleton width={84} height={34} radius={17} />
        <Skeleton width={84} height={34} radius={17} />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  card: {
    padding: 16,
    gap: 16,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 8,
  },
});

/* -------------------------------------------------------------------------- */
/*  Usage                                                                     */
/* -------------------------------------------------------------------------- */
/*
  import { Skeleton, SkeletonText, SkeletonAvatar, CardSkeleton } from './Skeleton';

  {isLoading ? <CardSkeleton /> : <RealCard data={data} />}

  <Skeleton width={120} height={20} />               // shimmer (default)
  <Skeleton variant="pulse" height={48} radius={12} /> // pulse, no gradient dep
  <SkeletonText lines={4} />
  <SkeletonAvatar size={64} />
*/