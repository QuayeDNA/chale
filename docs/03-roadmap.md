# Roadmap
## Chale

---

## Phase 0 — Setup
- Stand up Expo project (React Native + TypeScript).
- Stand up backend (Supabase or Firebase — see `02-technical-architecture.md`).
- Write the first question pack (~100 questions, mix of text-suited and voice-suited prompts).

## Phase 1 — MVP (Android-only beta)
- Pairing via invite link/code.
- Daily question push + text answers with locked-until-both-answer + reveal screen.
- Voice mode: record, send, expire-after-both-listen, optional save toggle post-listen.
- Distribute to a small group of real couples on Android for feedback.
- **Goal:** validate that the async reveal + voice mechanic actually creates the "can't wait to see what they said" feeling, and see real save-rate data on voice clips.

## Phase 2 — iOS expansion
- Get Apple Developer account.
- EAS cloud build for iOS (no Mac required for the build itself).
- Recruit iPhone-owning beta testers via TestFlight.
- Public launch on both platforms once iOS beta is stable.

## Phase 3 — v1.1 refinements (post-launch, driven by beta data)
- Shared streaks (couple-level, not individual).
- Partner nudge if one hasn't answered yet.
- Tune voice expiry window based on observed save-rate and complaints/feedback from beta.

## Phase 4 — v2 (depends on v1 data)
- Answer drift: resurface old questions, show old vs. new answer side by side.
- Saved-voice presentation layer: waveform styling per mood/pack, scrollable "voice timeline" of saved memories.
- Photo answers as a third answer type.
- Consider premium tier (additional question packs, presentation styling) once retention is proven — deliberately avoided at MVP to keep the core loop free of monetization friction while validating it.

## Phase 5 — Relationship-type expansion
- Add "friend" and "family" question packs (content work, not architecture work — `connections.relationship_type` and `question_packs.relationship_type` already support this from Phase 0).
- Update onboarding to ask which type of connection is being created.
- Re-run the same success-signal checks from Phase 1 (both-answered rate, voice save rate, retention) per relationship type — a friend-context connection may behave very differently from a partner-context one.

## Phase 6 — Groups (far-future, not committed)
- Support 3+ person connections (e.g. a family thread).
- Requires real design work before building: a `connection_members` join table, a redefined reveal rule (all members? a quorum?), and a rethought voice mode (walkie-talkie assumes two speakers). Not scoped in detail here — flagged only so it isn't forgotten.

---

**Sequencing principle:** nothing past Phase 1 should be built before Phase 1 data exists. The entire bet is on the async reveal + voice mechanic — validate that first with a couples beta before investing in gamification, cross-platform polish, additional relationship types, or groups.  