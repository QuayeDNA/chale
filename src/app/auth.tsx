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
  const { signInWithOtpEmail, verifyOtp, updateDisplayName } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Screen>
    <Card>
      <Text variant="title">Your account moment</Text>
      <Text variant="body">Browsing is free. Creating or joining a connection needs an account so answers stay yours.</Text>
      <TextInput placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      {!sent ? (
        <Button label="Send code" onPress={async () => { try { setErr(null); await signInWithOtpEmail(email); setSent(true); } catch (e) { setErr((e as Error).message); } }} />
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
