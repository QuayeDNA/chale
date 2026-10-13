# The question page — design brief

A brief for designing the question page in its two modes. Everything below is
grounded in the code that exists today; file and prop names are real.

---

## 1. The idea that organises everything

There is one screen the player looks at, and it behaves like **two different
pages** wearing the same card:

|  | **In person** | **Remote** |
|---|---|---|
| Who is looking | two people, one phone | one person, alone |
| Do you answer it | **never** | **always** |
| Is it a list | yes — question N of 20 | no — one question a day |
| Can you go back | yes — Previous | no |
| Needs a connection | no | yes |
| Needs an account | no (guests work) | effectively yes |

The single most important design consequence: **the in-person card must not
contain an answer affordance, and the remote card must not contain a counter or
a Previous button.** They share a card, not a layout.

---

## 2. In person

Route: `src/app/session.tsx` — `/session?pack=<deckId>`

### How it gets its questions

1. Read the local slot first: `loadSession(packId)` from `src/lib/session-store.ts`
   (one AsyncStorage slot per deck, `chale.session.v1.<packId>`, 7-day staleness).
2. No slot → `drawSessionQuestions(packId, deck.session_length)` — the server
   shuffles with `order by random()`, so both phones would agree.
3. The fresh draw is written straight back to storage.
4. **The index is read from the query, never held in state** (`index = session.data?.index ?? 0`).
   That is deliberate: it is why the sync effect that used to fight the cache is gone.

### States

| State | What is true | What the page shows |
|---|---|---|
| Loading | first draw in flight | a skeleton shaped like the card, not a spinner |
| Resuming | a slot existed | identical to loading-but-resolved — no "welcome back" ceremony. Home already announced it in the tray. |
| Reading | mid-session | the card |
| First question | `index === 0` | **Previous is disabled, not hidden** — the row keeps its width so nothing reflows at the end |
| Last question | `index === total - 1` | **Next relabels to "Finish — back home"**, primary variant unchanged. Same button, new words. |
| Part-way + abandoned | `index > 0` | a quiet centred caption pressable: "Start this deck over". Only shown once you've moved at least one card. |
| Error | deck missing or draw failed | an ErrorCard naming which. |

### Navigation

- `goTo(n)` writes `queryClient.setQueryData` **first**, then `saveSession`. Both.
- `finish()` clears the slot, removes the query, and `router.replace('/home')` — replace, not push, so Back doesn't return you to a finished session.
- A favourite toggle failure pushes `/auth`, because signing in is how a guest keeps what it just hearted.

---

## 3. Remote

Routes: `src/app/(tabs)/remote.tsx` (the day) and `src/app/prompt/[id].tsx` (the reveal)

### How it gets the day

- `useConnection()` → the connection id. **Gate on `status === 'linked'`** — home does this, remote currently doesn't, which is a bug: an unaccepted invite reads as a live connection.
- `useTodayPrompt(connectionId)` calls the **get-or-create** RPC. Opening Remote is what spends the day.
- `useMyAnswer(promptId, userId)` is a boolean-shaped query, shared with home so both agree the moment you answer.

### The eight states

| # | State | Page |
|---|---|---|
| 1 | no connection | "A question a day with your person" + one primary button → `/start` |
| 2 | invite pending (connection exists, not linked) | the same panel, reworded to "waiting for them" + your code |
| 3 | nothing drawn yet | an empty band, no card. Zero rows from the read-only peek RPC is a real answer, not a failure. |
| 4 | unanswered, question is **voice** | card + recorder only. No toggle. |
| 5 | unanswered, question is **text** | card + composer only. No toggle. |
| 6 | unanswered, question is **either** | card + a mode switch, then the composer or recorder |
| 7 | answered, `reveal_state !== 'revealed'` | card + waiting panel |
| 8 | answered, `reveal_state === 'revealed'` | card + "Open the reveal" |

`reveal_state` is the single source of truth for states 7 and 8. It is only ever
written by `submit_answer` / `save_own_clip` — never by a timer — so it reliably
means "both people have answered". `useRealtimePrompt(promptId)` flips the page
the moment they do; home's bell dot is driven by the same value.

