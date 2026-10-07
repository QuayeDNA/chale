import { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLockup } from '@/components/ui/brand-lockup';
import { LoadingBar } from '@/components/ui/loading-bar';

const ADVANCE_MS = 1800;
const BAR_WIDTH = 160;

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
        <View style={[styles.barWrap, { width: BAR_WIDTH }]}>
          <LoadingBar
            indeterminate
            track="rgba(251, 243, 223, 0.2)"
            testID="splash-loading"
            accessibilityLabel="Loading Chale"
          />
        </View>
      </View>
      {/* Lower zone reserved for the splash illustration artwork. */}
      <View style={styles.artZone} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.ink,
  },
  brandZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.five,
    paddingHorizontal: theme.spacing.five,
  },
  barWrap: {
    maxWidth: '100%',
  },
  artZone: {
    flex: 1,
  },
}));
