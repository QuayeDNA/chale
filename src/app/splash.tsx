import { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLockup } from '@/components/ui/brand-lockup';
import { LoadingBar } from '@/components/ui/loading-bar';
import { Text } from '@/components/ui/text';

const ADVANCE_MS = 1800;
const BAR_WIDTH = 160;

// Fixed brand colors — the splash looks the same in every theme.
const SPLASH_INK = '#2B1A0F';

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const lockupWidth = Math.min(windowWidth * 0.62, 280);

  useEffect(() => {
    const t = setTimeout(() => router.replace('/welcome'), ADVANCE_MS);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.brandZone}>
        <BrandLockup variant="light" width={lockupWidth} testID="splash-lockup" />
      </View>
      {/* Placeholder holding the future illustration's size and position. */}
      <View style={styles.artZone}>
        <View style={styles.artPlaceholder}>
          <Text variant="caption" style={styles.artPlaceholderLabel}>
            Splash illustration
          </Text>
        </View>
      </View>
      <View style={styles.barZone}>
        <View style={{ width: BAR_WIDTH }}>
          <LoadingBar
            indeterminate
            track="rgba(251, 243, 223, 0.2)"
            testID="splash-loading"
            accessibilityLabel="Loading Chale"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: SPLASH_INK,
  },
  brandZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.five,
  },
  artZone: {
    flex: 1,
    paddingHorizontal: 20,
  },
  artPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(251, 243, 223, 0.25)',
    borderRadius: 24,
  },
  artPlaceholderLabel: {
    color: 'rgba(251, 243, 223, 0.5)',
  },
  barZone: {
    alignItems: 'center',
    paddingVertical: theme.spacing.four,
  },
}));
