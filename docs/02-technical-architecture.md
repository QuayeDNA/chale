# Technical Architecture
## Chale

> **Refreshed 2026-10-13 from the shipped code** (screen-by-screen audit). The data model, RPC list and client architecture below now describe migrations `0001`–`0012` as written. Two spec'd-but-unbuilt items — push notifications and the voice-expiry scheduler — are marked explicitly rather than left implied.

---

## 1. Platform decision

**Framework:** React Native via Expo.

**Why:** Leverages existing React/TypeScript experience rather than requiring a new language. Expo's EAS Build compiles iOS binaries in the cloud, so a physical Mac isn't required to produce an iOS app — only an Apple Developer account ($99/year) is needed once ready to distribute via TestFlight/App Store. Native Kotlin was considered but rejected: this app needs both platforms from day one conceptually (couples are frequently split across Android/iPhone), so Android-only native work would need to be redone later.

**Rollout given current constraints (no Apple dev account, no Apple device):**
1. Build and test entirely on Android during MVP development.
2. Validate the core loop (async reveal + voice mode) with an Android-only beta.
3. Once validated: get Apple Developer account, run EAS cloud build for iOS, recruit a few iPhone-owning beta testers via TestFlight (no personal Apple device required for this step).

> Note: this rollout is still the intent, but the iOS build has not happened — `03-roadmap.md` Phase 4. Development also requires an **EAS dev build**, not Expo Go: Unistyles 3 and React Native's New Architecture (mandatory with Expo 57) both need native code (see `07-library-research.md`).

## 2. Backend requirements

**Needed:**
- Auth + user accounts
- Realtime or near-realtime updates (so "your partner just answered" / reveal moments feel instant, not refresh-dependent)
- ~~Push notification delivery (daily question, partner answered, reveal ready)~~ — **not implemented**; `expo-notifications` is not a dependency. Currently the only wake-up is opening the app.
- Object storage for voice clips with TTL/expiry support
- A scheduled job runner (for expiring unsaved voice clips) — the SQL expiry predicate is in place (0005/0012); no scheduler (pg_cron or otherwise) is wired yet, so expiry relies on the read path checking `expires_at`.

**Decision (locked): Supabase**, with a future migration to custom Node + Postgres planned for when managed-platform cost or limits bite — not for MVP.

**Why Supabase over the alternatives:**
- The data model in §3 is relational (uuid FKs, enums) — Supabase is Postgres, so the schema in this doc maps 1:1 and becomes the durable asset. When the move to Node + Postgres happens, the schema, the reveal RPC below, and the SQL carry over nearly unchanged; only the surrounding platform gets replaced (storage → S3, realtime → WebSockets, scheduled jobs → cron/BullMQ).
- The reveal rule (§4) is a transactional invariant — "insert answer, count both, flip reveal_state" is one atomic Postgres transaction/RPC. This directly satisfies the race-condition testing requirement in `06-development-workflow.md`.
- Realtime (partner answered / reveal) ships with the DB, auth is built in, and push goes through Expo's push service regardless of backend.

**Rejected options:**
- **Firebase** — Firestore's NoSQL model fights the relational design, and its main advantage (native FCM) is neutralized by using Expo push.
- **Convex** — attractive on paper (TypeScript server functions, live queries by default, strong local dev), but it's a proprietary managed platform: the reveal logic and data model would have to be rewritten from scratch for the planned Node/Postgres migration, and auth isn't built in (adding Clerk/Auth0 dependency + cost). Choosing it means writing the core mechanic twice.
- **Custom Node + Postgres now** — the eventual destination, but building auth/realtime/storage/scheduled-jobs from scratch before the core loop is validated violates the sequencing principle in `03-roadmap.md`. Postponed, not avoided.

**Known trade-offs to note:**
- ~~Supabase phone auth requires a third-party SMS provider (Twilio/Vonage). MVP starts with email magic-link/OTP~~ — **shipped as email one-time code only.** No phone auth was built; revisit if pairing by phone number proves necessary (Ghana focus — verify provider SMS coverage then).
- Supabase's free tier comfortably covers the Android beta; the switch to Node/Postgres is triggered by cost/usage becoming significant, which is exactly when the migration becomes worthwhile.

**Auth timing (anonymous-first):** the app is browsable with no account by default — first launch signs in via **Supabase anonymous sign-ins** (a low-trust identity that can later be linked to a real account, so early state — favourites in particular — carries over). Users are only asked to create an account at an auth-boundary feature: creating or joining a connection, or saving a favourite. The account itself is email + one-time code (`supabase.auth.signInWithOtp`); claiming an account from an anonymous session keeps the same user id (`users` row and favourites follow automatically). Anonymous identities get a `users` row too (display name defaults to "New friend"). RLS keeps question content readable by `anon`; everything in the core loop is `authenticated` only.

