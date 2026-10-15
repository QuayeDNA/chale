import { Link } from 'react-router-dom';

import lockupLight from '../assets/brand/lockup-light.svg';
import lockupDark from '../assets/brand/lockup-dark.svg';

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
