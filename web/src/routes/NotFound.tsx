import { BrandFooter, BrandHeader } from '../components/BrandChrome';

export function NotFound() {
  return (
    <div className="page panel">
      <BrandHeader />
      <div className="card state is-active">
        <h1 className="panel-title">Nothing here</h1>
        <p>That page doesn't exist. The app lives on your phone.</p>
        <a className="button button-block" href="/">
          Back to the start
        </a>
      </div>
      <BrandFooter />
    </div>
  );
}
