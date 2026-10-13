import { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BrandLockup } from '@/components/ui/brand-lockup';
import { LegalFoot } from '@/components/ui/legal-foot';
import { LoadingBar } from '@/components/ui/loading-bar';

/** One brand beat, not a wait: long enough to land the lockup, short enough to feel instant. */
const ADVANCE_MS = 1000;
const EXIT_MS = 180;
const BAR_WIDTH = 160;

// Fixed brand colors — the splash looks the same in every theme.
const SPLASH_INK = '#2B1A0F';

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { width: windowWidth } = useWindowDimensions();
  const lockupWidth = Math.min(windowWidth * 0.58, 260);

  // The stage fades out before the swap so the handoff to the paper-coloured
  // welcome screen reads as a curtain dropping, not a cut.
  const exit = useSharedValue(1);
  const exitStyle = useAnimatedStyle(() => ({ opacity: exit.value }));

  useEffect(() => {
    const advance = setTimeout(() => {
      if (reduceMotion) {
        router.replace('/welcome');
        return;
      }
      exit.value = withTiming(0, { duration: EXIT_MS, easing: Easing.out(Easing.cubic) });
      const swap = setTimeout(() => router.replace('/welcome'), EXIT_MS);
      return () => clearTimeout(swap);
    }, ADVANCE_MS);
    return () => clearTimeout(advance);
  }, [router, exit, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
        exitStyle,
      ]}>
      <View style={styles.centerZone}>
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(320)}>
          <BrandLockup variant="light" width={lockupWidth} testID="splash-lockup" />
        </Animated.View>
      </View>
      <View style={styles.bottomZone}>
        <Animated.View
          style={{ width: BAR_WIDTH }}
          entering={reduceMotion ? undefined : FadeIn.duration(240).delay(400)}>
          <LoadingBar
            indeterminate
            track="rgba(251, 243, 223, 0.2)"
            testID="splash-loading"
            accessibilityLabel="Loading Chale"
          />
        </Animated.View>
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(240).delay(500)}>
          <LegalFoot tone="ink" />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create(() => ({
  root: {
    flex: 1,
    backgroundColor: SPLASH_INK,
  },
  centerZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  bottomZone: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
}));
