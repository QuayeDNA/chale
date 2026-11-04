import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { BrandFooter, BrandHeader } from '../components/BrandChrome';
import {
  confirmWaitlist,
  WaitlistError,
  whatsAppShareUrl,
  waitlistErrorMessage,
} from '../lib/waitlist';

type State = 'loading' | 'confirmed' | 'already' | 'error';

export function Confirm() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>('loading');
  const [message, setMessage] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setState('error');
      setMessage('This link is missing its confirmation token.');
      return;
    }

    confirmWaitlist(token)
      .then((result) => {
        setInviteCode(result.inviteCode);
        setState(result.status === 'confirmed' ? 'confirmed' : 'already');
      })
      .catch((error) => {
        setState('error');
        setMessage(
          error instanceof WaitlistError ? error.message : waitlistErrorMessage(undefined),
        );
      });
  }, [token]);

  return (
    <div className="page panel">
      <BrandHeader />
      <main className="card doc confirm-card" aria-live="polite">
        <span className="doc-tag">Chale beta</span>

        {state === 'loading' ? (
          <>
            <h1>Checking your link.</h1>
            <p>Hang on a second while we save your spot.</p>
            <div className="bar-track" aria-hidden="true">
              <div className="bar-fill" />
            </div>
          </>
        ) : null}

        {state === 'confirmed' ? (
          <>
            <h1>You&apos;re in.</h1>
            <p>
              Your spot is saved. We&apos;ll email you when the Android beta opens. In the
              meantime, bring your person.
            </p>
            {inviteCode ? (
              <a
                className="button button-block"
                href={whatsAppShareUrl(inviteCode)}
                target="_blank"
                rel="noreferrer"
              >
                Share on WhatsApp
              </a>
            ) : null}
            <p className="confirm-foot">
              <Link to="/">Back to Chale</Link>
            </p>
          </>
        ) : null}

        {state === 'already' ? (
          <>
            <h1>You&apos;re already on the list.</h1>
            <p>Nothing else to do. We&apos;ll email you when the Android beta opens.</p>
            {inviteCode ? (
              <a
                className="button button-block"
                href={whatsAppShareUrl(inviteCode)}
                target="_blank"
                rel="noreferrer"
              >
                Share on WhatsApp
              </a>
            ) : null}
            <p className="confirm-foot">
              <Link to="/">Back to Chale</Link>
            </p>
          </>
        ) : null}

        {state === 'error' ? (
          <>
            <h1>This link didn&apos;t work.</h1>
            <p>{message}</p>
            <Link className="button button-block" to="/#cta">
              Join the beta again
            </Link>
          </>
        ) : null}
      </main>
      <BrandFooter />
    </div>
  );
}
