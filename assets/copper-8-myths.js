// Copper 8 Myths advertorial — behaviour for layout/copper-8-myths.liquid.

// Top bar: rotate messages when there is more than one.
(function () {
  var bar = document.querySelector('[data-cls-copper8myths-topbar]');
  if (!bar) return;
  var messages = Array.prototype.slice.call(bar.querySelectorAll('.cls-copper8myths-topbar__message'));
  if (messages.length < 2) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var interval = parseInt(bar.dataset.interval, 10) || 4000;
  var active = 0;
  setInterval(function () {
    messages[active].removeAttribute('data-active');
    active = (active + 1) % messages.length;
    messages[active].setAttribute('data-active', '');
  }, interval);
})();

// Sticky bar (mobile/tablet): slides up from the bottom once the visitor has
// scrolled down past the set share of the page (default 50%), then stays.
(function () {
  var bar = document.querySelector('[data-cls-copper8myths-sticky-bar]');
  if (!bar) return;

  var threshold = (parseFloat(bar.dataset.threshold) || 50) / 100;
  var link = bar.querySelector('a');
  var shown = false;
  var ticking = false;

  function show() {
    shown = true;
    bar.classList.add('cls-copper8myths-sticky-bar--visible');
    bar.removeAttribute('aria-hidden');
    if (link) link.removeAttribute('tabindex');
    document.body.classList.add('cls-copper8myths-body--sticky-visible');
    window.removeEventListener('scroll', onScroll);
  }

  function check() {
    if (shown) return;
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    if (window.pageYOffset / scrollable >= threshold) show();
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      check();
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  check();
})();
