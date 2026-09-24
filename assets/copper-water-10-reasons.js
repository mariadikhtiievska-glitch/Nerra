// Copper Water 10 Reasons advertorial — shared behavior for
// layout/copper-water-10-reasons.liquid. Each behavior below is its own
// IIFE with an early guard-clause return.

// Announcement bar (node 154:3) — rotates messages only when a merchant has
// added more than one message block; a single message needs no rotation.
(function () {
  var bar = document.querySelector('[data-cls-copperwater10-announcement]');
  if (!bar) return;

  var messages = Array.prototype.slice.call(
    bar.querySelectorAll('.cls-copperwater10-announcement__message')
  );
  if (messages.length < 2) return;

  var interval = parseInt(bar.dataset.interval, 10) || 4000;
  var activeIndex = 0;

  setInterval(function () {
    messages[activeIndex].removeAttribute('data-cls-copperwater10-announcement-active');
    activeIndex = (activeIndex + 1) % messages.length;
    messages[activeIndex].setAttribute('data-cls-copperwater10-announcement-active', '');
  }, interval);
})();

// Sticky bar (node 156:30) — hidden until the visitor scrolls past the
// trigger marker, then stays visible (the hasShown flag stops it flickering
// when scrolling back up past the marker). The marker is a 1px element
// rendered by the reason section whose "sticky_trigger" setting is on.
// IntersectionObserver rather than a pixel threshold, so it stays accurate
// if content above the marker changes length.
(function () {
  var bar = document.querySelector('[data-cls-copperwater10-sticky-bar]');
  var trigger = document.querySelector('[data-cls-copperwater10-sticky-trigger]');
  if (!bar || !trigger) return;

  var hasShown = false;

  var observer = new IntersectionObserver(
    function (entries) {
      if (hasShown) return;

      var entry = entries[0];
      var scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      if (!scrolledPast) return;

      hasShown = true;
      bar.classList.add('cls-copperwater10-sticky-bar--visible');
      observer.disconnect();
    },
    { threshold: 0 }
  );

  observer.observe(trigger);
})();
