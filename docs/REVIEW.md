# Chale Design Review

**Review date:** 2026-09-16  
**Reviewed:** `01-prd.md`, `03-roadmap.md`, `04-user-flows.md`, `05-design-system.md`, current `design(1).tsx`, and the supplied design showcase screenshots.

---

## 1. Executive summary

The current system has a strong starting idea: **quiet warm foundations + one contextual relationship accent + a deliberately human voice**. The product itself also has a genuinely differentiated interaction: two people answer independently and the app creates a shared reveal moment.

The main problem is not that the visual direction is bad. It is that the current showcase documents a **visual token collection more than a product design system**.

The implementation currently proves:
- type tokens,
- color tokens,
- a few card shapes,
- buttons,
- one input,
- relationship accents.

It does not yet prove the parts of the product that make Chale distinctive:
- anonymous-first onboarding,
- pairing,
- pending/waiting states,
- daily question,
- text/voice choice,
- recording,
- locked answers,
- reveal,
- ephemeral voice lifecycle,
- save-after-listen,
- notification states,
- empty/error/loading states.

That gap matters because the PRD says the product's core bet is the **async reveal + voice mechanic**, and the roadmap explicitly says Phase 1 should validate that loop before investing in later features.

### Core recommendation

Keep the underlying visual direction, but change the design system from:

> **"palette + typography + generic cards"**

to:

> **"a small behavioral system built around question → answer → wait → reveal."**

The interface should feel like a warm, slightly imperfect digital object made for two people, not a generic component-library showcase.

---

# 2. Source-of-truth product principles

These should become the design system's highest-level constraints.

## 2.1 The product is a ritual, not a content library

The PRD describes a daily question and independent answers that become a shared reveal. The UI should therefore optimize for:
1. noticing today's question,
2. answering with very little friction,
3. understanding what is waiting,
4. feeling anticipation,
5. experiencing the reveal.

Do not let secondary navigation, statistics, gamification, decorative cards, or settings compete with this loop.

## 2.2 The emotional payoff is the reveal

The user-flow document explicitly calls reveal the emotional payoff and says it should feel deliberate without adding friction.

This means the reveal deserves the strongest interaction design in the MVP:
- clear transition,
- strong hierarchy,
- obvious answer ownership,
- restrained motion,
- readable comparison,
- immediate playback for voice,
- no unnecessary modal ceremony.

The current showcase does not demonstrate this at all.

## 2.3 Voice is a product behavior, not just an icon

Voice has a lifecycle:

`choose voice → record → preview/re-record → send → wait → both listen → save prompt → expire/delete`

A microphone icon inside an icon row is not enough. The design system needs explicit states for this lifecycle.

## 2.4 Contextual color should explain relationship, not decorate the app

The design-system document intentionally keeps the foundation stable and applies relationship accents on top.

Keep that architecture.

However, accents should be assigned to **semantic roles**, not merely component variants.

For example:
- partner accent → relationship identity / intimate actions,
- family accent → relationship identity / safe contextual highlights,
- friend accent → relationship identity / playful contextual highlights,
- street yellow → product action / active state / focus / primary signal.

Do not create a rainbow interface where every surface becomes relationship-colored.

## 2.5 Chale's Ghanaian voice should be selective

The PRD explicitly says the Ghanaian-English tone should reinforce the brand without becoming a rebrand of every screen.

That is the right constraint.

Use phrases such as `"Say am"` or `"Kai this one?"` where they create personality. Keep core instructions extremely clear.

Avoid:
- forcing slang into system errors,
- making accessibility labels slang-heavy,
- turning every button into a joke,
- using Pidgin as a substitute for clarity.

---

# 3. Current visual direction: what works

## 3.1 Warm foundation

The espresso dark theme and warm paper/ink relationship are coherent with the stated "Playful Street Energy" direction.

The foundation tokens are intentionally quiet:
- paper
- surface
- ink
- border
- muted
- street

This is a good semantic vocabulary.

## 3.2 Strong typographic contrast

Archivo Black + Spline Sans gives the product a recognizable voice.

The display face works particularly well for:
- `chale,`
- the daily question,
- short section headings,
- emotionally important moments.

The body face is better suited to:
- explanations,
- helper text,
- answer content,
- controls.

## 3.3 Contextual relationship layer

The relationship accent architecture is one of the strongest ideas in the existing system.

It avoids rebuilding the entire app for every relationship type and gives the connection a recognizable emotional identity.

Keep this.

