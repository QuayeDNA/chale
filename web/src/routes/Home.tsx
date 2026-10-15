import { BrandFooter } from '../components/BrandChrome';
import { Decks } from '../components/Decks';
import { Hero } from '../components/Hero';
import { Marquee } from '../components/Marquee';
import { PageBackground } from '../components/PageBackground';
import { SiteNav } from '../components/SiteNav';
import { Ways } from '../components/Ways';

export function Home() {
  return (
    <>
      <PageBackground />
      <SiteNav />
      <Hero />
      <Marquee />
      <Ways />
      <Decks />
      <div className="page">
        <BrandFooter />
      </div>
    </>
  );
}
