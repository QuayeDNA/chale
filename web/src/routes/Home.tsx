import { BrandFooter } from '../components/BrandChrome';
import { Hero } from '../components/Hero';
import { Marquee } from '../components/Marquee';
import { SiteNav } from '../components/SiteNav';

export function Home() {
  return (
    <>
      <SiteNav />
      <Hero />
      <Marquee />
      <div className="page">

      <main className="landing">
        <section className="landing-section">
          <h2>Two ways to play</h2>
          <div className="modes">
            <div className="card mode">
              <span className="eyebrow">In person</span>
              <h3>One phone, passed around the room</h3>
              <p>
                Put the phone in the middle. The deck deals the questions, two
                people take turns answering out loud — nobody types anything.
              </p>
            </div>
            <div className="card mode">
              <span className="eyebrow">Apart</span>
              <h3>One card a day, answered your way</h3>
              <p>
                When you're apart, the day's card comes to both of you. Answer
                as text or voice, then reveal when you've both had your turn.
              </p>
            </div>
          </div>
        </section>

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
