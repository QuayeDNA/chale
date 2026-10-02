# Backend + Frontend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the functional Chale core loop (pairing → daily question → text+voice answers → waiting → reveal → voice save) using only existing UI primitives.

**Architecture:** RPC-first Supabase (SECURITY DEFINER) for pairing, daily prompt, listen/save; thin TanStack Query hooks + Expo Router screens; realtime on prompts+answers for instant reveal.

**Tech Stack:** Expo SDK 57, React Native, expo-router, TanStack Query 5, Supabase Postgres + Auth + Storage, expo-audio (recording/playback), expo-linking + React Native Share, zod + react-hook-form (invite code form), TypeScript strict.

## Global Constraints

- Reveal rule stays server-side in `submit_answer` — never compute reveal on client.
- Partner answer readable only after `reveal_state='revealed'` (existing RLS `answers_read`).
- Anonymous-first: browse with anon, `linkIdentity` on OTP so `auth.uid()` does not change.
- Invite code is 6-char uppercase A-Z0-9, unique on `connections.invite_code`.
- One prompt per connection per date (`uq_prompt_connection_date`).
- Voice backstop expiry is `now()+7 days` on upload.
- Save is speaker-only, after both listened.
- UI uses only `src/components/ui/*` (Button, Card, Text, TextInput, Badge, Icon) + `ThemedText/View` — no new design tokens.
- MVP relationship_type is `partner` only.
- Push notifications and scheduler/cron are out of scope.

---

## File Structure

New backend:
- `supabase/migrations/0003_pairing.sql` — owns `create_connection`, `join_connection`, grants. Single responsibility: pairing only.
- `supabase/migrations/0004_daily_voice.sql` — owns `voice_listens` table, `voice-clips` bucket, `get_or_create_today_prompt`, `record_listen`, `save_own_clip`, grants. Single responsibility: daily + voice lifecycle.

New lib (thin RPC wrappers, no UI):
- `src/lib/pairing.ts` — `createConnection()`, `joinConnection(code)`.
- `src/lib/prompts.ts` — `getTodayPrompt(connectionId)`, type `PromptWithQuestion`.
- `src/lib/answers.ts` — `submitTextAnswer()`, `submitVoiceAnswer()`, `recordListen()`, `saveOwnClip()`.
- `src/lib/voice-upload.ts` — `uploadVoiceAsync(localUri, answerId)`.

New hooks (Query + Supabase, no styling):
- `src/hooks/use-connection.tsx` — current user's linked/pending connection.
- `src/hooks/use-today-prompt.tsx` — today prompt for connection.
- `src/hooks/use-realtime-prompt.tsx` — realtime subscribe to prompt + answers.

Modified:
- `src/lib/database.types.ts` — regenerate after 0003/0004.
- `src/hooks/use-auth.tsx` — add `signInWithOtpEmail()`, `verifyOtp()`, `linkIdentityAfterOtp()`.
- `src/app/start.tsx` — replace placeholder with create/join + share.
- `src/app/index.tsx` — replace sample-only home with today state machine.
- `package.json` — add `expo-audio`.

New screens/components (functional composition only):
- `src/app/auth.tsx` — OTP entry.
- `src/app/prompt/[id].tsx` — answer + reveal detail.
- `src/components/connection-invite.tsx`
- `src/components/question-card.tsx`
- `src/components/answer-composer.tsx`
- `src/components/waiting-state.tsx`
- `src/components/reveal-card.tsx`
- `src/components/voice-recorder.tsx`
- `src/components/save-voice-prompt.tsx`

Docs to check while working: `docs/02-technical-architecture.md` §3-§4, `docs/04-user-flows.md` §1-§4, `supabase/migrations/0001_initial_schema.sql` (RLS + submit_answer pattern).

---

### Task 1: Pairing RPCs

**Files:**
- Create: `supabase/migrations/0003_pairing.sql`
- Test: `supabase/migrations/0003_pairing.sql` (verify via `supabase db push --dry-run` + SQL probes below)

**Interfaces:**
- Consumes: `connections` table, `auth.uid()`, `connection_member_ids(uuid)` from 0001.
- Produces: `create_connection() returns table(out_id uuid, out_invite_code text)`; `join_connection(p_code text) returns table(out_id uuid, out_status connection_status)`.

