/* Auth bridge: hands a Supabase email-link session to the app.
 *
 * Passwordless login, current flow: the email template points its link at
 * this page carrying a `token_hash` and a `type` (magiclink, signup,
 * recovery, email_change, invite). The page forwards both into the app via
 * the `chale://` scheme, and the app exchanges them with
 * `supabase.auth.verifyOtp({ token_hash, type })`. No session tokens ever
 * appear in a URL — Supabase stopped putting them there.
 *
 * A `?code=` (the PKCE exchange code from Supabase's own verify endpoint) is
 * still honoured for setups that redirect through it. Anything else lands on
 * the invalid state, which points back to the one-time code in the app.
 */
(function () {
  'use strict';

  var BOUNCE_TIMEOUT_MS = 1500;
  var SCHEME = 'chale';
  // The verifyOtp types a link can legitimately carry. An unknown value falls
  // back to magiclink rather than forwarding noise into the app.
  var TYPES = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

  var params = new URLSearchParams(window.location.search);

  var tokenHash = params.get('token_hash');
  var type = params.get('type');
  if (TYPES.indexOf(type) === -1) type = 'magiclink';
  var code = params.get('code');
  var error =
    params.get('error_description') ||
    params.get('error') ||
    params.get('error_code');

  function show(id) {
    var states = document.querySelectorAll('.state');
    for (var i = 0; i < states.length; i++) {
      states[i].classList.remove('is-active');
    }
    document.getElementById(id).classList.add('is-active');
  }

  if (error) {
    show('state-error');
    var detail = document.getElementById('error-detail');
    if (detail) detail.textContent = error;
    return;
  }

  var target = null;
  if (tokenHash) {
    target =
      SCHEME +
      '://auth-callback?token_hash=' +
      encodeURIComponent(tokenHash) +
      '&type=' +
      encodeURIComponent(type);
  } else if (code) {
    target = SCHEME + '://auth-callback?code=' + encodeURIComponent(code);
  }

  if (!target) {
    show('state-invalid');
    return;
  }

  window.location.replace(target);

  // Still visible after the bounce window means the scheme never resolved —
  // no app installed, or the link was opened on a desktop. The visible fallback
  // offers a real, gesture-driven retry plus the "use another device" advice.
  setTimeout(function () {
    if (!document.hidden) show('state-fallback');
  }, BOUNCE_TIMEOUT_MS);
})();
