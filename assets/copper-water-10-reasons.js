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

// Lazy videos (snippets/copper-water-10-reasons-video.liquid) — the <video>
// ships with preload="none" and no src, so nothing downloads on page load.
// Only one MP4 is attached: the smallest rendition at least as wide as the
// card on this screen. "autoplay" videos load when their card comes within
// 300px of the viewport and play only while on screen; "click" videos (and
// autoplay ones for visitors with reduce-motion or data saver on) load only
// when the play button is tapped.
(function () {
  if (!('IntersectionObserver' in window)) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);

  function attachSource(wrapper, video) {
    if (wrapper.hasAttribute('data-loaded')) return;
    wrapper.setAttribute('data-loaded', '');

    var sources = Array.prototype.slice.call(video.querySelectorAll('source[data-src]'));
    if (!sources.length) return;

    sources.sort(function (a, b) {
      return (parseInt(a.dataset.width, 10) || 0) - (parseInt(b.dataset.width, 10) || 0);
    });
    var needed = wrapper.clientWidth * Math.min(window.devicePixelRatio || 1, 2);
    var chosen = sources[sources.length - 1];
    for (var i = 0; i < sources.length; i++) {
      if ((parseInt(sources[i].dataset.width, 10) || 0) >= needed) {
        chosen = sources[i];
        break;
      }
    }

    sources.forEach(function (source) {
      if (source !== chosen) source.remove();
    });
    chosen.src = chosen.dataset.src;
    video.addEventListener('playing', function () {
      wrapper.classList.add('cls-copperwater10-video--playing');
    }, { once: true });
    video.load();
  }

  function play(video) {
    var promise = video.play();
    if (promise && promise.catch) promise.catch(function () {});
  }

  var loadObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      attachSource(entry.target, entry.target.querySelector('video'));
      loadObserver.unobserve(entry.target);
    });
  }, { rootMargin: '300px 0px' });

  var playObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var video = entry.target.querySelector('video');
      if (entry.isIntersecting) {
        attachSource(entry.target, video);
        play(video);
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.25 });

  function setUpClickToPlay(wrapper, video) {
    var button = wrapper.querySelector('.cls-copperwater10-video__play');
    if (!button) return;

    button.hidden = false;
    button.addEventListener('click', function () {
      attachSource(wrapper, video);
      button.hidden = true;
      video.controls = true;
      if (wrapper.dataset.mode === 'click') video.muted = false;
      play(video);
    });
  }

  function init(root) {
    root.querySelectorAll('[data-cls-copperwater10-video]').forEach(function (wrapper) {
      if (wrapper.hasAttribute('data-initialized')) return;
      wrapper.setAttribute('data-initialized', '');

      var video = wrapper.querySelector('video');
      if (!video) return;

      if (wrapper.dataset.mode === 'click' || reduceMotion || saveData) {
        setUpClickToPlay(wrapper, video);
        return;
      }

      loadObserver.observe(wrapper);
      playObserver.observe(wrapper);
    });
  }

  init(document);

  // Theme editor: re-run on sections re-rendered after a settings change.
  document.addEventListener('shopify:section:load', function (event) {
    init(event.target);
  });
})();
