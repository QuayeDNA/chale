# Chale — web pages

Static pages for the things that must live outside the app: the legal documents
(app-store submissions require public URLs) and the email sign-in bridge.

| File | Purpose |
|---|---|
| `terms.html` | Terms & Conditions (draft copy, structured for the real text) |
| `privacy.html` | Privacy Policy (draft copy, structured for the real text) |
| `auth-bridge.html` | Catches Supabase's email-link redirect and bounces the session into the app |
| `assets/chale.css` | `docs/05-design-system.md` in CSS — tokens mirror `src/unistyles.ts` |
| `assets/bridge.js` | Bridge logic: parse `?code=` / `#access_token`, bounce to `chale://…` |
| `assets/brand/` | The real lockup SVGs (copied from `assets/brand/`) |

Everything is static HTML/CSS/JS — no build step. All three pages follow the
app's Playful Street Energy system: same tokens, same fonts (Archivo Black +
Spline Sans), dark mode via `prefers-color-scheme`, reduced-motion respected.
The lockup is the supplied with-subtitle artwork, swapped by theme: the ink
lockup on light paper, the cream lockup on dark.

## Hosting

Any static host works. On the locked Supabase infra:

1. Dashboard → **Storage → New bucket** → name it `web`, tick **Public**.
2. Upload the contents of this folder (`terms.html`, `privacy.html`,
   `auth-bridge.html`, `assets/`) at the bucket root.
3. URLs come out as
   `https://<project-ref>.supabase.co/storage/v1/object/public/web/terms.html`
   (same pattern for the others).

Alternatives if you want prettier URLs: drag the folder onto Netlify/Vercel/
Cloudflare Pages, or point a custom domain at it later.

## Wiring the app

1. **Legal links** — once hosted, set the URLs in `src/constants/legal.ts`
   (`LEGAL_LINKS`). `LegalFoot` renders them automatically.
2. **Auth bridge redirect** — pass the hosted bridge URL on every email-sending
   auth call in `src/hooks/use-auth.tsx`:
   `signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: 'https://<host>/auth-bridge.html' } })`
   and `updateUser({ email }, { emailRedirectTo: … })`.
3. **Allowlist** — Supabase dashboard → Authentication → URL Configuration → add
   `https://<host>/auth-bridge.html` to Redirect URLs.
4. **App route** — add `src/app/auth-callback.tsx`: read `code` from the route
   params, call `supabase.auth.exchangeCodeForSession(code)`, then
   `router.replace('/home')`; show a retry card on failure. (`app.json` already
   declares the `chale://` scheme.)
5. **Optional upgrade** — Android App Links (`assetlinks.json`) + iOS Associated
   Domains make links open the app directly; the bridge page then only handles
   desktop/odd-client opens.

## Design sync

If `src/unistyles.ts` or `docs/05-design-system.md` change, update
`assets/chale.css` to match — the CSS variables at the top of the file are the
source of truth on the web side.
