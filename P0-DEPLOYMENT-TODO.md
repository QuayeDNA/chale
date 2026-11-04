# P0 Deployment TODO

P0 code is implemented locally. These are the operational steps that must be completed before P1 starts.

Do not start P1 until every checkbox below is checked and the live waitlist has passed one real end-to-end signup.

## Current status (28 October 2026)

- Intended production domain: `https://chale.space`, but it has **not been purchased or configured yet**. There are currently no DNS records for it.
- Waitlist migration `0014_waitlist.sql` has been applied to the production Supabase project.
- Resend API key is present in the local env files, but it is send-only. Domain verification is blocked until `chale.space` is purchased and DNS is configured.
- Local `web/.env.local` and `supabase/functions/.env` are populated.
- Turnstile site and secret keys are still pending.
- Supabase secrets are pushed and confirmed.
- Both Edge Functions are deployed and active.
- Invalid-email and invalid-token smoke tests return the expected `400` responses.
- Waitlist table, RLS, constraints, and indexes have been verified against the linked production database.
- Source is committed and pushed to the private repository `https://github.com/QuayeDNA/chale`.

## Values to decide first

Fill these in before touching any service:

| Value | Example | Notes |
| --- | --- | --- |
| `SITE_URL` | `https://chale.space` | Final public URL, no trailing slash |
| `CONTACT_EMAIL` | `hello@chale.space` | Confirm the inbox exists and is monitored |
| `WAITLIST_FROM_EMAIL` | `Chale <hello@chale.space>` | Must use a Resend-verified domain |
| `WAITLIST_REPLY_TO` | `hello@chale.space` | Optional but recommended |
| `SUPABASE_PROJECT_REF` | `abcdefghijklmnop` | From Supabase project settings |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Project API URL |
| `SUPABASE_ANON_KEY` | `eyJ...` | Public anon key |
| `RESEND_API_KEY` | `re_...` | Create after domain verification |
| `TURNSTILE_SITE_KEY` | `0x4...` | Optional; recommended for public traffic |
| `TURNSTILE_SECRET` | `0x4...` | Optional; pair with site key |
| `WAITLIST_IP_SALT` | random 32+ byte hex | Generate a unique value |
| `VITE_SITE_URL` | same as `SITE_URL` | Used by the web client |
| `VITE_CONTACT_EMAIL` | same as `CONTACT_EMAIL` | Used on legal pages |

Do not commit real keys or `.env` files.

## 1. Prepare Supabase

- [ ] Create or select the production Supabase project.
- [ ] Install the Supabase CLI if needed.
- [ ] Log in and link the repo to the project.

```powershell
supabase --version
supabase login
supabase link --project-ref <SUPABASE_PROJECT_REF>
```

- [ ] Confirm `supabase/config.toml` still has `verify_jwt = false` for `join-waitlist` and `confirm-waitlist`.

## 2. Apply the waitlist migration

- [x] Apply the migration to the linked project.

```powershell
supabase db push --linked
```

- [x] Verify the `public.waitlist` table exists.
- [x] Verify RLS is enabled and there are no public read/write policies.
- [x] Verify the unique email constraint and `invite_code` index exist.
- [ ] Do not run `supabase db reset` against production.

## 3. Configure Resend

- [x] Create a Resend account/project.
- [ ] Purchase `chale.space`.
- [ ] Add the sending domain in Resend.
- [ ] Add the required DNS records (SPF, DKIM, DMARC) at the domain registrar.
- [ ] Wait for Resend to show the domain as verified.
- [x] Create an API key with permission to send email. The current key is send-only.
- [ ] Confirm `chale.space` is verified in Resend and `WAITLIST_FROM_EMAIL` uses it.

## 4. Configure Cloudflare Turnstile

Turnstile is optional in code but strongly recommended for a public waitlist.

- [ ] Create a Turnstile widget for the production hostname.
- [ ] Save the site key for `VITE_TURNSTILE_SITE_KEY`.
- [ ] Save the secret key for `TURNSTILE_SECRET`.
- [ ] If intentionally skipping Turnstile, leave both values empty. Do not set only one of them.

## 5. Set the Edge Function secrets

- [x] Copy `supabase/functions/.env.example` to `supabase/functions/.env`.
- [x] Fill in the real values.
- [x] Generate a unique `WAITLIST_IP_SALT`.
- [x] Push the secrets to Supabase.

```powershell
supabase secrets set --env-file supabase/functions/.env
```

- [x] Confirm the secrets are present.

```powershell
supabase secrets list
```

Required secrets:

```text
SITE_URL
RESEND_API_KEY
WAITLIST_FROM_EMAIL
WAITLIST_REPLY_TO
TURNSTILE_SECRET
WAITLIST_IP_SALT
```

Optional:

```text
WAITLIST_EMAIL_MODE
```

Use `WAITLIST_EMAIL_MODE=log` only for local development. Do not use it in production.

## 6. Deploy the Edge Functions

- [x] Deploy both functions.

