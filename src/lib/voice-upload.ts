import { supabase } from './supabase';
export async function uploadVoiceAsync(localUri: string, answerId: string): Promise<string> {
  const res = await fetch(localUri);
  const buf = await res.arrayBuffer();
  const path = `${answerId}.m4a`;
  const { error } = await supabase.storage.from('voice-clips').upload(path, buf, { contentType: 'audio/m4a', upsert: true });
  if (error) throw error;
  const { data } = await supabase.storage.from('voice-clips').createSignedUrl(path, 60 * 60 * 24 * 7);
  if (!data?.signedUrl) throw new Error('Could not sign voice URL');
  return data.signedUrl;
}
