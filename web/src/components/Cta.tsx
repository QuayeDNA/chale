import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import {
  TURNSTILE_SITE_KEY,
  joinWaitlist,
  waitlistErrorMessage,
  WaitlistError,
} from '../lib/waitlist';
import { Turnstile } from './Turnstile';

const HEADLINE = 'Ask something real.';
const WORDS = HEADLINE.split(' ');

type Status = 'idle' | 'submitting' | 'sent' | 'error';

export function Cta() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll('.rv'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [status]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting') return;

    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    if (!email) return;

    setStatus('submitting');
    setError('');

    try {
      await joinWaitlist({
        email,
        turnstileToken,
        company: String(data.get('company') ?? ''),
      });
      setSubmittedEmail(email);
      setStatus('sent');
      setTurnstileToken(null);
      setTurnstileKey((key) => key + 1);
    } catch (err) {
      setStatus('error');
      setError(
        err instanceof WaitlistError ? err.message : waitlistErrorMessage(undefined),
      );
      setTurnstileToken(null);
      setTurnstileKey((key) => key + 1);
    }
  };

  const reset = () => {
    setStatus('idle');
    setError('');
    setSubmittedEmail('');
    setTurnstileKey((key) => key + 1);
    window.setTimeout(() => emailRef.current?.focus(), 0);
  };

  return (
    <section id="cta" className="cta" ref={sectionRef}>
      <div className="wrap">
        <h2 className="rv" aria-label={HEADLINE}>
          {WORDS.map((word, w) => (
            <Fragment key={w}>
              <span className="cta-word">
                {Array.from(word).map((c, i) => (
                  <span key={i} aria-hidden="true">
                    {c}
                  </span>
                ))}
              </span>
              {w < WORDS.length - 1 ? ' ' : null}
            </Fragment>
          ))}
        </h2>

        {status === 'sent' ? (
          <div className="waitlist-done" role="status">
            <span className="eyebrow"><i />Check your inbox</span>
            <h3>You&apos;re nearly in.</h3>
            <p>
              We sent a confirmation link to <strong>{submittedEmail}</strong>. Open it to save
              your spot, then bring your person.
            </p>
            <button type="button" className="btn o" onClick={reset}>
              Use a different email
            </button>
          </div>
        ) : (
          <form className="form rv in" onSubmit={onSubmit}>
            <label className="vh" htmlFor="waitlist-email">
              Email
            </label>
            <input
              ref={emailRef}
              id="waitlist-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              placeholder="Your email, for the beta"
              disabled={status === 'submitting'}
            />
            <input
              className="waitlist-honeypot"
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <button
              className="btn p"
              type="submit"
              disabled={
                status === 'submitting' || Boolean(TURNSTILE_SITE_KEY && !turnstileToken)
              }
            >
              {status === 'submitting' ? 'Joining…' : 'Join the Android beta'}
            </button>
          </form>
        )}

        {TURNSTILE_SITE_KEY && status !== 'sent' ? (
          <div className="form-check">
            <Turnstile onToken={setTurnstileToken} resetKey={turnstileKey} />
          </div>
        ) : null}

        {error ? (
          <p className="form-note error" role="alert">
            {error}
          </p>
        ) : null}

        {status !== 'sent' ? (
          <p className="small">
            Android beta first. One email when it&apos;s ready. No spam.{' '}
            <Link to="/privacy">Privacy</Link>.
          </p>
        ) : null}
      </div>
    </section>
  );
}
