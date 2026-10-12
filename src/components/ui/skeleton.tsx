import React, { useEffect, useState, type ReactNode } from 'react';
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet as RNStyleSheet,
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
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

/* -------------------------------------------------------------------------- */
/*  Theme                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The base fill is the theme's own border token, not a grey.
 *
 * A skeleton is a shape waiting for content, so it has to be made of the same
 * material the real surface is made of. A neutral grey on this palette reads as
 * a rendering fault rather than as "loading" — it is a colour the app uses
 * nowhere else.
 */
function useSkeletonPalette() {
  const { theme } = useUnistyles();
  const dark = useColorScheme() === 'dark';
  return {
    base: theme.colors.border,
    highlight: dark ? 'rgba(251,243,223,0.14)' : 'rgba(255,255,255,0.85)',
    clear: 'rgba(0,0,0,0)',
  };
}

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
  const colors = useSkeletonPalette();
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
        <Animated.View style={[RNStyleSheet.absoluteFill, shimmerStyle]}>
          <LinearGradient
            colors={[colors.clear, colors.highlight, colors.clear]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={RNStyleSheet.absoluteFill}
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
  widths,
  variant,
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  /**
   * Per-line widths. Defaults to full-width bars with a short last line, which
   * is what a paragraph looks like. Pass explicit widths for a title, where
   * "70%, 46%" reads as a heading rather than a paragraph.
   */
  widths?: DimensionValue[];
  variant?: SkeletonProps['variant'];
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          radius={lineHeight / 2}
          width={widths?.[i] ?? (i === lines - 1 && lines > 1 ? '60%' : '100%')}
          variant={variant}
        />
      ))}
    </View>
  );
}

/**
 * A card-shaped placeholder.
 *
 * Every skeleton that stands in for something with a surface was previously
 * hand-assembled out of bare `Skeleton` bars, which is how the deck grid ended
 * up as three floating blobs: the bars were there, the card they belonged to was
 * not. This owns the card geometry — the same padding, radius, border and shadow
 * as `Card` — so a placeholder and the real component it precedes are the same
 * size and the page does not jump when the data lands.
 *
 * `top` and `bottom` take `Skeleton` children rather than props, because the
 * things worth placeholdering vary too much to enumerate: an icon and a title
 * up top, copy and actions underneath.
 */
export function SkeletonCard({
  top,
  bottom,
  style,
}: {
  top?: ReactNode;
  bottom?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useUnistyles();
  return (
    <View
      // A skeleton is decoration for something that has not arrived, so it is
      // never announced — otherwise a grid of four reads out as four loading
      // cards to a screen reader.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
styles.card,
        {
          borderRadius: theme.radii.card,
          padding: theme.spacing.four,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {top ? <View style={styles.slot}>{top}</View> : null}
      {bottom ? <View style={styles.slot}>{bottom}</View> : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create((theme) => ({
  base: {
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    justifyContent: 'space-between',
    borderWidth: 1,
    // Matches Card's depth so a placeholder is not a flatter object than the
    // thing it becomes.
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  slot: {
    gap: theme.spacing.two,
  },
}));