/* μικρό script για τις νομικές σελίδες: έτος, μενού κινητού, sticky header */
(function () {
  'use strict';
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  var header = document.getElementById('header');
  if (header) {
    var f = function () { header.classList.toggle('is-stuck', window.scrollY > 8); };
    window.addEventListener('scroll', f, { passive: true });
    f();
  }

  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
})();
