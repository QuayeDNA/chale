import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type SiteTheme = 'light' | 'dark';

const STORAGE_KEY = 'chale-theme';
const SPRING = { damping: 32, stiffness: 350, mass: 1 };
const META_COLORS = { light: '#fbf3df', dark: '#231408' } as const;

function readTheme(): SiteTheme {
  const attr = document.documentElement.dataset.theme;
  if (attr === 'light' || attr === 'dark') return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function writeTheme(next: SiteTheme) {
  const apply = () => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {

    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[next]);
  };
  if (typeof document.startViewTransition === 'function') {
    document.startViewTransition(apply);
  } else {
    apply();
  }
}

function step(x: number, v: number, target: number, dt: number) {
  const force = -SPRING.stiffness * (x - target) - SPRING.damping * v;
  const nv = v + (force / SPRING.mass) * dt;
  return { x: x + nv * dt, v: nv };
}

function useSpringTo(target: number, snap: boolean): number {
  const [value, setValue] = useState(target);
  const pos = useRef(target);
  const vel = useRef(0);
  const targetRef = useRef(target);
  targetRef.current = target;
  const [reduceMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (snap || reduceMotion) {
      pos.current = targetRef.current;
      vel.current = 0;
      setValue(targetRef.current);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const next = step(pos.current, vel.current, targetRef.current, dt);
      pos.current = next.x;
      vel.current = next.v;
      if (Math.abs(next.x - targetRef.current) < 0.05 && Math.abs(next.v) < 2) {
        pos.current = targetRef.current;
        vel.current = 0;
        setValue(targetRef.current);
        return;
      }
      setValue(next.x);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, snap, reduceMotion]);

  return value;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<SiteTheme>(readTheme);
  const [rect, setRect] = useState<{ x: number; width: number } | null>(null);
  const [placed, setPlaced] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLButtonElement>(null);
  const darkRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const el = theme === 'light' ? lightRef.current : darkRef.current;
      if (!el) return;
      const next = { x: el.offsetLeft, width: el.offsetWidth };
      setRect((prev) => (prev && prev.x === next.x && prev.width === next.width ? prev : next));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(track);
    return () => ro.disconnect();
  }, [theme]);

  useEffect(() => {
    if (rect && !placed) setPlaced(true);
  }, [rect, placed]);

  const x = useSpringTo(rect?.x ?? 0, !placed);
  const width = useSpringTo(rect?.width ?? 0, !placed);

  const choose = (next: SiteTheme) => {
    if (next === theme) return;
    setTheme(next);
    writeTheme(next);
  };

  return (
    <div className="theme-toggle" role="group" aria-label="Colour theme" ref={trackRef}>
      <span
        className={`theme-toggle-pill${rect ? ' is-placed' : ''}`}
        style={{ transform: `translateX(${x}px)`, width: `${width}px` }}
        aria-hidden="true"
      />
      <button
        ref={lightRef}
        type="button"
        title="Light"
        aria-pressed={theme === 'light'}
        onClick={() => choose('light')}
      >
        <Sun size={18} key={theme} className={theme === 'light' ? 'tt-pop' : undefined} />
      </button>
      <button
        ref={darkRef}
        type="button"
        title="Dark"
        aria-pressed={theme === 'dark'}
        onClick={() => choose('dark')}
      >
        <Moon size={18} key={theme} className={theme === 'dark' ? 'tt-pop' : undefined} />
      </button>
    </div>
  );
}
