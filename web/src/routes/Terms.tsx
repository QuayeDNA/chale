import { BrandFooter, BrandHeader } from '../components/BrandChrome';

/**
 * REPLACE: this whole document is a structured draft. Swap the sections and
 * copy for the reviewed legal text; keep the markup and classes.
 */
export function Terms() {
  return (
    <div className="page">
      <BrandHeader />
      <main className="card doc">
        <span className="doc-tag">Draft — pending legal review</span>
        <h1>Terms &amp; Conditions</h1>
        <p className="effective">Effective: — (draft) · Last updated: — (draft)</p>

        <h2>1. The service</h2>
        <p>
          Chale is a question-card app. Users — partners, family, friends — play
          through decks of question cards and answer them as they go. There are
          two ways to play: <strong>together in person</strong>, on one device
          passed around the room; or <strong>remotely</strong>, when you're
          apart, where your answers are passed to each other as text or voice
          messages.
        </p>

        <h2>2. Your account</h2>
        <p>
          You can browse and play without an account. You create an account —
          with an email address and a one-time code — when you pair with someone
          or save content you want to keep. You are responsible for what happens
          on your device and for keeping your email secure.
        </p>
        <p>
          You must be 13 or older to create an account. If you are under 16, a
          parent or guardian must agree to these terms on your behalf.
        </p>
        <ul>
          <li>Guest progress (favourites) attaches to your device until you create an account.</li>
          <li>One person, one account: don't impersonate anyone else.</li>
        </ul>

        <h2>3. Pairing &amp; connections</h2>
        <p>
          Pairing happens through an invite code shared between two people. Once
          linked, the connection persists until either person ends it. During
          the beta, each account holds a single partner connection.
        </p>

        <h2>4. Your content</h2>
        <p>
          You keep ownership of the answers you write and the voice notes you
          record. We store and transmit them only to run the service — to your
          paired partner, on your instruction.
        </p>
        <ul>
          <li>
            <strong>Voice notes expire.</strong> A voice answer is deleted after
            both of you have listened to it, or 7 days after it was sent,
            whichever comes first. Either of you can choose to keep one
            permanently.
          </li>
          <li>
            <strong>Answers can be changed</strong> until both of you have
            answered and the reveal happens. After the reveal, they are fixed.
          </li>
        </ul>

        <h2>5. Acceptable use</h2>
        <p>
          Don't use Chale to harass, abuse, or endanger anyone; to share
          illegal content; or to interfere with the service. We may remove
          content or end accounts that break these rules.
        </p>

        <h2>6. Availability</h2>
        <p>
          The app is provided as-is during beta. Features may change, break, or
          disappear, and we may suspend the service for maintenance without
          notice.
        </p>

        <h2>7. Disclaimers &amp; liability</h2>
        <p>
          {/* REPLACE: insert the reviewed disclaimer and limitation-of-liability
              language, including the caps and exclusions counsel recommends. */}
          The service is provided without warranties. To the maximum extent
          permitted by law, we are not liable for indirect or consequential loss
          arising from your use of Chale.
        </p>

        <h2>8. Ending the relationship</h2>
        <p>
          You can stop using Chale at any time and ask us to delete your account
          and data. Unpairing ends the shared experience immediately; each
          person's answers remain visible to them.
        </p>

        <h2>9. Changes to these terms</h2>
        <p>
          If we change these terms we'll post the new version on this page and
          update the date above. Continuing to use Chale after a change means
          you accept the new terms.
        </p>

        <h2>10. Contact</h2>
        <p>
          {/* REPLACE: insert the real contact email or form. */}Questions about
          these terms: <a href="mailto:legal@example.com">legal@example.com</a>.
        </p>
      </main>
      <BrandFooter />
    </div>
  );
}
