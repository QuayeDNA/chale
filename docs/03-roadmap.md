# Roadmap
## Chale

> **Recut 2026-10-13 from the shipped code.** Phases now carry a status. The original sequencing ("nothing past Phase 1 before Phase 1 data") deliberately shipped early in two places — the in-person mode and the deck catalogue — and slipped one thing that was meant to ship in Phase 1: push notifications. That gap is now the roadmap's headline.

---

## Phase 0 — Setup — **Done**
- Expo project (React Native + TypeScript), Supabase backend (see `02-technical-architecture.md`).
- Initial question content; now evolved into six pubished decks served from the database (see `02-technical-architecture.md`).

## Phase 1 — MVP remote loop (Android-only beta) — **Built, live e2e unverified**
- Pairing via 6-character invite code / share link.
- Remote card play: one card per connection per calendar day drawn from the active deck, answers passed as text or voice, locked until both answer, per-card reveal screen.
- Voice: record, send, listen tracking, speaker-only save after both have listened, 7-day backstop expiry.
- Anonymous guest browsing with the account boundary at pairing (email one-time code).
- **Still open:** notification delivery (see Phase 4) and a two-device e2e pass through the whole loop.

## Phase 2 — In-person sessions — **Shipped (was not on the original roadmap)**
- Same catalogue, second mode: a resumable, two-people-one-phone session with no answers, no server state, draw of 20 questions per deck.
- Local session persistence (AsyncStorage) surfaced as Home's resume tray.

## Phase 3 — Catalogue: decks, storefront, premium surface — **Shipped (premium/monetisation not built)**
- Deck identity in the database (slug, tagline, icon, tone, art, session length), storefront with search/views/filters, deck detail spread, favourites.
- A premium shelf and a Home premium banner exist as **surfaces only** — no paywall, no purchases. Monetisation remains v2 work.

## Phase 4 — iOS + push notifications — **Not started (the real gap)**
- Push notifications were spec'd into the MVP and never built: new card ready, partner answered, reveal ready, invite accepted. Without them the remote loop depends entirely on users remembering to open the app. This is the highest-leverage next build.
- iOS port: EAS cloud build, TestFlight beta, then dual-platform public launch.

## Phase 5 — v1.1 refinements (post-launch, driven by beta data)
- Shared streaks (couple-level, not individual).
- Partner nudge if one hasn't answered yet.
- Tune voice expiry window based on observed save-rate and complaints/feedback from beta.

## Phase 6 — v2 (depends on v1 data)
- Answer drift: resurface old questions, show old vs. new answer side by side.
- Saved-voice presentation layer: waveform styling per mood/pack, scrollable "voice timeline" of saved memories.
- Photo answers as a third answer type.
- Premium tier: additional packs, presentation styling — decide once retention is proven.

## Phase 7 — Relationship-type expansion
- Add "friend" and "family" packs (content work — `connections.relationship_type` and deck relationship tags already support it; the storefront filters already render the chips).
- Ask which type of connection is being created at setup (picker exists; today only "Partner" is offered).
- Re-run the Phase 1 success-signal checks per relationship type — a friend-context connection may behave very differently from a partner-context one.

## Phase 8 — Groups (far-future, not committed)
- 3+ person connections. Requires real design work before building: a `connection_members` join table, a redefined reveal rule, and a rethought voice mode.

---

**Sequencing principle (unchanged):** nothing past the beta loop should be built before beta data exists. The entire bet is the async reveal + voice mechanic. The two early deviations — in-person sessions and the catalogue — were deliberate scope calls made during the build; notifications were the one thing skipped without that call, which is why Phase 4 reads the way it does.
