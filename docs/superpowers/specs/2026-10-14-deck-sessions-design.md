# Deck sessions without repeats — seed & cursor design

**Status: approved direction, 2026-10-14.** Rewritten from the seed model the owner proposed (m0294): the seen-ledger is retired. Not yet implemented. Every code claim below was verified against the migrations and screens.

## Problem (verified)

In-person sessions draw with `draw_session_questions` = `where pack = X order by random() limit session_length` (0007:68-83). Every session is an independent random 20 of 100, and nothing remembers what a device has already played:

1. **Sessions overlap.** With a 100-question deck, two 20-question draws share ~3 questions in expectation (birthday math), and up to 11 at one standard deviation. "20 fresh questions" is not what a second session delivers.
2. **Nothing surfaces sessioning.** The storefront says "N questions · 20 a session" (deck-row.tsx:52) and the spread says "Each session draws 20 at random" (deck-spread.tsx:164) — but a session never tells you it is a slice of a bigger deck, how much of the deck you've seen, or when a deck is running out.
3. **The copy lies on small decks.** A deck with 10 questions still advertises "20 a session"; the draw returns 10. Same on the spread's caption (deck-spread.tsx:241).

The remote loop already solved this problem for itself: `get_or_create_today_prompt` prefers *unseen* questions per connection (0007:175-214). The in-person draw has no equivalent.

## Model: seed + cursor

**Device-local, per deck.** In-person is one shared phone, and guests (the majority case) have no account — the same reasoning the session store already made in `src/lib/session-store.ts`. A per-pack seed shared across devices would make every phone play identical sessions, so the seed is generated per device.

Per pack, one AsyncStorage slot:

```
chale.shuffle.v1.<packId> = { seed: number, cursor: number, completedAt?: number }
```

- `seed` — created on first play of the pack (random 31-bit int). Deterministically shuffles the pack's question ids.
- `cursor` — number of sessions of this pack finished on this device. Session k (0-based) consumes `shuffle[cursor*L .. +L]`.
- `completedAt` — set by the "Back home" finish (not by "Draw the next 20"), powering the Home recommendation card.

**The elegant consequence:** the cursor *is* the seen-state. No id ledger, no growth, no backfill, and "N fresh left" is pure arithmetic: `poolSize − cursor*L`. Two states replace the ledger entirely, and the shuffle is a pure function (`shuffleFor(seed, ids)`) that is unit-testable.

**Freshness guarantee:** within a cycle (one seed), no question repeats across sessions — session boundaries are fixed slices of the shuffle, and `order by random()` never re-enters the picture for sessions. The current RPC stays untouched for its other callers (storefront samples, spread preview).

## The three session states

Per deck, `L` = session_length, `pool` = the pack's active published questions (shuffled by `seed`):

| State | Condition | Session | Copy |
|---|---|---|---|
| Fresh | cursor*L + L ≤ pool | L questions, all unseen | "20 questions, all new to you" |
| Tail | cursor*L < pool < cursor*L + L | final pool − cursor*L questions, short | "The last 5 you haven't heard" |
| Cycle end | cursor*L ≥ pool | **re-seed + cursor 0**, full fresh session | eyebrow: "Fresh shuffle — you've heard all 100" |

Decks that don't divide (65, 50, 10) are handled by the table: 65 → 20, 20, 20, 5, then reshuffle; 10 → the whole deck, then reshuffle. **No mixing**: the seed model refuses the old "5 new + 15 seen" top-up (owner rule, m0294: "making sure to NEVER mix up any using a seed"), so a tail is honestly short. No "session 2 of 5" counters — they break the moment a deck isn't a round multiple.

## Data flow (plain English)

