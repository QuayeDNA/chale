// src/app/auth.tsx
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/screen';
import { useAuth } from '@/hooks/use-auth';

export default function AuthScreen() {
  const { signInWithOtpEmail, claimAccount, verifyOtp, updateDisplayName, isAnonymous } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
        <TextInput placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        {!sent ? (
          <Button label="Send code" onPress={async () => { try { await sendCode(); } catch (e) { setErr((e as Error).message); } }} />
        ) : (
          <>
            <TextInput placeholder="Your name" autoCapitalize="words" value={name} onChangeText={setName} />
            <TextInput placeholder="6-digit code" keyboardType="number-pad" value={code} onChangeText={setCode} />
            <Button label="Verify" onPress={async () => { try { setErr(null); await verifyOtp(email, code); if (name.trim()) { await updateDisplayName(name.trim()); } router.back(); } catch (e) { setErr((e as Error).message); } }} />
          </>
        )}
        {err ? <Text variant="caption">{err}</Text> : null}
      </Card>
    </Screen>
  );
}
