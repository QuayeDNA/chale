import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <span>© Chale · made by DNA-Studios</span>
        <span className="site-foot-links">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </span>
      </div>
    </footer>
  );
}
