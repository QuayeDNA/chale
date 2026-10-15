/**
 * The landing's ambient background: a fixed layer of seven sparse brand
 * washes in varied organic shapes, sitting behind the whole page (z-index
 * -1, between the html ground and the content). Each blob drifts on its own
 * slow desynced loop — the marquee, deck, and simulations are sharper motion,
 * this is the room breathing behind them.
 */
export function PageBackground() {
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
