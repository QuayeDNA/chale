/** Studio identity shown on the opening screens. */
export const STUDIO_NAME = 'DNA-Studios';

/** Studio site, once one exists. Null = the credit stays plain text. */
export const STUDIO_URL: string | null = null;

/**
 * Legal links. Each becomes visible on both opening screens the moment its URL
 * is set here — no UI comes back to life, nothing dead ships.
 */
export const LEGAL_LINKS: { label: string; url: string | null }[] = [
  { label: 'Terms', url: null },
  { label: 'Privacy', url: null },
];

/**
 * Hosted auth bridge (web/auth-bridge.html). Null = emailed links are not
 * redirected yet, so emailRedirectTo is omitted until hosting is done.
 */
export const AUTH_BRIDGE_URL: string | null = null;