## 3.4 Rounded geometry

The current hierarchy of radii is useful:
- hero: large,
- regular cards: medium,
- chips: pill.

The mistake would be making every element equally rounded.

---

# 4. Current visual direction: problems

## 4.1 The showcase looks like a token inventory

The screenshots read like a design-system audit page rather than the visual language of a real app.

Examples:
- `"Foundational palette"`
- `"Relationship accents (contextual layer)"`
- `"Buttons"`
- `"Cards — speech-bubble bones"`

These are useful documentation labels, but the page mostly demonstrates isolated components rather than how the system behaves in the product.

### Recommendation

Organize the showcase around **real product moments first**, then expose primitives underneath.

Suggested order:

1. Brand / design principles
2. Daily question
3. Answer states
4. Waiting state
5. Reveal
6. Voice lifecycle
7. Relationship context
8. Onboarding / pairing
9. Inputs and controls
10. Tokens / typography
11. Accessibility and responsive rules

---

## 4.2 The current hero is too generic

The showcase says:

> "Design showcase — Playful Street Energy."

That describes the design direction but does not demonstrate it.

The strongest proof would be an actual daily question:

> **What's something small that made you smile today?**

followed by:
- answer controls,
- contextual relationship label,
- question metadata,
- a clear primary action.

The design system should make the product feel obvious before it explains itself.

---

## 4.3 Excessive card usage

The current page places almost every section inside a card.

That creates a common "AI design system" smell:
- everything floats,
- everything has a radius,
- everything has a border,
- everything is equally important.

Chale needs more **surface hierarchy**.

Use:
- page background for the canvas,
- one dominant question surface,
- occasional secondary surface,
- dividers for low-priority grouping,
- inline controls where a card is unnecessary.

A component should earn its container.

---

## 4.4 The settings gear is visually disconnected

The screenshots show a large floating settings button near the top-right.

Nothing in the provided PRD or user flows establishes settings as a primary product action.

It visually competes with the content and feels like a generic dashboard affordance.

### Recommendation

If settings exists, move it into a conventional top navigation action with:
- a 44×44 minimum hit target,
- a subtle icon button,
- no oversized circular decorative backing.

Do not make it look like a floating status badge.

---

## 4.5 Too much microcopy in the showcase

The showcase repeatedly explains the design system inside the interface:

> "Street is the app signal — accent is contextual"

> "Foundation stays quiet; accent tells the relationship story."

These statements are useful in documentation, but product UI should not need to explain its own design philosophy.

### Recommendation

Keep explanatory notes in the design showcase documentation, but make component examples look like actual product UI.

---

## 4.6 The dark theme is doing too much work

The supplied screenshots are overwhelmingly dark.

The design-system document defines light as the default theme, while the screenshots make dark the dominant showcase environment.

That creates a documentation mismatch.

### Recommendation

Show both themes, but establish the system with:
- light as the documented default,
- dark as a first-class supported theme,
- the same semantic hierarchy in both.

Do not make the dark theme the only way to make the system feel premium.

---

# 5. Color-system critique

## 5.1 Keep the semantic tokens

Keep:

`paper`, `surface`, `ink`, `border`, `muted`, `street`

These are clear and compact.

## 5.2 Add semantic interaction tokens

The current palette is missing explicit state semantics.

Add tokens conceptually equivalent to:

```ts
text.primary
text.secondary
text.inverse
surface.page
surface.raised
surface.inset
border.subtle
border.strong
action.primary
action.primaryPressed
focus.ring
status.success
status.warning
status.danger
scrim
```

Relationship colors should remain a separate contextual layer.

This prevents components from directly reaching for arbitrary hex values.

## 5.3 Street yellow needs strict usage rules

`#F5B400` is memorable, but it should not become the default decoration.

Use it for:
- primary action,
- focus,
- active answer mode,
- important state,
- small product signals.

Do not use it for:
- every icon,
- every border,
- every card,
- large page backgrounds,
- decorative gradients.

The existing "signal, not wash" rule is correct and should become an implementation constraint.

## 5.4 Relationship colors need contrast verification

The current soft relationship backgrounds are visually pleasant, but accessibility should be checked for every foreground/background pairing.

Do not assume a visually strong border is an adequate focus indicator.

At implementation time, test:
- normal text,
- large text,
- icons carrying meaning,
- focus rings,
- disabled states,
- light/dark combinations.

---

# 6. Typography critique

## 6.1 The type pairing is appropriate

