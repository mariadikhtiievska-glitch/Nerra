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
// The trigger is `[data-cls-coppercutopen-sticky-trigger]`, a 1px marker at
// the very top of the 3rd section ("What I Found") — so the bar appears as
// soon as the visitor scrolls past the 2nd section ("Opening Test"), on
// both mobile and desktop, per explicit request.
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

// Final CTA countdown timer (node 120:16) — rolling duration per visitor:
// the first time someone loads the page, a countdown of the configured
// length starts and is saved in localStorage so it survives a refresh
// instead of resetting; if a visitor's countdown has already run out, a
// fresh one starts automatically so the timer stays evergreen rather than
// freezing at zero.
(function () {
  var el = document.querySelector('[data-cls-coppercutopen-countdown]');
  if (!el) return;

  var daysEl = el.querySelector('[data-countdown-days]');
  var hoursEl = el.querySelector('[data-countdown-hours]');
  var minutesEl = el.querySelector('[data-countdown-minutes]');
  var secondsEl = el.querySelector('[data-countdown-seconds]');
  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  var durationMs = (parseFloat(el.dataset.durationHours) || 20) * 60 * 60 * 1000;
  var storageKey = 'clsCoppercutopenCountdownEnd';
  var endTime = null;

  try {
    var stored = window.localStorage.getItem(storageKey);
    if (stored) endTime = parseInt(stored, 10);
  } catch (e) {}

  function startNewCountdown() {
    endTime = Date.now() + durationMs;
    try {
      window.localStorage.setItem(storageKey, String(endTime));
    } catch (e) {}
  }

  if (!endTime || endTime <= Date.now()) startNewCountdown();

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function update() {
    var remaining = endTime - Date.now();
    if (remaining <= 0) {
      startNewCountdown();
      remaining = endTime - Date.now();
    }

    var totalSeconds = Math.floor(remaining / 1000);
    daysEl.textContent = pad(Math.floor(totalSeconds / 86400));
    hoursEl.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
    minutesEl.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
    secondsEl.textContent = pad(totalSeconds % 60);
  }

  update();
  setInterval(update, 1000);
})();

// FAQ accordion (node 84:116) — single-open behavior: opening one <details>
// closes any other open one in the same list. Native <details> toggling is
// instant with no animation hook, so the open/close is driven manually here:
// intercept the summary click, set an explicit starting height, then
// transition to the target height on the next frame. A rapid second click
// before that finishes must interrupt cleanly — animateAnswer cancels both
// the previous pending rAF and its transitionend listener before reading
// the answer's current (possibly mid-transition) height as the new start,
// rather than assuming it's settled at 0 or the previous target.
(function () {
  var list = document.querySelector('[data-cls-coppercutopen-faq]');
  if (!list) return;

  var items = Array.prototype.slice.call(list.querySelectorAll('.cls-coppercutopen-faq__item'));

  function animateAnswer(item, answer, opening) {
    if (answer._rafId) {
      cancelAnimationFrame(answer._rafId);
      answer._rafId = null;
    }
    if (answer._cleanup) answer._cleanup();

    answer.style.transition = 'none';
    answer.style.height = answer.offsetHeight + 'px';
    if (opening) item.open = true;
    var target = opening ? answer.scrollHeight : 0;

    answer._rafId = requestAnimationFrame(function () {
      answer._rafId = null;
      answer.style.transition = '';
      answer.style.height = target + 'px';
    });

    function onEnd(event) {
      if (event.target !== answer || event.propertyName !== 'height') return;
      if (!opening) item.open = false;
      answer.style.height = '';
      answer.removeEventListener('transitionend', onEnd);
      answer._cleanup = null;
    }
    answer.addEventListener('transitionend', onEnd);
    answer._cleanup = function () {
      answer.removeEventListener('transitionend', onEnd);
      answer._cleanup = null;
    };
  }

  items.forEach(function (item) {
    var summary = item.querySelector('.cls-coppercutopen-faq__question');
    var answer = item.querySelector('.cls-coppercutopen-faq__answer');
    if (!summary || !answer) return;

    summary.addEventListener('click', function (event) {
      event.preventDefault();
      var wasOpen = item.open;

      items.forEach(function (other) {
        if (other === item || !other.open) return;
        var otherAnswer = other.querySelector('.cls-coppercutopen-faq__answer');
        if (otherAnswer) animateAnswer(other, otherAnswer, false);
      });

      animateAnswer(item, answer, !wasOpen);
    });
  });
})();
