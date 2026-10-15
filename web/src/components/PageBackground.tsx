import { useEffect } from 'react';

/**
 * The landing's ambient background: a fixed layer of seven sparse brand
 * washes in varied organic shapes, sitting behind the whole page (z-index
 * -1, between the html ground and the content). Each blob drifts on its own
 * slow desynced loop — the marquee, deck, and simulations are sharper motion,
 * this is the room breathing behind them.
 *
 * While the page scrolls the blobs hold still (an `is-scrolling` flag on
 * <html>, cleared 150ms after the last scroll event): the nav's backdrop
 * blur re-samples everything behind it every scroll frame, and the drift
 * stacked on top of that saturates weak renderers until the bar visibly
 * tears mid-fling. Pausing the room while the camera moves keeps the glass
 * locked; nobody watches the blobs during a fling anyway.
 */
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
