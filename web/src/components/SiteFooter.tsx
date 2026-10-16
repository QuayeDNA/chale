import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YoutubeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

const SOCIALS: { label: string; href: string; Icon: ComponentType<{ size?: number }> }[] = [
  { label: 'Chale on Instagram', href: 'https://instagram.com/chaleapp', Icon: InstagramIcon },
  { label: 'Chale on X', href: 'https://x.com/chaleapp', Icon: XIcon },
  { label: 'Chale on YouTube', href: 'https://youtube.com/@chaleapp', Icon: YoutubeIcon },
];

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <span className="site-foot-brand">
          © Chale · made by{' '}
          <a href="https://dna-studios.space" target="_blank" rel="noreferrer">
            DNA-Studios
          </a>
        </span>
        <span className="site-foot-right">
          <span className="site-foot-socials">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>
                <Icon size={18} />
              </a>
            ))}
          </span>
          <span className="site-foot-links">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </span>
        </span>
      </div>
    </footer>
  );
}
