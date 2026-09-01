/* ============================================================
   cheap-is · συναίνεση cookies
   ------------------------------------------------------------
   ΔΕΝ εμφανίζεται τίποτα όσο δεν υπάρχει κωδικός παρακολούθησης
   στο config.js. Το site από μόνο του δεν βάζει cookies.
   Μόλις μπει GA4 ή Meta Pixel, το banner ενεργοποιείται αυτόματα
   και τα scripts φορτώνουν ΜΟΝΟ μετά από αποδοχή.
   ============================================================ */
(function () {
  'use strict';

  var CFG = (window.CHEAPIS_CONFIG || {}).analytics || {};
  var KEY = 'cheapis_cookies';
  var hasTrackers = !!(CFG.ga4 || CFG.metaPixel);

  function choice() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch (e) { return null; }
  }
  function save(v) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ apofasi: v, imerominia: new Date().toISOString() }));
    } catch (e) {}
  }

  /* ---- φόρτωση trackers μόνο μετά από «αποδοχή» ---- */
  function loadTrackers() {
    if (CFG.ga4) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CFG.ga4;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', CFG.ga4, { anonymize_ip: true });
    }
    if (CFG.metaPixel) {
      /* eslint-disable */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq('init', CFG.metaPixel);
      window.fbq('track', 'PageView');
    }
  }

  /* ---- banner ---- */
  function show() {
    var el = document.createElement('div');
    el.className = 'ckbar';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Συναίνεση cookies');
    el.innerHTML =
      '<div class="ckbar__in">' +
        '<p>Χρησιμοποιούμε cookies για να μετράμε την επισκεψιμότητα και να βελτιώνουμε ' +
        'τη σελίδα. Μπορείτε να τα αρνηθείτε — η ενημέρωση και η φόρμα λειτουργούν κανονικά. ' +
        '<a href="cookies.html">Περισσότερα</a></p>' +
        '<div class="ckbar__btns">' +
          '<button type="button" class="btn btn--ghostdark" data-ck="necessary">Μόνο τα απαραίτητα</button>' +
          '<button type="button" class="btn btn--gold" data-ck="all">Αποδοχή</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-in'); });

    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ck]');
      if (!b) return;
      save(b.dataset.ck);
      if (b.dataset.ck === 'all') loadTrackers();
      el.classList.remove('is-in');
      setTimeout(function () { el.remove(); }, 350);
    });
  }

  /* ---- εκκίνηση ---- */
  if (!hasTrackers) return;          // κανένα cookie → κανένα banner
  var c = choice();
  if (!c) { show(); }
  else if (c.apofasi === 'all') { loadTrackers(); }

  /* «Cookies» στο footer: ξανανοίγει την επιλογή */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-cookie-settings]');
    if (!a) return;
    e.preventDefault();
    try { localStorage.removeItem(KEY); } catch (err) {}
    if (!document.querySelector('.ckbar')) show();
  });
})();