- [ ] **Step 1: Write migration file with failing probe comment**

```sql
-- supabase/migrations/0003_pairing.sql
-- Chale pairing: create + join by invite code. RPC-only, no direct client INSERT.
create or replace function make_invite_code() returns text
language plpgsql as $$
declare v text;
begin
  loop
    v := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    v := regexp_replace(v, '[^A-Z0-9]', 'A', 'g');
    if length(v) = 6 and not exists (select 1 from connections where invite_code = v) then
      return v;
    end if;
  end loop;
end;
$$;

create or replace function create_connection()
returns table (out_id uuid, out_invite_code text)
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  v_code := make_invite_code();
  insert into connections (user_a_id, invite_code, status, relationship_type)
  values (auth.uid(), v_code, 'pending', 'partner')
  returning id, invite_code into v_id, v_code;
  return query select v_id, v_code;
end;
$$;

create or replace function join_connection(p_code text)
returns table (out_id uuid, out_status connection_status)
language plpgsql security definer set search_path = public as $$
declare v_row connections%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v_row from connections where invite_code = upper(trim(p_code));
  if not found then raise exception 'code not found'; end if;
  if v_row.status = 'linked' then raise exception 'already linked'; end if;
  if v_row.user_a_id = auth.uid() then raise exception 'cannot join own invite'; end if;
  update connections set user_b_id = auth.uid(), status = 'linked', updated_at = now()
  where id = v_row.id returning * into v_row;
  return query select v_row.id, v_row.status;
end;
$$;

grant execute on function create_connection() to authenticated;
grant execute on function join_connection(text) to authenticated;
```

- [ ] **Step 2: Push migration to linked project**

Run: `supabase db push`
Expected: `Applying migration 0003_pairing.sql... done`.

- [ ] **Step 3: Probe error paths (expects raised exceptions)**

Run in Supabase SQL editor as two authenticated users:
```sql
select * from create_connection();
select * from join_connection('BAD000');
```
Expected: first returns 1 row with 6-char code; second raises `code not found`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0003_pairing.sql
git commit -m "feat(db): pairing RPCs create/join by invite code"
```

### Task 2: Daily prompt + voice lifecycle backend

**Files:**
- Create: `supabase/migrations/0004_daily_voice.sql`
- Test: SQL probes in editor

**Interfaces:**
- Consumes: `connections`, `questions`, `prompts`, `answers`, `connection_member_ids`.
- Produces: `voice_listens(answer_id uuid, listener_id uuid, listened_at timestamptz)`; `get_or_create_today_prompt(p_connection uuid) returns table(out_prompt uuid, out_question uuid, out_text text, out_kind question_kind, out_reveal_state reveal_state)`; `record_listen(p_answer uuid) returns void`; `save_own_clip(p_answer uuid) returns void`; storage bucket `voice-clips`.

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/0004_daily_voice.sql
insert into storage.buckets (id, name, public) values ('voice-clips', 'voice-clips', false)
on conflict (id) do nothing;

create table if not exists voice_listens (
  answer_id uuid not null references answers (id) on delete cascade,
  listener_id uuid not null references users (id) on delete cascade,
  listened_at timestamptz not null default now(),
  primary key (answer_id, listener_id)
);
alter table voice_listens enable row level security;
create policy "listens_read_own" on voice_listens for select
  using (listener_id = auth.uid() or exists (
    select 1 from answers a join prompts p on p.id = a.prompt_id
    where a.id = voice_listens.answer_id
      and exists (select 1 from connection_member_ids(p.connection_id) as m where m = auth.uid())));
create policy "listens_insert_own" on voice_listens for insert with check (listener_id = auth.uid());
grant select, insert on table voice_listens to authenticated;

create or replace function get_or_create_today_prompt(p_connection uuid)
returns table (out_prompt uuid, out_question uuid, out_text text, out_kind question_kind, out_reveal_state reveal_state)
language plpgsql security definer set search_path = public as $$
declare v_prompt prompts%rowtype; v_q questions%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from connection_member_ids(p_connection) as m where m = auth.uid()) then
    raise exception 'not a member of this connection';
  end if;
  select * into v_prompt from prompts where connection_id = p_connection and date = current_date;
  if not found then
    select q.* into v_q from questions q
    where not exists (select 1 from prompts p join questions q2 on q2.id = p.question_id
      where p.connection_id = p_connection and q2.id = q.id)
    order by random() limit 1;
    if not found then select * into v_q from questions order by random() limit 1; end if;
    insert into prompts (connection_id, question_id, date)
    values (p_connection, v_q.id, current_date)
    returning * into v_prompt;
  end if;
  return query select v_prompt.id, v_prompt.question_id, (select text from questions where id = v_prompt.question_id),
    (select kind from questions where id = v_prompt.question_id), v_prompt.reveal_state;
end;
$$;

create or replace function record_listen(p_answer uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into voice_listens (answer_id, listener_id) values (p_answer, auth.uid())
  on conflict do nothing;
end;
$$;

create or replace function save_own_clip(p_answer uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_answer answers%rowtype; v_listen_count int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v_answer from answers where id = p_answer;
  if not found then raise exception 'answer not found'; end if;
  if v_answer.user_id <> auth.uid() then raise exception 'only speaker can save'; end if;
  if v_answer.kind <> 'voice' then raise exception 'text answers do not expire'; end if;
  select count(*) into v_listen_count from voice_listens where answer_id = p_answer;
  if v_listen_count < 2 then raise exception 'both must listen first'; end if;
  update answers set expiry_state = 'saved', saved_at = now() where id = p_answer;
end;
$$;

grant execute on function get_or_create_today_prompt(uuid) to authenticated;
grant execute on function record_listen(uuid) to authenticated;
grant execute on function save_own_clip(uuid) to authenticated;

create policy "voice_upload_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'voice-clips');
create policy "voice_read_member" on storage.objects for select to authenticated
  using (bucket_id = 'voice-clips');
```

