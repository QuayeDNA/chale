import { View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import Animated, { FadeIn, FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated';

import { Screen } from '@/components/screen';
import { BrandLockup } from '@/components/ui/brand-lockup';
import { Button } from '@/components/ui/button';
import { LegalFoot } from '@/components/ui/legal-foot';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAnonymous } = useAuth();
  const scheme = useColorScheme();
  const reduceMotion = useReducedMotion();
  const { width: windowWidth } = useWindowDimensions();
  const lockupWidth = Math.min(windowWidth * 0.56, 240);
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
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(300)}>
          <BrandLockup variant={lockupVariant} width={lockupWidth} testID="welcome-lockup" />
        </Animated.View>
      </View>
      <View style={styles.actions}>
        <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(280).delay(320)}>
          <Button
            label="Get started"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleGetStarted}
            testID="welcome-get-started"
          />
        </Animated.View>
        <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(280).delay(380)}>
          <Button
            label="Browse decks as guest"
            variant="outline"
            size="md"
            fullWidth
            onPress={() => router.replace('/home')}
            accessibilityLabel="Browse decks as guest"
            testID="welcome-guest"
          />
        </Animated.View>
      </View>
      {/* Pushes the credit to the page bottom: the studio sign-off belongs at
          the foot of the screen, not tucked under the buttons mid-page. */}
      <View style={styles.spacer} />
      <Animated.View
        style={styles.footer}
        entering={reduceMotion ? undefined : FadeIn.duration(280).delay(460)}>
        <LegalFoot />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  hero: {
    alignItems: 'center',
    paddingTop: theme.spacing.five,
    gap: theme.spacing.three,
  },
  actions: {
    marginTop: theme.spacing.four,
    gap: theme.spacing.two,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    marginTop: theme.spacing.two,
  },
}));
