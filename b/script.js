/* ============ cheap-is · script ============ */
(function () {
  'use strict';

  var CFG = window.CHEAPIS_CONFIG || {};
  var QUEUE_KEY = 'cheapis_queue';   // ό,τι δεν στάλθηκε ακόμη
  var LOCAL_KEY = 'cheapis_leads';   // τοπικό αρχείο για το admin.html

  /* ---- έτος footer ---- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---- sticky header shadow ---- */
  var header = document.getElementById('header');
  function onScroll() {
    header.classList.toggle('is-stuck', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- mobile menu ---- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---- tabs προγραμμάτων ---- */
  var tabs = document.querySelectorAll('.tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var id = tab.dataset.tab;
      tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
      document.querySelectorAll('.panel').forEach(function (p) {
        p.classList.toggle('is-active', p.dataset.panel === id);
      });
      document.querySelectorAll('.panel.is-active .reveal').forEach(function (el) {
        el.classList.add('is-in');
      });
    });
  });

  /* ---- FAQ: ένα ανοιχτό τη φορά ---- */
  var faqs = document.querySelectorAll('.faq details');
  faqs.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) faqs.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ---- reveal on scroll ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---- counters ---- */
  var counted = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      counted.unobserve(el);
      var target = parseInt(el.dataset.count, 10) || 0;
      var dur = 1400, t0 = null;
      function tick(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('el-GR');
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-count]').forEach(function (el) { counted.observe(el); });

  /* ---- modal ---- */
  var modal = document.getElementById('okModal');
  var modalTitle = document.getElementById('okTitle');
  var modalText = document.getElementById('okText');
  var OK_TITLE = modalTitle ? modalTitle.textContent : '';
  var OK_TEXT = modalText ? modalText.textContent : '';

  function openModal(title, text, isError) {
    if (modalTitle) modalTitle.textContent = title || OK_TITLE;
    if (modalText) modalText.textContent = text || OK_TEXT;
    modal.classList.toggle('modal--error', !!isError);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }
  modal.addEventListener('click', function (e) {
    if (e.target === modal || e.target.hasAttribute('data-close-modal')) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  /* ---- τοπική αποθήκευση ---- */
  function store(key, item) {
    try {
      var list = JSON.parse(localStorage.getItem(key) || '[]');
      list.push(item);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (err) { /* private mode / γεμάτο storage */ }
  }
  function readAll(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch (err) { return []; }
  }

  /* ---- αποστολή στο endpoint ----
     Content-Type: text/plain ώστε να μη γίνεται CORS preflight
     (το Google Apps Script δεν απαντά σε OPTIONS). */
  function sendLead(data) {
    if (!CFG.endpoint) {
      return Promise.reject(new Error('Δεν έχει οριστεί endpoint στο config.js'));
    }
    return fetch(CFG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
  }

  /* ---- ξαναστέλνει ό,τι είχε μείνει στην ουρά ---- */
  function flushQueue() {
    var q = readAll(QUEUE_KEY);
    if (!q.length || !CFG.endpoint) return;
    var rest = [];
    var jobs = q.map(function (item) {
      return sendLead(item).catch(function () { rest.push(item); });
    });
    Promise.all(jobs).then(function () {
      try { localStorage.setItem(QUEUE_KEY, JSON.stringify(rest)); } catch (e) {}
    });
  }
  flushQueue();

  /* ---- φόρμες εκδήλωσης ενδιαφέροντος ---- */
  function normTel(v) { return (v || '').replace(/[\s\-().]/g, ''); }
  function validTel(v) { return /^(\+30)?[0-9]{10}$/.test(normTel(v)); }
  function validEmail(v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  document.querySelectorAll('[data-lead-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* παγίδα spam: αν το κρυφό πεδίο είναι γεμάτο, είναι bot */
      var hp = form.querySelector('[name=website]');
      if (hp && hp.value) { form.reset(); openModal(); return; }

      var ok = true;
      form.querySelectorAll('.is-error').forEach(function (el) { el.classList.remove('is-error'); });

      var onoma = form.querySelector('[name=onoma]');
      if (onoma.value.trim().length < 3) { onoma.classList.add('is-error'); ok = false; }

      var tel = form.querySelector('[name=tilefono]');
      if (!validTel(tel.value)) { tel.classList.add('is-error'); ok = false; }

      var mail = form.querySelector('[name=email]');
      if (mail && !validEmail(mail.value.trim())) { mail.classList.add('is-error'); ok = false; }

      var syn = form.querySelector('[name=synainesi]');
      if (syn && !syn.checked) { syn.closest('.consent').classList.add('is-error'); ok = false; }

      if (!ok) {
        var first = form.querySelector('.is-error');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      /* συλλογή δεδομένων */
      var data = {
        formId: form.dataset.formId,
        imerominia: new Date().toISOString(),
        selida: location.href,
        pigi: document.referrer || 'απευθείας'
      };
      new FormData(form).forEach(function (v, k) {
        if (k === 'website') return;
        if (data[k] === undefined) data[k] = v;
        else data[k] = data[k] + ', ' + v;
      });

      /* πάντα κρατάμε τοπικό αντίγραφο */
      store(LOCAL_KEY, data);

      var btn = form.querySelector('button[type=submit]');
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Αποστολή…';

      function done() {
        btn.disabled = false;
        btn.textContent = label;
      }

      sendLead(data).then(function () {
        done();
        form.reset();
        openModal();
        flushQueue();
      }).catch(function (err) {
        /* μπαίνει σε ουρά και ξαναδοκιμάζει μόνο του */
        store(QUEUE_KEY, data);
        done();
        form.reset();
        if (!CFG.endpoint) {
          console.warn('[cheap-is] Η φόρμα δεν στέλνεται πουθενά: όρισε endpoint στο config.js.', err);
          openModal();
        } else {
          openModal(
            'Δεν καταφέραμε να το στείλουμε',
            'Υπήρξε πρόβλημα σύνδεσης. Δοκιμάστε ξανά σε λίγο ή καλέστε μας στο ' + (CFG.tilefono || '') + '.',
            true
          );
        }
      });
    });
  });
})();
