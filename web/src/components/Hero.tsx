import { Link } from 'react-router-dom';

import crownUrl from '../assets/brand/crown.svg';
import sparkleUrl from '../assets/chale-brand-svgs/doodles/sparkle.svg';
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
      <img src={crownUrl} className="crown" alt="" aria-hidden="true" />
      <div className="wrap">
        <div className="copy">
          <span className="eyebrow"><i aria-hidden="true"></i>Question cards for people you're close to</span>
          <h1>
            <span className="ln"><span>Questions worth</span></span>
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
          <svg className="dd sp" viewBox="0 0 100 100" aria-hidden="true"><g stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none"><path d="M68.4 51.9 L88.1 53.9" /><path d="M61.2 65.1 L68.7 75.2" /><path d="M48.9 70.0 L48.0 88.0" /><path d="M30.6 60.4 L19.5 66.4" /><path d="M31.5 45.3 L12.3 40.4" /><path d="M39.0 34.0 L32.9 25.1" /><path d="M51.5 31.5 L52.9 15.4" /><path d="M67.5 35.6 L77.2 27.6" /><circle cx="50" cy="50" r="3.2" fill="currentColor" stroke="none" /></g></svg>
          <svg className="dd st" viewBox="0 0 100 100" aria-hidden="true"><path d="M51 6 C53 30 63 44 94 49 C63 56 53 70 49 95 C47 70 37 56 6 51 C37 44 47 30 51 6 Z" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <svg className="dd sl" viewBox="0 0 130 100" aria-hidden="true"><path d="M19.4 83.0 L20.4 81.8 L21.7 80.5 L23.3 79.0 L25.3 77.4 L27.4 75.7 L29.4 73.7 L31.1 71.4 L32.9 69.0 L34.7 66.6 L36.4 64.1 L38.2 61.7 L40.0 59.4 L41.8 57.3 L43.5 55.2 L45.3 53.2 L47.1 51.2 L49.0 49.2 L50.8 47.2 L52.7 45.2 L54.6 43.2 L56.6 41.3 L58.6 39.4 L60.7 37.6 L62.8 35.8 L65.0 34.1 L67.3 32.5 L69.6 31.0 L72.0 29.5 L74.5 28.0 L77.4 26.6 L80.4 25.1 L83.7 23.5 L87.0 22.0 L90.4 20.5 L93.8 19.1 L97.1 17.7 L100.3 16.4 L103.4 15.2 L106.2 14.1 L108.7 13.2 L110.9 12.4 L112.6 11.8 L111.4 8.2 L109.6 8.8 L107.5 9.5 L104.9 10.3 L102.0 11.0 L98.9 11.9 L95.5 12.7 L91.9 13.7 L88.3 14.7 L84.7 15.8 L81.0 16.9 L77.5 18.2 L74.1 19.5 L70.9 21.0 L68.0 22.5 L65.3 24.1 L62.7 25.8 L60.2 27.6 L57.8 29.4 L55.4 31.2 L53.1 33.1 L50.9 35.0 L48.7 36.9 L46.6 38.9 L44.5 40.8 L42.4 42.8 L40.4 44.8 L38.4 46.8 L36.5 48.8 L34.5 50.9 L32.5 53.2 L30.5 55.7 L28.5 58.2 L26.6 60.7 L24.8 63.3 L23.1 65.8 L21.5 68.3 L20.4 71.0 L19.6 73.6 L18.9 76.0 L18.2 78.1 L17.4 79.7 L16.6 81.0Z" fill="#2E7D46" /><path d="M41.1 93.1 L42.0 92.2 L43.3 91.3 L44.9 90.3 L46.8 89.3 L48.7 88.2 L50.6 86.8 L52.3 85.1 L54.0 83.3 L55.8 81.6 L57.6 79.8 L59.3 78.0 L61.1 76.4 L62.9 74.8 L64.6 73.3 L66.4 71.9 L68.3 70.4 L70.2 68.9 L72.2 67.4 L74.2 66.0 L76.3 64.5 L78.4 63.1 L80.6 61.8 L82.7 60.5 L84.9 59.3 L87.0 58.2 L89.2 57.1 L91.3 56.1 L93.3 55.2 L95.3 54.4 L97.4 53.6 L99.7 52.8 L102.1 52.1 L104.5 51.4 L106.9 50.7 L109.2 50.2 L111.5 49.6 L113.8 49.2 L115.9 48.8 L117.8 48.4 L119.5 48.1 L121.0 47.9 L122.3 47.6 L121.7 44.4 L120.5 44.6 L119.0 44.7 L117.3 44.9 L115.4 45.1 L113.2 45.2 L110.9 45.4 L108.5 45.6 L106.0 45.8 L103.4 46.1 L100.8 46.4 L98.2 46.8 L95.7 47.4 L93.1 48.0 L90.7 48.8 L88.4 49.7 L86.1 50.7 L83.8 51.8 L81.5 53.0 L79.2 54.2 L76.9 55.5 L74.6 56.9 L72.3 58.2 L70.0 59.6 L67.8 61.0 L65.6 62.4 L63.5 63.8 L61.4 65.2 L59.4 66.7 L57.4 68.2 L55.4 69.9 L53.4 71.7 L51.4 73.5 L49.5 75.4 L47.7 77.3 L46.0 79.1 L44.3 81.0 L43.1 83.0 L42.1 85.1 L41.3 87.0 L40.5 88.7 L39.7 90.0 L38.9 90.9Z" fill="#4F9E5C" /><path d="M15.0 45.0 L15.6 44.6 L16.5 44.2 L17.7 43.9 L19.1 43.6 L20.2 42.9 L21.0 42.0 L21.9 41.0 L22.8 40.0 L23.7 38.9 L24.6 37.9 L25.4 36.9 L26.3 36.0 L27.1 35.3 L27.8 34.6 L28.6 34.1 L29.5 33.5 L30.5 33.0 L31.5 32.4 L32.6 31.8 L33.6 31.2 L34.6 30.6 L35.7 30.0 L36.6 29.4 L37.6 28.9 L38.5 28.4 L39.3 28.0 L40.0 27.7 L40.6 27.4 L39.4 24.6 L38.9 24.8 L38.2 25.0 L37.3 25.2 L36.3 25.3 L35.3 25.5 L34.1 25.7 L32.9 25.9 L31.6 26.2 L30.3 26.5 L29.0 26.9 L27.7 27.4 L26.5 28.0 L25.3 28.7 L24.2 29.4 L23.0 30.1 L21.9 31.0 L20.7 31.8 L19.6 32.8 L18.5 33.7 L17.4 34.7 L16.3 35.8 L15.4 36.8 L14.5 37.8 L13.9 39.0 L13.7 40.3 L13.6 41.5 L13.4 42.4 L13.0 43.0Z" fill="#2E7D46" /></svg>
        </div>
      </div>
    </header>
  );
}