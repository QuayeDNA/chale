import crownUrl from '../assets/brand/crown.svg';
import sparkleUrl from '../assets/chale-brand-svgs/doodles/sparkle.svg';
import star4Url from '../assets/chale-brand-svgs/doodles/star-4.svg';
import slashesGreenUrl from '../assets/chale-brand-svgs/doodles/slashes-green.svg';
import { DECK_STATS } from '../data/decks';
import { DeckStack } from './DeckStack';

export function Hero() {
  return (
    <header className="hero" id="top">
      <div className="wrap">
        <div className="copy">
          <h1>
            <span className="ln"><span>Questions worth<img src={crownUrl} className="h-crown" alt="" aria-hidden="true" /></span></span>
            <span className="ln"><span><em>passing the phone<svg viewBox="0 0 400 20" preserveAspectRatio="none" aria-hidden="true"><path d="M4 12 C 60 2, 110 18, 170 9 S 290 3, 396 11" /></svg></em></span></span>
            <span className="ln"><span>for.<img src={sparkleUrl} className="spark" alt="" aria-hidden="true" /></span></span>
          </h1>
          <p className="lede">Chale is decks of question cards for your person, your family, your friends. Play together on one phone. Or, with your partner, trade answers by text and voice when you&apos;re apart.</p>
          <div className="actions">
            <a className="btn p" href="#cta"><i className="dot" aria-hidden="true"></i>Join the Android beta</a>
            <a className="btn o" href="#ways">
              See how it works<span className="arr" aria-hidden="true">&rarr;</span>
            </a>
          </div>
          <ul className="facts">
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="5" width="12" height="16" rx="2" /><path d="M8 3h10a2 2 0 0 1 2 2v12" /></svg>{DECK_STATS.total} decks</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4" /></svg>Text or voice</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>No account to play in person</li>
          </ul>
        </div>
        <div className="stage">
          <span className="hint-tag" aria-hidden="true">Drag me<svg viewBox="0 0 56 48"><g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4 C 30 2, 42 16, 40 36" /><path d="M31 28 L40 39 L48 28" /></g></svg></span>
          <DeckStack />
<img src={sparkleUrl} className="dd sp" alt="" aria-hidden="true" />
<img src={star4Url} className="dd st" alt="" aria-hidden="true" />
<img src={slashesGreenUrl} className="dd sl" alt="" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
