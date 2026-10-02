import { supabase } from './supabase';
export type PromptWithQuestion = { promptId: string; questionId: string; text: string; kind: 'text'|'voice'|'either'; reveal_state: 'waiting_on_both'|'revealed' };
export async function getTodayPrompt(connectionId: string): Promise<PromptWithQuestion> {
  const { data, error } = await supabase.rpc('get_or_create_today_prompt', { p_connection: connectionId });
  if (error) throw error;
  const r = (data as unknown as { out_prompt: string; out_question: string; out_text: string; out_kind: PromptWithQuestion['kind']; out_reveal_state: PromptWithQuestion['reveal_state'] }[])[0];
  return { promptId: r.out_prompt, questionId: r.out_question, text: r.out_text, kind: r.out_kind, reveal_state: r.out_reveal_state };
}
