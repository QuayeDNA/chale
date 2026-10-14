import { ActivityIndicator, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import Svg, { Path } from 'react-native-svg';

import { Text } from './text';

/**
 * Press feedback for the Google row. Written as module-level worklets because
 * the repo's lint forbids shared-value writes inside inline handlers; the
 * value is passed in, so the closure lives on the UI thread.
 */
const pressIn = (s: SharedValue<number>) => {
  'worklet';
  s.value = withTiming(0.97, { duration: 90 });
};

const pressOut = (s: SharedValue<number>) => {
  'worklet';
  s.value = withSpring(1, { damping: 14, stiffness: 320 });
};

/**
 * The Google G in its four brand colours. This is the one logo in the app
 * that cannot come from the icon registry — every registry entry is a
 * single-colour glyph, and the mark only reads as Google as four paths.
 */
export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </Svg>
  );
}

/**
 * The Google sign-in row: the real mark on our secondary button look, with a
 * press-scale the shared `Button` doesn't have. The background stays the
 * theme's surface rather than pure white so it sits on the paper like every
 * other control — the mark carries the recognition, not a white slab.
 */
export function GoogleButton({
  busy = false,
  onPress,
  style,
}: {
  busy?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animated, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={onPress}
        onPressIn={() => pressIn(scale)}
        onPressOut={() => pressOut(scale)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
        {busy ? <ActivityIndicator size="small" /> : <GoogleMark />}
        <Text variant="bodyStrong">Continue with Google</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    // Mirrors Button's secondary variant at md (52) so the ladder reads as one
    // set: same height, same pill, same border, one step louder on press.
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  rowPressed: {
    opacity: 0.9,
  },
}));
