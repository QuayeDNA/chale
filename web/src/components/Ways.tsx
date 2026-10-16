import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import './styles/ways.css';

import crownUrl from '../assets/chale-brand-svgs/doodles/crown.svg';
import dashesUrl from '../assets/chale-brand-svgs/doodles/dashes.svg';
import heartUrl from '../assets/chale-brand-svgs/doodles/heart.svg';
import slashesGreenUrl from '../assets/chale-brand-svgs/doodles/slashes-green.svg';
import sparkleUrl from '../assets/chale-brand-svgs/doodles/sparkle.svg';
import star4Url from '../assets/chale-brand-svgs/doodles/star-4.svg';
import swooshUrl from '../assets/chale-brand-svgs/doodles/squiggle-swoosh.svg';

/* ----------------------------------------------------------------- copy ---- */

type Step = { title: string; text: string };
type Mode = { label: string; sub: string; title: string; body: string; steps: Step[] };

const MODES: Mode[] = [
  {
    label: 'In person',
    sub: 'One phone',
    title: 'One phone, passed around the room',
    body: 'Put the phone in the middle and let the deck deal. You take turns answering out loud, so nobody types a thing.',
    steps: [
      { title: 'Put the phone in the middle', text: 'The deck deals a card. No sign-up, no typing, just a question on the table.' },
      { title: 'Take turns, out loud', text: 'One of you reads it and answers, then the other does. The phone keeps the questions coming.' },
      { title: 'Turn it to face them', text: 'Spin the card around so whoever is across from you can read it too.' },
    ],
  },
  {
    label: 'Apart',
    sub: 'Two phones',
    title: 'Same game, different rooms',
    body: 'The same deck and the same turns. You just answer from where you are, in text or in your own voice.',
    steps: [
      { title: 'Answer your way', text: 'Type it, or say it out loud and send your voice. Whatever feels more like you.' },
      { title: 'Wait for each other', text: 'Nothing shows until you have both answered. No peeking, no spoilers.' },
      { title: 'Flip together', text: 'Both answers open at once, text or voice. That is the moment the deck is for.' },
    ],
  },
];

const STEP_MS = 4600;
const QUESTION = 'What is something small I did this week that you noticed?';
const TYPED = 'You noticed when I did the dishes before you got home.';

/* ---------------------------------------------------------------- hooks ---- */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(q.matches);
    on();
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Types `text` out once `run` is true. Returns the whole thing when it can't animate. */
function useTyped(text: string, run: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!run) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) window.clearInterval(id);
    }, 36);
    return () => window.clearInterval(id);
  }, [text, run]);
  return run ? text.slice(0, n) : text;
}

/* ------------------------------------------------------------ primitives ---- */

function Bars({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span className={`wy-bars ${className}`} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i
          key={i}
          style={{ '--h': `${28 + Math.abs(Math.sin(i * 1.3)) * 72}%`, '--i': i } as CSSProperties}
        />
      ))}
    </span>
  );
}

function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="wy-phone-wrap">
      <div className="wy-phone">
        <span className="wy-notch" />
        <div className="wy-screen">{children}</div>
      </div>
      <img className="wy-crown" src={crownUrl} alt="" />
    </div>
  );
}

