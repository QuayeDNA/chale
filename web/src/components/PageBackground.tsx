import { useEffect } from 'react';

export function PageBackground() {
  useEffect(() => {
    let t = 0;
    const onScroll = () => {
      document.documentElement.classList.add('is-scrolling');
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        document.documentElement.classList.remove('is-scrolling');
      }, 150);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(t);
    };
  }, []);
  return (
    <div className="page-bg" aria-hidden="true">
      <i className="b1"></i>
      <i className="b2"></i>
      <i className="b3"></i>
      <i className="b4"></i>
      <i className="b5"></i>
      <i className="b6"></i>
      <i className="b7"></i>
    </div>
  );
}
