/* ============================================================
   Router + Page Transitions
   - Intercepts internal .html links
   - Fetches new page, swaps <main>, animates
   - Random transition: slide-fade | curtain | glitch | flip
   - Falls back gracefully (no JS = normal nav)
   ============================================================ */
(function () {
  if (!window.history || !window.fetch) return; // bail on ancient browsers

  var $main = document.querySelector('main.page');
  var $fx   = document.getElementById('page-fx');
  if (!$main) return;

  var TRANSITIONS = ['slide', 'curtain', 'glitch', 'flip'];
  var inFlight = false;

  // --- highlight active nav link
  function setActive() {
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('nav a[data-page], footer a[data-page]').forEach(function (a) {
      var href = (a.getAttribute('href') || '').toLowerCase();
      a.classList.toggle('is-active', href === here);
    });
  }
  setActive();

  // --- intercept clicks
  document.addEventListener('click', function (e) {
    if (inFlight) { e.preventDefault(); return; }
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    if (a.hasAttribute('data-router-skip')) return;
    if (a.target && a.target !== '' && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    var href = a.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

    var url;
    try { url = new URL(href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (!/\.html?$/i.test(url.pathname) && url.pathname !== '/') return;
    if (url.pathname === location.pathname && url.search === location.search) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    navigate(url.href, true);
  });

  window.addEventListener('popstate', function () {
    navigate(location.href, false);
  });

  function navigate(href, push) {
    inFlight = true;
    var transition = TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];

    // 1) play OUT phase
    runOut(transition).then(function () {
      // 2) fetch new page
      return fetch(href, { credentials: 'same-origin' });
    }).then(function (r) {
      if (!r.ok) throw new Error('fetch failed: ' + r.status);
      return r.text();
    }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var newMain = doc.querySelector('main.page');
      if (!newMain) throw new Error('no main.page in target');

      // swap title + main
      if (doc.title) document.title = doc.title;
      $main.innerHTML = newMain.innerHTML;
      $main.setAttribute('data-page-name', newMain.getAttribute('data-page-name') || '');

      if (push) history.pushState({}, '', href);
      window.scrollTo(0, 0);
      setActive();

      // re-init: GSAP reveals + counters + Vimeo + chat handlers run via site.js init hook
      if (typeof window.__siteReinit === 'function') {
        try { window.__siteReinit(); } catch (e) { console.warn('reinit', e); }
      }

      return runIn(transition);
    }).catch(function (err) {
      console.warn('router fallback', err);
      location.href = href;
    }).then(function () {
      inFlight = false;
    });
  }

  function runOut(t) {
    return new Promise(function (resolve) {
      $fx.setAttribute('data-fx', t);
      $fx.classList.add('fx-out');
      var dur = (t === 'slide') ? 380 : (t === 'glitch') ? 480 : 520;
      $main.classList.add('page-out-' + t);
      setTimeout(resolve, dur);
    });
  }

  function runIn(t) {
    return new Promise(function (resolve) {
      $main.classList.remove('page-out-' + t);
      $main.classList.add('page-in-' + t);
      $fx.classList.remove('fx-out');
      $fx.classList.add('fx-in');
      var dur = 600;
      setTimeout(function () {
        $main.classList.remove('page-in-' + t);
        $fx.classList.remove('fx-in');
        $fx.removeAttribute('data-fx');
        resolve();
      }, dur);
    });
  }
})();
