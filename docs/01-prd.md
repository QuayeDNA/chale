# Product Requirements Document
## Chale

---

## 1. Vision

A mobile app for any two people who want to stay close — partners, friends, siblings, parent and child — to deepen connection through daily questions answered independently, then revealed together. Where most question-card apps (Flamingo Cards, etc.) are built for two people sitting side-by-side with one phone, this app is built for people who are apart as often as they're together: the question comes to both of you, you each answer on your own time, and the reveal is a shared moment even across distance.

The relationship context (romantic partner, friend, family) changes the question content and tone, but the core mechanic — async reveal + optional ephemeral voice — stays the same across every connection type. This is a relationship-agnostic mechanic, not a couples-only feature.

## 1a. Naming

App name: **Chale** — Ghanaian Pidgin English for "friend/buddy," widely recognized across Ghana and West Africa. Chosen because it's an English word carrying Ghanaian tonality (fits the Ghana/West Africa launch focus while staying globally pronounceable), and because it works naturally across every relationship type in scope — a partner, sibling, or best friend is all equally your "chale."

In-app microcopy should carry the same voice where it fits naturally: e.g. "Say Am" on the voice-record button, "Kai this one?" on the save-voice prompt. Not a rebrand of every screen — just a few key moments where the Ghanaian-English tone reinforces the brand.

*Note: the project repo/codebase was already scaffolded under the working name "Twogether" — renaming the codebase/package identifiers to Chale is a housekeeping task for later, not urgent before further feature work.*

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

1. Account creation + 1-on-1 connection via invite link/code, tagged with a relationship type (MVP ships with "partner" as the only selectable type — data model supports more from day one).
2. One question per day, pushed to both people via notification.
3. Text answers, locked until both people submit.
4. Reveal screen once both answers are in.
5. Voice answers (walkie-talkie mode): record, send, auto-expire after both people have listened once; optional save toggle shown *after* listening.
6. One curated question pack for the "partner" relationship type (~100 hand-written questions) — no content CMS yet.

## 6. Explicit non-goals for MVP

- No streaks/gamification yet (v1.1).
- No saved-answer "timeline" or presentation features yet (v2 — depends on save behavior data from MVP).
- No additional relationship types (friends, family) at launch — the model supports them, but MVP ships with "partner" content only to keep validation focused. Adding a pack + relationship type later is a content change, not a rebuild.
- No group connections (3+ people) — explicitly far-future. MVP and near-term roadmap are 1-on-1 only.
- No iOS build in the very first release — Android-only beta to validate the core loop before investing in the Apple Developer account and cross-platform testing.
- No multiple question packs / premium content tiers yet.

## 7. Near-term roadmap after MVP validation

- **v1.1:** Streaks (shared, not individual), partner nudges when one hasn't answered yet.
- **v1.2:** iOS release via TestFlight, once Android beta validates the core loop.
- **v2:** Answer drift ("this question again, 6 months later — see your old answer vs new"), saved-voice presentation layer (waveform styling, voice timeline), photo answers.

## 8. Success signals to watch in the Android beta

- % of pushed questions where **both** partners answer (the core loop only works if both sides participate).
- Voice vs text answer ratio, and % of voice answers saved (tells you whether ephemerality or permanence is what people actually want).
- Day-7 and day-30 retention compared to typical question-card app benchmarks (these apps generally struggle past the first week or two).

## 9. Key open questions to resolve during build

- Exact ephemeral window for voice ("expires after both listen" vs. a hard time limit) — recommend starting with "expires after both have listened once," reassess after beta feedback.
- Whether pairing is permanent (locked to one partner) or a pair can be unlinked/re-linked — affects account/data model complexity.
- Whether unanswered questions roll over or expire at midnight — affects how "daily ritual" the app feels.