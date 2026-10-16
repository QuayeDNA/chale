import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

const HEADLINE = 'Ask something real.';
const LETTERS = HEADLINE.split('');
const TOAST_MS = 2600;

export function Cta() {
  const [toasted, setToasted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);

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
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.currentTarget.reset();
    setToasted(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToasted(false), TOAST_MS);
  }

  return (
    <section className="cta" ref={sectionRef}>
      <div className="wrap">
        <h2 className="rv" aria-label={HEADLINE}>
          {LETTERS.map((c, i) => (c === ' ' ? c : <span key={i} aria-hidden="true">{c}</span>))}
        </h2>

        <form className="form rv" onSubmit={submit}>
          <input type="email" required placeholder="Your email, for the beta" aria-label="Email" />
          <button className="btn p" type="submit">Tell me when it&rsquo;s open</button>
        </form>

        <p className="small">Coming to Android &amp; iOS. No spam, just the day it opens.</p>
      </div>

      <div className={`toast${toasted ? ' on' : ''}`} role="status">
        {toasted ? 'Thanks. We’ll tell you the day it opens. (demo)' : ''}
      </div>
    </section>
  );
}
