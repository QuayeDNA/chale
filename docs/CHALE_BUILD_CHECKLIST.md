# Chale — Penpot Build Checklist

A working checklist for manually building the Chale UI in Penpot, following
`CHALE_PENPOT_UI_DESIGN_WORKFLOW.md`. Ordered by build sequence, not by
user-journey order — foundations and the question screen come before Home,
per the workflow doc's "design from the core interaction outward" rule.

Tick items off as you go. Each phase links back to the workflow doc section
in parentheses, so you can jump back for the full rationale.

---

## Phase 0 — File Setup (doc §5–6)

- [x] Create Penpot project: **Chale — Product UI**
- [x] Create pages: `00 — COVER`, `01 — USER FLOW`, `02 — DESIGN PRINCIPLES`,
      `03 — FOUNDATIONS`, `04 — ICONS`, `05 — COMPONENTS`,
      `06 — DECK SYSTEM`, `07 — SCREENS`, `08 — PROTOTYPE`
- [x] `00 — COVER`: add product direction text (name, tagline, primary vs
      secondary experience)
- [x] `01 — USER FLOW`: paste in the flow diagram (primary, remote,
      supporting) — unpolished, just boxes and arrows
- [x] `02 — DESIGN PRINCIPLES`: write out the 5 principles as reference text
      (Feels Like a Game / Questions Are the Hero / Playful Not Childish /
      Human Before Polished / Remote Is an Extension)
      — redesigned as a proper screen: header + 5 brand cards in a clean
      grid (surface cards, accent bars, Archivo/Spline/Caveat)
- [x] `REFERENCE` mood-board page: reference collage image uploaded
      (docs/Image (2).png) for visual cross-check

---

## Phase 1 — Foundations (doc §8–12)

`03 — FOUNDATIONS` page:

- [x] Color tokens: `paper` `#FBF3DF`, `surface` `#2E1E10`, `ink` `#2A1A0F`,
      `border` `#3D2A18`, `muted` `#C4A991`, `street` `#F5B400`
- [x] Relationship accents: Partner `#D85A30`, Family `#639922`,
      Friend `#D4537E`
- [x] Semantic color roles (background, surface, text-primary,
      text-secondary, border, action-primary, action-secondary,
      relationship-partner/family/friend)
- [x] Typography specimen: Archivo Black (display) + Spline Sans (UI/body)
      + Caveat (handwritten accent, 600), with display/heading/body/label/
      button examples + handwritten alphabet specimen
- [x] Typography tokens: `typography` set (families display/body/
      handwritten, sizes display/title/body/label/caption, weights
      bold/semibold/regular) in Light + Dark themes
- [x] Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80
- [x] Radius tokens: `radius/small`, `radius/medium`, `radius/card`,
      `radius/full`
- [x] Shadow tokens (kept minimal — this brand avoids "excessive shadows")
- [x] Motion direction notes (subtle card transitions, tactile feedback,
      deliberate reveal — no constant bouncing)
- [x] Color design tokens created in Penpot library (sets: `core` 10 tokens,
      `light`/`dark` 5 tokens each, `semantic` 8 alias tokens; themes: Light
      active, Dark ready)
- [x] Spacing / radius / shadow tokens created in Penpot library (sets:
      `spacing` 11 steps 4–80px, `radius` small/medium/card/full,
      `shadow` none/card; all three wired into Light + Dark themes)

`04 — ICONS` page:

- [x] Import Lucide icon set, keep only the ~18 icons the product actually
      needs (arrows, heart, x, check, plus, share, copy, settings, user,
      volume, mic, send, lock, clock, more, play, pause)

---

## Phase 2 — Core Components (doc §13)

`05 — COMPONENTS` page:

- [x] Buttons: Primary, Secondary, Tertiary, Icon, Destructive — each with
      Default / Pressed / Disabled / Loading states
- [x] Navigation: TopBar, BackButton, CloseButton, BottomNavigation
- [x] Cards: DeckCard, QuestionCard, FavouriteCard, RemoteQuestionCard
- [x] Inputs: TextInput, InviteCodeInput, MultilineAnswerInput
- [x] Dialogs: StartSessionDialog, ConfirmDialog, ShareDialog (StartSession
      is the important one — it branches the whole experience)
- [ ] Refine + componentize Phase 2 layouts (owner: manual follow-up —
      layouts are groundwork only: correct text alignment, convert rects to
      real components/tokens, build states as variants)

---

## Phase 3 — Deck System (doc §14)

`06 — DECK SYSTEM` page:

- [ ] Concept A — Traditional card
- [ ] Concept B — Editorial card (number + label + question)
- [ ] Concept C — Bold game card (number / total shown as progress)
- [ ] Concept D — Minimal (question dominates, no decoration)
- [ ] Concept E — Playful (controlled doodles/shapes)
- [ ] Pick one direction and confirm it still reads as "Chale" — not a
      generic questionnaire

---

## Phase 4 — The Question Screen First (doc §15–17)

