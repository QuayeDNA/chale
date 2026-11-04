import { BrandFooter, BrandHeader } from '../components/BrandChrome';
import { CONTACT_EMAIL, EFFECTIVE_DATE } from '../lib/site';

export function Privacy() {
  return (
    <div className="page">
      <BrandHeader />
      <main className="card doc">
        <span className="doc-tag">Beta policy</span>
        <h1>Privacy Policy</h1>
        <p className="effective">Effective: {EFFECTIVE_DATE} · Last updated: {EFFECTIVE_DATE}</p>

        <h2>1. What we collect</h2>
        <ul>
          <li>
            <strong>Account basics</strong> — your email address and a display
            name, when you create an account. Browsing stays anonymous: guests
            get no email on file.
          </li>
          <li>
            <strong>Waitlist details</strong> - if you join the beta waitlist, we
            collect your email address, confirmation status, referral code, and
            the campaign or page that brought you to us. We use this only to
            manage the beta list and send launch updates.
          </li>
          <li>
            <strong>Your answers</strong> - text answers, voice recordings, and
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
            the stores, when you&apos;ve opted into sharing them.{' '}
          </li>
        </ul>

        <h2>2. How your answers are used</h2>
        <p>
          Answers exist to be revealed to your paired partner — that&apos;s the whole
          product. We don&apos;t read your answers, and we don&apos;t use them to train
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
          processor that stores data on our instruction. We don&apos;t sell your data
          and we don&apos;t share it with advertisers.{' '}
        </p>

        <h2>5. How long we keep things</h2>
        <ul>
          <li>Voice notes: until listened-to by both, or 7 days — unless kept.</li>
          <li>Answers: while your account and connection exist.</li>
          <li>Account data: until you ask us to delete it.</li>
          <li>Waitlist data: until the beta opens, or until you ask us to remove it.</li>
        </ul>

        <h2>6. Your choices</h2>
        <p>
          You can delete your account and data from the app (Profile, then Sign out,
          then contact us) or by emailing us. Deleting removes your profile,
          answers, and favourites; it can&apos;t un-reveal answers your partner has
          already seen. To leave the waitlist, email us and we will remove your
          details.
        </p>

        <h2>7. Children</h2>
        <p>
          Chale is for users aged 13 and over. If you are under 16, a parent or
          guardian must review and agree to this policy and the Terms on your
          behalf, and is responsible for your use of the app. We do not
          knowingly collect data from anyone under 13. If you believe a child is
          using the app without that consent, contact us and we&apos;ll remove the
          account.
        </p>

        <h2>8. Changes</h2>
        <p>
          We&apos;ll post any new version of this policy here and update the date
          above. Material changes will be announced in the app.
        </p>

        <h2>9. Contact</h2>
        <p>
          Privacy questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </main>
      <BrandFooter />
    </div>
  );
}