### The waiting panel

`src/components/waiting-state.tsx` today is three lines of copy in a card. It is
the second-most-seen screen in the app and it should not feel like an error.

### The reveal

`/prompt/[id]` does three sequential reads (prompt → question → user → answers),
no join. It subscribes to `prompt-<id>` for `prompts` changes and `answers`
inserts, so the reveal lights up live without a pull.

The one piece of real business logic here: a voice answer can only be kept
permanently after it has been **listened to twice**. `voice_listens` is counted
with a `refetchInterval: 5000` and the "play it so it counts" nudge only appears
while that count is short. `VoiceMessage` records the listen itself when playback
finishes, once per viewer.

---

## 4. What already exists, and what each is for

### Primitives (`src/components/ui/`)

| Component | For |
|---|---|
| `Text` | variants: display 32, title 22, body 16, bodyStrong, label, smallBold, caption. `muted` prop. |
| `Button` | variants primary\|secondary\|accent\|ghost\|outline\|destructive\|inverse\|inverseOutline\|paper. Sizes sm 44 \| md 52 \| lg 60. Takes **no `style` prop** — wrap it. Supports `icon` + `iconPosition`. |
| `Badge` | tones street\|partner\|family\|friend\|muted. `unselected` for filter chips. |
| `Card` | variant `hero`. Owns its own gap. |
| `TextInput` | label / hint / error, 56 single-line, 96 multiline, street focus ring. |
| `LucideIcon` | the whole icon registry. No `style` prop. |
| `LoadingBar` | determinate + indeterminate. Use as a progress rail with a custom `accessibilityLabel` — its default says "Loading". |
| `Skeleton`, `SkeletonRow` | shimmer; skeletons are hidden from screen readers. |
| `ErrorCard` | names what failed + one button that fixes it. |
| `Waveform` family | the shared bar geometry both recorder and player use. |
| `Sheet` | bottom sheet, `useSheetAction()` defers navigation until it has dismissed. |
| `Checkbox`, `SearchBar`, `SegmentedControl`, `FilterChips`, `Dropdown`, `ResponsiveGrid` | as named. |

### Question surfaces

**`QuestionCard`** (`src/components/question-card.tsx`) — all props are optional
and its visibility switches on which ones you pass. That is deliberate and
should stay, because the two modes use the same component:

```
question        string
deckLabel?      string    → Badge, tone from deckTone
deckTone?       'street' | 'partner' | 'family' | 'friend' | 'muted'   ← a BADGE tone, not a deck fill
index?/total?   number    → "12 / 100" counter, shown only when both are given
isFavourite?    boolean
onToggleFavourite?       → the favourite row, omitted entirely when absent
onPrevious?/onNext?/prevDisabled?/nextDisabled?/nextLabel?/hideNavigation?
```

Note the trap: `deckTone` is a **Badge** tone derived from the deck's
`relationship_type`, not its fill colour. A partner deck is a red badge whether
it is Love or Life & Dreams. Don't "fix" it by passing the fill.

**`VoiceRecorder`** (`src/components/voice-recorder.tsx`) — a pill that morphs
through four phases: `idle → recording → recorded → sending`.

```
onSend?(recording: VoiceRecording)          // may be async; the pill waits
onDiscard?() onPermissionDenied?() onError?(message)
maxDurationMs = 120_000   align = 'end'
permissionDeniedHint?      // shown under the pill when idle and refused
```
`VoiceRecording = { uri, durationMs, levels }` where `levels` are 0–1 loudness
samples every ~70ms. Clips under 600ms are discarded as accidental taps.
A failed send **keeps the clip** so it can be retried.

**`VoiceMessage`** — the player. `{ url, answerId, label, levels?, durationMs?, onError? }`.
Tap the waveform to seek. It mounts its audio player lazily and retires itself
when playback finishes, because expo-audio's `updateInterval` is a native
constructor argument that fires whether or not anything is playing.

