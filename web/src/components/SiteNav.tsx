import lockupLightNoSubtitle from '../assets/brand/lockup-no-subtitle-light.svg';
import lockupDarkNoSubtitle from '../assets/brand/lockup-no-subtitle-dark.svg';
/**
 * The site nav — sticky, blurred, the wordmark in Archivo Black with the
 * street-yellow dot, the section anchors, and the store pill.
 *
 * Colour note: the mockup hardcodes a light translucent bar (#FBF3DFcc on
 * #EDE0BE88). The same look is expressed here with color-mix over the theme
 * vars so the bar works in dark mode too, where those hexes would be a solid
 * cream slab.
 */
export function SiteNav() {
  return (
    <nav className="site-nav">
      <div className="wrap">
        <a className="logo" href="#top">
          chale<i></i>
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
          Coming to Android &amp; iOS
        </span>
      </div>
    </nav>
  );
}
