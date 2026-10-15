import { Link } from 'react-router-dom';

import crownUrl from '../assets/brand/crown.svg';
import sparkleUrl from '../assets/chale-brand-svgs/doodles/sparkle.svg';
import star4Url from '../assets/chale-brand-svgs/doodles/star-4.svg';
import slashesGreenUrl from '../assets/chale-brand-svgs/doodles/slashes-green.svg';
import { DeckStack } from './DeckStack';

/**
 * The hero. Copy on the left (headline sized to its own column), the draggable
 * deck on a stage on the right. Decorative layers (blobs, doodles, hint) are
 * aria-hidden and pointer-events: none.
 */
export function Hero() {
  return (
    <header className="hero" id="top">
      <svg className="backdrop" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path className="blob pk" d="M1344 168C1344 201 1307 260 1281 286C1256 312 1221 325 1190 325C1158 325 1121 312 1093 286C1065 259 1024 198 1023 164C1021 130 1057 111 1082 84C1107 57 1137 2 1171 3C1204 3 1252 61 1281 88C1310 116 1344 135 1344 168Z" /><path className="blob pu" d="M208 699C205 732 165 762 145 782C125 803 115 818 87 822C58 827 -1 831 -27 810C-52 788 -65 728 -65 693C-65 658 -47 620 -26 601C-6 581 25 577 57 574C90 571 141 563 166 584C191 604 212 666 208 699Z" /><path className="blob or" d="M1432 683C1431 707 1418 755 1403 770C1387 786 1358 777 1337 774C1316 772 1291 770 1276 755C1262 740 1250 706 1249 685C1248 664 1258 644 1271 630C1284 616 1302 598 1325 598C1347 597 1389 613 1406 627C1424 641 1432 659 1432 683Z" /><path className="blob ye" d="M726 50C727 70 717 116 704 129C690 143 666 134 645 132C623 130 591 127 576 116C561 105 554 84 554 65C554 45 562 12 575 -1C588 -14 612 -13 632 -11C653 -8 683 3 699 13C715 23 725 31 726 50Z" /></svg>
      <div className="wrap">
        <div className="copy">
          <span className="eyebrow"><i aria-hidden="true"></i>Question cards for people you're close to</span>
          <h1>
            <span className="ln"><span>Questions worth<img src={crownUrl} className="h-crown" alt="" aria-hidden="true" /></span></span>
            <span className="ln"><span><em>passing the phone<svg viewBox="0 0 400 20" preserveAspectRatio="none" aria-hidden="true"><path d="M4 12 C 60 2, 110 18, 170 9 S 290 3, 396 11" /></svg></em></span></span>
            <span className="ln"><span>for.<img src={sparkleUrl} className="spark" alt="" aria-hidden="true" /></span></span>
          </h1>
          <p className="lede">Chale is decks of question cards for your person, your family, your friends. Play through them together on one phone, or trade answers by text and voice when you're apart.</p>
          <div className="actions">
            <span className="btn p" aria-disabled="true"><i className="dot" aria-hidden="true"></i>Coming to Android &amp; iOS</span>
            <Link className="btn o" to="/terms">
              Read the terms<span className="arr" aria-hidden="true">→</span>
            </Link>
          </div>
          <ul className="facts">
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="5" width="12" height="16" rx="2" /><path d="M8 3h10a2 2 0 0 1 2 2v12" /></svg>6 decks</li>
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