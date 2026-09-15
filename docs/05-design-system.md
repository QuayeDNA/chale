# Design System
## Chale

## Status

**Locked — Playful Street Energy (2026-09-15).** Foundational palette, type pairing, and token shape are settled. The contextual theming architecture in §2 was already settled and is unchanged — accent shifts per `connections.relationship_type` are applied on top of this foundation.

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

Derived tokens: `shadow` is a warm shadow (`rgba(43,26,15,0.12)` light / `rgba(0,0,0,0.45)` dark), `overlay` for modals. Radii are varied by hierarchy (hero 24, card 20, chip 999), not uniform.

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

The active theme is looked up by the current connection's `relationship_type` and applied to accent-only surfaces (buttons, tags, highlights) — never to the foundational elements in section 1.

## 3. Scope for MVP

Since MVP ships with only the "partner" relationship type (see `01-prd.md` §5–6), only one theme variant needs to actually be built and polished for launch. The token structure above should still exist from day one so that adding `family` and `friend` themes later (Phase 5 in `03-roadmap.md`) is a matter of adding entries to the `themes` object — not a redesign or a new component architecture.

## 4. Future refinement (not MVP)

Individual question packs *within* a relationship type could eventually carry their own micro-accent (e.g. a "Deep Talk" pack feeling slightly more subdued than a "Fun & Games" pack, even within the Partner theme) — flagged as a possible v2+ nuance, not something to design now.

## 5. Decision log

- **2026-09-15 — Playful Street Energy locked.** Foundation (§1a–1c) settled: paper `#FBF3DF` / `#231408`, ink `#2B1A0F`, street `#F5B400`, type Archivo Black + Spline Sans. Prior candidates (Warm Terracotta, Quiet Dusk) archived.