import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Heart, Home, Lock, MessageCircle, Moon, Sparkle, Sun, Users } from 'lucide-react';

const DECKS = [
  { key: 'love', name: 'Love & Relationships', fill: '#D85A30', ink: '#fff', Icon: Heart, count: 100, q: 'What small thing do I do that makes you feel loved?' },
  { key: 'deep', name: 'Deep Talks', fill: '#2B4BD8', ink: '#fff', Icon: MessageCircle, count: 80, q: 'What belief did you hold at 18 that you have let go of?' },
  { key: 'fun', name: 'Fun & Silly', fill: '#F5B400', ink: '#2B1A0F', Icon: Sun, count: 60, q: 'Which of us would survive longer in a zombie film?' },
  { key: 'dreams', name: 'Life & Dreams', fill: '#1E7A3C', ink: '#fff', Icon: Sparkle, count: 75, q: 'Where do we wake up in ten years?' },
  { key: 'family', name: 'Family', fill: '#639922', ink: '#fff', Icon: Home, count: 65, q: 'Which family story should we never stop telling?' },
  { key: 'friends', name: 'Friends', fill: '#D4537E', ink: '#fff', Icon: Users, count: 80, q: 'What would you never tell the group chat?' },
  { key: 'late', name: 'Late Night', fill: '#6A55D8', ink: '#fff', Icon: Moon, count: 0, q: 'What do you think about when you cannot sleep?', locked: true },
] as const;

const SPEED = 0.03;
const RESUME_DELAY = 1400;
const DRAG_SLOP = 14;
const HIDE_AFTER = 5000;

