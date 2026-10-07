# Chale — Manual UI Design Workflow in Penpot

## Purpose

This is the practical playbook for manually designing Chale's UI in
**Penpot** before implementation.

### Core product direction

> **Chale is a digital conversation-card experience first. Remote
> conversation is an extension of the same system.**

The primary experience is two people sitting together, using one device
to read questions and talk to each other. Chale does **not** need to
capture answers in the normal in-person flow.

------------------------------------------------------------------------

## 1. Product Mental Model

### Primary flow

``` text
OPEN CHALE
   ↓
HOME / DECK COLLECTION
   ↓
CHOOSE A DECK
   ↓
START SESSION
   ↓
"ARE YOU SITTING TOGETHER?"
   ↓
YES
   ↓
QUESTION CARD
   ↓
READ → TALK
   ↓
FAVOURITE / PREVIOUS / NEXT
   ↓
NEXT QUESTION
```

The app's primary job is to:

1. Present good questions.
2. Make the question feel special.
3. Keep interaction effortless.
4. Let people move through the deck.
5. Let users favourite questions.
6. Stay out of the conversation.

------------------------------------------------------------------------

## 2. Secondary Remote Flow

``` text
CHOOSE DECK
   ↓
START SESSION
   ↓
"ARE YOU SITTING TOGETHER?"
   ↓
NOT CLOSE RIGHT NOW
   ↓
LOGIN / AUTH
   ↓
CREATE REMOTE SESSION
   ↓
INVITE CODE
   ↓
SHARE
   ↓
OTHER PERSON LOGS IN
   ↓
JOIN SESSION
   ↓
REMOTE QUESTION
   ↓
ANSWER
 ┌─┴─┐
TEXT VOICE
 └─┬─┘
   ↓
WAITING
   ↓
REVEAL / RECEIVE ANSWER
   ↓
NEXT QUESTION
```

Remote mode should feel like an extension of Chale, not a completely
different product.

------------------------------------------------------------------------

## 3. Design Direction

Think:

``` text
UNO
+
Conversation Cards
+
Mobile Game
+
Editorial Design
+
Chale's own human/cultural personality
```

Avoid:

- Relationship SaaS
- Generic questionnaire UI
- Dating-app clones
- Social-media feeds
- Dashboards
- Overly polished AI-template aesthetics
- Excessive luxury branding

Aim for:

- Playful
- Warm
- Human
- Tactile
- Confident
- Slightly quirky
- Easy to understand
- Card-focused
- Game-like without looking childish

------------------------------------------------------------------------

## 4. Design Principles

Create a Penpot page called **02 — DESIGN PRINCIPLES**.

### 01 — Feels Like a Game

Chale should feel like something you **play**, not something you fill
out.

Use:

- Decks
- Cards
- Clear actions
- Question progression
- Small moments of anticipation
- Playful transitions

Avoid:

- Forms everywhere
- Dense navigation
- Dashboard metrics
- Excessive explanatory text

### 02 — Questions Are the Hero

The question is the most important object on the screen.

Everything else becomes secondary while a question is being shown.

### 03 — Playful, Not Childish

Use:

- Bold typography
- Interesting shapes
- Small doodles
- Strong composition
- Controlled color

Avoid cartoon overload, excessive stickers, emojis, candy-like
gradients, and decoration for decoration's sake.

### 04 — Human Before Polished

Chale should feel authored.

Use:

- Slightly imperfect decorative details
- Doodles
- Editorial layouts
- Strong typography
- Cultural texture
- Small visual surprises

### 05 — Remote Is an Extension

Reuse the same:

- Question cards
- Deck identity
- Typography
- Colors
- Buttons
- Icons
- Interaction language

------------------------------------------------------------------------

## 5. Penpot File Structure

Create one Penpot project:

``` text
Chale — Product UI
```

Organize it as:

``` text
CHALE
│
├── 00 — COVER
├── 01 — USER FLOW
├── 02 — DESIGN PRINCIPLES
├── 03 — FOUNDATIONS
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Radius
│   ├── Shadows
│   └── Motion
├── 04 — ICONS
├── 05 — COMPONENTS
│   ├── Buttons
│   ├── Navigation
│   ├── Cards
│   ├── Inputs
│   ├── Chips
│   ├── Dialogs
│   └── Toggles
├── 06 — DECK SYSTEM
├── 07 — SCREENS
│   ├── Splash
│   ├── Home
│   ├── Deck
│   ├── Session
│   ├── Favourites
│   ├── Remote
│   ├── Auth
│   ├── Profile
│   └── Settings
└── 08 — PROTOTYPE
```