## 3. Data model

Rendered as SQL in `supabase/migrations/` — keep this doc and the SQL in sync (same commit rule as `/types` in `06-development-workflow.md`). Migrations `0001` establishes; `0002`–`0012` evolve the model. Note: `0001`'s comment says answers are never editable; that comment is superseded by `0012` (see below) — the file is left as historical record.

### `users`
| field | type | notes |
|---|---|---|
| id | uuid | ties to Supabase Auth |
| display_name | text | set at account verification; "New friend" for guests |
| avatar_url | text | nullable; app renders a DiceBear from the id |
| push_token | text | **unused** — notifications not shipped |
| created_at / updated_at | timestamptz | |

### `connections` (formerly "pairs")
| field | type | notes |
|---|---|---|
| id | uuid | |
| user_a_id | uuid | FK -> users |
| user_b_id | uuid | FK -> users, nullable until linked |
| relationship_type | enum | partner / friend / family — MVP only exposes "partner" |
| invite_code | text | unique, not null; **stable while pending** — one live invite per connection |
| status | enum | pending / linked |
| active_deck_id | uuid | FK -> question_packs (0009) — the deck the daily prompt draws from; set by the creator of the invite |
| streak_count / longest_streak | int | (v1.1, unused) |
| created_at / updated_at | timestamptz | |

Unique index guarantees at most one *linked* connection per unordered pair.

### `question_packs` (decks)
Evolved in 0007 from "one flat pack" into deck identity. The database stores **keys only** (`slug`, `tone`, `icon`, `art_key`); rendering lives in `src/decks/art.ts` — a new deck is one row plus one art entry, no migration.

| field | type | notes |
|---|---|---|
| id | uuid | |
| title | text | |
| slug | text | unique where present |
| tagline | text | storefront subline |
| icon | text | lucide key |
| tone | text | art/gradient key |
| art_key | text | |
| session_length | int | default 20, checked 5–50 — the in-person draw size |
| sort_order | int | |
| is_published | boolean | gate for both storefront and draws |
| relationship_type | enum | tags the deck's audience |
| created_at | timestamptz | |

(`category` was dropped in 0007 — superseded by slug + tone + is_published.)

### `questions`
| field | type | notes |
|---|---|---|
| id | uuid | |
| pack_id | uuid | FK -> question_packs |
| text | text | |
| kind | enum | text / voice / either — decides what the answer panel offers |
| ordinal | int | authored position (0007); nullable so partial decks still draw |
| is_active | boolean | soft-delete per question |
| created_at | timestamptz | |

### `prompts`
One row per connection per day (unique on `(connection_id, date)`).

| field | type | notes |
|---|---|---|
| id | uuid | |
| connection_id | uuid | FK -> connections |
| question_id | uuid | FK -> questions |
| date | date | |
| reveal_state | enum | waiting_on_both / revealed |
| created_at | timestamptz | |

### `answers`
One row per `(prompt_id, user_id)` — the unique constraint is what makes replacing-in-place possible.

| field | type | notes |
|---|---|---|
| id | uuid | |
| prompt_id | uuid | FK -> prompts |
| user_id | uuid | FK -> users |
| kind | enum | text / voice |
| content | text | text content, or storage URL for voice |
| submitted_at | timestamptz | updated on replace |
| expiry_state | enum | active / expired / saved (voice only) |
| expires_at | timestamptz | set to `now() + 7 days` on voice submit (0005/0012) |
| saved_at | timestamptz | set only by the speaker, for their own clip, once listening is satisfied |

**Answers are editable until reveal (0012).** `submit_answer` inserts *or replaces* the row — and refuses to replace once the prompt is `revealed`. Every field moves with the replacement, including `saved_at` (a replaced clip starts a fresh 7 days). This supersedes the "first answer wins" note from the 2026-10-02 integration spec; the reveal, not immutability, is the integrity guarantee.

### `favourites` (0006)
| field | type | notes |
|---|---|---|
| user_id | uuid | FK -> users |
| question_id | uuid | FK -> questions |
| created_at | timestamptz | PK (user_id, question_id) |

Favourites are on *questions* (a heart on a question card, session or remote side), not on answers.

### `voice_listens` (0004)
| field | type | notes |
|---|---|---|
| answer_id | uuid | FK -> answers |
| listener_id | uuid | FK -> users |
| created_at | timestamptz | PK (answer_id, listener_id) |