Keep Archivo Black for high-emotion display moments and Spline Sans for reading/UI.

## 6.2 Do not use the display face for everything important

The current showcase uses the display face heavily.

In the actual app, reserve it for:
- brand,
- question hero,
- major reveal statement,
- occasional short headings.

Long titles and instructions should use the body/UI family.

## 6.3 Add explicit text roles

The current roles are close, but the implementation should be semantic rather than purely visual.

Recommended roles:

- `display`
- `screenTitle`
- `sectionTitle`
- `question`
- `body`
- `bodyStrong`
- `label`
- `caption`
- `button`
- `input`
- `numeric`
- `error`

Do not create dozens of typography variants.

---

# 7. Shape, spacing and depth

## 7.1 Reduce the number of visual tricks

The current system mentions:
- varied radii,
- warm shadows,
- speech-bubble bones.

The direction is good, but the combination can become decorative quickly.

Use depth sparingly.

Recommended hierarchy:

### Level 0
Page background.

### Level 1
Raised surface with subtle border.

### Level 2
Hero/question surface with slightly stronger separation.

### Level 3
Temporary overlays/sheets only when necessary.

Avoid stacking:
`shadow + border + large radius + tinted background + decorative icon`.

That is a common source of generic UI polish.

## 7.2 Use a predictable spacing rhythm

The current implementation relies on theme spacing but the showcase does not communicate the rhythm.

Use a compact spacing scale and document the intended meaning:
- 4: icon/text relationships,
- 8: compact control gaps,
- 12–16: component internal spacing,
- 20–24: component padding,
- 32+: section separation.

The exact numerical system can follow the existing theme implementation, but the principle should be consistent.

---

# 8. Component-system critique

The current imports show:

`Badge`, `Button`, `Card`, `Icon`, `Text`, `TextInput`.

That is a reasonable primitive layer.

The missing layer is **product components**.

## 8.1 Primitive components

Keep small primitives:
- Text
- Icon
- Button
- IconButton
- Badge
- TextInput
- Divider
- Card/Surface

## 8.2 Product components to add

### QuestionCard

Owns:
- relationship/context label,
- question text,
- answer mode,
- answer action,
- optional question metadata.

### AnswerModeToggle

Owns:
- text,
- voice,
- active state,
- accessibility state.

### AnswerComposer

Owns:
- text input or voice recorder,
- submit,
- validation,
- disabled/loading states.

### WaitingState

Owns:
- confirmation that the local answer is submitted,
- explanation that the other person has not submitted,
- notification expectation.

Important: it must **not** imply whether the other person has started answering.

### RevealCard

Owns:
- both answers,
- speaker identity,
- text/voice presentation,
- reveal transition.

### VoiceRecorder

Owns:
- idle,
- recording,
- recorded,
- preview,
- re-record,
- sending,
- sent.

### VoicePlayer

Owns:
- play/pause,
- progress,
- duration,
- listened state,
- expiry state.

### SaveVoicePrompt

Owns the post-listen decision:
- save,
- don't save,
- expiry messaging.

### ConnectionInvite

Owns:
- invite code,
- copy/share,
- pending state,
- accepted state.

### RelationshipBadge

Should be semantic and relationship-aware rather than a generic colored chip.

---

# 9. User-flow critique

The behavioral flows are strong, but the design system needs to represent them explicitly.

## 9.1 Onboarding

The current flow correctly delays account creation until the user initiates pairing.

This should remain.

### UI implication

The first launch should feel like the product immediately:
- show one or two sample questions,
- let the user explore,
- then use a strong `"Start with your person"` action.

Do not show a registration wall.

The account request should be contextual and explain why it is needed.

---

## 9.2 Pairing

The flow has two branches:
- enter an invite code,
- create/share an invite.

The waiting screen is especially important.

It must communicate:

> "You're connected on your side. We're waiting for them to join."

Avoid spinner-heavy UI. A pending connection is not an application loading state.

---

## 9.3 Daily question

This is the primary home state.

Recommended hierarchy:

```text
small context
TODAY'S QUESTION

[ large question ]

How do you want to answer?
[ Text ] [ Voice ]

[ primary answer action ]

small helper
```

The question itself should be the largest visual object.

---

## 9.4 Submitted / waiting

After submission, do not leave the user staring at a disabled button.

Show a meaningful state:

```text
You answered.

Your answer is tucked away
until they answer too.

We'll let you know when the reveal is ready.
```

This is anticipation, not a loading screen.

---

## 9.5 Reveal