Do not design every screen immediately. This is an organizational
structure, not the work order.

------------------------------------------------------------------------

## 6. Step 1 — Create the Penpot File

Create the file and pages above.

On **00 — COVER**, add:

``` text
CHALE

Digital conversation cards
for people who want to talk.

UI / UX Exploration

PRIMARY EXPERIENCE
In-person conversation

SECONDARY EXPERIENCE
Remote conversation
```

Keep this visible as the product direction.

------------------------------------------------------------------------

## 7. Step 2 — Map the User Flow

On **01 — USER FLOW**, use simple boxes and arrows.

### Primary

``` text
OPEN
 ↓
HOME
 ↓
SELECT DECK
 ↓
START SESSION
 ↓
SITTING TOGETHER?
 ↓
YES
 ↓
QUESTION
 ↓
TALK
 ↓
NEXT
 ↓
QUESTION
```

### Remote

``` text
START SESSION
 ↓
SITTING TOGETHER?
 ↓
NOT CLOSE
 ↓
LOGIN
 ↓
CREATE SESSION
 ↓
INVITE CODE
 ↓
JOIN
 ↓
REMOTE QUESTION
 ↓
ANSWER
 ↓
WAIT
 ↓
REVEAL
```

### Supporting

``` text
HOME
 ├── FAVOURITES
 ├── PROFILE
 └── SETTINGS
```

Do not polish this page. It is your UX map.

------------------------------------------------------------------------

## 8. Step 3 — Build Foundations First

Go to **03 — FOUNDATIONS**.

### Color foundation

Start with:

| Token      | Value       | Purpose                          |
|------------|-------------|-----------------------------------|
| `paper`    | `#FBF3DF`   | Light background / card surface  |
| `surface`  | `#2E1E10`   | Dark surface                     |
| `ink`      | `#2A1A0F`   | Primary text                     |
| `border`   | `#3D2A18`   | Borders / separators             |
| `muted`    | `#C4A991`   | Secondary text                   |
| `street`   | `#F5B400`   | Main playful accent              |

Relationship accents:

| Relationship | Color       |
|--------------|-------------|
| Partner      | `#D85A30`   |
| Family       | `#639922`   |
| Friend       | `#D4537E`   |

Keep the palette small.

Create semantic roles such as:

``` text
color/background
color/surface
color/text-primary
color/text-secondary
color/border
color/action-primary
color/action-secondary
color/relationship-partner
color/relationship-family
color/relationship-friend
```

Penpot's design-system features can later map these into reusable
tokens.

------------------------------------------------------------------------

## 9. Typography

Use:

### Display

**Archivo Black**

For:

- Major headings
- Deck names
- Large question text
- Important statements

### UI / Body

**Spline Sans**

For:

- Buttons
- Navigation
- Labels
- Metadata
- Inputs
- Supporting text

Create a specimen:

``` text
DISPLAY
The question is the game.

HEADING
What makes you feel understood?

BODY
A little question can start a very long conversation.

LABEL
NEXT QUESTION

BUTTON
START SESSION
```

Keep the type scale small and consistent.

------------------------------------------------------------------------

## 10. Spacing

Start with:

``` text
4
8
12
16
20
24
32
40
48
64
80
```

Use these values consistently.

Roughly:

``` text
4–8    tiny gaps
12–16  normal UI spacing
20–24  component spacing
32–48  section spacing
64+    major breathing room
```

Do not invent arbitrary spacing on every screen.

------------------------------------------------------------------------

## 11. Shape Language

Create a small radius system:

``` text
radius/small
radius/medium
radius/card
radius/full
```

Use larger radii primarily for cards and large surfaces.

Do not turn every component into a pill.

------------------------------------------------------------------------

## 12. Icons

Use **Lucide** as the primary icon family.

Start with only what the product needs:

``` text
ArrowLeft
ArrowRight
ChevronRight
Heart
X
Check
Plus
Share
Copy
Settings
User
Volume2
Mic
Send
Lock
Clock
MoreHorizontal
Play
Pause
```

Consistency matters more than having hundreds of icons.

------------------------------------------------------------------------

## 13. Step 4 — Build Core Components

On **05 — COMPONENTS**, build the components required by the real
flows.

### Buttons

