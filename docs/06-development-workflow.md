# Development Workflow
## Chale

Practical setup and process for building this — how the repo is organized, how to work day to day, and how code gets from your machine to a real device.

**Status (2026-10-13):** sections below reflect the repo as it exists. Where early planning text disagreed with reality (Expo Go iteration, root-level folders, a CI workflow that was never added), it has been corrected to match what's actually built.

---

## 1. Environment setup

**Frontend (Expo / React Native):**
- Node.js (LTS version)
- Expo CLI (`npx expo` — no global install needed with modern Expo)
- **EAS development build on your Android device/emulator for iteration.** An early plan to use Expo Go was dropped: Unistyles 3.3 ships a native module and requires a dev build (see `07-library-research.md`). Expo Go also doesn't support this config, so `npx expo run:android` or `eas build --profile development` is the loop.
- EAS CLI (`npm install -g eas-cli`) for cloud builds later (both Android APK/AAB and, eventually, iOS)

**Backend:**
- If using Supabase or Firebase (recommended for MVP — see `02-technical-architecture.md`): mostly configuration, not infrastructure you host yourself. Create a project in the dashboard, grab API keys, store them in environment variables — never commit them.
- If moving to custom Node + Postgres later: standard local Postgres instance + `.env` for connection strings.

**Environment variables:** keep a `.env.example` in the repo with placeholder keys (no real secrets) so it's clear what needs to be set up locally. Actual `.env` stays gitignored.

## 2. Suggested folder structure

```
chale/                         # local folder is still named twogether — cosmetic only
├── src/
│   ├── app/                   # Expo Router screens — the whole route tree
│   │   ├── index.tsx          # → /splash redirect
│   │   ├── splash.tsx / welcome.tsx
│   │   ├── (tabs)/            # home / favourites / remote / profile (FloatingTabBar)
│   │   ├── auth.tsx start.tsx decks.tsx settings.tsx session.tsx
│   │   ├── deck/[id].tsx prompt/[id].tsx
│   │   └── _layout.tsx
│   ├── components/            # shared UI components
│   ├── hooks/                 # React Query hooks (use-auth, use-prompts, …)
│   ├── lib/                   # supabase client, queries/mutations, session store,
│   │                          # database.types.ts (generated — mirrors the schema)
│   ├── constants/
│   │   └── theme.ts           # relationship accent hexes
│   ├── decks/                 # deck catalogue data
│   ├── dev/                   # dev-only showcases (design.tsx, showcase.tsx) — not routes
│   ├── types/
│   └── unistyles.ts           # light/dark themes, spacing, radii, breakpoints
├── docs/                      # this doc set lives here in the repo
├── supabase/migrations/       # SQL migrations 0001+
├── .env.example
└── app.json / eas.json        # Expo config, EAS build profiles
```

Keep `src/lib/database.types.ts` and `src/types/` in sync with the schema (`supabase/migrations/`) and `02-technical-architecture.md` — when one changes, update the others in the same commit.

## 3. Git workflow

**Branching:**
- `main` — always deployable/stable.
- Feature branches off `main`, named descriptively: `feature/voice-recording`, `fix/reveal-race-condition`.
- No long-lived `develop` branch needed at this project size — trunk-based with short-lived feature branches is enough for a solo/small-team MVP.

**Commits:** Conventional Commits style keeps history scannable as the project grows:
- `feat: add voice clip expiry job`
- `fix: reveal state not updating on second answer`
- `docs: update user flow for save prompt timing`

**Pull requests (even solo):** even working alone, opening a PR against `main` for each feature branch is worth the small overhead — it gives you a changelog, a place to leave yourself review notes, and a clean point to squash-merge.

## 4. Testing strategy

Given this is an MVP with two genuinely fragile pieces of logic (reveal state, voice expiry), testing effort should concentrate there rather than spreading thin:

- **Unit tests** on reveal-state logic and expiry-window calculations — these are pure logic, cheap to test, and the most damaging to get wrong (a bug here breaks the core mechanic silently).
- **Manual test pass** on the full flows in `04-user-flows.md` before each build you send to beta testers — walk through onboarding → pairing → question → reveal → voice → save, on a real device.
- **Backend/integration tests** on the "both answers submitted → reveal_state flips" transition specifically, since this is the one place a race condition (both partners submitting near-simultaneously) could cause a bug.
- Full end-to-end (E2E) automation (Detox, Maestro) is likely overkill before the core loop is validated — revisit once the app has more than one active developer or a growing feature surface.

## 5. Build & release process

- **Local development:** EAS dev build (or `npx expo run:android`) on your Android device or an emulator — an Expo Go workflow was dropped because Unistyles 3 needs a dev build.
- **Beta builds:** EAS Build for a signed Android APK/AAB, distributed directly or via Google Play's internal testing track.
- **iOS (once ready):** EAS Build cloud-compiles the iOS binary — no Mac required for the build step itself. Distribute via TestFlight to a few iPhone-owning testers (see `03-roadmap.md`, Phase 4 — iOS is not built yet).
- **CI:** no CI exists today (an early GitHub Actions plan was never wired up). A lightweight workflow that runs `npx tsc --noEmit` on every PR is still the recommended first step — cheap, catches the type regressions that otherwise only surface on device. EAS Build itself can also be triggered from CI once builds are routine.

## 6. Code review checklist (for yourself or collaborators)

Quick sanity list before merging a feature branch, tied to what tends to break in this specific app:
- [ ] Reveal state changes are computed server-side, not inferred on the client.
- [ ] Voice save action is scoped to the speaker's own clip only.
- [ ] New question/answer types update `src/lib/database.types.ts` and `src/types/`.
- [ ] Any new screen matches the corresponding flow in `04-user-flows.md` (or that doc is updated alongside the code).