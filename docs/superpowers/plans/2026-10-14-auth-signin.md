# Auth Sign-in Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One method-ladder /auth screen (Apple + Google + email) with anonymous-identity linking and an auth-callback route, per `docs/superpowers/specs/2026-10-14-auth-signin-design.md`.

**Architecture:** New methods live in `use-auth.tsx` beside `claimAccount`; `/auth` renders the ladder; `auth-callback` handles code / token_hash / empty returns. No new UI kit (Button, Card, Divider, LegalFoot, ErrorCard already exist).

**Tech Stack:** expo-apple-authentication (new), expo-web-browser openAuthSessionAsync (installed), Supabase linkIdentity / signInWithIdToken / exchangeCodeForSession.

## Global Constraints

- `npx tsc --noEmit` + `npx eslint <touched files>` clean per task; the pre-existing `ui/dropdown.tsx` set-state-in-effect stays untouched.
- No `.value` writes inside async handlers (module-level `'worklet'` fns only); no ref reads during render; single reanimated import per file.
- Sentence case copy; no dead UI (null URLs stay hidden).
- This repo has no unit-test runner: each task's "test" is tsc + eslint + the stated behavioral check. Device checks run on the EAS dev build (Expo Go cannot do Apple sign-in).
- Dashboard prerequisites (Supabase Google + Apple providers, `chale://auth-callback` allowlist, email template → bridge URL, Apple Services ID + key) are user-side and block device testing, not code.

---

### Task 1: Deps and iOS capability

**Files:**
- Modify: `package.json` (via expo install), `app.json`, `src/components/ui/icon.tsx`

**Interfaces:**
- Produces: `expo-apple-authentication` importable. (The Google row uses the already-registered `'globe'` icon — no icon work needed.)

- [ ] **Step 1: Install the Apple package**

Run: `npx expo install expo-apple-authentication`
Expected: package.json gains the dep at the SDK-57 cohort version.

- [ ] **Step 2: iOS capability**

In `app.json`, inside the existing `"ios"` object (which already holds `icon`), add:

```json
"usesAppleSignIn": true
```

If the EAS build warns the entitlement is missing, follow the `expo-apple-authentication` README's iOS setup section verbatim — it is the source of truth, this plan does not guess past it.

- [ ] **Step 3: Confirm the globe icon (no registration needed)**

The Google row uses the existing `'globe'` icon, already registered in `src/components/ui/icon.tsx` (import, `ExtraIconName` union, both maps). The `chrome` icon from the original draft does not exist in the installed lucide version (no `Chrome` export — brand icons were removed), so no icon file changes are required. Verify with: `Select-String -Path src/components/ui/icon.tsx -Pattern "globe"` — expect the import, union, and map hits.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx eslint src/components/ui/icon.tsx`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json app.json
git commit -m "chore(auth): apple sign-in dep and ios capability"
```

---

### Task 2: use-auth — Google, Apple, bridge redirect

**Files:**
- Modify: `src/constants/legal.ts`, `src/hooks/use-auth.tsx`

**Interfaces:**
- Consumes: `verifyOtpLink`, `refreshProfile` (already in file).
- Produces: `signInWithGoogle`, `signInWithApple` on the context value.

- [ ] **Step 1: Bridge URL constant**

Append to `src/constants/legal.ts`:

```ts
/**
 * Hosted auth bridge (web/auth-bridge.html). Null = emailed links are not
 * redirected yet, so emailRedirectTo is omitted until hosting is done.
 */
export const AUTH_BRIDGE_URL: string | null = null;
```

- [ ] **Step 2: Thread emailRedirectTo through the email path**

In `src/hooks/use-auth.tsx`, import `AUTH_BRIDGE_URL` and add a helper above `AuthProvider`:

```ts
const bridgeRedirect = () => (AUTH_BRIDGE_URL ? { emailRedirectTo: AUTH_BRIDGE_URL } : {});
```

Spread it into the `options` of all three OTP sends: `signInWithOtpEmail`, both `signInWithOtp` calls inside `claimAccount`, and pass `{ emailRedirectTo: AUTH_BRIDGE_URL ?? undefined }` as the second arg of `updateUser({ email: clean }, ...)` — but only include the key when set (never send `emailRedirectTo: null`):

```ts
const { error } = await supabase.auth.updateUser(
  { email: clean },
  ...(AUTH_BRIDGE_URL ? [{ emailRedirectTo: AUTH_BRIDGE_URL }] : []),
);
```

