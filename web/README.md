# Chale web — landing, legal, auth bridge

A small Vite + React app that serves the public web surface: the marketing
landing, Terms and Privacy, and the email-link bridge that hands a Supabase
magic-link token to the app.

## Run it

```bash
cd web
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in web/dist — host anywhere
npm run typecheck  # tsc --noEmit over src
```

`base: './'` in `vite.config.ts` keeps asset URLs relative, so the build runs
from a sub-path (Supabase Storage) or a root domain (Vercel/Netlify) alike.

## Routes

| Path | What |
|---|---|
| `/` | Landing: hero, two modes (in person / apart), how it works |
| `/terms` | Terms & Conditions (`src/routes/Terms.tsx`) |
| `/privacy` | Privacy Policy (`src/routes/Privacy.tsx`) |
| `/confirm` | Beta waitlist double opt-in landing (`src/routes/Confirm.tsx`) |
| `/auth/bridge` | The emailed-link landing: forwards to `chale://auth-callback` |

## Deck manifest

The landing page's names, counts, locked state, and samples are generated from
`content/decks/*.json`:

```bash
node scripts/build-web-decks.mjs          # from the repo root
node scripts/build-web-decks.mjs --check  # fail if web/src/data/decks.ts is stale
```

`npm run dev` and `npm run build` regenerate it automatically. The four locked
packs are shown as **Coming soon**, never as paid.

## Beta waitlist

The landing form posts to the Supabase Edge Function `join-waitlist`; the email
link lands on `/confirm`, which calls `confirm-waitlist`. Both functions are
public (`verify_jwt = false`) and protected by IP rate limits, an optional
Turnstile check, and a hashed 48-hour confirmation token.

1. Apply `supabase/migrations/0014_waitlist.sql`.
2. Copy `web/.env.example` to `web/.env.local` and set the public Supabase URL,
   anon key, site URL, contact email, and optional Turnstile site key.
3. Copy `supabase/functions/.env.example` to `supabase/functions/.env` for local
   serving, or set the same values with
   `supabase secrets set --env-file supabase/functions/.env`.
4. Deploy:
   ```bash
   supabase functions deploy join-waitlist
   supabase functions deploy confirm-waitlist
   ```
5. Set `SITE_URL` to the public site origin. Confirmation links use
   `<SITE_URL>/confirm?token=...`.

If `RESEND_API_KEY` is unset locally, set `WAITLIST_EMAIL_MODE=log` and the
function will log the confirmation link instead of sending email. Never use
`log` in production.

`email/magic-link.html` is the Supabase email template. Paste it into
Dashboard → Authentication → Email Templates → **Magic Link**.

## Supabase configuration (dashboard, user-side)

1. **Site URL** → your hosted root, e.g. `https://chale.space`.
   The email template builds `{{ .SiteURL }}/auth/bridge?token_hash=…`, so this
   one setting drives dev, staging and prod.
2. **Redirect URLs** (Authentication → URL Configuration) — allow all of:
   - `chale://auth-callback` (the app deep link)
   - `<site-url>/auth/bridge` (the bridge route, incl. any dev/preview URLs)
3. **Email Templates → Magic Link** → paste `email/magic-link.html`, and set
   the logo `src` to an absolute URL on your host, e.g.
   `{{ .SiteURL }}/assets/brand/lockup-dark.svg`.
4. **Providers** — enable Google + Apple (see the auth plan's prerequisites in
   `docs/superpowers/plans/2026-10-14-auth-signin.md`).

### Dev access to the link

Deploy once (Vercel preview is enough). Emailed links land on the hosted
bridge and deep-link into the dev app — no tunnel needed for the flow itself.
Only reach for `npm run dev` + a tunnel (cloudflared/ngrok) when you want to
debug the bridge page's own HTML/JS locally.

## Wiring back into the app

- `src/constants/legal.ts` — set `LEGAL_LINKS` entries to
  `<site-url>/terms` and `<site-url>/privacy` (right now they're null, so the
  in-app `LegalFoot` shows no links).
- `src/constants/legal.ts` — set `AUTH_BRIDGE_URL` to
  `<site-url>/auth/bridge`; `use-auth.tsx` then adds it as `emailRedirectTo`
  on every OTP send.

## Design tokens

`src/styles/chale.css` mirrors `docs/05-design-system.md` and
`src/unistyles.ts` (light/dark via `prefers-color-scheme`, radii, spacing,
Archivo Black + Spline Sans). If the app's tokens change, change the CSS vars
in `:root` and its dark-mode copy — nothing else hardcodes a colour.