export function Decks() {
  const sectionRef = useRef<HTMLElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [dragging, setDragging] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const held = useRef(false);
  const resumeAt = useRef(0);
  const seen = useRef(false);
  const down = useRef(false);
  const moved = useRef(0);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const draggingRef = useRef(false);
  const stopDrag = useRef<(() => void) | null>(null);
  const suppressFlip = useRef(false);

  const setWidth = () => setRef.current?.offsetWidth ?? 0;

  const recentre = (track: HTMLDivElement, value: number) => {
    const w = setWidth();
    if (!w) return value;
    const max = track.scrollWidth - track.clientWidth;
    if (value <= 0) return value + w;
    if (value >= max - 1) return value - w;
    return value;
  };

  useEffect(() => {
    const shelf = shelfRef.current;
    const first = setRef.current;
    if (!shelf || !first) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      if (!held.current && !down.current && seen.current && !document.hidden && now >= resumeAt.current) {
        const w = setWidth();
        if (w > 0) {
          let next = shelf.scrollLeft + SPEED * dt;
          if (next >= w) next -= w;
          shelf.scrollLeft = next;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const shelf = shelfRef.current;
    const first = setRef.current;
    if (!shelf || !first) return;
    const fit = () => {
      const w = first.offsetWidth;
      if (!w) return;
      const needed = Math.max(2, Math.ceil((shelf.clientWidth + w) / w));
      setCopies((c) => (c === needed ? c : needed));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(shelf);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const shelf = shelfRef.current;
    if (!shelf) return;
    const io = new IntersectionObserver(([entry]) => { seen.current = entry.isIntersecting; }, { threshold: 0 });
    io.observe(shelf);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setRevealed(true);
        io.disconnect();
      }
    }, { threshold: 0.15 });
    io.observe(section);
    return () => io.disconnect();
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    suppressFlip.current = false;
    moved.current = 0;
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const shelf = shelfRef.current;
    if (!shelf) return;
    down.current = true;
    startX.current = event.clientX;
    startScroll.current = shelf.scrollLeft;

    const move = (e: globalThis.PointerEvent) => {
      const dx = e.clientX - startX.current;
      moved.current = Math.max(moved.current, Math.abs(dx));
      if (Math.abs(dx) < DRAG_SLOP && !draggingRef.current) return;
      if (!draggingRef.current) {
        draggingRef.current = true;
        setDragging(true);
        held.current = true;
      }
      const track = shelfRef.current;
      if (track) track.scrollLeft = recentre(track, startScroll.current - dx);
    };

    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      stopDrag.current = null;
      down.current = false;
      suppressFlip.current = moved.current >= DRAG_SLOP;
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragging(false);
      held.current = false;
      resumeAt.current = performance.now() + RESUME_DELAY;
    };

    stopDrag.current = up;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  useEffect(() => () => { stopDrag.current?.(); }, []);

  const onCardMove = (event: PointerEvent<HTMLButtonElement>, key: string) => {
    if (event.pointerType === 'touch' || flipped[key] || down.current) return;
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const tilt = card.querySelector<HTMLElement>('.t');
    const face = card.querySelector<HTMLElement>('.f');
    if (tilt) {
      tilt.style.setProperty('--ry', `${(x - 0.5) * 18}deg`);
      tilt.style.setProperty('--rx', `${-(y - 0.5) * 14}deg`);
    }
    if (face) {
      face.style.setProperty('--gx', `${x * 100}%`);
      face.style.setProperty('--gy', `${y * 100}%`);
      face.style.setProperty('--gl', '1');
    }
  };

  const onCardLeave = (event: PointerEvent<HTMLButtonElement>) => {
    const card = event.currentTarget;
    const tilt = card.querySelector<HTMLElement>('.t');
    const face = card.querySelector<HTMLElement>('.f');
    tilt?.style.setProperty('--rx', '0deg');
    tilt?.style.setProperty('--ry', '0deg');
    face?.style.setProperty('--gl', '0');
  };

  const hideTimers = useRef(new Map<string, number>());

  const clearHide = (key: string) => {
    const timer = hideTimers.current.get(key);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      hideTimers.current.delete(key);
    }
  };

  useEffect(() => {
    const timers = hideTimers.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const toggle = (key: string) => {
    if (suppressFlip.current) return;
    const opening = !flipped[key];
    clearHide(key);
    if (opening) {
      hideTimers.current.set(
        key,
        window.setTimeout(() => {
          hideTimers.current.delete(key);
          setFlipped((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }, HIDE_AFTER),
      );
    }
    setFlipped((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section
      id="decks"
      ref={sectionRef}
      onPointerEnter={() => { held.current = true; }}
      onPointerLeave={() => {
        held.current = false;
        resumeAt.current = performance.now() + RESUME_DELAY;
      }}
    >
      <div className="wrap">
        <span className={`eyebrow rv${revealed ? ' in' : ''}`}><i></i>The decks</span>
        <h2 className={`rv${revealed ? ' in' : ''}`}>Pick a mood. Tap to peek inside.</h2>
      </div>

      <div
        ref={shelfRef}
        className={`shelf${dragging ? ' is-dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerCancel={() => { suppressFlip.current = true; }}
      >
        {Array.from({ length: copies }, (_, copy) => (
          <div
            key={copy}
            ref={copy === 0 ? setRef : undefined}
            className="decks-set"
            inert={copy > 0 || undefined}
            aria-hidden={copy > 0 || undefined}
          >
            {DECKS.map((deck) => {
              const { Icon } = deck;
              const isFlipped = Boolean(flipped[deck.key]);
              const vars = { '--f': deck.fill, '--k': deck.ink } as CSSProperties;
              return (
                <button
                  key={deck.key}
                  type="button"
                  className={`dk${isFlipped ? ' on' : ''}${'locked' in deck ? ' lock' : ''}`}
                  style={vars}
                  aria-label={`${deck.name}. ${'locked' in deck ? 'A peek, not the whole deck.' : 'Tap to peek inside.'}`}
                  aria-pressed={isFlipped}
                  onPointerMove={(e) => onCardMove(e, deck.key)}
                  onPointerLeave={onCardLeave}
                  onKeyDown={() => { suppressFlip.current = false; }}
                  onClick={() => toggle(deck.key)}
                >
                  <span className="t">
                    <span className="fl">
                      <span className="f">
                        <Icon className="art" strokeWidth={1.4} aria-hidden />
                        <span className="ic"><Icon size={22} strokeWidth={2.2} aria-hidden /></span>
                        <span className="fc">
                          <h3>{deck.name}</h3>
                          <div className="m">{'locked' in deck ? 'Paid · coming soon' : `${deck.count} questions`}</div>
                        </span>
                        {'locked' in deck && (
                          <span className="tag"><Lock size={11} strokeWidth={2.4} aria-hidden />PAID</span>
                        )}
                      </span>
                      <span className="b">
                        <i className="c"></i>
                        <span className="flipnote">{'locked' in deck ? 'A peek, not the whole deck' : 'Sample question'}</span>
                        <span className="q">{deck.q}</span>
                        <span className="flipnote">{'locked' in deck ? 'Unlocks when Late Night ships' : 'Tap to flip back'}</span>
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="wrap">
        <div className={`steps rv${revealed ? ' in' : ''}`}>
          <div>
            <b>1</b>
            <h3>Pick a deck</h3>
            <p>Love, deep talks, fun and silly. Each deck is played twenty questions at a sitting.</p>
          </div>
          <div>
            <b>2</b>
            <h3>Play your way</h3>
            <p>One phone between you, or the same turns from wherever you are. Questions never repeat until you've heard every one.</p>
          </div>
          <div>
            <b>3</b>
            <h3>Reveal</h3>
            <p>When you're both done, the answers unlock. That's the moment the deck exists for.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
