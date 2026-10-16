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
  const navRef = useRef<HTMLElement>(null);

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
          <span className="pill" aria-disabled="true">
            <span className="pill-full">Coming to Android &amp; iOS</span>
            <span className="pill-short">Coming soon</span>
          </span>
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
    </>
  );
}
