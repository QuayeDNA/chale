import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { BrandFooter, BrandHeader } from '../components/BrandChrome';

const CALLBACK = 'chale://auth-callback';

const VERIFY_TYPES = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

type Phase = 'loading' | 'fallback' | 'invalid' | 'error';

export function AuthBridge() {
  const [params] = useSearchParams();
  const [phase, setPhase] = useState<Phase>('loading');

  useEffect(() => {
    const error = params.get('error') ?? params.get('error_description');
    if (error) {
      setPhase('error');
      return;
    }

    const tokenHash = params.get('token_hash');
    const rawType = params.get('type') ?? 'magiclink';
    const type = VERIFY_TYPES.includes(rawType) ? rawType : 'magiclink';
    const code = params.get('code');
    const target = tokenHash
      ? `${CALLBACK}?token_hash=${encodeURIComponent(tokenHash)}&type=${type}`
      : code
        ? `${CALLBACK}?code=${encodeURIComponent(code)}`
        : null;

    if (!target) {
      setPhase('invalid');
      return;
    }

    window.location.replace(target);

    const timer = window.setTimeout(() => {
      if (!document.hidden) setPhase('fallback');
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [params]);

  return (
    <div className="page panel">
      <BrandHeader />
      <div className={`card state ${phase === 'loading' ? 'is-active' : ''}`}>
        <h1 className="panel-title">Opening Chale…</h1>
        <p>If nothing happens, the button below will open it on this device.</p>
        <div className="bar-track">
          <div className="bar-fill" />
        </div>
      </div>
      <div className={`card state ${phase === 'fallback' ? 'is-active' : ''}`}>
        <h1 className="panel-title">Open Chale</h1>
        <p>
          This link opens the app. If nothing happened automatically, tap below
          — on the phone where Chale lives.
        </p>
        <button className="button button-block" type="button" onClick={() => window.location.replace(buildTarget(params) ?? '/')}>
          Open Chale
        </button>
      </div>
      <div className={`card state ${phase === 'invalid' ? 'is-active' : ''}`}>
        <h1 className="panel-title">This link belongs to the app</h1>
        <p>
          Open it on the phone where Chale is installed, or sign in with a
          one-time code in the app instead.
        </p>
      </div>
      <div className={`card state ${phase === 'error' ? 'is-active' : ''}`}>
        <h1 className="panel-title">That link didn't work</h1>
        <p>{params.get('error_description') ?? params.get('error') ?? 'Unknown error.'}</p>
        <p>Request a fresh link from the app and try again.</p>
      </div>
      <BrandFooter />
    </div>
  );
}

function buildTarget(params: URLSearchParams): string | null {
  const tokenHash = params.get('token_hash');
  const code = params.get('code');
  if (tokenHash) {
    const rawType = params.get('type') ?? 'magiclink';
    const type = VERIFY_TYPES.includes(rawType) ? rawType : 'magiclink';
    return `${CALLBACK}?token_hash=${encodeURIComponent(tokenHash)}&type=${type}`;
  }
  if (code) return `${CALLBACK}?code=${encodeURIComponent(code)}`;
  return null;
}
