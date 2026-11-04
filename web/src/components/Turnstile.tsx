import { useEffect, useRef } from 'react';

import { TURNSTILE_SITE_KEY } from '../lib/waitlist';

type TurnstileWidget = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: 'light' | 'dark' | 'auto';
      language?: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileWidget;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-chale-turnstile]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('turnstile_load_failed')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.chaleTurnstile = 'true';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('turnstile_load_failed')), {
      once: true,
    });
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function Turnstile({
  onToken,
  resetKey,
}: {
  onToken: (token: string | null) => void;
  resetKey: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const siteKey = TURNSTILE_SITE_KEY;
    if (!siteKey) return;
    let widgetId: string | null = null;
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !hostRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(hostRef.current, {
          sitekey: siteKey,
          theme: 'auto',
          language: 'en',
          callback: (token) => onToken(token),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
        });
      })
      .catch(() => onToken(null));

    return () => {
      cancelled = true;
      onToken(null);
      if (widgetId && window.turnstile?.remove) window.turnstile.remove(widgetId);
      if (hostRef.current) hostRef.current.innerHTML = '';
    };
  }, [onToken, resetKey]);

  if (!TURNSTILE_SITE_KEY) return null;

  return <div className="turnstile-slot" ref={hostRef} />;
}
