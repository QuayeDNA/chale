import { supabase } from './supabase';
import { READ_TIMEOUT_MS, withTimeout } from './with-timeout';

/** A deck as list_packs_with_counts() returns it. */
export type DeckSummary = {
  id: string;
  slug: string | null;
  title: string;
  tagline: string | null;
  icon: string;
  tone: string;
  art_key: string;
  relationship_type: 'partner' | 'family' | 'friend';
  session_length: number;
  sort_order: number;
  is_locked: boolean;
  question_count: number;
};

/** One drawn question from draw_session_questions(). */
export type DrawnQuestion = {
  id: string;
  text: string;
  kind: 'text' | 'voice' | 'either';
  ordinal: number | null;
};

export async function listDecks(): Promise<DeckSummary[]> {
  // Bounded: a stalled connection would otherwise leave the grid's skeletons
  // spinning with no error and no retry. Timing out turns "loading forever"
  // into the error card with its Try again button.
  return withTimeout(
    (async () => {
      const { data, error } = await supabase.rpc('list_packs_with_counts');
      if (error) throw error;
      return (data ?? []) as DeckSummary[];
    })(),
    READ_TIMEOUT_MS,
    "Loading your decks",
  );
}

export async function getDeck(id: string): Promise<DeckSummary> {
  const decks = await listDecks();
  const found = decks.find((d) => d.id === id);
  if (!found || found.is_locked) throw new Error('That deck is not available.');
  return found;
}

/**
 * Draws a bounded, shuffled session from a deck. The shuffle happens in Postgres
 * (order by random()) rather than in the client, so every device in the session
 * sees the same order and no two sessions start identically.
 *
 * SECURITY INVOKER on the RPC means the existing read policies apply, so guests
 * can play in-person without an account.
 */
export async function drawSessionQuestions(
  packId: string,
  count = 20,
): Promise<DrawnQuestion[]> {
  // Same bound as the deck list: a session that never draws should fail into
  // its error state rather than hold the loading screen open indefinitely.
  return withTimeout(
    (async () => {
      const { data, error } = await supabase.rpc('draw_session_questions', {
        p_pack: packId,
        p_count: count,
      });
      if (error) throw error;
      return (data ?? []) as DrawnQuestion[];
    })(),
    READ_TIMEOUT_MS,
    'Drawing your questions',
  );
}

/**
 * The whole question pool of a deck, as the session shuffle needs it: the
 * client-side seeded shuffle (see `src/lib/shuffle-store.ts`) picks from this
 * list, so the pool only needs the same filters the RPC applies — active
 * questions in a published, unlocked deck.
 *
 * SECURITY INVOKER-style read policies still apply: guests hold the same
 * anonymous select grant they always had (see 0001).
 */
export async function loadPoolQuestions(packId: string): Promise<DrawnQuestion[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('id,text,kind,ordinal,question_packs!inner(is_published,is_locked)')
        .eq('pack_id', packId)
        .eq('is_active', true)
        .eq('question_packs.is_published', true)
        .eq('question_packs.is_locked', false);
      if (error) throw error;
      return (data ?? []) as DrawnQuestion[];
    })(),
    READ_TIMEOUT_MS,
    'Loading the deck',
  );
}