- [ ] **Step 3: signInWithGoogle (corrected — supersedes the truncated draft below in git history)**

> Why corrected: `openAuthSessionAsync` intercepts the `chale://` redirect INSIDE the browser session and hands it back as `result.url` — the OS never deep-links into the app on that path, so nobody would ever exchange the PKCE `?code=`. The browser result must be exchanged in place; the `auth-callback` route (Task 3) only handles links opened from OUTSIDE the app (emailed bridge links).

In `src/hooks/use-auth.tsx`, at module scope (above `AuthProvider`), add the browser import, the web session completer, and the shared pieces both social methods use:

```ts
import * as WebBrowser from 'expo-web-browser';

// Completes web auth sessions. No-op on native, required on web.
WebBrowser.maybeCompleteAuthSession();

const CALLBACK = 'chale://auth-callback';

const linkConflict = (message: string) => /already|linked|exists|conflict/i.test(message);

/** What a social method reports: linked in place, signed in separately, or stood down. */
export type LinkResult = { linked: boolean; note?: string; cancelled?: boolean };

/** Pulls `?code=` out of a redirect URL without relying on the URL constructor. */
const codeFromUrl = (url: string) => {
  const m = /[?&]code=([^&]+)/.exec(url);
  return m ? decodeURIComponent(m[1]) : null;
};

/**
 * Opens the provider URL and exchanges the PKCE code the browser hands back.
 * Returns true when a code was exchanged. A dismissed browser (cancel /
 * dismiss result, or no code) returns false — the caller reports `cancelled`
 * and the screen stays put, silently. Without this exchange the session is
 * never established and the app just returns to a signed-out screen.
 */
const openProviderUrl = async (url: string | null | undefined): Promise<boolean> => {
  if (!url) return false;
  const result = await WebBrowser.openAuthSessionAsync(url, CALLBACK);
  if (result.type !== 'success') return false;
  const code = codeFromUrl(result.url);
  if (!code) return false;
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return true;
};
```

Then the method, beside `claimAccount`:

```ts
const signInWithGoogle = useCallback(async (): Promise<LinkResult> => {
  const { data: current } = await supabase.auth.getUser();
  const anon = !!current.user?.is_anonymous;
  const call = anon
    ? () =>
        supabase.auth.linkIdentity({
          provider: 'google',
          options: { redirectTo: CALLBACK, skipBrowserRedirect: true },
        })
    : () =>
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: CALLBACK, skipBrowserRedirect: true },
        });
  try {
    const { data, error } = await call();
    if (error) throw error;
    const exchanged = await openProviderUrl(data.url);
    await refreshProfile();
    if (!exchanged) return { linked: anon, cancelled: true };
    return { linked: anon };
  } catch (e) {
    if (anon && linkConflict((e as Error).message)) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: CALLBACK, skipBrowserRedirect: true },
      });
      if (error) throw error;
      const exchanged = await openProviderUrl(data.url);
      await refreshProfile();
      if (!exchanged) return { linked: false, cancelled: true };
      return { linked: false, note: 'Signed in as your Google account. Guest favourites stayed on this device.' };
    }
    throw e;
  }
}, [refreshProfile]);
```

- [ ] **Step 4: signInWithApple**

```ts
import * as AppleAuthentication from 'expo-apple-authentication';

const signInWithApple = useCallback(async () => {
  let identityToken: string | null;
  try {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    identityToken = cred.identityToken ?? null;
  } catch (e) {
    // Cancellation is not failure — return silently, no error text.
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return { linked: true };
    throw e;
  }
  if (!identityToken) throw new Error('Apple sign-in returned no token');
  const { data: current } = await supabase.auth.getUser();
  const anon = !!current.user?.is_anonymous;
  try {
    if (anon) {
      const { error } = await supabase.auth.linkIdentity({ provider: 'apple', token: identityToken });
      if (error) throw error;
    } else {
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken });
      if (error) throw error;
    }
    await refreshProfile();
    return { linked: anon };
  } catch (e) {
    if (anon && linkConflict((e as Error).message)) {
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken });
      if (error) throw error;
      await refreshProfile();
      return { linked: false, note: 'Signed in with your Apple ID. Guest favourites stayed on this device.' };
    }
    throw e;
  }
}, [refreshProfile]);
```

