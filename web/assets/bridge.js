/* Auth bridge: hands a Supabase email-link session to the app.
 *
 * Supabase verifies the link, redirects here, and appends the session — a
 * `?code=` (PKCE, what the app's client uses) or an implicit `#access_token`
 * pair. This page forwards it into the app via the `chale://` scheme and
 * falls back to a manual handoff when the scheme doesn't resolve.
 */
(function () {
  'use strict';

  var BOUNCE_TIMEOUT_MS = 1500;
  var SCHEME = 'chale';

  var params = new URLSearchParams(window.location.search);
  var hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  var code = params.get('code');
  var accessToken = hash.get('access_token');
  var refreshToken = hash.get('refresh_token');
  var error =
    params.get('error_description') || params.get('error') || hash.get('error_description') || hash.get('error');

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
  if (code) {
    target = SCHEME + '://auth-callback?code=' + encodeURIComponent(code);
  } else if (accessToken && refreshToken) {
    target =
      SCHEME +
      '://auth-callback#access_token=' +
      encodeURIComponent(accessToken) +
      '&refresh_token=' +
      encodeURIComponent(refreshToken);
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