1. **Pool fetch.** Opening a session loads the pack's questions for the device once: `select id, text where pack_id and is_active and question_packs.is_published` (PostgREST, embedded filter; anon read policies already cover question content). One round trip, ~100 rows of small JSON worst case.
2. **Shuffle + slice.** Client-side: seeded PRNG (mulberry32) Fisher-Yates over the ids — `shuffleFor(seed, ids)`. The slice for this session is `shuffle.slice(cursor*L, cursor*L + L)`, then mapped back to question rows. Pure, offline, deterministic.
3. **Session slot (unchanged).** The slice is written to `chale.session.v1.<packId>` as `{ packId, questions, index, startedAt }` exactly as today; resuming an abandoned session still lands mid-slice, and Home's resume tray is unchanged.
4. **Ending.** On the last card, two options:
   - **Back home** — `cursor+1` + `completedAt: now` → clear the session slot → `router.replace('/home')`. Resuming is gone (Back can't return), and the recommendation card picks this deck up.
   - **Draw the next 20** — full-width primary below the card; `cursor+1` → slice advances → session slot resets to `index: 0` **on the same screen**, playing continues (the card slides forward).
5. **Next entry.** A later open of the same pack (from the storefront sheet, the browse row, or the recommendation card) resumes from the saved cursor — never from the top.
6. **Exhaustion.** The next entry after the tail finds `cursor*L ≥ pool`: a new seed, cursor 0, and a `reshuffled` flag paints the eyebrow on that session only.

## Backend

**No migration.** The shuffle moved on-device precisely so the draw stays a plain read. `draw_session_questions` (0007) remains the storefront sample path. `src/lib/database.types.ts` is untouched — no sync needed.

## Client changes

1. **`src/lib/shuffle-store.ts` (new)** — `loadCursor(packId)` / `advanceCursor(packId)` / `markCompleted(packId)` / `reshuffle(packId)` / `loadPool(packId)` (the PostgREST fetch) / `shuffleFor(seed, ids)` (pure, exported for tests).
2. **`src/lib/decks.ts`** — add `loadPoolQuestions(packId)`; keep `drawSessionQuestions` for samples.
3. **`src/app/session.tsx`** — the session query: resume slot → else load cursor + pool → shuffle + slice → save. `finish()` splits into the two endings above (both advance the cursor; back-home also marks completed). `restart()` re-enters the *same* slice (cursor unchanged, fresh session slot at index 0). Last card renders the nav row (`Previous` + quiet `Back home`) plus the full-width `Draw the next 20` primary below.
4. **`src/components/next-up-card.tsx` (new)** — the Home recommendation card (see below).
5. **Storefront surfaces** compute honest copy from `freshLeft(pool, cursor)`: deck-row.tsx:52, deck-spread.tsx:164/241, DeckSheet preview, session header ("40 of 100 seen on this phone" replaces the deck-level line).

## Home recommendation card

**Position:** the slot Home currently gives the pairing invite (the no-connection state of `DailyPromptCard`).

**Rules (approved m0301):**
- Pairing invite holds the slot until the user has a linked connection **or** dismisses it once (the dismissal persists).
- After that, the slot is the recommendation card:
  - **No completed session yet** → an age-neutral starter deck (Friends-family; resolve the slug from the 0008 seed) — "Start playing".
  - **After a Back-home finish** → that deck: "Keep going with <title> — <N> fresh left". Tapping opens `/session?pack=<id>` directly.
- Fires only on Back-home completions; a session continued with "Draw the next 20" is still in-flight, not a recommendation.
- The ResumeCarousel (half-finished sessions) stays where it is, above this card; the two surfaces never compete.
- Never shown to a user who still has the pairing invite pending (see first rule).

## Seed audit

The check allows `session_length` 5–50 per deck (0007:23). Decks with fewer questions than their length are a content bug, not a UI one: audit `content/decks/*.json` + the 0008 seed and set `session_length ≤ question_count` (a 10-question deck carries 10, or 5). The honest copy covers the gap regardless; this stops the metadata from lying in the first place.

## Deliberately out of scope

- **The storefront sheet's play interaction** (together/remotely split, preview copy) — deferred by the owner until this idea is solidified.
- Account-synced session state — deferred; device-local matches guests.
- Recycled-question weighting — irrelevant now; the seed defines the order.
- No server state is added; no schema changes.

## Plan (ordered) — all steps complete 2026-10-14

1. `src/lib/shuffle-store.ts`: pool fetch + seeded shuffle (pure) + cursor slot CRUD, with a unit-level shuffle test script. **Done.**
2. `session.tsx`: resume → shuffle-slice → save; two endings on the last card; restart = same slice. **Done.**
3. `session.tsx` render: last-card layout (nav row + full-width primary below) and the reshuffle eyebrow. **Done.**
4. Honest copy pass: deck-row, deck-spread, DeckSheet preview, session header (count-led, no raw session_length as a size). **Done** — deck-row gates the session suffix on `question_count > session_length`; art.ts, deck-spread and deck-sheet reworded to "no repeats till the deck runs out".
5. `next-up-card.tsx` + Home slot rules (pairing until dismissed/paired → recommend). **Done.**
6. Seed audit: `session_length ≤ question_count` across `content/decks/*.json` and 0008. **Done — passes.** Pools: love-and-relationships 100, life-and-dreams 75, fun-and-silly 60, friends 80, family 65, deep-talks 80; every deck seeds at session_length 20, so the smallest pool (Fun & Silly, 60) is exactly 3 full sessions with no tail. Legacy flat pack is unpublished and invisible to the app. The DDL bounds session_length 5–50 but cannot cross-check pool size (cross-table), so this stays seed-data discipline: any future deck whose pool ≤ session_length shows honest copy via the deck-row gate but never exercises the tail branch.
7. Docs: 02 (§5 RPC surface + §7 store), 04 flow 2 (seed model + the two endings + recommendation card), 01 §5 item 2, question-page-brief (draw sources), 00 if flow 1 changes. **Done.**
8. Verify: `npx tsc --noEmit`, eslint on touched files, one manual dev-build pass (100-question deck: session 1 → Back home → session 2 shows "80 fresh left" and zero overlap with session 1; 65-question deck: 4th session is the 5-card tail; 5th shows the reshuffle eyebrow). **Done** — tsc + eslint clean; device pass still owed.

## Working decisions (recorded, still changeable)

1. **Seed is per-device, shuffle runs client-side** — alternates: per-pack global seed (identical sessions everywhere), or server-side md5 ordering (needs migration + types sync).
2. **Tail is short, never mixed** — alternates: old ledger top-up ("5 new + 15 seen"), or replay-early.
3. **Cycle end is automatic re-seed + eyebrow** — alternates: confirm-at-exhaustion interstitial, or deck goes dead on exhaustion.
4. **Recommendation card replaces the pairing slot only after dismiss/paired** — alternates: always-recommend (pairing moves into the daily card), or recommend only after first completion.