- [ ] **Step 2: Push migration**

Run: `supabase db push`
Expected: `Applying migration 0004_daily_voice.sql... done`.

- [ ] **Step 3: Probe save guard**

Run as speaker before both listened:
```sql
select save_own_clip('<voice-answer-id>');
```
Expected: FAIL with `both must listen first`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0004_daily_voice.sql
git commit -m "feat(db): daily prompt RPC plus voice listen/save lifecycle"
```

### Task 3: Regenerate types + thin TS RPC clients

**Files:**
- Modify: `src/lib/database.types.ts`
- Create: `src/lib/pairing.ts`, `src/lib/prompts.ts`, `src/lib/answers.ts`, `src/lib/voice-upload.ts`

**Interfaces:**
- Consumes: `supabase` client, `Database` types.
- Produces: `createConnection(): Promise<{id:string;invite_code:string}>`; `joinConnection(code:string): Promise<{id:string;status:string}>`; `PromptWithQuestion {promptId,questionId,text,kind,reveal_state}`; `getTodayPrompt(connectionId:string): Promise<PromptWithQuestion>`; `submitTextAnswer(promptId,content)`; `submitVoiceAnswer(promptId,audioUrl)`; `recordListen(answerId)`; `saveOwnClip(answerId)`; `uploadVoiceAsync(localUri,answerId): Promise<string>`.

- [ ] **Step 1: Regenerate types (overwrites file)**

Run: `supabase gen types typescript --linked > src/lib/database.types.ts`
Expected: file contains `voice_listens` table and `create_connection`, `join_connection`, `get_or_create_today_prompt`, `record_listen`, `save_own_clip` in Functions.

- [ ] **Step 2: Write lib files**

```ts
// src/lib/pairing.ts
import { supabase } from './supabase';
export async function createConnection() {
  const { data, error } = await supabase.rpc('create_connection');
  if (error) throw error;
  const row = (data as unknown as { out_id: string; out_invite_code: string }[])[0];
  return { id: row.out_id, invite_code: row.out_invite_code };
}
export async function joinConnection(code: string) {
  const { data, error } = await supabase.rpc('join_connection', { p_code: code.trim().toUpperCase() });
  if (error) throw error;
  const row = (data as unknown as { out_id: string; out_status: string }[])[0];
  return { id: row.out_id, status: row.out_status };
}
```

```ts
// src/lib/prompts.ts
import { supabase } from './supabase';
export type PromptWithQuestion = { promptId: string; questionId: string; text: string; kind: 'text'|'voice'|'either'; reveal_state: 'waiting_on_both'|'revealed' };
export async function getTodayPrompt(connectionId: string): Promise<PromptWithQuestion> {
  const { data, error } = await supabase.rpc('get_or_create_today_prompt', { p_connection: connectionId });
  if (error) throw error;
  const r = (data as unknown as { out_prompt: string; out_question: string; out_text: string; out_kind: PromptWithQuestion['kind']; out_reveal_state: PromptWithQuestion['reveal_state'] }[])[0];
  return { promptId: r.out_prompt, questionId: r.out_question, text: r.out_text, kind: r.out_kind, reveal_state: r.out_reveal_state };
}
```

```ts
// src/lib/answers.ts
import { supabase } from './supabase';
export async function submitTextAnswer(promptId: string, content: string) {
  const text = content.trim();
  if (!text) throw new Error('Answer cannot be empty');
  const { error } = await supabase.rpc('submit_answer', { p_prompt: promptId, p_kind: 'text', p_content: text });
  if (error) throw error;
}
export async function submitVoiceAnswer(promptId: string, audioUrl: string) {
  if (!audioUrl) throw new Error('Upload audio first');
  const { error } = await supabase.rpc('submit_answer', { p_prompt: promptId, p_kind: 'voice', p_content: audioUrl });
  if (error) throw error;
}
export async function recordListen(answerId: string) {
  const { error } = await supabase.rpc('record_listen', { p_answer: answerId });
  if (error) throw error;
}
export async function saveOwnClip(answerId: string) {
  const { error } = await supabase.rpc('save_own_clip', { p_answer: answerId });
  if (error) throw error;
}
```

```ts
// src/lib/voice-upload.ts
import { supabase } from './supabase';
export async function uploadVoiceAsync(localUri: string, answerId: string): Promise<string> {
  const res = await fetch(localUri);
  const buf = await res.arrayBuffer();
  const path = `${answerId}.m4a`;
  const { error } = await supabase.storage.from('voice-clips').upload(path, buf, { contentType: 'audio/m4a', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('voice-clips').createSignedUrl(path, 60 * 60 * 24 * 7);
  if (!data?.signedUrl) throw new Error('Could not sign voice URL');
  return data.signedUrl;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no output (PASS).

- [ ] **Step 4: Commit**

```bash
git add src/lib/database.types.ts src/lib/pairing.ts src/lib/prompts.ts src/lib/answers.ts src/lib/voice-upload.ts
git commit -m "feat(app): thin RPC clients for pairing prompt answers voice"
```

### Task 4: Auth OTP at pairing boundary with identity link

**Files:**
- Modify: `src/hooks/use-auth.tsx`

**Interfaces:**
- Consumes: `supabase.auth.signInWithOtp`, `verifyOtp`, `linkIdentity`, existing `ensureProfileRow`.
- Produces: `signInWithOtpEmail(email:string): Promise<void>`; `verifyOtp(email:string,token:string): Promise<void>`; `isAnonymous:boolean` stays true until verify completes.

- [ ] **Step 1: Add OTP helpers to use-auth**

Add to `AuthContextValue`:
```ts
signInWithOtpEmail: (email: string) => Promise<void>;
verifyOtp: (email: string, token: string) => Promise<void>;
```
Implement:
```ts
const signInWithOtpEmail = useCallback(async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
  if (error) throw error;
}, []);
const verifyOtp = useCallback(async (email: string, token: string) => {
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' });
  if (error) throw error;
  await refreshProfile();
}, [refreshProfile]);
```
Keep anonymous session until verify: do not call `signOut()` before OTP; Supabase upgrades the anon user when `linkIdentity` is used for OAuth, and email OTP creates-or-links by email — profile row follows `auth.uid()` via `ensureProfileRow`.

- [ ] **Step 2: Lint the hook**

Run: `npx expo lint src/hooks/use-auth.tsx`
Expected: no errors.

- [ ] **Step 3: Manual check**

Run: `npx expo start --web`, browse anon home, request OTP, verify, confirm greeting shows and `isAnonymous` flips false.
Expected: PASS visually.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-auth.tsx
git commit -m "feat(auth): email OTP at pairing boundary"
```

### Task 5: Pairing UI — start, auth, invite, share link

**Files:**
- Modify: `src/app/start.tsx`, `src/app/_layout.tsx` (register `auth` route)
- Create: `src/app/auth.tsx`, `src/components/connection-invite.tsx`
- Modify: `package.json` (no new dep — uses `expo-linking` already present + `react-native` Share)

**Interfaces:**
- Consumes: `createConnection`, `joinConnection`, `useAuth`, `Button`, `Card`, `TextInput`, `Text`.
- Produces: `ConnectionInvite {inviteCode:string}` component with Copy + Share (`chale://join?code=XXXXXX` via `Linking.createURL`).

- [ ] **Step 1: Write auth screen**

```tsx
// src/app/auth.tsx
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
export default function AuthScreen() {
  const { signInWithOtpEmail, verifyOtp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Card>
      <Text variant="title">Your account moment</Text>
      <Text variant="body">Browsing is free. Creating or joining a connection needs an account so answers stay yours.</Text>
      <TextInput placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      {!sent ? (
        <Button label="Send code" onPress={async () => { try { setErr(null); await signInWithOtpEmail(email); setSent(true); } catch (e) { setErr((e as Error).message); } }} />
      ) : (
        <>
          <TextInput placeholder="6-digit code" keyboardType="number-pad" value={code} onChangeText={setCode} />
          <Button label="Verify" onPress={async () => { try { setErr(null); await verifyOtp(email, code); router.back(); } catch (e) { setErr((e as Error).message); } }} />
        </>
      )}
      {err ? <Text variant="caption">{err}</Text> : null}
    </Card>
  );
}
```

- [ ] **Step 2: Rewrite start screen with create/join + share**

```tsx
// src/app/start.tsx (replace file)
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { ConnectionInvite } from '@/components/connection-invite';
import { createConnection, joinConnection } from '@/lib/pairing';
import { useAuth } from '@/hooks/use-auth';
export default function StartScreen() {
  const router = useRouter();
  const { isAnonymous } = useAuth();
  const [code, setCode] = useState('');
  const [mine, setMine] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const needAuth = isAnonymous;
  return (
    <Card>
      <Text variant="title">Start with your person</Text>
      {needAuth ? <Button label="Create account to continue" onPress={() => router.push('/auth')} /> : null}
      <Button label="Generate my invite code" disabled={needAuth} onPress={async () => {
        try { setErr(null); const c = await createConnection(); setMine(c.invite_code); } catch (e) { setErr((e as Error).message); }
      }} />
      {mine ? <ConnectionInvite inviteCode={mine} onShare={() => Share.share({ message: `Join me on Chale: ${Linking.createURL(`join?code=${mine}`)}` })} /> : null}
      <TextInput placeholder="Enter their code" autoCapitalize="characters" value={code} onChangeText={setCode} maxLength={6} />
      <Button label="Join with code" variant="outline" disabled={needAuth || code.trim().length < 6} onPress={async () => {
        try { setErr(null); await joinConnection(code); router.replace('/'); } catch (e) { setErr((e as Error).message); }
      }} />
      {err ? <Text variant="caption">{err}</Text> : null}
    </Card>
  );
}
```

```tsx
// src/components/connection-invite.tsx
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Text } from './ui/text';
import * as Clipboard from 'expo-clipboard';
export function ConnectionInvite({ inviteCode, onShare }: { inviteCode: string; onShare: () => void }) {
  return (
    <Card>
      <Text variant="label">Your invite code</Text>
      <Text variant="title">{inviteCode}</Text>
      <Button label="Copy code" variant="outline" onPress={() => Clipboard.setStringAsync(inviteCode)} />
      <Button label="Share link" onPress={onShare} />
      <Text variant="caption">Waiting on them — this is pending, not broken.</Text>
    </Card>
  );
}
```
Note: run `npx expo install expo-clipboard` before this step — Copy uses `expo-clipboard`, Share uses `react-native` Share + `expo-linking` (already present, scheme `chale` in app.json).

- [ ] **Step 3: Register route + typecheck**

Add `<Stack.Screen name="auth" />` in `src/app/_layout.tsx`, then run `npx tsc --noEmit`. Expected PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/start.tsx src/app/auth.tsx src/components/connection-invite.tsx src/app/_layout.tsx
git commit -m "feat(app): pairing UI with code plus share link"
```

### Task 6: Today flow — text answer + waiting

**Files:**
- Modify: `src/app/index.tsx`
- Create: `src/hooks/use-connection.tsx`, `src/hooks/use-today-prompt.tsx`, `src/components/question-card.tsx`, `src/components/answer-composer.tsx`, `src/components/waiting-state.tsx`

**Interfaces:**
- Consumes: `getTodayPrompt`, `submitTextAnswer`, `supabase` connection fetch, `Button`, `Card`, `TextInput`.
- Produces: `useConnection(): {connectionId:string|null;status:string|null}`; `useTodayPrompt(connectionId): PromptWithQuestion`; index state machine `no-connection | question | waiting`.

- [ ] **Step 1: Write hooks**

```tsx
// src/hooks/use-connection.tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
export function useConnection() {
  return useQuery({
    queryKey: ['connection', 'mine'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from('connections').select('id,status').or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data as { id: string; status: string } | null;
    },
  });
}
```

```tsx
// src/hooks/use-today-prompt.tsx
import { useQuery } from '@tanstack/react-query';
import { getTodayPrompt } from '@/lib/prompts';
export function useTodayPrompt(connectionId: string | null) {
  return useQuery({ queryKey: ['prompt', 'today', connectionId], queryFn: () => getTodayPrompt(connectionId!), enabled: !!connectionId });
}
```

- [ ] **Step 2: Write components**

```tsx
// src/components/question-card.tsx
import { Card } from './ui/card';
import { Text } from './ui/text';
export function QuestionCard({ text, kind }: { text: string; kind: string }) {
  return <Card variant="hero"><Text variant="label">Today's question</Text><Text variant="question">{text}</Text><Text variant="caption">{kind}</Text></Card>;
}
// src/components/answer-composer.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { TextInput } from './ui/text-input';
export function AnswerComposer({ onSubmit }: { onSubmit: (t: string) => Promise<void> }) {
  const [v, setV] = useState(''); const [busy, setBusy] = useState(false);
  return (<><TextInput placeholder="Say am…" multiline value={v} onChangeText={setV} /><Button label={busy ? 'Sending…' : 'Send answer'} disabled={!v.trim() || busy} onPress={async () => { setBusy(true); try { await onSubmit(v); setV(''); } finally { setBusy(false); } }} /></>);
}
// src/components/waiting-state.tsx
import { Card } from './ui/card';
import { Text } from './ui/text';
export function WaitingState() {
  return <Card><Text variant="title">You answered.</Text><Text variant="body">Your answer is tucked away until they answer too. We'll let you know when the reveal is ready.</Text></Card>;
}
```

- [ ] **Step 3: Wire index state machine (text path only; voice arrives Task 8)**

```tsx
// src/app/index.tsx (replace body, keep imports style)
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { QuestionCard } from '@/components/question-card';
import { AnswerComposer } from '@/components/answer-composer';
import { WaitingState } from '@/components/waiting-state';
import { useConnection } from '@/hooks/use-connection';
import { useTodayPrompt } from '@/hooks/use-today-prompt';
import { supabase } from '@/lib/supabase';
import { submitTextAnswer } from '@/lib/answers';
export default function HomeScreen() {
  const router = useRouter();
  const conn = useConnection();
  const connectionId = conn.data?.id ?? null;
  const prompt = useTodayPrompt(connectionId);
  const myAnswer = useQuery({
    queryKey: ['answers', 'mine', prompt.data?.promptId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('answers').select('id').eq('prompt_id', prompt.data!.promptId).eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!prompt.data,
  });
  if (conn.isLoading) return <Card><Text variant="body">Loading…</Text></Card>;
  if (!conn.data) return <Card><Text variant="title">A question a day with your person</Text><Button label="Start with your person" onPress={() => router.push('/start')} /></Card>;
  if (prompt.isLoading) return <Card><Text variant="body">Loading today's question…</Text></Card>;
  if (prompt.error) return <Card><Text variant="body">Couldn't load today's question.</Text></Card>;
  if (myAnswer.data) return (<><QuestionCard text={prompt.data!.text} kind={prompt.data!.kind} /><WaitingState /><Button label="Open reveal" variant="outline" onPress={() => router.push(`/prompt/${prompt.data!.promptId}`)} /></>);
  return (<><QuestionCard text={prompt.data!.text} kind={prompt.data!.kind} /><AnswerComposer onSubmit={(t) => submitTextAnswer(prompt.data!.promptId, t)} /></>);
}
```
Check "my answer exists" via the `myAnswer` query above (`answers` + `user_id` + `prompt_id`).

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && npx expo lint src/hooks/use-connection.tsx src/hooks/use-today-prompt.tsx src/components/question-card.tsx src/components/answer-composer.tsx src/components/waiting-state.tsx src/app/index.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-connection.tsx src/hooks/use-today-prompt.tsx src/components/question-card.tsx src/components/answer-composer.tsx src/components/waiting-state.tsx src/app/index.tsx
git commit -m "feat(app): today question text answer plus waiting state"
```

### Task 7: Reveal + realtime

**Files:**
- Create: `src/hooks/use-realtime-prompt.tsx`, `src/components/reveal-card.tsx`, `src/app/prompt/[id].tsx`
- Modify: `src/app/_layout.tsx` (register `prompt/[id]`)

**Interfaces:**
- Consumes: `supabase.channel`, `prompts.reveal_state`, `answers` (RLS-gated), `Text`, `Card`, `Button`.
- Produces: `useRealtimePrompt(promptId)` invalidates `['prompt',...]` on `postgres_changes`; `RevealCard {mine,theirs}`; detail route shows both texts or voice URLs.

- [ ] **Step 1: Write realtime hook + reveal card**

```tsx
// src/hooks/use-realtime-prompt.tsx
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
export function useRealtimePrompt(promptId: string | null) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!promptId) return;
    const ch = supabase.channel(`prompt-${promptId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prompts', filter: `id=eq.${promptId}` }, () => { qc.invalidateQueries({ queryKey: ['prompt'] }); qc.invalidateQueries({ queryKey: ['answers'] }); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'answers', filter: `prompt_id=eq.${promptId}` }, () => { qc.invalidateQueries({ queryKey: ['answers'] }); qc.invalidateQueries({ queryKey: ['prompt'] }); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [promptId, qc]);
}
```

```tsx
// src/components/reveal-card.tsx
import { Card } from './ui/card';
import { Text } from './ui/text';
export function RevealCard({ question, mine, theirs }: { question: string; mine: string; theirs: string }) {
  return (
    <Card variant="hero">
      <Text variant="label">The reveal</Text>
      <Text variant="body">{question}</Text>
      <Text variant="label">Their answer</Text><Text variant="body">{theirs}</Text>
      <Text variant="label">Your answer</Text><Text variant="body">{mine}</Text>
    </Card>
  );
}
```

- [ ] **Step 2: Write prompt detail route fetching both answers (RLS enforces reveal)**

```tsx
// src/app/prompt/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { WaitingState } from '@/components/waiting-state';
import { RevealCard } from '@/components/reveal-card';
import { useRealtimePrompt } from '@/hooks/use-realtime-prompt';
import { supabase } from '@/lib/supabase';
export default function PromptDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useRealtimePrompt(id ?? null);
  const q = useQuery({
    queryKey: ['prompt', 'detail', id],
    queryFn: async () => {
      const { data: p } = await supabase.from('prompts').select('id,reveal_state,question_id').eq('id', id!).single();
      const { data: question } = await supabase.from('questions').select('text').eq('id', p!.question_id).single();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: answers } = await supabase.from('answers').select('user_id,content').eq('prompt_id', id!);
      return { reveal: p!.reveal_state as string, text: question!.text as string, mine: (answers ?? []).find((a) => a.user_id === user!.id)?.content ?? '', theirs: (answers ?? []).find((a) => a.user_id !== user!.id)?.content ?? '' };
    },
    enabled: !!id,
  });
  if (!q.data) return <Card><Text variant="body">Loading…</Text></Card>;
  if (q.data.reveal !== 'revealed') return <WaitingState />;
  return <RevealCard question={q.data.text} mine={q.data.mine} theirs={q.data.theirs} />;
}
```
Pre-reveal the `answers` select returns only the viewer's own row (RLS `answers_read`), so `theirs` stays empty until `revealed`.

- [ ] **Step 3: Two-user probe**

With two test accounts linked: A submits → B still sees waiting (no partner text leaked); B submits → both channels fire, both see reveal. Verify in SQL that pre-reveal `select * from answers` as B returns only own row.
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-realtime-prompt.tsx src/components/reveal-card.tsx "src/app/prompt/[id].tsx" src/app/_layout.tsx
git commit -m "feat(app): reveal screen with realtime flip"
```

### Task 8: Voice record, upload, playback, listen, save

**Files:**
- Modify: `package.json`, `app.json` (mic permission)
- Create: `src/components/voice-recorder.tsx`, `src/components/save-voice-prompt.tsx`
- Modify: `src/components/reveal-card.tsx` (voice rows), `src/app/prompt/[id].tsx` (listen + save wiring)

**Interfaces:**
- Consumes: `expo-audio` `useAudioRecorder`, `AudioPlayer`, `uploadVoiceAsync`, `submitVoiceAnswer`, `recordListen`, `saveOwnClip`.
- Produces: `VoiceRecorder {onSend(url)}` with idle/recording/preview/sending; `SaveVoicePrompt {answerId}` speaker-only.

- [ ] **Step 1: Install audio + permission**

Run: `npx expo install expo-audio`
Expected: `package.json` gains `"expo-audio"`.
Add to `app.json` plugins: `["expo-audio", { "microphonePermission": "Allow Chale to record voice answers." }]`.

- [ ] **Step 2: Write recorder (expo-audio API)**

```tsx
// src/components/voice-recorder.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Text } from './ui/text';
import { useAudioRecorder, RecordingPresets } from 'expo-audio';
export function VoiceRecorder({ onSend }: { onSend: (localUri: string) => Promise<void> }) {
  const rec = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [uri, setUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (<>
    {!rec.isRecording && !uri ? <Button label="Say am — record" onPress={() => rec.record()} /> : null}
    {rec.isRecording ? (<><Text variant="label">Recording…</Text><Button label="Stop" onPress={async () => { await rec.stop(); setUri(rec.uri ?? null); }} /></>) : null}
    {uri && !rec.isRecording ? (<>
      <Text variant="caption">{uri}</Text>
      <Button label="Re-record" variant="outline" onPress={() => setUri(null)} />
      <Button label={busy ? 'Sending…' : 'Send voice'} disabled={busy} onPress={async () => { setBusy(true); try { await onSend(uri); setUri(null); } finally { setBusy(false); } }} />
    </>) : null}
  </>);
}
```

```tsx
// src/components/save-voice-prompt.tsx
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Text } from './ui/text';
export function SaveVoicePrompt({ onSave, onSkip }: { onSave: () => Promise<void>; onSkip: () => void }) {
  return <Card><Text variant="label">Kai this one?</Text><Text variant="body">You both listened. Save this one?</Text><Button label="Save" onPress={onSave} /><Button label="Let it expire" variant="ghost" onPress={onSkip} /></Card>;
}
```
Wire playback with `useAudioPlayer(url)`: on `play()` completion call `recordListen(answerId)`; when both listens exist (query `voice_listens` count>=2) and `auth.uid()===answer.user_id` show `SaveVoicePrompt` → `saveOwnClip`.

- [ ] **Step 3: Device check**

Record 5s clip → preview → send → partner listens → speaker save. Confirm `answers.expiry_state` flips `active`→`saved`, `expires_at` ≈ +7d.
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add package.json app.json src/components/voice-recorder.tsx src/components/save-voice-prompt.tsx src/components/reveal-card.tsx "src/app/prompt/[id].tsx"
git commit -m "feat(app): voice record upload playback listen save"
```

### Task 9: Verification pass

**Files:**
- Touch none (verification only) unless fixes needed.

- [ ] **Step 1: Static checks**

Run: `npx tsc --noEmit`
Expected: PASS with no output.
Run: `npx expo lint`
Expected: PASS with no errors.

- [ ] **Step 2: Two-device functional sweep**

On Android + web: fresh anon → OTP → create → copy/share link → second device join → auto today prompt appears both sides → A text answers → A sees waiting, B sees question → B answers → both realtime to reveal → voice clip round-trip + save.
Expected: all transitions work, no partner answer visible pre-reveal.

- [ ] **Step 3: Commit fixes only if needed**

```bash
git add -A
git commit -m "fix: integration verification sweep" || echo "nothing to commit"
```