```powershell
supabase functions deploy join-waitlist
supabase functions deploy confirm-waitlist
```

- [x] Confirm both functions are listed.

```powershell
supabase functions list
```

- [ ] Check the function logs after the first request for runtime errors.

## 7. Configure the web environment

- [x] Copy `web/.env.example` to `web/.env.local`.
- [x] Fill in the real values.
- [x] Use the final production URL for `VITE_SITE_URL`, with no trailing slash.
- [ ] Confirm `hello@chale.space` is a real monitored inbox for `VITE_CONTACT_EMAIL`.
- [x] Keep `VITE_SUPABASE_ANON_KEY` as the public anon key only. Never put the service-role key in the web app.

Required web values:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SITE_URL
VITE_CONTACT_EMAIL
```

Optional:

```text
VITE_TURNSTILE_SITE_KEY
```

## 8. Run the local production build

- [x] Install dependencies if needed.
- [x] Run type checking.
- [x] Run the production build.
- [ ] Preview the built site locally.

```powershell
cd web
npm install
npm run typecheck
npm run build
npm run preview
```

- [x] Confirm the build regenerates the deck manifest successfully.
- [x] Confirm the privacy page headings render at full width.
- [x] Confirm no `Paid` or price copy appears on the deck shelf.

## 9. Complete a live end-to-end test

Use a real email address you can access.

- [ ] Visit the production or preview site with `?ref=test-ref` appended.
- [ ] Submit a valid email through the waitlist form.
- [ ] Confirm the UI shows the success state.
- [ ] Confirm the `waitlist` row is created with `status = 'pending'`.
- [ ] Confirm `referred_by` is recorded when a valid referral code is used.
- [ ] Confirm the confirmation email arrives.
- [ ] Confirm the email sender is the verified Resend domain.
- [ ] Click the confirmation link.
- [ ] Confirm `/confirm?token=...` shows the confirmed state.
- [ ] Confirm the database row becomes `status = 'confirmed'` and `confirmed_at` is set.
- [ ] Refresh the confirmation page and confirm it does not reconfirm or error.
- [ ] Test an invalid email and confirm the form shows a useful error.
- [ ] Test a duplicate signup and confirm the response does not reveal whether the address already exists.
- [ ] Test the honeypot field if possible.
- [ ] Test Turnstile failure if Turnstile is enabled.
- [ ] Test the IP rate limit without locking out your own production IP for long.
- [ ] Test an expired or invalid confirmation token.
- [ ] Check Supabase function logs and Resend logs for errors.

## 10. Deploy the web app and domain

Blocked: `chale.space` has not been purchased yet, so DNS and custom-domain steps cannot run.

- [ ] Set the web environment variables in the hosting provider.
- [ ] Set the build root to `web`.
- [ ] Set the build command to `npm run build`.
- [ ] Set the output directory to `dist`.
- [ ] Configure SPA fallback rewrites so every route serves `index.html`.
- [ ] Confirm `/confirm` works when opened directly, not only through client-side navigation.
- [ ] Confirm `/terms` and `/privacy` work when opened directly.
- [ ] Attach `chale.space` and confirm HTTPS.
- [ ] Set the Supabase Auth Site URL to `https://chale.space`.
- [ ] Add `https://chale.space/auth/bridge` to the Supabase Auth redirect URLs.
- [ ] If the domain changes after deployment, update `SITE_URL` and redeploy the Edge Functions.

## 11. Check email deliverability

- [ ] Send a test confirmation to Gmail.
- [ ] Send a test confirmation to Outlook.
- [ ] Confirm the email is not landing in spam.
- [ ] Confirm links use the final HTTPS domain.
- [ ] Confirm the confirmation link expires after the intended 48-hour window.
- [ ] Confirm reply-to points to a monitored inbox.

## 12. Final legal and operations sign-off

- [ ] Confirm the `hello@chale.space` inbox exists and is monitored.
- [ ] Confirm the privacy policy names the actual operator and contact channel.
- [ ] Confirm the terms describe the partner-first remote beta honestly.
- [ ] Confirm the effective date is correct.
- [ ] Confirm the waitlist privacy disclosure matches what is actually stored.
- [ ] Confirm there is a process for handling deletion and contact requests.
- [ ] Confirm Supabase and Resend billing/alerts are enabled.

## 13. Monitoring

- [ ] Bookmark Supabase function logs.
- [ ] Bookmark Resend email logs.
- [ ] Confirm failed sends are visible and actionable.
- [ ] Confirm rate-limit behavior is acceptable.
- [ ] Record the first successful live signup and confirmation.

## P1 gate

P1 can start only when:

- [x] The migration is applied.
- [x] Both Edge Functions are deployed.
- [x] Web and function secrets are set.
- [ ] The production web build is live on the final domain.
- [ ] One real signup and confirmation completed successfully.
- [ ] The confirmation email is deliverable to major inboxes.
- [ ] Legal contact details are real.
- [ ] No production errors appear in Supabase or Resend logs.
