// src/app/auth.tsx
import { useEffect, useState } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import Animated, { FadeIn, FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated';

import { BrandLockup } from '@/components/ui/brand-lockup';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TextInput } from '@/components/ui/text-input';
import { Text } from '@/components/ui/text';
import { Divider } from '@/components/ui/divider';
import { GoogleButton } from '@/components/ui/google-button';
import { LegalFoot } from '@/components/ui/legal-foot';
import { Screen } from '@/components/screen';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { LinkResult } from '@/hooks/use-auth';

export default function AuthScreen() {
  const { signInWithOtpEmail, claimAccount, verifyOtp, updateDisplayName, isAnonymous, signInWithGoogle, signInWithApple } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const reduceMotion = useReducedMotion();
  const { width: windowWidth } = useWindowDimensions();
  const lockupWidth = Math.min(windowWidth * 0.56, 240);
  // Cream artwork on dark theme, ink artwork on light theme — same as welcome.
  const lockupVariant = scheme === 'dark' ? 'light' : 'dark';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  // Which social method is busy ('apple' | 'google' | null), or the email send.
  const [busy, setBusy] = useState<'apple' | 'google' | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // The official button must only ever render where Sign in with Apple exists.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  // One runner for both social methods. Cancellation and browser-dismiss stay
  // put silently (they are not failure); a link-conflict note is shown in place;
  // anything else lands the user back where they came from.
  const runSocial = async (which: 'apple' | 'google', fn: () => Promise<LinkResult>) => {
    setErr(null);
    setNote(null);
    setBusy(which);
    try {
      const result = await fn();
      if (result.cancelled) return;
      if (result.note) {
        setNote(result.note);
        return;
      }
      router.back();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  // A guest keeps their user id on sign-up, so the favourites they saved while
  // browsing are already theirs when the code lands. A returning user has no
  // anon data to preserve, so they take the ordinary sign-in path.
  const sendCode = async () => {
    setErr(null);
    if (isAnonymous) await claimAccount(email);
    else await signInWithOtpEmail(email);
    setSent(true);
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(300)}>
          <BrandLockup variant={lockupVariant} width={lockupWidth} testID="auth-lockup" />
        </Animated.View>
      </View>

      <View style={styles.ladder}>
        {/* The official Apple button IS the real mark — black, pill, Apple's own
            label. Only its corner radius is chosen by us. */}
        {appleAvailable ? (
          <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(280).delay(320)}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={26}
              style={styles.apple}
              onPress={() => void runSocial('apple', signInWithApple)}
            />
          </Animated.View>
        ) : null}
        <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(280).delay(380)}>
          <GoogleButton busy={busy === 'google'} onPress={() => void runSocial('google', signInWithGoogle)} />
        </Animated.View>
        <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(280).delay(440)}>
          <Divider label="or" />
        </Animated.View>
        <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(280).delay(500)} style={styles.email}>
          {note ? (
            <Text variant="caption" muted>
              {note}
            </Text>
          ) : null}
          {!sent ? (
            <>
              <Checkbox
                checked={consented}
                onChange={setConsented}
                label="I'm 13 or older"
                hint="If you're under 16, a parent or guardian agrees for you."
              />
              <TextInput
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <Button
                label="Send code"
                disabled={!consented}
                onPress={async () => {
                  try {
                    await sendCode();
                  } catch (e) {
                    setErr((e as Error).message);
                  }
                }}
              />
            </>
          ) : (
            <>
              <TextInput placeholder="Your name" autoCapitalize="words" value={name} onChangeText={setName} />
              <TextInput placeholder="6-digit code" keyboardType="number-pad" value={code} onChangeText={setCode} />
              <Button label="Verify" onPress={async () => { try { setErr(null); await verifyOtp(email, code); if (name.trim()) { await updateDisplayName(name.trim()); } router.back(); } catch (e) { setErr((e as Error).message); } }} />
            </>
          )}
          {err ? <Text variant="caption">{err}</Text> : null}
        </Animated.View>
      </View>

      {/* Pushes the credit to the page bottom, same as welcome. */}
      <View style={styles.spacer} />
      <Animated.View
        style={styles.footer}
        entering={reduceMotion ? undefined : FadeIn.duration(280).delay(560)}>
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
  ladder: {
    marginTop: theme.spacing.four,
    gap: theme.spacing.three,
  },
  email: {
    gap: theme.spacing.two,
  },
  apple: {
    width: '100%',
    height: 52,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    marginTop: theme.spacing.two,
  },
}));
