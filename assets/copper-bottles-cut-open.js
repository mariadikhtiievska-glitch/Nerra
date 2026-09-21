// Copper Bottles Cut Open advertorial — shared behavior for
// layout/copper-bottles-cut-open.liquid. Each behavior below is its own
// IIFE with an early guard-clause return.

// Sticky bar (node 85:27) — stays hidden until the visitor scrolls past the
// trigger block, then stays visible for the rest of the page (a "has shown
// once" flag prevents it from flickering if the visitor scrolls back up and
// down near the trigger). Uses IntersectionObserver instead of a scroll-
// position pixel threshold so it stays accurate if content above the
// trigger changes length.
//
// The trigger block is `[data-cls-coppercutopen-sticky-trigger]` — per the
// Figma layer name on the sticky bar ("appears from Block 12 onward only"),
// this must be added to the Final CTA + Product Card section's outer
// wrapper once that section is built. Until then this behavior silently
// no-ops (guard clause below).
(function () {
  var bar = document.querySelector('[data-cls-coppercutopen-sticky-bar]');
  var trigger = document.querySelector('[data-cls-coppercutopen-sticky-trigger]');
  if (!bar || !trigger) return;

  var hasShown = false;

  var observer = new IntersectionObserver(
    function (entries) {
      if (hasShown) return;

      var entry = entries[0];
      var scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      if (!scrolledPast) return;

      hasShown = true;
      bar.classList.add('cls-coppercutopen-sticky-bar--visible');
      observer.disconnect();
    },
    { threshold: 0 }
  );

  observer.observe(trigger);
})();