`07 — SCREENS` page. **Do not start with Home.**

> Progress: 14 phone frames laid out (Splash, Welcome, Home, SelectDeck,
> StartSession, QuestionSession, Favourites, Login, CreateInvite,
> JoinSession, RemoteAnswer, Waiting, Profile, Settings) — frames only,
> screen designs pending below.

- [ ] Design `SESSION — QUESTION` screen: progress (e.g. "07/30"), deck
      label, question text, favourite toggle, previous/next controls
- [ ] Confirm hierarchy: Question → Deck/context → Favourite → Navigation
- [ ] Check the "Don't" list: no answer fields, no chat UI, no extra
      metadata, no social-feed elements, no decoration overload
- [ ] Confirm minimum controls only: Favourite / Previous / Next
- [ ] **Long-question test** (doc §34) — verify the layout holds up for:
  - [ ] Short: "What's your favourite memory?"
  - [ ] Medium: two-line question
  - [ ] Long: four-line question
- [ ] Design component states (doc §35): Button (Default/Pressed/
      Disabled/Loading), Favourite (Unselected/Selected)

---

## Phase 5 — Home as Game Lobby (doc §18–20)

- [ ] Home screen: greeting + "what are you playing today" framing + deck
      cards + Favourites link — explicitly not a dashboard, no analytics
- [ ] Deck Details screen: answers what/how many/what kind/how to start,
      ends in a Start Session CTA
- [ ] Start-Session dialog/sheet: "Are you sitting together?" with
      **YES, LET'S GO** and **NOT CLOSE RIGHT NOW** branches

---

## Phase 6 — Remote Mode (doc §21–22)

Only after the in-person experience feels strong.

- [ ] Create Session
- [ ] Invite (code + share)
- [ ] Join Session
- [ ] Remote Question (same card identity + interaction layer added)
- [ ] Text Answer
- [ ] Voice Answer / Voice Playback
- [ ] Waiting state
- [ ] Reveal / Receive Answer
- [ ] Remote states (doc §35): Waiting / Answering / Submitted / Revealed

---

## Phase 7 — Supporting UX (doc §23–24)

Design these last — they inherit the existing system, no separate visual
language.

- [ ] Authentication (Login / Signup / Forgot Password) — only gates remote,
      never the core loop
- [ ] Profile
- [ ] Settings
- [ ] Empty states
- [ ] Error states
- [ ] Loading states

---

## Phase 8 — Componentize & Reuse (doc §26–28)

- [ ] Convert finished elements into real Penpot components
      (`Button/Primary`, `Card/Deck`, `Card/Question`,
      `Navigation/TopBar`, `Dialog/StartSession`, `Input/Text`,
      `Input/InviteCode`)
- [ ] Build component states as variants, not copies
- [ ] Apply relationship colors only as accents (labels, borders, selected
      states) — never flooding a full screen
- [ ] Check doodle ratio stays roughly 80% typography/cards/shapes,
      15% doodles, 5% illustration

---

## Phase 9 — Sanity Checks Before Calling It Done

- [ ] **Avoid generic AI-template look** (doc §29): no gradient blobs, no
      glassmorphism, no stock 3D illustrations, no pill overload
- [ ] **Shared-device check** (doc §31): text readable at a glance, touch
      targets comfortable, works from either side of the device
- [ ] **Responsive classification** (doc §33): fixed (icon size, button
      height, touch targets) vs flexible (card width, text block) vs
      adaptive (deck arrangement, padding) — not just "scale everything"
- [ ] **Accessibility checklist** (doc §37):
  - [ ] Text is readable
  - [ ] Contrast is sufficient
  - [ ] Buttons are easy to tap
  - [ ] Icons have clear meaning
  - [ ] Important actions are not ambiguous
  - [ ] Long questions remain readable
  - [ ] Disabled states are distinguishable
  - [ ] Color is not the only information cue
- [ ] **Prototype the primary flow** (doc §38): Home → Deck → Start Session
      → "Sitting together?" → Yes → Question 01 → 02 → 03 — nothing more
- [ ] **The Couch Test** (doc §39): two people, one device — can they get
      through a full question exchange with no explanation needed?
- [ ] **The First Conversation Test** (doc §40): time the path from Open to
      first real conversation — Open → Choose → Start → Talk

---

## Definition of Done — First UI Milestone (doc §43)

- [ ] Penpot file organized
- [ ] Design principles documented
- [ ] Color tokens created
- [ ] Typography system created
- [ ] Spacing system created
- [ ] Icon direction chosen
- [ ] Button components created
- [ ] Basic card component created
- [ ] 4–6 deck concepts explored
- [ ] Question card finalized
- [ ] In-person session screen designed
- [ ] Question → Next prototype working
- [ ] Long-question test completed
- [ ] Shared-device/couch test completed

---

*Whenever a decision feels stuck, return to the golden rule (doc §44):
does this help two people start talking, understand the question, feel
playful, reduce friction, and feel like Chale? If not, it doesn't belong.*
