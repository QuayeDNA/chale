import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { DECKS as MARKETING_DECKS } from '../data/decks';
import { deckIcon } from '../lib/deck-icons';

const DECKS = Object.fromEntries(
  MARKETING_DECKS.map((deck) => [deck.slug, { ...deck, Icon: deckIcon(deck.icon) }]),
) as Record<
  string,
  (typeof MARKETING_DECKS)[number] & { Icon: ReturnType<typeof deckIcon> }
>;

const CARDS: [string, string][] = [
  ['love-and-relationships', 'When did you last feel completely understood by me?'],
  ['deep-talks', 'What belief did you hold at 18 that you have let go of?'],
  ['fun-and-silly', 'Which of us would survive longer in a zombie film?'],
  ['life-and-dreams', 'Where do we wake up in ten years?'],
  ['family-table', 'Which family story should we never stop telling?'],
  ['day-ones', 'What would you never tell the group chat?'],
  ['love-and-relationships', 'What do you need more of from me right now?'],
  ['deep-talks', 'When do you feel most like yourself around me?'],
];

const N = CARDS.length;

const C = { dur: 520, shift: 1.15, tilt: 15, lift: 30, scale: 0.07, depth: 2, shade: 0.08, fan: 3 };

function bez(x1: number, y1: number, x2: number, y2: number) {
  return (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let a = t;
    for (let i = 0; i < 8; i++) {
      const cx = 3 * x1;
      const bx = 3 * (x2 - x1) - cx;
      const ax = 1 - cx - bx;
      const x = ((ax * a + bx) * a + cx) * a - t;
      const d = (3 * ax * a + 2 * bx) * a + cx;
      if (Math.abs(d) < 1e-6) break;
      a -= x / d;
    }
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    return ((ay * a + by) * a + cy) * a;
  };
}

const easeOut = bez(0.22, 1, 0.36, 1);

type DragState = { x: number; p0: number; lx: number; lt: number; v: number; on: boolean };