Create:

``` text
Primary
Secondary
Tertiary
Icon
Destructive
```

States:

``` text
Default
Pressed
Disabled
Loading
```

### Navigation

Start with:

``` text
TopBar
BackButton
CloseButton
BottomNavigation
```

Keep navigation quiet during a conversation session.

### Cards

Create:

``` text
DeckCard
QuestionCard
FavouriteCard
RemoteQuestionCard
```

### Inputs

Primarily for remote/auth:

``` text
TextInput
InviteCodeInput
MultilineAnswerInput
```

### Dialogs

Create:

``` text
StartSessionDialog
ConfirmDialog
ShareDialog
```

The **StartSessionDialog** is especially important because it branches
the main experience.

------------------------------------------------------------------------

## 14. Step 5 — Design the Deck System

Go to **06 — DECK SYSTEM**.

Create **4--6 visual explorations** before committing to one.

Explore:

### Concept A — Traditional Card

``` text
DEEP TALK

What's something
you wish people
understood about you?
```

### Concept B — Editorial Card

``` text
03

DEEP TALK

What's something
you wish people
understood about you?
```

### Concept C — Bold Game Card

``` text
DEEP TALK
03 / 40

What's something
you wish people
understood about you?
```

### Concept D — Minimal

Let the question dominate with almost no decoration.

### Concept E — Playful

Use controlled doodles and shapes around the question.

These should still feel like the same Chale brand.

------------------------------------------------------------------------

## 15. Step 6 — Design the Question Screen First

This is the most important screen in the product.

**Do not start with Home.**

Create:

``` text
SESSION — QUESTION
```

Example structure:

``` text
                  07 / 30

              DEEP TALK

       What's something
       you've never told
       anyone because
       you were afraid
       they'd judge you?

                  ♡

        ← PREVIOUS     NEXT →
```

The exact layout is yours to explore.

The hierarchy should remain:

``` text
QUESTION
   ↓
DECK / CONTEXT
   ↓
FAVOURITE
   ↓
NAVIGATION
```

------------------------------------------------------------------------

## 16. Question Screen Rules

### Do

- Give the question room.
- Make it readable from a shared device.
- Keep controls obvious.
- Make previous/next easy to tap.
- Keep the screen calm.
- Make the card feel tactile.
- Use typography as the main visual element.

### Don't

- Add answer fields.
- Add chat UI.
- Add unnecessary metadata.
- Add social-feed elements.
- Add too many buttons.
- Fill the screen with decoration.

Remember:

> Two people are sitting together looking at this screen.

The interface should facilitate their conversation rather than compete
with it.

------------------------------------------------------------------------

## 17. Session Controls

Minimum controls:

``` text
Favourite
Previous
Next
```

Optional:

``` text
Question number
Deck name
Close session
```

Controls should not overpower the question.

Think:

``` text
QUESTION
   ↓
CONVERSATION
   ↓
SMALL CONTROLS
```

------------------------------------------------------------------------

## 18. Step 7 — Design Home as a Game Lobby

Only after the question experience works.

Home should feel like:

``` text
GAME LOBBY
+
CARD COLLECTION
```

not a dashboard.

Possible structure:

``` text
Good evening.

What are you
playing today?

[ DECK CARD ]

[ DECK CARD ]

[ DECK CARD ]

────────────

Favourites
```

The user should understand quickly:

1. What Chale is.
2. What they can play.
3. Which deck they can choose.
4. How to start.

Avoid analytics, progress dashboards, and unnecessary statistics.

------------------------------------------------------------------------

## 19. Step 8 — Deck Details

The deck detail screen should answer:

``` text
What is this deck?
How many questions?
What kind of conversation?
How do I start?
```

Example:

``` text
DEEP TALK

30 questions

For conversations that
go a little deeper.

[ START SESSION ]
```

Keep supporting information lightweight.

------------------------------------------------------------------------

## 20. Step 9 — Session-Start Branch

When the user taps **START SESSION**, use a lightweight dialog/sheet:

``` text
Are you sitting together?

Chale works best when
you're both right here.

[ YES, LET'S GO ]

[ NOT CLOSE RIGHT NOW ]
```

### YES

Starts the normal in-person question session.

### NOT CLOSE RIGHT NOW

Routes to remote mode.

This is preferable to forcing users to understand technical concepts
like "rooms", "async mode", or "online session" before they even start.

------------------------------------------------------------------------