- [ ] **Step 5: Expose both methods on the context**

In `src/hooks/use-auth.tsx`, three insertions:

1. Add to the `AuthContextValue` type, after the `verifyOtpLink` line:
```ts
signInWithGoogle: () => Promise<LinkResult>;
signInWithApple: () => Promise<LinkResult>;
```
Import the type at the top of nothing — `LinkResult` is defined in this same file (Step 3/4), so no import needed.
2. Add `signInWithGoogle,` and `signInWithApple,` to the `value` object in `useMemo` (after `verifyOtpLink,`).
3. Add `signInWithGoogle,` and `signInWithApple,` to the `useMemo` dependency array (after `verifyOtpLink,`).

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npx eslint src/hooks/use-auth.tsx src/constants/legal.ts`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/use-auth.tsx src/constants/legal.ts
git commit -m "feat(auth): google + apple sign-in with anonymous linking"
```

---

### Task 3: auth-callback route (code, token_hash, empty)

**Files:**
- Create: `src/app/auth-callback.tsx`
- Modify: `src/app/_layout.tsx` (register the route)

**Interfaces:**
- Consumes: `verifyOtpLink`, `LinkVerifyType` (from `src/hooks/use-auth.tsx`); `supabase` (from `@/lib/supabase`); `ErrorCard` (from `@/components/error-card`); `Screen` (from `@/components/screen`).
- Produces: the `chale://auth-callback` deep-link target. Handles three arrivals: `?code=` (PKCE, fresh OAuth sign-in opened externally), `?token_hash&?type=` (emailed link via the hosted bridge), neither (OAuth-link return — session never left). An `error` param renders a retryable `ErrorCard`.

- [ ] **Step 1: Write the route**

Create `src/app/auth-callback.tsx` with exactly this content (sentence case copy throughout):

```tsx
// src/app/auth-callback.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ErrorCard } from '@/components/error-card';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { useAuth, type LinkVerifyType } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

/** What the callback route decided: exchanged, nothing to do, or failed. */
type CallbackOutcome = 'working' | 'done' | 'failed';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { verifyOtpLink } = useAuth();
  const params = useLocalSearchParams<{
    code?: string;
    token_hash?: string;
    type?: string;
    error?: string;
    error_description?: string;
  }>();
  const [err, setErr] = useState<string | null>(null);
  // Bumped by the error card's retry: re-runs the exchange once.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (params.error) throw new Error(params.error_description ?? params.error);
        if (params.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) throw error;
        } else if (params.token_hash && params.type) {
          await verifyOtpLink(params.token_hash, params.type as LinkVerifyType);
        } else {
          // OAuth-link return: the session never left the app, nothing to exchange.
          if (active) router.back();
          return;
        }
        if (active) router.replace('/home');
      } catch (e) {
        if (active) setErr((e as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [router, verifyOtpLink, params.code, params.token_hash, params.type, params.error, params.error_description, attempt]);

  if (err) {
    return (
      <Screen>
        <ErrorCard
          title="That link didn't sign you in"
          body={err}
          onRetry={() => {
            setErr(null);
            setAttempt((n) => n + 1);
          }}
        />
        <View style={styles.back}>
          <Button label="Go back" variant="secondary" size="sm" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ActivityIndicator />
    </Screen>
  );
}

const styles = StyleSheet.create(() => ({
  // Button drops `style`, so the back-out needs a wrapper to sit on its own line.
  back: {
    alignSelf: 'flex-start',
  },
}));
```

- [ ] **Step 2: Register the route**

In `src/app/_layout.tsx`, inside the existing `<Stack>`, after the `auth` screen line, add:

```tsx
<Stack.Screen name="auth-callback" />
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx eslint src/app/auth-callback.tsx src/app/_layout.tsx`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/app/auth-callback.tsx src/app/_layout.tsx
git commit -m "feat(auth): auth-callback deep-link route (code, token_hash, empty)"
```

---

### Task 4: /auth ladder — Apple, Google, email

**Files:**
- Modify: `src/app/auth.tsx`

**Interfaces:**
- Consumes: `signInWithGoogle`, `signInWithApple`, `LinkResult` (from `src/hooks/use-auth.tsx`); `Divider` (from `@/components/ui/divider`); `LegalFoot` (from `@/components/ui/legal-foot`); `AppleAuthenticationButton` (from `expo-apple-authentication`); existing email section, consent gate, `Card`, `Screen`, `Button`, `Text`, `TextInput` (all untouched in place).
- Produces: the method ladder. Social section sits above the existing `{!sent ? ...}` email block inside the same `Card`. The email section (consent checkbox, input, send, verify) is not reordered and not reworded.

- [ ] **Step 1: Imports and state**

In `src/app/auth.tsx`, add to the existing imports:

```ts
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
```

(replacing the current `import { useState } from 'react';` line), and add component imports:

```ts
import { Divider } from '@/components/ui/divider';
import { LegalFoot } from '@/components/ui/legal-foot';
import type { LinkResult } from '@/hooks/use-auth';
```

Change the `useAuth()` destructure to also pull `signInWithGoogle, signInWithApple`. Add state beside the existing `useState` lines:

```ts
const [appleAvailable, setAppleAvailable] = useState(false);
// Which social method is busy ('apple' | 'google' | null), or the email send.
const [busy, setBusy] = useState<'apple' | 'google' | null>(null);
const [note, setNote] = useState<string | null>(null);
```

- [ ] **Step 2: Apple availability**

Above the `sendCode` definition, add:

```ts
// The official button must only ever render where Sign in with Apple exists.
useEffect(() => {
  if (Platform.OS !== 'ios') return;
  void AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
}, []);
```

- [ ] **Step 3: The social runner**

Above the `sendCode` definition, add:

```ts
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
```

- [ ] **Step 4: The ladder UI**

Inside the existing `<Card>`, above the `{!sent ? (` email block (after the anonymous caption block), insert the social section:

```tsx
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
```

Notes the implementer must respect: the Apple button stays mounted while busy (a double-tap during the native sheet is accepted and harmless — the runner is idempotent per tap, the second tap no-ops on the unchanged session). The email section below (consent, input, send, verify) is untouched.

- [ ] **Step 5: Legal footer**

At the bottom of the existing `<Card>`, after the `{err ? ...}` line, append:

```tsx
<LegalFoot />
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npx eslint src/app/auth.tsx`
Expected: clean. Behavioral check: on Android the Apple button never renders; on iOS without Apple capability it never renders; Google row shows the globe glyph; the divider reads "or"; the email section is byte-identical in behavior (consent gate still disables Send code).

- [ ] **Step 7: Commit**

```bash
git add src/app/auth.tsx
git commit -m "feat(auth): method ladder — apple, google, email"
```

---

### Task 5: Edge pass, flow doc, device checklist

**Files:**
- Modify: `docs/04-user-flows.md`

**Interfaces:**
- Consumes: the shipped Tasks 1–4.
- Produces: an updated flow-1 ladder and the device checklist sign-off.

- [ ] **Step 1: Edge sweep in code**

Walk these edges and fix anything found (each fix gets its own commit, same verify commands as above):
1. Empty-email user taps a social method: must work — social never reads the email state.
2. Dark mode on `/auth` and `auth-callback`: no hardcoded colors in the new UI (the Apple button is black by design on both modes — that is Apple's asset, not ours).
3. Small screens (320pt): ladder + email section scrolls inside `Screen` without overlap.
4. Apple button absent off-iOS and where `isAvailableAsync()` is false.
5. Globe glyph renders on the Google row (pre-registered; no icon changes).
6. Sentence case on all new copy; `LegalFoot` shows nothing dead (null URLs stay hidden).

- [ ] **Step 2: Flow doc**

In `docs/04-user-flows.md`, flow 1: add the Apple/Google rungs to the ladder (social section above email, callback route for code/token_hash/empty returns), and record that the 13+ consent gate stays email-only for now — flagged as a follow-up, not silently dropped.

- [ ] **Step 3: Device checklist (spec §6)**

On the EAS dev build only (dashboard prerequisites are user-side): Apple link on iOS keeps favourites; Google link on Android keeps favourites; emailed link via bridge signs in; `?code=` PKCE path signs in; cancelled Apple/Google returns silently. Record pass/fail per line in the commit message.

- [ ] **Step 4: Verify and commit**

Run: `npx tsc --noEmit && npx eslint src/app/auth.tsx src/app/auth-callback.tsx src/hooks/use-auth.tsx`
Expected: clean.

```bash
git add docs/04-user-flows.md
git commit -m "docs: auth ladder and callback in flow 1"
```
