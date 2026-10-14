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

### Task 1: Deps, iOS capability, chrome icon

**Files:**
- Modify: `package.json` (via expo install), `app.json`, `src/components/ui/icon.tsx`

**Interfaces:**
- Produces: `expo-apple-authentication` importable; `ShowcaseIconName` accepts `'chrome'`.

- [ ] **Step 1: Install the Apple package**

Run: `npx expo install expo-apple-authentication`
Expected: package.json gains the dep at the SDK-57 cohort version.

- [ ] **Step 2: iOS capability**

In `app.json`, inside the existing `"ios"` object (which already holds `icon`), add:

```json
"usesAppleSignIn": true
```

If the EAS build warns the entitlement is missing, follow the `expo-apple-authentication` README's iOS setup section verbatim — it is the source of truth, this plan does not guess past it.

- [ ] **Step 3: Register the chrome icon**

In `src/components/ui/icon.tsx`, three insertions following the existing pattern (used before for `audiolines`):
1. Add `Chrome` to the alphabetical `lucide-react-native` import list.
2. Add `'chrome'` to the `ExtraIconName` union (near line 169).
3. Add `chrome: Chrome,` to `LUCIDE_MAP` (near line 230).

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx eslint src/components/ui/icon.tsx`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add package.json app.json src/components/ui/icon.tsx
git commit -m "chore(auth): apple sign-in dep, ios capability, chrome icon"
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

- [ ] **Step 3: signInWithGoogle**

```ts
import * as WebBrowser from 'expo-web-browser';

const CALLBACK = 'chale://auth-callback';

const linkConflict = (message: string) => /already|linked|exists|conflict/i.test(message);

const signInWithGoogle = useCallback(async () => {
  const { data: current } = await supabase.auth.getUser();
  const anon = !!current.user?.is_anonymous;
  const call = anon
    ? () => supabase.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: CALLBACK, skipBrowserRedirect: true },
      })
    : () => supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: CALLBACK, skipBrowserRedirect: true },
      });
  try {
    const { data, error } = await call();
    if (error) throw error;
    if (data.url) await WebBrowser.openAuthSessionAsync(data.url, CALLBACK);
    await refreshProfile();
    return { linked: anon };
  } catch (e) {
    if (anon && linkConflict((e as Error).message)) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: CALLBACK, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data.url) await WebBrowser.openAuthSessionAsync(data.url, CALLBACK);
      await refreshProfile();
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
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: id
...[truncated 4471 chars]