One row per (answer, listener) — a person's first play counts, replays don't. This is the data the save gate reads.

## 4. Reveal logic (server-side, non-negotiable)

`prompts.reveal_state` flips from `waiting_on_both` to `revealed` only when both people in the connection have a corresponding row in `answers` for that `prompt_id`. This must be computed and enforced server-side — if the client determines reveal state locally, one person could inspect local state to see whether their own answer has already been "counted" before the other submits, defeating the entire mechanic. This logic assumes exactly two participants (see the groups note below) and would need to change if group connections are ever added.

**On groups (far-future, not near-term roadmap):** if group connections (e.g. a whole family thread) are added later, they will not fit cleanly into `connections` — reveal logic ("both have answered") and voice mode ("walkie-talkie") both assume exactly two participants. Groups would need a separate `connection_members` join table and a redefined reveal rule. Deliberately not designing this now.

## 5. RPC surface

All server-side entry points the app calls; each is `security definer` with explicit membership checks.

| function | migration | purpose |
|---|---|---|
| `create_connection(p_deck uuid default null)` | 0003, 0009 | mints a stable 6-char invite; pins the chosen deck as the connection's active deck |
| `join_connection(p_code text)` | 0003 | redeems a code; adopts the inviter's deck |
| `get_or_create_today_prompt(p_connection uuid)` | 0004, 0007, 0009 | creates today's `(connection, date)` prompt if absent and reveals it in the remote flow; draws from the connection's active deck |
| `read_today_prompt(p_connection uuid)` | 0011 | peek — returns today's prompt **without creating it**; Home uses this so browsing never spends a day |
| `submit_answer(p_prompt, p_kind, p_content)` | 0001, 0005, 0012 | insert-or-replace until revealed; sets voice `expires_at`; flips reveal at count ≥ 2 |
| `record_listen(p_answer)` | 0004 | inserts the (answer, listener) row |
| `save_own_clip(p_answer)` | 0004 | speaker-only; requires listen count ≥ 2 (both people) |
| `draw_session_questions(p_pack, p_count default 20)` | 0007 | bounded shuffled draw over published, active questions — used by in-person sessions *and* the storefront's 3-question sample |
| `list_packs_with_counts()` | 0007 | catalogue listing with per-pack question counts |

Realtime is on `answers` (the reveal flip) and `question_packs` (0010, deck identity changes).

## 6. Voice mode (walkie-talkie) implementation notes

- Encode audio at low bitrate (Opus or AAC) — voice notes don't need music-quality audio, and this keeps storage/bandwidth costs down as saved-clip volume grows.
- Lifecycle: submit sets `expires_at = now() + 7 days`; a listen is a `voice_listens` row; **the save prompt appears to the speaker only once `listens >= 2`** — i.e. after both people (exactly two per connection) have listened once; `save_own_clip` enforces this in SQL. Saving flags `saved_at` and exempts the clip from expiry.
- The 7-day backstop also expires clips nobody ever listened to, so an unlistened clip can't block the save decision forever. The expiry *check* lives in the read path; the automated sweep (§2) is not wired.
- **Save is per-speaker, not per-listener.** Only the person who recorded a clip can choose to save *their own* clip.
- Storage: `voice-clips` bucket; the app uploads first, then submits the answer row — and keeps the recorded clip on screen if the submit fails.

## 7. Client architecture notes

- **Routing:** expo-router (file-based). Routes: `index → splash → welcome`, `(tabs)` = home / favourites / remote / profile, then `start`, `auth`, `decks`, `deck/[id]`, `session?pack=`, `prompt/[id]`, `settings`. Two former dev-only showcase routes were removed from production.
- **Server state:** TanStack Query v5 owns all network state; invalidation keys (`connection`, `prompt`, `answers`, `decks`, `sessions`, `favourites`) are refreshed on tab focus so a stale day never displays.
- **Local state:** in-person sessions live in AsyncStorage (`chale.session.v1.<packId>`) — no database rows; a session is resumable, discardable, and one deck per session.
- **Styling:** Unistyles 3.3 (see `05-design-system.md` for tokens). Requires an EAS dev build, not Expo Go.
- **Types:** `src/lib/database.types.ts` is generated and committed (`supabase gen types typescript`); sync rule in `06-development-workflow.md`.

## 8. Notifications

**Spec'd, not shipped.** The 2026-10-02 integration spec deliberately deferred them; they were also absent from the code as of this refresh. `users.push_token` exists but is never written. When built (roadmap Phase 4): Expo push service + a scheduler for the daily question — the DB side (one prompt per connection per day) is already the cadence source.
