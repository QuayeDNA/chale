import { useEffect, useRef, useState } from 'react';

const ANSWER =
  'You noticed when I did the dishes before you got home. It meant more than you know.';
const BARS = 30;
const HOLD = 2000;
const RESET = 350;
const SLIDE = 800;

function bars() {
  return Array.from({ length: BARS }, (_, i) => 20 + Math.abs(Math.sin(i * 1.3)) * 80);
}

export function Reveal() {
  const [go, setGo] = useState(false);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const duoRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const flipAfter = (delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setGo(true), delay);
  };

  useEffect(() => {
    const slot = sectionRef.current;
    if (!slot) return;
    const reach = Math.min(0.6, (window.innerHeight / slot.offsetHeight) * 0.8);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setInView(true);
        flipAfter(SLIDE + HOLD);
      },
      { threshold: reach },
    );
    io.observe(slot);
    return () => {
      io.disconnect();
      window.clearTimeout(timer.current);
    };
  }, []);

  const replay = () => {
    setGo(false);
    flipAfter(RESET + HOLD);
  };

  return (
    <section id="reveal" className="rvl-slot" ref={sectionRef}>
      <div className={`rvl${inView ? ' in' : ''}`}>

      <div className="wrap">
        <div className="grid">
          <div className="rvl-copy">
            <span className="eyebrow">
              <i></i>The reveal
            </span>
            <h2>Nobody peeks first.</h2>
            <p>
              Answers stay sealed until you've both had your turn. Then they open
              together, and you find out what the other one wrote.
            </p>
            <button type="button" className="btn g" onClick={replay}>
              Replay the reveal
            </button>
          </div>

          <div className={`duo${go ? ' go' : ''}`} ref={duoRef}>
            <div className="ac">
              <div className="fa">
                <div className="who2">
                  <span className="av" style={{ background: '#2B1A0F', border: '1px solid #ffffff4d' }}>
                    Y
                  </span>
                  You
                </div>
                <p>{ANSWER}</p>
              </div>
              <div className="fb"><span>?</span></div>
            </div>

            <div className="ac">
              <div className="fa">
                <div className="who2">
                  <span className="av" style={{ background: '#D85A30' }}>
                    A
                  </span>
                  Ama · voice
                </div>
                <div className="wf">
                  {bars().map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }}></i>
                  ))}
                </div>
                <p className="wf-note">0:14 · tap to listen</p>
              </div>
              <div className="fb"><span>?</span></div>
            </div>

            <i className="burst" aria-hidden="true"></i>
            <i className="burst" aria-hidden="true"></i>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
