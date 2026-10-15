import { BrandFooter, BrandHeader } from '../components/BrandChrome';

/**
 * REPLACE: this whole document is a structured draft. Swap the sections and
 * copy for the reviewed legal text; keep the markup and classes.
 */
export function Privacy() {
  return (
    <div className="page">
      <BrandHeader />
      <main className="card doc">
        <span className="doc-tag">Draft — pending legal review</span>
        <h1>Privacy Policy</h1>
        <p className="effective">Effective: — (draft) · Last updated: — (draft)</p>

        <h2>1. What we collect</h2>
        <ul>
          <li>
            <strong>Account basics</strong> — your email address and a display
            name, when you create an account. Browsing stays anonymous: guests
            get no email on file.
          </li>
          <li>
            <strong>Your answers</strong> — text answers, voice recordings, and
            the questions they belong to.
          </li>
          <li>
            <strong>Pairing data</strong> — who is paired with whom, and your
            invite code.
          </li>
          <li>
            <strong>Favourites</strong> — the questions you heart.
          </li>
          <li>
            <strong>Basic diagnostics</strong> — app version and crash data from
            the stores, when you've opted into sharing them.{' '}
            {/* REPLACE: confirm whether crash reporting is enabled. */}
          </li>
        </ul>

        <h2>2. How your answers are used</h2>
        <p>
          Answers exist to be revealed to your paired partner — that's the whole
          product. We don't read your answers, and we don't use them to train
          anything. Your partner sees your answer when the reveal happens;
          nobody else does.
        </p>

        <h2>3. Voice notes</h2>
        <p>
          Voice answers are recorded on your device, uploaded when you send, and
          deleted automatically after both of you have listened — or 7 days
          after sending, whichever comes first. If you choose to keep a voice
          note permanently, it stays until you delete it.
        </p>

        <h2>4. Who else touches your data</h2>
        <p>
          Chale runs on Supabase (hosting, database, and file storage) — a
          processor that stores data on our instruction. We don't sell your data
          and we don't share it with advertisers.{' '}
          {/* REPLACE: list any additional processors, e.g. crash reporting or
              email delivery, once confirmed. */}
        </p>

        <h2>5. How long we keep things</h2>
        <ul>
          <li>Voice notes: until listened-to by both, or 7 days — unless kept.</li>
          <li>Answers: while your account and connection exist.</li>
          <li>Account data: until you ask us to delete it.</li>
        </ul>

        <h2>6. Your choices</h2>
        <p>
          You can delete your account and data from the app (Profile → Sign out,
          then contact us) or by emailing us. Deleting removes your profile,
          answers, and favourites; it can't un-reveal answers your partner has
          already seen.
        </p>

        <h2>7. Children</h2>
        <p>
          Chale is for users aged 13 and over. If you are under 16, a parent or
          guardian must review and agree to this policy and the Terms on your
          behalf, and is responsible for your use of the app. We do not
          knowingly collect data from anyone under 13. If you believe a child is
          using the app without that consent, contact us and we'll remove the
          account.
          {/* REVIEW: threshold set to 13+ with guardian consent under 16 to keep
              family play possible; confirm against counsel for each launch
              market (GDPR sets the digital-consent age at 13–16 by country). */}
        </p>

        <h2>8. Changes</h2>
        <p>
          We'll post any new version of this policy here and update the date
          above. Material changes will be announced in the app.
        </p>

        <h2>9. Contact</h2>
        <p>
          {/* REPLACE: insert the real contact email or form. */}Privacy
          questions: <a href="mailto:privacy@example.com">privacy@example.com</a>.
        </p>
      </main>
      <BrandFooter />
    </div>
  );
}