## 21. Step 10 — Remote Mode

Design remote mode only after the in-person experience is strong.

Start with:

``` text
Create Session
 ↓
Invite
 ↓
Remote Question
 ↓
Answer
 ↓
Waiting
 ↓
Reveal
```

Then add the supporting states:

``` text
Remote Login
Join Session
Text Answer
Voice Answer
Voice Playback
Next Question
```

Reuse the question-card system.

------------------------------------------------------------------------

## 22. Remote Question

A remote question can add interaction controls while keeping the same
Chale card identity:

``` text
DEEP TALK

What's something
you wish you could
change about your past?

────────────────

Your answer

[ Type something... ]

[ Record voice ]

[ SEND ]
```

The question/deck language remains the same. Only the interaction layer
changes.

------------------------------------------------------------------------

## 23. Authentication Comes Later

Do not begin with login.

The normal path should get users into questions quickly.

Authentication becomes relevant when remote functionality requires it.

Design:

``` text
Home
 ↓
Deck
 ↓
Session
```

before:

``` text
Login
Signup
Forgot Password
Profile
Settings
```

This keeps Chale conversation-centric rather than account-centric.

------------------------------------------------------------------------

## 24. Profile and Settings

Design these last.

Possible areas:

``` text
Profile
Preferences
Favourite Questions
Account
Notifications
About Chale
```

These screens should inherit the existing system.

Do not invent a separate visual language for them.

------------------------------------------------------------------------

## 25. Exact Design Order

Follow this sequence:

``` text
01. Foundations
        ↓
02. Icons
        ↓
03. Components
        ↓
04. Deck Concepts
        ↓
05. Question Card
        ↓
06. Session Screen
        ↓
07. Home
        ↓
08. Deck Details
        ↓
09. Start Session Dialog
        ↓
10. Favourites
        ↓
11. Remote Create
        ↓
12. Invite / Join
        ↓
13. Remote Question
        ↓
14. Remote Answer
        ↓
15. Waiting
        ↓
16. Reveal
        ↓
17. Authentication
        ↓
18. Profile
        ↓
19. Settings
        ↓
20. Prototype
```

The order is intentional: **design from the core interaction outward.**

------------------------------------------------------------------------

## 26. Component Strategy in Penpot

Once something is correct, convert it into a reusable component.

For example:

``` text
Button / Primary
Button / Secondary
Button / Icon

Card / Deck
Card / Question

Navigation / TopBar

Dialog / StartSession

Input / Text
Input / InviteCode
```

Build reusable states instead of copying individual objects.

Example:

``` text
Button
├── Primary
├── Secondary
├── Disabled
└── Loading
```

This makes eventual implementation much easier.

------------------------------------------------------------------------

## 27. Relationship Colors

Use relationship types as contextual accents:

``` text
PARTNER
#D85A30

FAMILY
#639922

FRIEND
#D4537E
```

Use them for:

- Deck identity
- Small accents
- Labels
- Borders
- Selected states
- Decorative details

Do not flood an entire screen with relationship color.

------------------------------------------------------------------------

## 28. Doodles and Authored Details

A useful visual target:

``` text
80% typography + cards + shapes
15% authored doodles
5% illustration
```

Doodles should:

- Support composition
- Give the brand personality
- Create visual warmth
- Highlight important moments

Do not use them simply to fill empty space.

------------------------------------------------------------------------

## 29. Avoid Generic AI-Template Design

Warning signs:

``` text
❌ Giant gradient blobs
❌ Glassmorphism
❌ Excessive floating cards
❌ Generic 3D illustrations
❌ Random abstract shapes
❌ Too many rounded pills
❌ Excessive shadows
❌ Dashboard statistics
❌ Huge decorative emojis
❌ Stock-looking illustrations
```

Prefer:

``` text
✓ Strong typography
✓ Clear composition
✓ Card mechanics
✓ Intentional whitespace
✓ Meaningful color
✓ Authored details
✓ Consistent spacing
✓ Strong hierarchy
```

------------------------------------------------------------------------

## 30. Use Dribbble Correctly

Search for:

``` text
mobile card game UI
conversation card game UI
digital card game UI
UNO mobile UI
playful editorial mobile UI
question card app UI
mobile game menu UI
```

Study:

- Card composition
- Information hierarchy
- Game states
- Navigation during gameplay
- Category color systems
- Typography

Do not copy individual screens. Extract principles.

------------------------------------------------------------------------

