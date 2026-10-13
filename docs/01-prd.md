# Product Requirements Document
## Chale

> **Aligned to shipped code 2026-10-13** (screen-by-screen audit). MVP scope (§5) now records what actually ships: the app has two modes — remote (async, the spine) and in-person sessions; it ships six decks rather than one pack; and push notifications, which §5 originally required, are **not built**. Open questions (§9) are resolved.

---

## 1. Vision

A mobile app for any two people who want to stay close — partners, friends, siblings, parent and child — to deepen connection through daily questions answered independently, then revealed together. Where most question-card apps (Flamingo Cards, etc.) are built for two people sitting side-by-side with one phone, this app is built for people who are apart as often as they're together: the question comes to both of you, you each answer on your own time, and the reveal is a shared moment even across distance.

The relationship context (romantic partner, friend, family) changes the question content and tone, but the core mechanic — async reveal + optional ephemeral voice — stays the same across every connection type. This is a relationship-agnostic mechanic, not a couples-only feature.

**Shipped scope note (2026-10-13):** the product now also ships an **in-person mode** — two people, one phone, a resumable session of questions with no answering at all. It is the opposite posture to the async loop, it shares the deck catalogue and favourites with it, and it has become a first-class mode alongside remote rather than an extension of it. Both modes exist; the async loop remains the spine and the reason the app exists.

*Auth note: because the mechanic is two-person by definition, "no auth by default" means anonymous **browsing only** — the ask to create an account comes at the pairing/answering boundary, not at first launch (see MVP scope §5).*

## 1a. Naming

App name: **Chale** — Ghanaian Pidgin English for "friend/buddy," widely recognized across Ghana and West Africa. Chosen because it's an English word carrying Ghanaian tonality (fits the Ghana/West Africa launch focus while staying globally pronounceable), and because it works naturally across every relationship type in scope — a partner, sibling, or best friend is all equally your "chale."

In-app microcopy should carry the same voice where it fits naturally: e.g. "Say Am" on the voice-record button, "Kai this one?" on the save-voice prompt. Not a rebrand of every screen — just a few key moments where the Ghanaian-English tone reinforces the brand.

*Note: codebase identifiers (`app.json` name/slug/scheme, Android package) are now updated to "Chale". The local folder/directory name still reads "twogether" — purely cosmetic, no code depends on it.*

## 2. Problem

- Existing bonding/question-card apps assume both people are in the same room with one device (pass-and-play).
- They're low-retention: people download for a date night, play twice, forget the app exists.
- People who are apart — long-distance couples, friends who've drifted, family across cities — are underserved: there's no good "answer separately, feel together" product in this space, for any relationship type.

## 3. Target users

- Any 1-on-1 relationship where staying connected matters: romantic partners, close friends, siblings, parent/child — particularly pairs who spend meaningful time apart (distance, busy schedules, travel).
- People looking for a low-effort daily ritual rather than a one-off activity.
- **MVP beta audience:** couples specifically, to validate the core mechanic with the highest emotional-intent use case before opening up other relationship types. Broadening to friends/family is a content and onboarding change once the mechanic proves out — not a rebuild, since the underlying model is relationship-agnostic from day one.

## 4. Core differentiator

**Async reveal mechanic:** A question is pushed to both partners. Each answers independently; answers are locked and hidden until *both* have submitted. Once both are in, a reveal moment triggers for both partners at once.

