import { BrandFooter } from '../components/BrandChrome';
import { Hero } from '../components/Hero';
import { Marquee } from '../components/Marquee';
import { SiteNav } from '../components/SiteNav';
import { Ways } from '../components/Ways';

export function Home() {
  return (
    <>
      <SiteNav />
      <Hero />
      <Marquee />
      <Ways />
      <div className="page">

      <main className="landing">
        <section className="landing-section">
          <h2>How it works</h2>
          <ol className="steps">
            <li>
              <span>
                <strong>Pick a deck</strong>
                Love &amp; relationships, deep talks, fun &amp; silly — each one
                is a hundred questions, played twenty at a sitting.
              </span>
            </li>
            <li>
              <span>
                <strong>Play your way</strong>
                Together on one phone, or apart with a card a day. The questions
                never repeat until you've heard every one.
              </span>
            </li>
            <li>
              <span>
                <strong>Reveal</strong>
                When you're both done, answers unlock — that's the moment the
                deck exists for.
              </span>
            </li>
          </ol>
        </section>
      </main>

      <BrandFooter />
      </div>
    </>
  );
}