export function DeckStack() {
  const deckRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const drag = useRef<DragState | null>(null);
  const reduced = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const st = useRef({
    p: 0,
    idx: 0,
    anim: null as { f: number; to: number; t0: number } | null,
    user: false,
    lastTouch: 0,
    raf: 0,
  });
  const [pos, setPos] = useState(0);

  const layout = useCallback(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const w = deck.clientWidth;
    const { p } = st.current;
    cardRefs.current.forEach((e, i) => {
      const shd = shadeRefs.current[i];
      if (!e || !shd) return;
      const o = i - p;
      let tx = 0;
      let ty = 0;
      let r = 0;
      let s = 1;
      let op = 1;
      let z = 30;
      let sh = 0;
      if (reduced.current) {
        op = Math.max(0, 1 - Math.abs(o));
        z = Math.abs(o) < 0.5 ? 30 : 10;
      } else if (o >= 0) {
        const t = Math.min(o, C.depth);
        s = 1 - C.scale * t;
        ty = C.lift * t;
        r = (i % 2 ? 1 : -1) * C.fan * Math.min(o, 1);
        op = o <= C.depth ? 1 : Math.max(0, 1 - (o - C.depth) * 2.5);
        z = 20 - Math.min(Math.round(o * 4), 16);
        sh = Math.min(1, t) * C.shade + Math.max(0, t - 1) * C.shade * 1.2;
      } else {
        const t = Math.min(-o, 1);
        tx = -t * w * C.shift * 1.1;
        ty = -10 * t;
        r = -t * C.tilt;
        s = 1 - 0.03 * t;
        op = Math.max(0, 1 - t * 1.25);
      }
      e.style.display = Math.abs(o) > C.depth + 1.6 ? 'none' : 'flex';
      e.style.zIndex = String(z);
      e.style.opacity = String(op);
      e.style.transform = `translateX(${tx}px) translateY(${ty}px) rotate(${r}deg) scale(${s})`;
      shd.style.opacity = String(sh);
    });
  }, []);

  const go = useCallback(
    (n: number) => {
      const s = st.current;
      n = Math.max(0, Math.min(N - 1, n));
      if (n === s.idx && !s.anim && Math.abs(s.p - n) < 0.01) return;
      s.idx = n;
      setPos(n);
      s.anim = { f: s.p, to: n, t0: performance.now() };
      cancelAnimationFrame(s.raf);
      const frame = (now: number) => {
        const a = st.current.anim;
        if (!a) return;
        const t = (now - a.t0) / C.dur;
        st.current.p = a.f + (a.to - a.f) * easeOut(Math.min(1, t));
        if (t >= 1) {
          st.current.p = a.to;
          st.current.anim = null;
        }
        layout();
        if (st.current.anim) st.current.raf = requestAnimationFrame(frame);
      };
      s.raf = requestAnimationFrame(frame);
    },
    [layout],
  );

  useEffect(() => {
    layout();
    const auto = setInterval(() => {
      const s = st.current;
      if (document.hidden) return;
      if (s.user && performance.now() - s.lastTouch < 10000) return;
      s.user = false;
      go(s.idx >= N - 1 ? 0 : s.idx + 1);
    }, 3800);
    return () => {
      clearInterval(auto);
      cancelAnimationFrame(st.current.raf);
      st.current.anim = null;
    };
  }, [go, layout]);

  const claim = () => {
    st.current.user = true;
    st.current.lastTouch = performance.now();
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    claim();
    drag.current = { x: e.clientX, p0: st.current.p, lx: e.clientX, lt: performance.now(), v: 0, on: false };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const dg = drag.current;
    const deck = deckRef.current;
    if (!dg || !deck) return;
    const dx = e.clientX - dg.x;
    if (!dg.on && Math.abs(dx) > 6) {
      dg.on = true;
      st.current.anim = null;
      cancelAnimationFrame(st.current.raf);
      deck.setPointerCapture(e.pointerId);
    }
    if (!dg.on) return;
    const span = deck.clientWidth * C.shift * 1.1;
    const raw = dg.p0 - dx / span;
    st.current.p = raw < 0 ? raw * 0.3 : raw > N - 1 ? N - 1 + (raw - (N - 1)) * 0.3 : raw;
    const now = performance.now();
    dg.v = (e.clientX - dg.lx) / Math.max(now - dg.lt, 1);
    dg.lx = e.clientX;
    dg.lt = now;
    layout();
  };

  const endDrag = () => {
    const dg = drag.current;
    const deck = deckRef.current;
    drag.current = null;
    if (!dg || !dg.on || !deck) return;
    const span = deck.clientWidth * C.shift * 1.1;
    const from = Math.round(dg.p0);
    const proj = st.current.p - (dg.v / span) * 220;
    const t = Math.max(0, Math.min(N - 1, Math.max(from - 1, Math.min(from + 1, Math.round(proj)))));
    st.current.idx = -9;
    go(t);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      claim();
      go(st.current.idx + 1);
    }
    if (e.key === 'ArrowLeft') {
      claim();
      go(st.current.idx - 1);
    }
  };

  return (
    <div
      ref={deckRef}
      className="deck"
      tabIndex={0}
      aria-label="Sample question cards. Use arrow keys or drag."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
    >
        {CARDS.map(([key, q], i) => {
          const d = DECKS[key];
          const Icon = d.Icon;
          return (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="hc"
              style={{ '--f': d.fill, '--k': d.ink } as CSSProperties}
            >
              <Icon size={240} strokeWidth={1.4} className="art" aria-hidden="true" />
              <div className="top">
                <span className="ic">
                  <Icon size={22} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <span className="chip">{d.name.toUpperCase()}</span>
              </div>
              <div className="q">{q}</div>
              <div className="m">
                {String(i + 1).padStart(2, '0')} / {String(N).padStart(2, '0')} &middot; {d.count} questions
              </div>
              <div
                className="shd"
                ref={(el) => {
                  shadeRefs.current[i] = el;
                }}
              />
            </div>
          );
        })}
      <span className="vh" aria-live="polite">
        Card {pos + 1} of {N}
      </span>
    </div>
  );
}
