import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import lockupLightNoSubtitle from '../assets/brand/lockup-no-subtitle-light.svg';
import lockupDarkNoSubtitle from '../assets/brand/lockup-no-subtitle-dark.svg';
import { ThemeToggle } from './ThemeToggle';

const LINKS = [
  { href: '#ways', label: 'Two ways to play' },
  { href: '#decks', label: 'Decks' },
  { href: '#reveal', label: 'The reveal' },
  { href: '#cta', label: 'Early access' },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [hung, setHung] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const hungTimer = useRef<number | undefined>(undefined);
  const rearm = useRef(true);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 200 && rearm.current) {
        rearm.current = false;
        setHung(true);
        window.clearTimeout(hungTimer.current);
        hungTimer.current = window.setTimeout(() => setHung(false), 4500);
      } else if (y <= 120) {
        rearm.current = true;
        window.clearTimeout(hungTimer.current);
        setHung(false);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(hungTimer.current);
    };
  }, []);

  return (
    <>
      <div className="nav-spacer" aria-hidden="true" />
      <nav className="site-nav" ref={navRef}>
        <div className="wrap">
          <a className="logo" href="#top" aria-label="Chale">
            <img className="brand-dark" src={lockupDarkNoSubtitle} alt="Chale" />
            <img className="brand-light" src={lockupLightNoSubtitle} alt="Chale" />
          </a>
          <ul className="nav-links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
          <a className="pill" href="#cta">
            <span className="pill-full">Join early access</span>
            <span className="pill-short">Join</span>
          </a>
          <ThemeToggle />
          <button
            type="button"
            className="nav-burger"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <div id="site-menu" className={`nav-menu${open ? ' open' : ''}`} inert={!open}>
          <ul>
            {LINKS.map((l, i) => (
              <li key={l.href} style={{ transitionDelay: open ? `${i * 70}ms` : '0ms' }}>
                <a href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className={`nav-hanger${hung ? ' dropped' : ''}`}>
        <div className="hanger-swing">
          <a className="pill" href="#cta">
            <span className="pill-full">Join early access</span>
            <span className="pill-short">Join beta</span>
          </a>
        </div>
      </div>
    </>
  );
}
