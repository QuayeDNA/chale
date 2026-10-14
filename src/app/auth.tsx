// src/app/auth.tsx
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TextInput } from '@/components/ui/text-input';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { LegalFoot } from '@/components/ui/legal-foot';
import { Screen } from '@/components/screen';
import { useAuth } from '@/hooks/use-auth';
import type { LinkResult } from '@/hooks/use-auth';

export default function AuthScreen() {
  const { signInWithOtpEmail, claimAccount, verifyOtp, updateDisplayName, isAnonymous, signInWithGoogle, signInWithApple } = useAuth();
  const router = useRouter();
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
      <Card>
        <Text variant="title">Your account moment</Text>
        <Text variant="body">Browsing is free. Creating or joining a connection needs an account so answers stay yours.</Text>
        {isAnonymous ? (
          <Text variant="caption" muted>
            Your favourites and progress come with you — nothing is lost by signing up.
          </Text>
        ) : null}
        {appleAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={26}
            style={{ width: '100%', height: 52 }}
            onPress={() => void runSocial('apple', signInWithApple)}
          />
        ) : null}
        <Button
          label="Continue with Google"
          variant="secondary"
          icon="globe"
          fullWidth
          loading={busy === 'google'}
          onPress={() => void runSocial('google', signInWithGoogle)}
        />
        <Divider label="or" />
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
        <LegalFoot />
      </Card>
    </Screen>
  );
}
