# Auth + Sign-in Redesign — Design

Date: 2026-10-14
Status: Approved
Scope: One method-ladder /auth screen (Apple + Google + email), the auth-callback route, anonymous-identity linking for all three methods. No password auth, no social profile import, no account deletion.

## 1. Goal

Replace the email-only /auth screen with a single sign-in ladder — Apple (iOS), Google (browser OAuth), email one-time code — so a guest can claim an account in one tap without losing anonymous data (favourites, progress). Email stays as the universal alternate; the emailed-link path keeps working through the hosted bridge.

User decisions locked in:
- Google: browser OAuth via expo-web-browser (already installed), no native SDK
- Screen: one /auth method ladder, no separate signup/signin
- Linking: linkIdentity in place on the anonymous session; fall back to plain sign-in with an explanatory note when the provider account already exists separately
- Google glyph: lucide `chrome` icon (default; revisit if it reads wrong)

## 2. Architecture

Expo Router + Supabase Auth (PKCE, AsyncStorage, detectSessionInUrl false — unchanged).

Auth provider additions (src/hooks/use-auth.tsx):
- `signInWithApple()` — expo-apple-authentication (NEW dep; app.json `ios.usesAppleSignIn`). Anonymous → `linkIdentity({provider:'apple', token})`; else `signInWithIdToken`. Button hidden unless `Platform.OS === 'ios'` and `isAvailableAsync()`.
- `signInWithGoogle()` — anonymous → `linkIdentity({provider:'google', redirectTo:'chale://auth-callback'})`; else `signInWithOAuth({provider:'google', redirectTo})`. Open the returned URL with `openAuthSessionAsync` (expo-web-browser, already installed).
- Email path unchanged (claimAccount promotion, 13+ consent gate, code-in-app verify), plus `emailRedirectTo` (hosted bridge URL) on both `signInWithOtp` and `updateUser` so emailed links land in-app via the bridge.

Routes:
- `/auth` rework: Apple button (official `AppleAuthenticationButton`, black, pill) → Google `Button` (secondary, chrome icon) → `Divider` "or" (shipped 4e836de) → email section (consent + input + send, existing) → verify step (existing) → `LegalFoot` (existing).
- NEW `src/app/auth-callback.tsx` (registered in _layout): `?code=` → `exchangeCodeForSession`; `?token_hash&?type=` → existing `verifyOtpLink`; empty params → back (OAuth-link return, session never left); error → `ErrorCard`. Spinner at most.

## 3. Components

- `AppleAuthButton` (thin wrapper or inline): official button, iOS-only render.
- Google row: existing `Button` secondary + chrome icon + `onPress` → `signInWithGoogle`, loading state while the browser session is open.
- `Divider` label="or" between social and email sections.
- auth-callback: param parsing + three branches + `ErrorCard` on failure; no new UI kit.

## 4. Data flow

Apple: credential → link (anon) / id-token sign-in → refreshProfile → back. Google: link/sign-in URL → browser → `chale://auth-callback` (empty params for links; `?code=` for fresh sign-ins) → exchange or back → refreshProfile. Email link: inbox → bridge (`?token_hash&type`) → `chale://auth-callback` → `verifyOtpLink` → back. Guest favourites survive in all link paths (same user id); the plain-sign-in fallback orphans them with an explanatory note, mirroring claimAccount's existing tradeoff.

## 5. Error handling

- Apple unavailable/cancelled = silent return, no error text (cancellation is not failure).
- Linking impossible (provider account exists separately) = plain sign-in + note, never a dead end.
- OAuth browser dismissed = silent return; callback errors = `ErrorCard` with retry (re-open) and a back-out.
- Email errors keep the existing inline `err` text path.

## 6. Testing

- `npx tsc --noEmit` + `expo lint` clean (no `.value` writes in handlers, no ref reads in render, single reanimated import — repo rules).
- Manual on EAS dev build (Expo Go can't do Apple): Apple link on iOS keeps favourites; Google link on Android keeps favourites; emailed link via bridge signs in; `?code=` PKCE path signs in; cancelled Apple/Google returns silently.
- Dashboard prerequisites must be done first (see §7): without them nothing above is testable.

## 7. Explicit non-goals and prerequisites

No passwords, no phone auth, no profile-photo/name import from providers, no account deletion, no desktop web auth.

PREREQUISITES (dashboard work, blocks testing): Supabase enable Google + Apple providers; allowlist `chale://auth-callback`; email template redirect → hosted bridge URL; Apple Services ID + key (paid Developer account); Google web OAuth client; `npx expo install expo-apple-authentication`.
