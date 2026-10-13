# Design System
## Chale

## Status

**Locked — Playful Street Energy (2026-09-15).** Foundational palette, type pairing, and token shape are settled.

**Implemented status (2026-10-13):** the foundation ships in `src/unistyles.ts` (light/dark themes, spacing, radii incl. chip 12, `sm` breakpoint at 768) and `src/constants/theme.ts` (relationship accent hexes). Two things in this doc are **planned, not implemented**: the semantic interaction token layer (§1a-1) — components read foundation colors directly — and runtime relationship-theme switching by `connections.relationship_type` (§2) — the app pairs partner-only and components import `RelationshipThemes` from `src/constants/theme.ts` ad hoc (e.g. `src/app/(tabs)/profile.tsx`, `src/app/settings.tsx`).

**Product-behavior direction locked (2026-09-16, per `REVIEW.md`).** The system is a **behavioral system built around `question → answer → wait → reveal`**, not a component-library showcase. Interactions, lifecycle states (voice, reveal, pairing), and accessibility are first-class residents of this doc, not future toppings. P0 build order is defined in §9. Light theme is the documented default; dark is first-class.

---

## 1. Foundational elements (fixed across every context)

These never change, regardless of relationship type or question pack — they're what makes the app recognizably "Chale" no matter what theme is active:

- **Wordmark:** "chale," lowercase, set in the display face.
- **Layout & spacing:** card shapes, corner radius, spacing rhythm.
- **Iconography style:** consistent icon set/weight across all themes (lucide, 2px stroke, rounded caps).
- **Interaction patterns:** the question card layout, the text/voice answer toggle, the reveal screen structure — same bones everywhere.

### 1a. Color — Playful Street Energy

Grounded in Accra street culture (trotro yellow, hand-painted sign warmth). The foundation stays warm and quiet so the relationship accent layer can tell the story. Street yellow is a signal, not a wash.

**Light theme (default)**

| Token | Hex | Role |
|---|---|---|
| `paper` | `#FBF3DF` | Page background — warm chamois-yellow |
| `ink` | `#2B1A0F` | Primary text on paper |
| `surface` | `#FFF9E8` | Card / elevated surface on paper |
| `border` | `#EDE0BE` | Hairline / card border |
| `muted` | `#8A7562` | Secondary text, captions |
| `street` | `#F5B400` | Signature pop — CTA, active, emphasis only |

**Dark theme**

| Token | Hex | Role |
|---|---|---|
| `paper` | `#231408` | Page background — deep warm espresso-charcoal |
| `ink` | `#FBF3DF` | Primary text on dark (paper inverted) |
| `surface` | `#2E1E10` | Card / elevated surface on dark |
| `border` | `#3D2A18` | Hairline / card border on dark |
| `muted` | `#C4A991` | Secondary text on dark |
| `street` | `#F5B400` | Same pop — passes on both themes |

Derived tokens: `shadow` is a warm shadow (`rgba(43,26,15,0.12)` light / `rgba(0,0,0,0.45)` dark), `overlay` for modals. Radii are varied by hierarchy (hero 24, card 20, chip 12, pill 999), not uniform.

Street yellow `#F5B400` is a **signal, not a wash** — it is the app's single high-signal color. Use it for: primary action, focus ring, active answer mode indicator, small product signals. Do **not** use it for: every icon, every border, every card, large page backgrounds, decorative gradients.

### 1a-1. Semantic interaction tokens

Components never reach for arbitrary hex values; they read semantic roles from the theme. **Status: planned — not yet implemented**; components currently read foundation colors directly. When built, these live beside the foundation colors in `src/unistyles.ts`:

```ts
text.primary          // primary content (ink)
text.secondary        // secondary content (muted)
text.inverse          // content on a filled color (paper)
surface.page          // canvas (paper)
surface.raised        // normal card (surface)
surface.inset         // recessed input, sub-surface
border.subtle         // hairline (border)
border.strong         // emphasis divider, focus-able boundaries
action.primary        // filled action (street)
action.primaryPressed // pressed/dimmed action (derived)
focus.ring            // visible keyboard/web focus ring
status.success        // confirmations (green)
status.warning        // caution, expiring soon (amber)
status.danger         // errors, destructive (red)
scrim                 // modal overlay (overlay)
```

Relationship accents (§2) stay a separate contextual layer; status colors are distinct from relationship colors. Contrast must be verified for every foreground/background pairing (normal text, large text, meaningful icons, focus rings, disabled states, light and dark).

### 1b. Type pairing

Two voices, clearly distinct:

