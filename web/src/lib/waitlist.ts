const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '');

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

const UTM_KEYS = ['source', 'medium', 'campaign', 'content', 'term'] as const;

export type WaitlistAttribution = {
  source: string;
  ref?: string;
  referrer?: string;
  utm: Partial<Record<(typeof UTM_KEYS)[number], string>>;
};

export class WaitlistError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'WaitlistError';
    this.code = code;
  }
}

function endpoint(name: 'join-waitlist' | 'confirm-waitlist'): string {
  if (!SUPABASE_URL) {
    throw new WaitlistError('not_configured', 'The waitlist is not connected yet.');
  }
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

function headers(): HeadersInit {
  const result: Record<string, string> = { 'Content-Type': 'application/json' };
  if (SUPABASE_ANON_KEY) {
    result.apikey = SUPABASE_ANON_KEY;
    result.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  return result;
}

async function post<T>(name: 'join-waitlist' | 'confirm-waitlist', body: unknown): Promise<T> {
  const res = await fetch(endpoint(name), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new WaitlistError(
      typeof data?.error === 'string' ? data.error : `http_${res.status}`,
      waitlistErrorMessage(data?.error),
    );
  }
  return data as T;
}

export function waitlistErrorMessage(code: unknown): string {
  switch (code) {
    case 'invalid_email':
      return 'That email does not look right. Check it and try again.';
    case 'rate_limited':
      return 'Too many tries from here. Give it a minute, then try again.';
    case 'captcha_failed':
      return 'The check did not pass. Try again.';
    case 'email_failed':
      return 'We could not send the confirmation email. Try again in a moment.';
    case 'payload_too_large':
      return 'That request was too large. Try again.';
    case 'invalid_or_expired':
      return 'This link has expired or has already been used.';
    case 'not_configured':
    case 'server_not_configured':
    case 'email_not_configured':
      return 'The waitlist is not connected yet. Try again shortly.';
    default:
      return 'Something went wrong. Try again.';
  }
}

export function attributionFromUrl(): WaitlistAttribution {
  const params = new URLSearchParams(window.location.search);
  const utm: WaitlistAttribution['utm'] = {};
  for (const key of UTM_KEYS) {
    const value = params.get(`utm_${key}`);
    if (value) utm[key] = value.slice(0, 200);
  }
  return {
    source: 'web',
    ref: params.get('ref')?.slice(0, 32) || undefined,
    referrer: document.referrer || undefined,
    utm,
  };
}

export function joinWaitlist(input: {
  email: string;
  turnstileToken: string | null;
  company?: string;
}): Promise<{ ok: true; status: 'pending' | 'confirmed' }> {
  return post('join-waitlist', {
    email: input.email,
    turnstileToken: input.turnstileToken,
    company: input.company ?? '',
    ...attributionFromUrl(),
  });
}

export function confirmWaitlist(token: string): Promise<{
  ok: true;
  status: 'confirmed';
  inviteCode: string;
}> {
  return post('confirm-waitlist', { token });
}

export function siteUrl(): string {
  if (SITE_URL) return SITE_URL;
  return `${window.location.protocol}//${window.location.host}`;
}

export function shareUrl(inviteCode: string): string {
  return `${siteUrl()}/?ref=${encodeURIComponent(inviteCode)}`;
}

export function whatsAppShareUrl(inviteCode: string): string {
  const message = `I'm getting early access to Chale, a deck of questions for the people you're close to. Join me: ${shareUrl(inviteCode)}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
