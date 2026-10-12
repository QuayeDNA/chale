import { supabase } from './supabase';
export type PromptWithQuestion = { promptId: string; questionId: string; text: string; kind: 'text'|'voice'|'either'; reveal_state: 'waiting_on_both'|'revealed' };
type PromptRow = { out_prompt: string; out_question: string; out_text: string; out_kind: PromptWithQuestion['kind']; out_reveal_state: PromptWithQuestion['reveal_state'] };

function toPrompt(r: PromptRow): PromptWithQuestion {
  return { promptId: r.out_prompt, questionId: r.out_question, text: r.out_text, kind: r.out_kind, reveal_state: r.out_reveal_state };
}

export async function getTodayPrompt(connectionId: string): Promise<PromptWithQuestion> {
  const { data, error } = await supabase.rpc('get_or_create_today_prompt', { p_connection: connectionId });
  if (error) throw error;
  return toPrompt((data as unknown as PromptRow[])[0]);
}

/**
 * Today's prompt, but only if one already exists — nothing is assigned here.
 * Surfaces use this so opening the dashboard never spends the day; only
 * actually answering does. Returns null when the day has not been drawn yet.
 */
export async function readTodayPrompt(connectionId: string): Promise<PromptWithQuestion | null> {
  const { data, error } = await supabase.rpc('read_today_prompt', { p_connection: connectionId });
  if (error) throw error;
  const r = (data as unknown as PromptRow[])[0];
  return r ? toPrompt(r) : null;
}
