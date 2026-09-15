# Technical Architecture
## Chale

---

## 1. Platform decision

**Framework:** React Native via Expo.

**Why:** Leverages existing React/TypeScript experience rather than requiring a new language. Expo's EAS Build compiles iOS binaries in the cloud, so a physical Mac isn't required to produce an iOS app — only an Apple Developer account ($99/year) is needed once ready to distribute via TestFlight/App Store. Native Kotlin was considered but rejected: this app needs both platforms from day one conceptually (couples are frequently split across Android/iPhone), so Android-only native work would need to be redone later.

**Rollout given current constraints (no Apple dev account, no Apple device):**
1. Build and test entirely on Android during MVP development.
2. Validate the core loop (async reveal + voice mode) with an Android-only beta.
3. Once validated: get Apple Developer account, run EAS cloud build for iOS, recruit a few iPhone-owning beta testers via TestFlight (no personal Apple device required for this step).

## 2. Backend requirements

This is not a static-content app — pairing, reveal state, and push notifications require a real backend with a source of truth.

**Needed:**
- Auth + user accounts
- Realtime or near-realtime updates (so "your partner just answered" / reveal moments feel instant, not refresh-dependent)
- Push notification delivery (daily question, partner answered, reveal ready)
- Object storage for voice clips with TTL/expiry support
- A scheduled job runner (for expiring unsaved voice clips, sending the daily question)

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
- Supabase phone auth requires a third-party SMS provider (Twilio/Vonage). MVP starts with email magic-link/OTP; add a phone provider only if pairing by phone number proves necessary (Ghana focus — verify provider SMS coverage then).
- Supabase's free tier comfortably covers the Android beta; the switch to Node/Postgres is triggered by cost/usage becoming significant, which is exactly when the migration becomes worthwhile.

## 3. Data model

Rendered as SQL in `supabase/migrations/0001_initial_schema.sql` — keep this doc and the SQL in sync (same commit rule as `/types` in `06-development-workflow.md`).

### `users`
| field | type | notes |
|---|---|---|
| id | uuid | |
| display_name | text | |
| avatar_url | text | nullable |
| push_token | text | for notifications |

### `connections` (formerly "pairs")
1-on-1 for now. Renamed from "pairs" to "connections" since this now covers partners, friends, and family, not just couples. Group connections (3+ people) are explicitly out of scope near-term — see note below.

| field | type | notes |
|---|---|---|
| id | uuid | |
| user_a_id | uuid | FK -> users |
| user_b_id | uuid | FK -> users, nullable until linked |
| relationship_type | enum | partner / friend / family / etc. — MVP only exposes "partner", field exists from day one so adding types later is a content change, not a schema change |
| invite_code | text | used to complete linking |
| status | enum | pending / linked |
| streak_count | int | current streak (v1.1) |
| longest_streak | int | (v1.1) |

**On groups (far-future, not near-term roadmap):** if group connections (e.g. a whole family thread) are added later, they will not fit cleanly into this table — reveal logic ("both have answered") and voice mode ("walkie-talkie") both assume exactly two participants. Groups would need a separate `connection_members` join table and a redefined reveal rule (all members? quorum?). Deliberately not designing this now — flagging it so the 1-on-1 assumption baked into `connections`, `prompts`, and the reveal logic below is a known, revisit-later simplification rather than an accidental limitation.

### `question_packs`
| field | type | notes |
|---|---|---|
| id | uuid | |
| title | text | MVP: single hardcoded pack, tagged "partner" |
| category | text | |
| relationship_type | enum | matches `connections.relationship_type` — determines which pack(s) a connection draws from |

### `questions`
| field | type | notes |
|---|---|---|
| id | uuid | |
| pack_id | uuid | FK -> question_packs |
| text | text | |
| answer_type | enum | text / voice / either |

### `prompts`
One row per question-instance sent to a specific pair on a specific day.

| field | type | notes |
|---|---|---|
| id | uuid | |
| connection_id | uuid | FK -> connections |
| question_id | uuid | FK -> questions |
| date | date | |
| reveal_state | enum | waiting_on_both / revealed |

### `answers`
| field | type | notes |
|---|---|---|
| id | uuid | |
| prompt_id | uuid | FK -> prompts |
| user_id | uuid | FK -> users |
| type | enum | text / voice |
| content | text | text content, or audio file URL |
| submitted_at | timestamp | |
| expiry_state | enum | active / expired / saved (voice only) |
| expires_at | timestamp | nullable for text |
| saved_at | timestamp | nullable — set only by the speaker, for their own clip |

## 4. Reveal logic (server-side, non-negotiable)

`prompts.reveal_state` flips from `waiting_on_both` to `revealed` only when both people in the connection have a corresponding row in `answers` for that `prompt_id`. This must be computed and enforced server-side — if the client determines reveal state locally, one person could inspect local state to see whether their own answer has already been "counted" before the other submits, defeating the entire mechanic. This logic assumes exactly two participants (see the groups note above) and would need to change if group connections are ever added.

## 5. Voice mode (walkie-talkie) implementation notes

- Encode audio at low bitrate (Opus or AAC) — voice notes don't need music-quality audio, and this keeps storage/bandwidth costs down as saved-clip volume grows.
- Default expiry: clip expires once both partners have listened to it once (matches the "in-the-moment intimacy" framing from the PRD). A scheduled job should also hard-expire unsaved clips after a backstop window (e.g. 7 days) in case one partner never listens.
- **Save is per-speaker, not per-listener.** Only the person who recorded a clip can choose to save *their own* clip. This avoids one partner unilaterally archiving audio the other partner didn't want kept.
- Saved clips are flagged (`saved_at` set) but otherwise live in the same table for MVP — no need for a separate "saved answers" table until the v2 presentation layer is built.

## 6. Notifications needed

- New daily question available
- Partner has submitted their answer (nudge, not full reveal)
- Reveal ready (both answered)
- (v1.1) Streak reminder if a day is about to lapse