import { createClient } from 'npm:@supabase/supabase-js@2';

import { clean, json, preflight, sha256Hex } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'server_not_configured' }, 503);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const token = clean(payload.token, 200);
  if (!token || token.length < 20) {
    return json({ error: 'invalid_token' }, 400);
  }

  const tokenHash = await sha256Hex(token);
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: row, error } = await admin
    .from('waitlist')
    .select('id, status, invite_code, confirm_token_expires_at')
    .eq('confirm_token_hash', tokenHash)
    .maybeSingle();

  if (error) {
    console.error('waitlist confirm lookup failed', error.message);
    return json({ error: 'server_error' }, 500);
  }

  if (!row) return json({ error: 'invalid_or_expired' }, 400);

  if (row.status === 'confirmed') {
    return json({ ok: true, status: 'confirmed', inviteCode: row.invite_code });
  }

  if (!row.confirm_token_expires_at || Date.parse(row.confirm_token_expires_at) < Date.now()) {
    return json({ error: 'invalid_or_expired' }, 400);
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from('waitlist')
    .update({
      status: 'confirmed',
      confirmed_at: now,
      confirm_token_hash: null,
      confirm_token_expires_at: null,
      updated_at: now,
    })
    .eq('id', row.id);

  if (updateError) {
    console.error('waitlist confirm update failed', updateError.message);
    return json({ error: 'server_error' }, 500);
  }

  return json({ ok: true, status: 'confirmed', inviteCode: row.invite_code });
});
