import { createClient } from 'npm:@supabase/supabase-js@2';

import { sendWaitlistConfirmation } from '../_shared/email.ts';
import {
  clean,
  clientIp,
  json,
  normalizeEmail,
  preflight,
  randomToken,
  sha256Hex,
  verifyTurnstile,
} from '../_shared/http.ts';

const RATE_LIMIT_PER_HOUR = 6;
const RESEND_COOLDOWN_MS = 60_000;
const TOKEN_TTL_MS = 48 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 12_000;

function inviteCode(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10);
}

function utmValue(source: unknown, key: string): string | null {
  if (!source || typeof source !== 'object') return null;
  return clean((source as Record<string, unknown>)[key], 200);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'server_not_configured' }, 503);
  }

  const bodyText = await req.text();
  if (bodyText.length > MAX_BODY_BYTES) {
    return json({ error: 'payload_too_large' }, 413);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  if (clean(payload.company, 80)) {
    return json({ ok: true, status: 'pending' });
  }

  const email = normalizeEmail(payload.email);
  if (!email) return json({ error: 'invalid_email' }, 400);

  const ip = clientIp(req);
  const ipHash = await sha256Hex(`${ip}:${Deno.env.get('WAITLIST_IP_SALT') ?? 'chale'}`);

  const turnstileOk = await verifyTurnstile(clean(payload.turnstileToken, 2048), ip);
  if (!turnstileOk) return json({ error: 'captcha_failed' }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from('waitlist')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', since);

  if (countError) {
    console.error('waitlist rate-limit query failed', countError.message);
    return json({ error: 'server_error' }, 500);
  }

  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return json({ error: 'rate_limited' }, 429);
  }

  const { data: existing, error: existingError } = await admin
    .from('waitlist')
    .select('id, status, invite_code, referred_by, email_sent_at')
    .eq('email', email)
    .maybeSingle();

  if (existingError) {
    console.error('waitlist lookup failed', existingError.message);
    return json({ error: 'server_error' }, 500);
  }

  if (existing?.status === 'confirmed') {
    return json({ ok: true, status: 'confirmed' });
  }

  if (existing?.status === 'pending' && existing.email_sent_at) {
    const sentAt = Date.parse(existing.email_sent_at);
    if (Number.isFinite(sentAt) && Date.now() - sentAt < RESEND_COOLDOWN_MS) {
      return json({ ok: true, status: 'pending' });
    }
  }

  const ref = clean(payload.ref, 32);
  let referredBy: string | null = existing?.referred_by ?? null;
  if (!referredBy && ref && /^[a-zA-Z0-9_-]{6,32}$/.test(ref) && ref !== existing?.invite_code) {
    const { data: referrer } = await admin
      .from('waitlist')
      .select('invite_code')
      .eq('invite_code', ref)
      .maybeSingle();
    if (referrer) referredBy = ref;
  }

  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  const now = new Date().toISOString();

  const values = {
    email,
    status: 'pending' as const,
    confirm_token_hash: tokenHash,
    confirm_token_expires_at: expiresAt,
    confirmed_at: null,
    referred_by: referredBy,
    relationship_type: clean(payload.relationship, 16),
    platform: clean(payload.platform, 16),
    source: clean(payload.source, 100),
    utm_source: utmValue(payload.utm, 'source'),
    utm_medium: utmValue(payload.utm, 'medium'),
    utm_campaign: utmValue(payload.utm, 'campaign'),
    utm_content: utmValue(payload.utm, 'content'),
    utm_term: utmValue(payload.utm, 'term'),
    referrer: clean(payload.referrer, 500),
    ip_hash: ipHash,
    email_sent_at: now,
    updated_at: now,
  };

  const relationship = clean(payload.relationship, 16);
  if (relationship && !['partner', 'family', 'friend'].includes(relationship)) {
    values.relationship_type = null;
  }
  const platform = clean(payload.platform, 16);
  if (platform && !['android', 'ios', 'web', 'unknown'].includes(platform)) {
    values.platform = null;
  }

  let rowId: string;
  if (existing) {
    const { error: updateError } = await admin
      .from('waitlist')
      .update(values)
      .eq('id', existing.id);
    if (updateError) {
      console.error('waitlist update failed', updateError.message);
      return json({ error: 'server_error' }, 500);
    }
    rowId = existing.id;
  } else {
    const { data: inserted, error: insertError } = await admin
      .from('waitlist')
      .insert({ ...values, invite_code: inviteCode() })
      .select('id')
      .single();
    if (insertError) {
      console.error('waitlist insert failed', insertError.message);
      return json({ error: 'server_error' }, 500);
    }
    rowId = inserted.id;
  }

  const siteUrl = (Deno.env.get('SITE_URL') ?? 'http://localhost:5173').replace(/\/+$/, '');
  const confirmUrl = `${siteUrl}/confirm?token=${encodeURIComponent(token)}`;
  const emailMode = Deno.env.get('WAITLIST_EMAIL_MODE') ?? 'resend';

  if (emailMode === 'log') {
    console.log('waitlist confirmation link', confirmUrl);
    return json({ ok: true, status: 'pending' });
  }

  try {
    await sendWaitlistConfirmation(email, confirmUrl);
  } catch (error) {
    console.error('waitlist confirmation email failed', error instanceof Error ? error.message : error);
    await admin
      .from('waitlist')
      .update({
        confirm_token_hash: null,
        confirm_token_expires_at: null,
        email_sent_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rowId);
    const status = error instanceof Error && error.message === 'resend_not_configured' ? 503 : 502;
    return json({ error: 'email_failed' }, status);
  }

  return json({ ok: true, status: 'pending' });
});