The reveal should not feel like a normal list page.

Suggested structure:

```text
THE REVEAL

Today's question

[ Their answer ]
      +
[ Your answer ]

small reaction/action row
```

For voice:

```text
Their voice
[ ▶  ━━━━━ 0:18 ]

Your voice
[ ▶  ━━━━━ 0:22 ]
```

The UI should make ownership immediately clear.

---

## 9.6 Voice

The current flow has a subtle but important privacy/intimacy rule: the save decision appears only to the speaker after both people have listened.

That rule should be visible in the UI architecture.

Do not put a permanent `"Save"` button on the voice player.

Instead:

`both listened → speaker sees save prompt`

This prevents the archive behavior from dominating the recording experience.

---

# 10. Accessibility requirements

The current showcase has almost no explicit accessibility treatment.

Add accessibility requirements to the design system.

## 10.1 Touch targets

All interactive controls should have a practical minimum target around 44×44 points.

This is especially important for:
- icon buttons,
- play/pause,
- close/back,
- answer mode selection,
- recording controls.

## 10.2 Do not encode meaning by color alone

Examples:
- active voice mode should have text/icon/state,
- relationship type should have a readable label,
- errors should include text,
- recording state should say "Recording" rather than only changing the microphone color.

## 10.3 Focus

Keyboard/web focus needs a visible ring.

The current statement "focused border goes street yellow" is not enough if the focus indication becomes subtle on some surfaces.

Use a consistent focus treatment with sufficient contrast and spacing.

## 10.4 Dynamic type

Do not hard-code layouts around the screenshot dimensions.

Long questions must wrap.

Controls must tolerate larger text.

The showcase should demonstrate at least one long question.

## 10.5 Screen readers

Every icon-only control needs an accessibility label.

Decorative icons should be hidden from accessibility services.

---

# 11. Responsive implementation

The current showcase uses a fixed-feeling mobile composition.

The implementation should support:

### Narrow phone
- one-column layout,
- full-width question card,
- controls stacked when necessary.

### Larger phone / tablet
- same reading width,
- increased outer margins,
- no oversized cards.

### Web
- centered reading column,
- max content width,
- optional two-column component documentation sections,
- product UI itself remains focused rather than becoming a dashboard.

The key principle:

> Increase whitespace before increasing component size.

Do not stretch a mobile card into a giant desktop panel.

---

# 12. Motion direction

Motion should be functional and emotionally timed.

Use motion for:
- reveal,
- answer submission confirmation,
- recording state,
- voice playback progress,
- subtle press feedback.

Avoid:
- continuous floating,
- decorative particles,
- automatic bouncing,
- excessive spring animations,
- animated gradients.

The reveal is the one place where motion can carry emotional weight.

---

# 13. "AI slop" / generic-design risks to avoid

These are the patterns most likely to make Chale feel generated rather than authored:

### Avoid
- gradient backgrounds used as decoration,
- glassmorphism,
- excessive floating blobs,
- random sparkles,
- identical rounded cards everywhere,
- huge rounded buttons with no hierarchy,
- excessive pills,
- meaningless stats,
- dashboard layouts,
- icon grids,
- every section enclosed in a card,
- excessive emoji,
- decorative illustrations that do not serve the product,
- "premium" shadows everywhere,
- arbitrary color changes for visual variety.

### Prefer
- strong typography,
- restrained surfaces,
- real product states,
- asymmetric but intentional composition,
- meaningful whitespace,
- small moments of Ghanaian visual character,
- relationship color used semantically,
- tactile interaction states,
- a small number of memorable details.

The goal is **authored simplicity**, not minimalism for its own sake.

---

# 14. Ghanaian / Accra character

The design-system document references Accra street culture, trotro yellow, and hand-painted sign warmth.

That should remain an influence, not become a decorative theme pack.

A better implementation is subtle:
- warm yellow as the signal color,
- direct language,
- occasional Pidgin in emotional moments,
- typography with poster-like confidence,
- slightly imperfect human copy,
- restrained use of street-inspired visual rhythm.

Avoid literal:
- trotro illustrations everywhere,
- kente patterns,
- flags,
- map motifs,
- generic "African" decoration.

The product should feel Ghanaian because of its **voice and design decisions**, not because it contains obvious cultural clip-art.

---

# 15. Revised design-system architecture

Recommended hierarchy:

