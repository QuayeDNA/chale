import { Link } from 'react-router-dom';

import { DeckStack } from './DeckStack';

/**
 * The hero — eyebrow, the giant headline with its self-drawing underline,
 * lede, the two actions, and the small print, over the drifting rings.
 * The right column is the draggable deck stack.
 */
export function Hero() {
  return (
    <header className="hero" id="top">
      <i className="ring r1" aria-hidden="true"></i>
      <i className="ring r2" aria-hidden="true"></i>
      <div className="wrap">
        <div>
          <span className="eyebrow">
            <i aria-hidden="true"></i>Question cards for people you're close to
          </span>
          <h1>
            Questions worth <em>passing the phone
              <svg viewBox="0 0 400 20" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 12 C 60 2, 110 18, 170 9 S 290 3, 396 11" />
              </svg>
            </em> for.
          </h1>
          <p className="lede">
            Chale is decks of question cards for your person, your family, your friends.
            Play through them together on one phone, or trade answers by text and voice
            when you're apart.
          </p>
          <div className="actions">
            <span className="btn p" aria-disabled="true">
              Coming to Android &amp; iOS
            </span>
            <Link className="btn o" to="/terms">
              Read the terms
            </Link>
          </div>
          <p className="small">The beta isn't public yet. The card on the right is real: drag it.</p>
        </div>
        <div>
          <DeckStack />
        </div>
      </div>
    </header>
  );
}