function Seat({ who }: { who: 'you' | 'ama' }) {
  const you = who === 'you';
  return (
    <div className={`wy-seat ${who}`}>
      <span className="wy-av">
        <b>{you ? 'Y' : 'A'}</b>
        <i className="wy-ring" />
      </span>
      <span className="wy-name">{you ? 'You' : 'Ama'}</span>
      <span className="wy-say">
        <span className="s-idle">Ready</span>
        <span className="s-a">{you ? 'Your turn' : 'Listening'}</span>
        <span className="s-b">{you ? 'Listening' : 'Her turn'}</span>
        <span className="s-end">{you ? 'Turned it' : 'Reading it'}</span>
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- scenes ---- */

function PersonScene({ step }: { step: number }) {
  return (
    <div className="wy-table" data-step={step}>
      <Seat who="you" />
      <Phone>
        <div className="wy-bar">
          <span className="wy-chip">Deep Talks</span>
          <span className="wy-count">4 / 20</span>
        </div>
        <div className="wy-deck">
          <div className="wy-stack">
            <div className="wy-card back2" />
            <div className="wy-card back1" />
            <div className="wy-card front">
              <span className="wy-tag">Read it out loud</span>
              <p>{QUESTION}</p>
              <Bars n={11} className="mic" />
            </div>
          </div>
        </div>
        <div className="wy-actions">
          <span className="wy-btn turn">Turn to face them</span>
          <span className="wy-btn next">Next ›</span>
        </div>
      </Phone>
      <Seat who="ama" />
    </div>
  );
}

function AnswerScreen() {
  const typed = useTyped(TYPED, true);
  const ready = typed.length >= TYPED.length;
  return (
    <div className="wy-pane wy-answer">
      <div className="wy-bar">
        <span className="wy-chip warm">Today</span>
        <span className="wy-count">with Ama</span>
      </div>
      <div className="wy-card mini">
        <span className="wy-tag">Today&apos;s card</span>
        <p>{QUESTION}</p>
      </div>
      <div className="wy-mseg">
        <i />
        <span className="t">Text</span>
        <span className="v">Voice</span>
      </div>
      <div className="wy-input">
        <span className="wy-typed">
          {typed}
          <i className="wy-cur" />
        </span>
        <span className="wy-voice">
          <span className="wy-rec" />
          <Bars n={22} className="live" />
          <em>0:09</em>
        </span>
      </div>
      <span className={`wy-send${ready ? ' ready' : ''}`}>Send answer</span>
    </div>
  );
}

function WaitScreen() {
  return (
    <div className="wy-pane wy-wait">
      <div className="wy-card mini dim">
        <span className="wy-tag">Today&apos;s card</span>
        <p>{QUESTION}</p>
      </div>
      <div className="wy-pair">
        <span className="wy-av2 me">
          <b>Y</b>
          <em>✓</em>
        </span>
        <span className="wy-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="wy-av2 ama">
          <b>A</b>
        </span>
      </div>
      <h4>Held until Ama answers</h4>
      <p>No peeking. We&apos;ll nudge you the second she does.</p>
    </div>
  );
}

function RevealScreen() {
  return (
    <div className="wy-pane wy-reveal">
      <div className="wy-bar">
        <span className="wy-chip warm">The reveal</span>
        <span className="wy-count">Both in</span>
      </div>
      <div className="wy-flip you">
        <div>
          <div className="f a">
            <b>You</b>
            <p>{TYPED}</p>
          </div>
          <div className="f b">?</div>
        </div>
      </div>
      <div className="wy-flip ama">
        <div>
          <div className="f a">
            <b>Ama · voice</b>
            <span className="wy-play">
              <span className="tri" />
              <Bars n={20} className="play" />
              <em>0:14</em>
            </span>
          </div>
          <div className="f b">?</div>
        </div>
      </div>
      <span className="wy-keep">
        <img src={heartUrl} alt="" />
        Keep this question
      </span>
      <img className="wy-spark" src={sparkleUrl} alt="" />
      <i className="wy-burst" />
      <i className="wy-burst two" />
    </div>
  );
}

function ApartScene({ step }: { step: number }) {
  return (
    <div className="wy-solo">
      <Phone>
        <span className="wy-live" key={step}>
          {step === 0 ? <AnswerScreen /> : step === 1 ? <WaitScreen /> : <RevealScreen />}
        </span>
      </Phone>
    </div>
  );
}

/* ------------------------------------------------------------- the section ---- */

export function Ways() {
  const [mode, setMode] = useState(0);
  const [step, setStep] = useState(0);
  const [tick, setTick] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Scroll-reveal for the .rv blocks.
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    root.querySelectorAll('.rv').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // The story only plays while the stage is on screen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playing = inView && !reduced;
  const m = MODES[mode]!;

  const pickMode = (next: number) => {
    if (next === mode) return;
    setDir(next > mode ? 1 : -1);
    setMode(next);
    setStep(0);
    setTick((t) => t + 1);
  };
  const pickStep = (i: number) => {
    setStep(i);
    setTick((t) => t + 1);
  };

  return (
    <section id="ways" className="wy" ref={sectionRef} data-playing={playing}>
      <div className="wrap">
        <header className="wy-head rv">
          <span className="eyebrow">
            <i />
            Two ways to play
          </span>
          <h2 className="wy-title">
            Same deck. <span className="wy-nb">Near&nbsp;or&nbsp;far.</span>
            <img className="wy-flourish wy-ink" src={swooshUrl} alt="" />
          </h2>
        </header>

        <div className="wy-grid rv">
          <div className="wy-left">
            <div className="wy-tabs" role="tablist" aria-label="How you play">
              <i className="wy-pill" style={{ transform: `translateX(${mode * 100}%)` }} />
              {MODES.map((x, i) => (
                <button
                  key={x.label}
                  type="button"
                  role="tab"
                  aria-selected={mode === i}
                  className={`wy-tab${mode === i ? ' on' : ''}`}
                  onClick={() => pickMode(i)}
                >
                  <b>{x.label}</b>
                  <small>{x.sub}</small>
                </button>
              ))}
            </div>

            <div className="wy-copy" key={mode} data-dir={dir}>
              <h3>{m.title}</h3>
              <p>{m.body}</p>
            </div>

            <ol className="wy-steps">
              {m.steps.map((s, i) => (
                <li key={s.title} className={`wy-step${i === step ? ' on' : ''}${i < step ? ' done' : ''}`}>
                  <button type="button" onClick={() => pickStep(i)} aria-current={i === step ? 'step' : undefined}>
                    <span className="wy-num">{i + 1}</span>
                    <span className="wy-st">
                      <b>{s.title}</b>
                      <span className="wy-text">
                        <span>{s.text}</span>
                      </span>
                      <i className="wy-prog" aria-hidden="true">
                        {i === step && (
                          <u
                            key={`${mode}-${step}-${tick}`}
                            style={{ animationDuration: `${STEP_MS}ms` }}
                            onAnimationEnd={() => setStep((n) => (n + 1) % m.steps.length)}
                          />
                        )}
                      </i>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div className="wy-stage" ref={stageRef} data-mode={mode} aria-hidden="true">
            <i className="wy-wash warm" />
            <i className="wy-wash cool" />
            <img className="wy-decor d-slashes" src={slashesGreenUrl} alt="" />
            <img className="wy-decor d-dashes" src={dashesUrl} alt="" />
            <img className="wy-decor d-heart" src={heartUrl} alt="" />
            <img className="wy-decor d-star wy-ink" src={star4Url} alt="" />
            <div className="wy-scene" key={mode} data-dir={dir}>
              {mode === 0 ? <PersonScene step={step} /> : <ApartScene step={step} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}