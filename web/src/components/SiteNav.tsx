import lockupLightNoSubtitle from '../assets/brand/lockup-no-subtitle-light.svg';
import lockupDarkNoSubtitle from '../assets/brand/lockup-no-subtitle-dark.svg';
import { ThemeToggle } from './ThemeToggle';

export function SiteNav() {
  return (
    <>
      <div className="nav-spacer" aria-hidden="true" />
      <nav className="site-nav">
      <div className="wrap">
        <a className="logo" href="#top" aria-label="Chale">
          <img className="brand-dark" src={lockupDarkNoSubtitle} alt="Chale" />
          <img className="brand-light" src={lockupLightNoSubtitle} alt="Chale" />
        </a>
        <ul>
          <li>
            <a href="#ways">Two ways to play</a>
          </li>
          <li>
            <a href="#decks">Decks</a>
          </li>
          <li>
            <a href="#reveal">The reveal</a>
          </li>
        </ul>
        <span className="pill" aria-disabled="true">
          <span className="pill-full">Coming to Android &amp; iOS</span>
          <span className="pill-short">Coming soon</span>
        </span>
        <ThemeToggle />
      </div>
    </nav>
    </>
  );
}
