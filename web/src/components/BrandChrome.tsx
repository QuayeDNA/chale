import { Link } from 'react-router-dom';

import lockupLight from '../assets/brand/lockup-light.svg';
import lockupDark from '../assets/brand/lockup-dark.svg';

/**
 * The brand lockup, swapped by the visitor's colour scheme — the same rule the
 * app uses: ink artwork on light paper, cream artwork on dark paper. The class
 * names describe the ARTWORK, not the theme; the CSS does the swap.
 */
export function BrandHeader() {
  return (
    <header className="brand-header">
      <div className="brand-lockup">
        <img className="brand-dark" src={lockupDark} alt="Chale — better questions, deeper chats" />
        <img className="brand-light" src={lockupLight} alt="Chale — better questions, deeper chats" />
      </div>
    </header>
  );
}

export function BrandFooter() {
  return (
    <footer className="foot">
      Made by DNA-Studios · <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link>
    </footer>
  );
}
