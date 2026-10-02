import { supabase } from './supabase';
export async function createConnection() {
  const { data, error } = await supabase.rpc('create_connection');
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