**`RevealCard`** — `{ question, mine, theirs }` where each is
`{ answerId, kind, content }`. Renders a voice answer as a player, text as body copy.

**`AnswerComposer`** and **`AnswerModeToggle`** — these two are the weak point.
They are 8 and 6 lines, written inline, and do not match anything else in the
app.

---

## 5. What should be designed

Five pieces, in priority order.

### 5.1 `QuestionPrompt` — the shared card, split by mode

The existing `QuestionCard` is correct for in person and wrong for remote. Rather
than a boolean per surface, give it one prop that carries the whole difference:

```ts
type PromptMode = 'session' | 'daily'
```

- `session` renders the deck badge, the `12 / 100` counter, the favourite row, and the Previous/Next pair.
- `daily` renders a **partner line instead of a counter** ("from Love & Relationships", with their avatar if we have it), the favourite row, and **no navigation**.

A single card, two arrangements, no duplicated styles.

### 5.2 `AnswerPanel` — replaces `AnswerComposer` + `AnswerModeToggle`

The answer surface is the thing with no design at all right now. It should be:

- **Mode switch.** When the question is `either`, use the same `SegmentedControl`
  the storefront already uses — Text / Voice — not two stacked buttons. Same
  sliding pill, so the app teaches it once.
- **Text.** The real `TextInput`, multiline, auto-growing to a cap. Label it with
  the question's kind so people know what they're picking.
- **Voice.** The existing recorder pill, but presented: a hint line above it
  ("Say it how you'd say it") and the permission-denied hint below.
- **Send.** Disabled until there's something to send, and the disabled state must
  say why — currently the button just greys out.

### 5.3 The waiting panel

State 7 is the app's most-seen and least-designed screen. It should read as
*held*, not *broken*: the question stays visible and dimmed rather than being
replaced, a quiet state of play explains you're waiting, and the only action is
"change your answer" until the reveal lands.

### 5.4 Favourites from remote

`toggleFavourite` is currently only ever called from `session.tsx`. You cannot
heart a question from a daily prompt, which is exactly the question you'll want
to keep. The `daily` mode of `QuestionPrompt` must pass `onToggleFavourite`
through, and the remote screen needs the same `['favourites', 'is', id]` query
that in-person uses.

### 5.5 The reveal entry

State 8 currently shows one button on one screen. The reveal is the payoff of the
whole loop, so it should read as a payoff: the card changes volume when the
reveal is ready, exactly as home's daily card already does.

---

## 6. On retiring the carousel and the start page

**The carousel — agree, retire it.** Deck selection is now a sheet, opened by
tapping a card in any view. A full-screen coverflow spread that also opens a
sheet is a second way to do one thing. `/decks` keeps List / Grid / Spread as
browse modes but Spread is no longer a *navigation* step; if it stays, it stays
as a browse surface only.

**The start page — do not agree, it can't go.** `/start` is not a deck screen.
It's pairing: create an invite code, or enter one. Remote play cannot begin
without a connection, so the remote branch of the sheet has to land there the
first time and go straight to the prompt every time after.

What *should* go is the extra hop you already removed: tapping a deck opens the
sheet, the sheet asks **Together or Remotely**, and:

- **Together** → `/session?pack=<deckId>` immediately. No further screen.
- **Remotely** → today's question immediately *if a connection already exists*;
  otherwise `/start`.

That conditional is the whole optimisation. A user who has played with one person
never sees the pairing screen again.

---

## 7. Design tokens

```
paper   #FBF3DF   surface #FFF9E8   ink  #2B1A0F
border  #EDE0BE   muted  #8A7562   street #F5B400
partner #D85A30   family #639922   friend #D4537E
radii   hero 24 · card 20 · chip 12 · pill 999
spacing half 2 · one 4 · two 8 · three 16 · four 24 · five 32 · six 64
```

Type: **Archivo Black** for display and title, **Spline Sans** for everything else.
Every surface in the app flips in dark mode except a handful that are pinned to
fixed hex because the fill *is* the design (the daily card's five volumes, the
resume tray, the premium banner).