- **Display — Archivo Black (900):** heavy geometric, street-poster energy. Wordmark `chale,`, hero question text, section titles. Lowercase-friendly.
- **Body — Spline Sans (300–700, variable):** friendly humanist-geometric. All body, captions, labels, inputs. Loaded via `@expo-google-fonts/spline-sans` + `@expo-google-fonts/archivo-black`, held behind `SplashScreen.preventAutoHideAsync`.

Type scale (mobile): display 32/700, title 22/700 (display face for titles), body 16/400, bodyStrong 16/600, label 13/600, caption 12/400. Line length ≤ 80ch, left-aligned, generous vertical rhythm. Sentence case throughout; Pidgin microcopy in body voice.

### 1c. Tokens (shape)

```ts
// constants/theme.ts — foundational tokens (new)
// light/dark objects each carry { paper, ink, surface, border, muted, street, shadow }
```

## 2. Contextual theming layer

The app's accent color and background tone shift based on the **relationship type** of the active connection (see `connections.relationship_type` in `02-technical-architecture.md`). Same screen, same layout, different emotional register:

| Relationship type | Accent direction | Feel |
|---|---|---|
| Partner | Warm coral/terracotta | Intimate, close |
| Family | Soft green | Nurturing, safe |
| Friend | Playful pink | Fun, energetic |

These hex values are now finalized against the Playful Street Energy foundation — chosen as variations *of* that foundation rather than independently.

**Implementation shape:**

```ts
// constants/theme.ts
type RelationshipType = 'partner' | 'family' | 'friend';

const themes: Record<RelationshipType, { accent: string; accentSoft: string; accentText: string }> = {
  partner: { accent: '#D85A30', accentSoft: '#F5C4B3', accentText: '#4A1B0C' },
  family:  { accent: '#639922', accentSoft: '#C0DD97', accentText: '#173404' },
  friend:  { accent: '#D4537E', accentSoft: '#F4C0D1', accentText: '#4B1528' },
};
```

The active theme is looked up by the current connection's `relationship_type` and applied to accent-only surfaces (buttons, tags, highlights) — never to the foundational elements in section 1. **Status: planned.** The accent values exist (`src/constants/theme.ts`) and are used ad hoc in a few screens; runtime switching driven by the active connection is not implemented, and pairing is partner-only today.

## 3. Scope for MVP

Since MVP ships with only the "partner" relationship type (see `01-prd.md` §5–6), only one theme variant needs to actually be built and polished for launch. The token structure above should still exist from day one so that adding `family` and `friend` themes later (Phase 5 in `03-roadmap.md`) is a matter of adding entries to the `themes` object — not a redesign or a new component architecture.

## 4. Future refinement (not MVP)

Individual question packs *within* a relationship type could eventually carry their own micro-accent (e.g. a "Deep Talk" pack feeling slightly more subdued than a "Fun & Games" pack, even within the Partner theme) — flagged as a possible v2+ nuance, not something to design now.

## 5. Decision log

- **2026-09-15 — Playful Street Energy locked.** Foundation (§1a–1c) settled: paper `#FBF3DF` / `#231408`, ink `#2B1A0F`, street `#F5B400`, type Archivo Black + Spline Sans. Prior candidates (Warm Terracotta, Quiet Dusk) archived.
- **2026-10-13 — Implementation status recorded.** Foundation confirmed shipped in `src/unistyles.ts` + `src/constants/theme.ts` (chip radius 12 added to match code). Semantic interaction tokens (§1a-1) and runtime relationship theming (§2) marked planned — both are declared here but do not exist in code yet.
- **2026-10-13 — Opening screen polish.** `splash → welcome` rebuilt: supplied with-subtitle `BrandLockup` (tagline lives inside the artwork — single source of truth, never hand-set), splash as a ~1s brand beat with staggered entrances (lockup 320ms → bar 400ms, plus `LegalFoot` at 500ms) and a fade-out before the swap to welcome; welcome pairs an lg full-width primary with an md full-width outline ("Browse decks as guest"). All entrances collapse to their settled state under reduced motion. No new assets, fonts, or dependencies. An intermediate "brand tape" device — a tilted street-yellow strip hand-setting the tagline — was built, then **retired the same day** as brand drift: it duplicated the tagline already baked into the supplied artwork. Street yellow enters the brand moment only via the splash loading bar and the welcome primary CTA. Opening screens also carry `LegalFoot` (`src/components/ui/legal-foot.tsx`) — a "Made by Ananse" studio credit plus legal links that appear only once their URLs exist in `src/constants/legal.ts` (currently null, so no link renders). The `web/` pages mirror these tokens in `web/assets/chale.css`, including the rule that a theme shows the lockup artwork whose ink contrasts with it (ink lockup on light paper, cream on dark).