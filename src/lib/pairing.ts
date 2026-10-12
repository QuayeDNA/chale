import { supabase } from './supabase';
/**
 * Creates the connection and pins the deck the pair chose. The inviter's deck
 * wins: joinConnection deliberately does not take one, so whoever generates
 * the code decides and the joiner inherits — otherwise both sides picking a
 * deck would need a tie-break rule nobody can predict.
 */
export async function createConnection(deckId?: string | null) {
  const { data, error } = await supabase.rpc('create_connection', {
    p_deck: deckId ?? undefined,
  });
  if (error) throw error;
  const row = (data as unknown as { out_id: string; out_invite_code: string }[])[0];
  return { id: row.out_id, invite_code: row.out_invite_code };
}
export async function joinConnection(code: string) {
  const { data, error } = await supabase.rpc('join_connection', { p_code: code.trim().toUpperCase() });
  if (error) throw error;
  const row = (data as unknown as { out_id: string; out_status: string }[])[0];
  return { id: row.out_id, status: row.out_status };
}
