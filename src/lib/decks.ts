import { supabase } from './supabase';

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
  const { data, error } = await supabase.rpc('list_packs_with_counts');
  if (error) throw error;
  return (data ?? []) as DeckSummary[];
}

export async function getDeck(id: string): Promise<DeckSummary> {
  const decks = await listDecks();
  const found = decks.find((d) => d.id === id);
  if (!found) throw new Error('That deck is not available.');
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
  const { data, error } = await supabase.rpc('draw_session_questions', {
    p_pack: packId,
    p_count: count,
  });
  if (error) throw error;
  return (data ?? []) as DrawnQuestion[];
}
