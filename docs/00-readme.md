# Chale — Project Documentation Index

Doc set for the Chale app. As of **2026-10-13** every numbered doc has been re-aligned to the shipped code (the code wins over earlier planning text). Each item below carries a status label.

## Read in this order

1. **01-prd.md** — What we're building and why. Vision, differentiator, MVP scope, non-goals. *Updated 2026-10-13: scope notes reflect shipped behaviour (in-person mode + async remote loop).*
2. **04-user-flows.md** — The step-by-step journeys through the app (onboarding, in-person session, pairing, remote answer, reveal, voice lifecycle). *Updated 2026-10-13: describes the app as built, including what is **not** shipped (notifications). This is the behavior spec — read before touching UI or backend logic.*
3. **05-design-system.md** — Visual direction: mood, color, type. *Foundation locked and implemented; §1a-1 semantic tokens and §2 runtime relationship theming are marked planned, not built.*
4. **02-technical-architecture.md** — Stack decision, data model, RPC surface, reveal logic, voice mode, client architecture. *Rewritten 2026-10-13: full data-model refresh (decks, favourites, voice_listens), notifications marked spec'd-not-shipped.*
5. **06-development-workflow.md** — Git workflow, folder structure, environment setup, testing, build/release. *Corrected 2026-10-13: `src/` tree, dev-build iteration (not Expo Go), CI is a recommendation (none exists).*
6. **03-roadmap.md** — Phased build order with per-phase status. *Rewritten 2026-10-13: Phases 0–3 are shipped (Phase 4, iOS + push, is the real gap).*
7. **07-library-research.md** — Library decisions and their red flags (unistyles dev-build requirement, New Arch, icon subpath imports). Reference material.

## Reference & context (not part of the numbered set)

- **question-page-brief.md** (2026-10-13) — The doc that most closely matches shipped truth: one `QuestionCard` with session vs daily modes, AnswerPanel design, voice kept after "listened to twice". Useful as the screen-behavior reference alongside 04.
- **REVIEW.md** (2026-09-16) — Historical design audit (semantic tokens, a11y, P0/P1/P2). Mostly folded into 05.
- **Image (2).png** — Moodboard.
- **superpowers/specs/2026-10-02-backend-frontend-integration-design.md** and **superpowers/plans/2026-10-02-backend-frontend-integration.md** — The RPC-first integration spec and execution plan. The "first answer wins" rule was later superseded by migration `0012` (answers editable until reveal) — see 02 §3 and 04 flow 4.
- **archive/** — Retired planning docs, kept for history:
  - **archive/README.md** — why these were archived.
  - **archive/2026-09-penpot-ui-workflow.md** — The original in-person-first single-device design exploration. Its in-person flow is folded into 04; its token values were wrong and are not the shipped palette.
  - **archive/2026-09-penpot-build-checklist.md** — Penpot design progress log (historical).

## How these relate

- The **PRD** is the "what/why" — it shouldn't change often. Shipped-scope deviations are called out inline rather than silently adopted.
- **User flows** and **design system** are the "how it feels". Behavior spec first; visual system is locked.
- **Technical architecture** and **development workflow** are the "how it's built" — the data model and reveal logic are load-bearing; changing them later touches a lot of code.
- **Roadmap** is the sequencing — what not to build yet. It is where gaps (push notifications, iOS) are recorded.

## Naming note

App name: **Chale**. Codebase identifiers (`app.json` name/slug/scheme, Android package) are updated to `chale`; only the local folder name still reads `twogether` — cosmetic, nothing depends on it (see PRD §1).
