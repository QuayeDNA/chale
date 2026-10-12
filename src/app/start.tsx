// src/app/start.tsx (replace file)
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { ConnectionInvite } from '@/components/connection-invite';
import { RelationshipPicker } from '@/components/relationship-picker';
import { PendingConnection } from '@/components/pending-connection';
import { Screen } from '@/components/screen';
import { createConnection, joinConnection } from '@/lib/pairing';
import { useAuth } from '@/hooks/use-auth';
import { useConnection } from '@/hooks/use-connection';
export default function StartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAnonymous } = useAuth();
  // The deck chosen on the spread rides along and gets pinned to the
  // connection, so the daily prompt is drawn from it rather than from
  // whatever the relationship type happens to match.
  const deckId = (() => {
    const incoming = params.deck;
    const raw = Array.isArray(incoming) ? incoming[0] : incoming;
    return typeof raw === 'string' && raw ? raw : null;
  })();
  const initialCode = (() => {
    const incoming = params.code;
    const raw = Array.isArray(incoming) ? incoming[0] : incoming;
    return typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  })();
  const deckTitle = (() => {
    const incoming = params.deckTitle;
    const raw = Array.isArray(incoming) ? incoming[0] : incoming;
    return typeof raw === 'string' && raw ? raw : null;
  })();
  const [code, setCode] = useState(initialCode);
  // An invite already sent is the only way in, so re-entering this screen must
  // show THAT code rather than minting another one — a second code would leave
  // whoever was sent the first one with no way in, and leave the person who
  // generated it with nothing to share.
  const existing = useConnection().data;
  const pendingCode = existing?.status === 'pending' ? existing.invite_code : null;
  const [mine, setMine] = useState<string | null>(pendingCode);
  const [relationship, setRelationship] = useState<'partner'>('partner');
  const [err, setErr] = useState<string | null>(null);
  const needAuth = isAnonymous;
  return (
    <Screen>
    <Card>
      <Text variant="title">Start with your person</Text>
      {deckTitle ? (
        <Text variant="caption">
          {deckTitle} will arrive a day at a time. Whoever shares the code sets the deck, so
          theirs wins if you picked a different one.
        </Text>
      ) : null}
      {needAuth ? <Button label="Create account to continue" onPress={() => router.push('/auth')} /> : null}
      {/* Hidden once a code exists: the share block below IS the action, and
          leaving the generator on screen would invite a second code that
          quietly replaces the one you already sent. */}
      {!mine ? <Button label="Generate my invite code" disabled={needAuth} onPress={async () => {
        try { setErr(null); const c = await createConnection(deckId); setMine(c.invite_code); } catch (e) { setErr((e as Error).message); }
      }} /> : null}
      {mine ? (
        <>
          <RelationshipPicker value={relationship} onChange={setRelationship} />
          <ConnectionInvite inviteCode={mine} onShare={() => Share.share({ message: `Join me on Chale: ${Linking.createURL(`join?code=${mine}`)}` })} />
          <PendingConnection inviteCode={mine} />
        </>
      ) : null}
      <TextInput placeholder="Enter their code" autoCapitalize="characters" value={code} onChangeText={setCode} maxLength={6} />
      <Button label="Join with code" variant="outline" disabled={needAuth || code.trim().length < 6} onPress={async () => {
        try { setErr(null); await joinConnection(code); router.replace('/remote'); } catch (e) { setErr((e as Error).message); }
      }} />
      {err ? <Text variant="caption">{err}</Text> : null}
    </Card>
    </Screen>
  );
}