## 31. Design for the Shared Device

This is specific to Chale.

The device may sit between two people.

Therefore:

- Text must be readable at a glance.
- Controls must be obvious.
- Questions must work from either side.
- Touch targets must be comfortable.
- Avoid tiny hidden controls.
- Do not assume one person is staring at the phone continuously.

The real interaction is:

``` text
LOOK
 ↓
READ
 ↓
TALK
 ↓
LOOK
 ↓
TAP
 ↓
NEXT
 ↓
TALK
```

Design around that loop.

------------------------------------------------------------------------

## 32. Mobile Frame Strategy

Start with one canonical mobile frame:

``` text
390 × 844
```

Once stable, test:

``` text
375 × 812
390 × 844
412 × 915
```

Do not design every screen at every size from the beginning.

------------------------------------------------------------------------

## 33. Responsive Rules

Classify elements as:

``` text
FIXED
FLEXIBLE
ADAPTIVE
```

### Fixed

- Icon size
- Button height
- Touch targets
- Border thickness

### Flexible

- Question card width
- Text block width
- Deck spacing

### Adaptive

- Deck arrangement
- Card wrapping
- Padding
- Long-question layout

Do not simply scale the whole interface.

------------------------------------------------------------------------

## 34. Test Question Length

Test at least three cases.

### Short

``` text
What's your favourite memory?
```

### Medium

``` text
What's something you wish you
had learned earlier in life?
```

### Long

``` text
If you could revisit one moment
from your childhood and experience
it again with everything you know now,
which moment would you choose?
```

The design must work for all three.

------------------------------------------------------------------------

## 35. Design States, Not Just Screens

For each important component, create its states.

Example:

``` text
Button
├── Default
├── Pressed
├── Disabled
└── Loading

Favourite
├── Unselected
└── Selected

Remote
├── Waiting
├── Answering
├── Submitted
└── Revealed
```

This is essential for implementation.

------------------------------------------------------------------------

## 36. Motion Direction

Motion should reinforce the card-game feeling.

Good examples:

``` text
Question changes
→ subtle card transition

Favourite
→ small tactile feedback

Deck selected
→ card emphasis

Answer submitted
→ clear state transition

Reveal
→ deliberate reveal animation
```

Avoid constant bouncing, long transitions, and decorative animation
everywhere.

------------------------------------------------------------------------

## 37. Accessibility Checklist

Before finalizing each screen:

- [ ] Text is readable
- [ ] Contrast is sufficient
- [ ] Buttons are easy to tap
- [ ] Icons have clear meaning
- [ ] Important actions are not ambiguous
- [ ] Long questions remain readable
- [ ] Disabled states are distinguishable
- [ ] Color is not the only information cue

------------------------------------------------------------------------

## 38. Prototype the Primary Flow First

Create only:

``` text
Home
 ↓
Deck
 ↓
Start Session
 ↓
"Are you sitting together?"
 ↓
YES
 ↓
Question 01
 ↓
Question 02
 ↓
Question 03
```

Do not prototype the entire application at once.

------------------------------------------------------------------------

## 39. The Couch Test

Pretend two people are sitting together.

``` text
Person A opens Chale.
Person B looks at the screen.
They choose a deck.
They start.
Chale asks if they are sitting together.
They choose YES.
A question appears.
They read it.
They talk.
Someone taps NEXT.
A new question appears.
They talk again.
```

Ask:

``` text
Can they understand what to do without explanation?

Is the question immediately readable?

Are controls obvious?

Does the interface disappear enough for conversation?

Does anything feel like unnecessary app workflow?
```

If not, redesign before adding more screens.

------------------------------------------------------------------------

## 40. The First Conversation Test

The most important question is not:

> How many screens have I designed?

It is:

> **How quickly can two people get from opening Chale to having their
> first real conversation?**

The ideal path is:

``` text
OPEN
 ↓
CHOOSE
 ↓
START
 ↓
TALK
```

Everything else is secondary.

------------------------------------------------------------------------

## 41. Recommended Design Sessions

### Session 1 — Foundation

Create only:

- [x] Foundations
- [x] Typography
- [x] Colors
- [x] Spacing
- [ ] Basic buttons
- [ ] Question card
- [ ] One session screen

### Session 2 — Primary Product

Create:

- [ ] Deck concepts
- [ ] Final deck direction
- [ ] Deck selection
- [ ] Deck detail
- [ ] Home
- [ ] Start-session dialog

