import { supabase } from './supabase';
export async function submitTextAnswer(promptId: string, content: string) {
  const text = content.trim();
  if (!text) throw new Error('Answer cannot be empty');
  const { error } = await supabase.rpc('submit_answer', { p_prompt: promptId, p_kind: 'text', p_content: text });
  if (error) throw error;
}
export async function submitVoiceAnswer(promptId: string, audioUrl: string) {
  if (!audioUrl) throw new Error('Upload audio first');
  const { error } = await supabase.rpc('submit_answer', { p_prompt: promptId, p_kind: 'voice', p_content: audioUrl });
  if (error) throw error;
}
export async function recordListen(answerId: string) {
  const { error } = await supabase.rpc('record_listen', { p_answer: answerId });
  if (error) throw error;
}
export async function saveOwnClip(answerId: string) {
  const { error } = await supabase.rpc('save_own_clip', { p_answer: answerId });
  if (error) throw error;
}
