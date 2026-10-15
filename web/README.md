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
| `/terms` | Terms & Conditions (draft — `src/routes/Terms.tsx`) |
| `/privacy` | Privacy Policy (draft — `src/routes/Privacy.tsx`) |
| `/auth/bridge` | The emailed-link landing: forwards to `chale://auth-callback` |

`email/magic-link.html` is the Supabase email template. Paste it into
Dashboard → Authentication → Email Templates → **Magic Link**.

## Supabase configuration (dashboard, user-side)

1. **Site URL** → your hosted root, e.g. `https://chale-dna-studios.vercel.app`.
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