### Session 3 — Remote

Create:

- [ ] Remote create
- [ ] Invite
- [ ] Join
- [ ] Remote question
- [ ] Text answer
- [ ] Voice answer
- [ ] Waiting
- [ ] Reveal

### Session 4 — Supporting UX

Create:

- [ ] Favourites
- [ ] Authentication
- [ ] Profile
- [ ] Settings
- [ ] Empty states
- [ ] Error states
- [ ] Loading states

Then polish.

------------------------------------------------------------------------

## 42. Final Design Architecture

Your finished system should roughly become:

``` text
CHALE
│
├── FOUNDATIONS
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Radius
│   ├── Shadows
│   └── Motion
│
├── COMPONENTS
│   ├── Buttons
│   ├── Navigation
│   ├── Cards
│   ├── Inputs
│   ├── Dialogs
│   └── Feedback
│
├── QUESTION SYSTEM
│   ├── QuestionCard
│   ├── QuestionMeta
│   ├── FavouriteButton
│   ├── PreviousButton
│   ├── NextButton
│   ├── QuestionCounter
│   └── QuestionDeck
│
├── TOGETHER MODE
│   ├── Home
│   ├── DeckSelection
│   ├── DeckDetails
│   ├── StartSession
│   └── ConversationSession
│
├── REMOTE MODE
│   ├── Authentication
│   ├── CreateSession
│   ├── Invite
│   ├── Join
│   ├── RemoteQuestion
│   ├── TextAnswer
│   ├── VoiceAnswer
│   ├── Waiting
│   └── Reveal
│
└── SUPPORTING
    ├── Favourites
    ├── Profile
    └── Settings
```

------------------------------------------------------------------------

## 43. Definition of Done — First UI Milestone

Do not call the first milestone complete until:

- [x] Penpot file organized
- [x] Design principles documented
- [x] Color tokens created
- [x] Typography system created
- [x] Spacing system created
- [x] Icon direction chosen
- [ ] Button components created
- [ ] Basic card component created
- [ ] 4–6 deck concepts explored
- [ ] Question card finalized
- [ ] In-person session screen designed
- [ ] Question → Next prototype working
- [ ] Long-question test completed
- [ ] Shared-device/couch test completed

At this point you have a real UI foundation rather than a collection of
attractive screens.

------------------------------------------------------------------------

## 44. The Golden Rule

Whenever you are unsure about a design decision, return to:

> **Chale exists to help two people have a good conversation.**

Ask:

``` text
Does this help them start talking?
Does this make the question easier to understand?
Does this make the interaction more playful?
Does this reduce friction?
Does this make Chale feel like Chale?
```

If not, question whether it belongs.

------------------------------------------------------------------------

## 45. Your Exact Starting Point in Penpot

When you open Penpot, **do not start with Home**.

Follow this exact sequence:

``` text
PENPOT
  ↓
Create "Chale — Product UI"
  ↓
Create pages
  ↓
03 — FOUNDATIONS
  ↓
Set colors
  ↓
Set typography
  ↓
Set spacing
  ↓
04 — ICONS
  ↓
05 — COMPONENTS
  ↓
06 — DECK SYSTEM
  ↓
Create 4–6 card explorations
  ↓
07 — SCREENS
  ↓
Design QUESTION SCREEN
  ↓
Prototype QUESTION → NEXT → QUESTION
```

Once that works:

``` text
QUESTION
   ↓
SESSION
   ↓
DECK
   ↓
HOME
   ↓
START SESSION
   ↓
REMOTE
   ↓
AUTH
   ↓
PROFILE / SETTINGS
```

------------------------------------------------------------------------

## 46. Final Mental Model

Keep this architecture in mind:

``` text
                    CHALE
                      │
              CONVERSATION CARDS
                      │
          ┌───────────┴───────────┐
          │                       │
     TOGETHER MODE            REMOTE MODE
          │                       │
     Shared device            Separate devices
          │                       │
      Question                Question
          │                       │
       Talk                  Answer
          │                       │
       Next                    Wait
          │                       │
       Repeat                  Reveal
```

The **question system is the center of both experiences**.

Everything else exists around it.

------------------------------------------------------------------------

## Final Direction

The finished design should make the user feel:

> **"Someone made a really good conversation card game for my phone."**

Not:

> "Someone built a relationship management application."

That distinction should guide every major UI decision you make in
Penpot.