**Walkie-talkie mode:** Voice answers as an alternative to text. Voice clips are short-lived / ephemeral by default (ordinary intimacy shouldn't feel archived), but either person can choose to save their *own* clip. Saved clips are the seed for a future "presentation layer" (visualized, searchable memory of saved answers over time).

**Relationship-aware content:** Each connection has a relationship type (partner, friend, family, etc.) that determines which question pack(s) it draws from and the tone of the prompts. The mechanic above is identical across all types — only the content changes.

## 5. MVP scope

1. Anonymous-first onboarding: the app is browsable with no account (deck catalogue and previews via Supabase anonymous sign-in). **Shipped.** An account is created exactly when the user initiates creating or joining a connection, or saves a favourite — email one-time code; claiming from a guest session keeps the same user id, so early favourites carry over. Relationship type is tagged on the connection (MVP ships "partner" as the only selectable type; the data model supports more from day one). **Shipped.**
2. **In-person sessions** *(not in the original MVP; shipped)*: a resumable, shared-device session drawing `session_length` (default 20) questions from a deck — no answers, no server state, guests allowed. Lives on Home as a resume tray.
3. ~~One question per day, pushed to both people via notification.~~ **Half shipped:** one question per calendar day per connection, drawn from the connection's active deck — shipped (server-side, `get_or_create_today_prompt`); **push notification — not shipped.** The question arrives when the app is opened. Notifications are the top of the roadmap (`03-roadmap.md` Phase 4).
4. Text answers, locked until both people submit. **Shipped**, with one behavioural change: an answer stays **editable until the reveal** (`submit_answer` replaces-in-place, then refuses after `reveal_state = revealed`). Locking at reveal is what protects the mechanic; pre-reveal immutability was dropped.
5. Reveal screen once both answers are in. **Shipped** — side-by-side, server-enforced flips, realtime on answers.
6. Voice answers (walkie-talkie mode): record, send, auto-expire after both people have listened once; optional save toggle shown *after* listening. **Shipped** with the rule resolved: expiry is a hard 7-day backstop from submission; a listen is a row in `voice_listens` (first play per person); the save prompt appears to the speaker only once listens ≥ 2 (both people). Saved clips are exempt from expiry.
7. ~~One curated question pack for the "partner" relationship type (~100 hand-written questions) — no content CMS yet.~~ **Evolved:** six themed decks (slug/tagline/tone/art + session length + is_published) seeded in the database, browsable via a storefront with search, view modes and relationship filters, plus a premium shelf and premium banner as **surfaces only** (no paywall, no purchases). A minimal CMS is still not built — decks are seeded migrations.

## 6. Explicit non-goals for MVP

- No streaks/gamification yet (v1.1).
- No saved-answer "timeline" or presentation features yet (v2 — depends on save behavior data from MVP).
- No additional relationship types (friends, family) at launch — the model supports them, but MVP ships with "partner" content only to keep validation focused. Adding a pack + relationship type later is a content change, not a rebuild. *(The storefront's friend/family filter chips render already, with nothing behind them.)*
- No group connections (3+ people) — explicitly far-future. MVP and near-term roadmap are 1-on-1 only.
- No iOS build in the very first release — Android-only beta to validate the core loop before investing in the Apple Developer account and cross-platform testing.
- No push notifications in the beta — a deliberate skip during the build, now the roadmap's highest-leverage gap. Everything the notification table promised (daily question, partner answered, reveal ready) works only while the app is open.
- No multiple question packs / premium content tiers yet. *(Historical: the catalogue shipped in beta by design choice — the deck system, not the monetisation, which remains v2. The non-goal that still stands is "premium/paywall", not "more than one pack".)*

## 7. Near-term roadmap after MVP validation

- **v1.1:** Streaks (shared, not individual), partner nudges when one hasn't answered yet.
- **v1.2:** iOS release via TestFlight, plus push notifications — both slipped out of the beta and are now the next build (see `03-roadmap.md` Phase 4).
- **v2:** Answer drift ("this question again, 6 months later — see your old answer vs new"), saved-voice presentation layer (waveform styling, voice timeline), photo answers.

## 8. Success signals to watch in the Android beta

- % of pushed questions where **both** partners answer (the core loop only works if both sides participate).
- Voice vs text answer ratio, and % of voice answers saved (tells you whether ephemerality or permanence is what people actually want).
- Day-7 and day-30 retention compared to typical question-card app benchmarks (these apps generally struggle past the first week or two).

## 9. Key open questions — resolved during build

- **Voice ephemeral window** — resolved: hard 7-day backstop from submission; save unlocks after both people have listened once (two `voice_listens` rows); save is speaker-only and exempts the clip from expiry.
- **Pairing permanence** — resolved for beta: connections are permanent. An unaccepted invite simply stays pending (its code is stable and reusable); there is no cancel/unlink flow.
- **Unanswered questions rollover** — resolved: one prompt per connection per calendar day; an unanswered question does not roll over — the next day draws fresh.

New question the build surfaced, still open: **does the in-person mode dilute or feed the remote loop?** Two modes share one catalogue and one favourites store; whether a beta user who only ever plays in-person converts to remote (or needs a nudge to) is a validation question for the beta data.