```text
FOUNDATION
├── color tokens
├── typography tokens
├── spacing
├── radii
├── borders
├── elevation
├── motion
└── accessibility

PRIMITIVES
├── Text
├── Icon
├── Button
├── IconButton
├── Badge
├── Input
├── Divider
└── Surface

PRODUCT COMPONENTS
├── QuestionCard
├── AnswerModeToggle
├── AnswerComposer
├── WaitingState
├── RevealCard
├── VoiceRecorder
├── VoicePlayer
├── SaveVoicePrompt
├── ConnectionInvite
└── RelationshipBadge

SCREEN PATTERNS
├── FirstLaunch
├── Pairing
├── PendingConnection
├── HomeQuestion
├── AnsweredWaiting
├── Reveal
└── VoiceExpiry

CONTEXT
└── relationship accent
    ├── partner
    ├── family
    └── friend
```

This keeps the system scalable without turning it into a giant component framework.

---

# 16. What the new showcase should prove

The replacement showcase should be a **living contract** for the implementation.

It should visibly demonstrate:

- brand,
- typography,
- semantic palette,
- relationship context,
- primary/secondary/destructive button behavior,
- input states,
- daily question,
- text answer,
- voice answer,
- waiting state,
- reveal state,
- voice playback,
- save prompt,
- badges,
- icon buttons,
- accessibility labels,
- responsive behavior,
- light/dark foundations.

It should not merely show color swatches and component names.

---

# 17. Recommended MVP screen hierarchy

## Home

Primary:
- today's question.

Secondary:
- answer status,
- relationship context,
- small connection/status affordance.

Avoid:
- streak counters,
- feeds,
- stats,
- content grids.

Those are not MVP priorities according to the roadmap.

## Answer

Primary:
- answer mode,
- composer.

Secondary:
- concise guidance.

Avoid:
- complex formatting,
- unnecessary toolbars.

## Waiting

Primary:
- "You've answered."

Secondary:
- "Waiting on them."

Avoid:
- progress percentages,
- fake activity indicators,
- "they're typing" style speculation.

## Reveal

Primary:
- both answers.

Secondary:
- playback/reaction.

This is the product's signature moment.

---

# 18. Product/design alignment with roadmap

The roadmap explicitly says nothing beyond Phase 1 should be built before Phase 1 data exists.

Therefore the design system should resist premature UI for:
- streaks,
- answer timelines,
- saved voice archives,
- photo answers,
- premium packs,
- groups.

The showcase may document future extension points, but the MVP screens should remain focused on the validated loop.

This is particularly important because a design system can accidentally make future features feel "already committed."

---

# 19. Open decisions that affect UX

The source documents leave several decisions open. These should be resolved before finalizing production interaction states:

1. **Unanswered question lifecycle**
   - Does it roll over?
   - Does it expire at midnight?

2. **Voice backstop expiry**
   - The flow suggests seven days, but the PRD says the exact window is unresolved.

3. **Pair lifecycle**
   - Is a connection permanent?
   - Can it be unlinked/re-linked?

4. **Notification copy and frequency**
   - Especially the distinction between partner-submitted and reveal-ready notifications.

These should not be hidden inside UI implementation assumptions.

---

# 20. Prioritized implementation plan

## P0 — Do before polishing

1. Build semantic color/state tokens.
2. Define accessible interactive states.
3. Build `QuestionCard`.
4. Build answer mode control.
5. Build waiting state.
6. Build reveal state.
7. Build voice recorder/player lifecycle.
8. Define relationship accent application rules.
9. Make the showcase responsive and dynamic-type tolerant.
10. Remove unnecessary card nesting.

## P1 — Complete the MVP system

1. Pairing/invite components.
2. Notification-state examples.
3. Error/empty/loading states.
4. Light + dark verification.
5. Keyboard/web focus behavior.
6. Screen-reader labels.
7. Reduced-motion behavior.

## P2 — After real beta feedback

Use actual beta behavior to determine:
- whether voice feels too ephemeral,
- whether users need nudges,
- whether streaks add value,
- which visual moments deserve stronger emphasis.

Do not solve these through decorative UI before the behavioral data exists.

---

# 21. Final design direction

The system should feel:

**warm, direct, tactile, youthful, Ghanaian in voice, emotionally intelligent, and slightly streetwise.**

It should not feel:

**luxury-tech, futuristic, gamified, corporate, overly cute, or generated from a generic mobile UI kit.**

The strongest version of Chale is not a page full of colorful components.

It is a quiet interface where one question has enough visual weight to make someone stop, answer honestly, and wonder what their person said.

That is the design system's job.
