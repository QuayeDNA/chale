import { Pressable, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Screen } from '@/components/screen';
import { BrandLockup } from '@/components/ui/brand-lockup';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAnonymous } = useAuth();
  const scheme = useColorScheme();
  const { width: windowWidth } = useWindowDimensions();
  const lockupWidth = Math.min(windowWidth * 0.52, 220);
  // Cream artwork on dark theme, ink artwork on light theme.
  const lockupVariant = scheme === 'dark' ? 'light' : 'dark';

  const handleGetStarted = () => {
    if (isAnonymous) {
      router.push('/auth');
    } else {
      router.replace('/home');
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <BrandLockup variant={lockupVariant} width={lockupWidth} testID="welcome-lockup" />
      </View>
      {/* Placeholder holding the future welcome illustration's size and position. */}
      <View style={styles.artPlaceholder} accessibilityLabel="Welcome illustration placeholder">
        <Text variant="caption" style={styles.artPlaceholderLabel}>
          Welcome illustration
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label="Get started" onPress={handleGetStarted} testID="welcome-get-started" />
        <Text variant="caption" muted style={styles.accountNote}>
          Create your free account
        </Text>
        <Pressable
          onPress={() => router.replace('/home')}
          accessibilityRole="link"
          accessibilityLabel="Browse as guest"
          style={styles.guestHitArea}
          testID="welcome-guest"
        >
          <Text variant="small" style={styles.guestLabel}>
            Browse as guest instead
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  hero: {
    alignItems: 'center',
    paddingTop: theme.spacing.five,
  },
  artPlaceholder: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: 24,
    marginVertical: theme.spacing.four,
  },
  artPlaceholderLabel: {
    color: theme.colors.muted,
  },
  actions: {
    gap: theme.spacing.two,
  },
  accountNote: {
    textAlign: 'center',
  },
  guestHitArea: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestLabel: {
    textDecorationLine: 'underline',
  },
}));
