# Design System
## Chale

## Status

The **foundational visual identity** (base palette, type pairing) is still being decided — three contrasting directions were explored (Warm Terracotta, Playful Street Energy, Quiet Dusk) and are being refined/blended. This section of the doc will be locked once that's settled.

The **contextual theming architecture** below is settled independently of that choice — it's a structural decision, not a mood decision, and applies no matter which foundational palette wins.

---

## 1. Foundational elements (fixed across every context)

These never change, regardless of relationship type or question pack — they're what makes the app recognizably "Chale" no matter what theme is active:

- **Wordmark:** "chale," lowercase.
- **Layout & spacing:** card shapes, corner radius, spacing rhythm.
- **Iconography style:** consistent icon set/weight across all themes.
- **Interaction patterns:** the question card layout, the text/voice answer toggle, the reveal screen structure — same bones everywhere.
- **Type pairing:** *(pending — depends on final foundational direction)*

## 2. Contextual theming layer

The app's accent color and background tone shift based on the **relationship type** of the active connection (see `connections.relationship_type` in `02-technical-architecture.md`). Same screen, same layout, different emotional register:

| Relationship type | Accent direction | Feel |
|---|---|---|
| Partner | Warm coral/terracotta | Intimate, close |
| Family | Soft green | Nurturing, safe |
| Friend | Playful pink | Fun, energetic |

These are directional placeholders — exact hex values get finalized once the foundational palette is locked, so the contextual accents are chosen as variations *of* that foundation rather than independently.

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

## 5. Open decision

Foundational palette/type still pending — see the three live previews already shared (Warm Terracotta / Playful Street Energy / Quiet Dusk) and the contextual-theming demo built on a neutral placeholder base. Once a foundational direction (or blend) is chosen, this doc gets a full section 1 with locked hex values and type specimens.