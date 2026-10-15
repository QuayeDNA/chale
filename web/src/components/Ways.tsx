import { useEffect, useRef, useState } from 'react';

/**
 * Two ways to play — the segmented In person / Apart switch beside the
 * animated phone simulation. Ports the mockup's renderSb/auto2/typer logic:
 * in person is user-driven (turn the card, next question); apart auto-plays
 * a 4-step sequence every 3.2s while the stage is on screen.
 */

const WCOPY: [string, string][] = [
  [
    'One phone, passed around the room',
    'Put the phone in the middle. The deck deals the questions, and you take turns answering out loud. Nobody types anything. Turn the card to face whoever is reading.',
  ],
  [
    'Same game, different rooms',
    'The same deck and the same turns — you just answer from where you are, in text or in your own voice. Nothing shows until you both flip.',
  ],
];

const QP = [
  'What is something small I did this week that you noticed?',
  'What do you need more of from me right now?',
  'Where do we wake up in ten years?',
];

const TXT = 'You noticed when I did the dishes before you got home.';

const AV_FONT = '400 20px var(--font-display)';

function Waveform() {
  return (
    <>
      {Array.from({ length: 26 }, (_, i) => (
        <i key={i} style={{ height: `${20 + Math.abs(Math.sin(i * 1.3)) * 80}%` }} />
      ))}
    </>
  );
}

export function Ways() {
  const [mode, setMode] = useState(0);
  const [step, setStep] = useState(0);
  const [qi, setQi] = useState(0);
  const [turned, setTurned] = useState(false);
  const [typed, setTyped] = useState('');
  const [f2go, setF2go] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const sbRef = useRef<HTMLDivElement>(null);

  // Scroll reveal: .rv elements ease in once, then stay.
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

  // The apart sequence only advances while the stage is on screen.
  useEffect(() => {
    const sb = sbRef.current;
    if (!sb) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(sb);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (mode !== 1 || !visible) return;
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 3200);
    return () => clearInterval(id);
  }, [mode, visible]);

  // The typing effect on the answer screen.
  useEffect(() => {
    if (mode !== 1 || step !== 1) {
      setTyped('');
      return;
    }
    let n = 0;
    const id = setInterval(() => {
      n++;
      setTyped(TXT.slice(0, n));
      if (n >= TXT.length) clearInterval(id);
    }, 38);
    return () => clearInterval(id);
  }, [mode, step]);

  // The second reveal card flips half a beat after the screen lands.
  useEffect(() => {
    setF2go(false);
    if (mode !== 1 || step !== 3) return;
    const t = setTimeout(() => setF2go(true), 500);
    return () => clearTimeout(t);
  }, [mode, step]);

  const switchMode = (m: number) => {
    setMode(m);
    setStep(0);
  };

  const apartScreens = [
    <div className="scr" key="s0">
      <div className="ph-h">
        <span>CARD 4</span>
        <span>with Ama</span>
      </div>
      <div className="mc" style={{ flex: 1 }}>
        <div className="t">THE CARD</div>
        <div className="qq">{QP[0]}</div>
        <div className="t">ONE QUESTION, TWO ANSWERS</div>
      </div>
      <button className="mbtn pulse" type="button" tabIndex={-1}>
        Answer
      </button>
    </div>,
    <div className="scr" key="s1">
      <div className="ph-h">
        <span>YOUR ANSWER</span>
        <span>TEXT</span>
      </div>
      <div className="ansbox">
        <span>{typed}</span>
        <span className="cur" />
      </div>
      <button className="mbtn" type="button" tabIndex={-1}>
        Send answer
      </button>
    </div>,
    <div className="scr" key="s2" style={{ textAlign: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#2B1A0F',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            font: AV_FONT,
          }}
        >
          Y
        </span>
        <span
          className="pulse"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#D85A30',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            font: AV_FONT,
            opacity: 0.6,
          }}
        >
          A
        </span>
      </div>
      <h4>Held until Ama answers</h4>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>The flip unlocks when you&apos;re both in.</p>
    </div>,
    <div className="scr" key="s3">
      <div className="ph-h">
        <span>THE REVEAL</span>
        <span>BOTH IN</span>
      </div>
      <div className="flipc go" style={{ height: 100, flex: 'none' }}>
        <div>
          <div className="fa">
            <b>You</b>
            <br />
            {TXT}
          </div>
          <div className="fb">?</div>
        </div>
      </div>
      <div className={`flipc${f2go ? ' go' : ''}`} style={{ height: 100, flex: 'none' }}>
        <div>
          <div className="fa">
            <b>Ama · voice</b>
            <div className="wf">
              <Waveform />
            </div>
          </div>
          <div className="fb">?</div>
        </div>
      </div>
    </div>,
  ];

  return (
    <section id="ways" ref={sectionRef}>
      <div className="wrap">
        <span className="eyebrow rv">
          <i></i>Two ways to play
        </span>
        <h2 className="rv" style={{ marginTop: 14 }}>
          Same deck. Near or far.
        </h2>
        <div className="ways rv">
          <div>
            <div className="seg">
              <i style={{ transform: `translateX(${mode * 100}%)` }} />
              <button
                type="button"
                className={mode === 0 ? 'on' : ''}
                aria-pressed={mode === 0}
                onClick={() => switchMode(0)}
              >
                In person
              </button>
              <button
                type="button"
                className={mode === 1 ? 'on' : ''}
                aria-pressed={mode === 1}
                onClick={() => switchMode(1)}
              >
                Apart
              </button>
            </div>
            <div className="wcopy">
              <div key={mode}>
                <h3>{WCOPY[mode][0]}</h3>
                <p>{WCOPY[mode][1]}</p>
              </div>
            </div>
          </div>
          <div className="stagebox" ref={sbRef}>
            {mode === 0 ? (
              <>
                <div className="who a">
                  <span className="av" style={{ background: '#2B1A0F' }}>
                    Y
                  </span>
                  <span>Your turn</span>
                </div>
                <div className="who b">
                  <span className="av" style={{ background: '#D85A30' }}>
                    A
                  </span>
                  <span>Ama&apos;s turn</span>
                </div>
                <div className="phone">
                  <div className="ph-h">
                    <span>DEEP TALKS</span>
                    <span>{qi + 1} / 20</span>
                  </div>
                  <div className="mc" style={{ transform: `rotate(${turned ? 180 : 0}deg)` }}>
                    <div className="t">READ IT OUT LOUD</div>
                    <div className="qq">{QP[qi % 3]}</div>
                    <div className="t">NO TYPING, JUST TALK</div>
                  </div>
                  <button className="mbtn" type="button" onClick={() => setTurned((t) => !t)}>
                    Turn to face them
                  </button>
                  <button
                    className="mbtn"
                    type="button"
                    style={{ background: 'var(--ink)', color: 'var(--paper)', marginTop: 8 }}
                    onClick={() => setQi((q) => q + 1)}
                  >
                    Next ›
                  </button>
                </div>
              </>
            ) : (
              <div className="phone">
                {apartScreens[step]}
                <div className="dots">
                  {[0, 1, 2, 3].map((i) => (
                    <button
                      key={i}
                      type="button"
                      className={i === step ? 'on' : ''}
                      aria-label={`Step ${i + 1}`}
                      onClick={() => setStep(i)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
