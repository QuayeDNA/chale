import { BrandFooter } from '../components/BrandChrome';
import { SiteNav } from '../components/SiteNav';

export function Home() {
  return (
    <>
      <SiteNav />
      <div className="page">

      <main className="landing">
        <section className="landing-hero">
          <h1>Better questions. Deeper chats.</h1>
          <p className="lede">
            Chale is decks of question cards for the people you're close to.
            Play through them together in person, or trade answers over text
            and voice when you're apart.
          </p>
          <div className="actions">
            {/* No store links yet — the beta isn't public. The buttons stay in
                the layout so the design doesn't change the day they exist. */}
            <span className="button button-block" aria-disabled="true">
              Coming to Android &amp; iOS
            </span>
            <a className="button button-outline button-block" href="/terms">
              Read the terms
            </a>
          </div>
        </section>

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
