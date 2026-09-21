// Neera Living advertorial — shared behavior for layout/neera-advertorial.liquid.
// Each behavior below is its own IIFE with an early guard-clause return.

// Top bar message rotation (node 19:2) — only runs when a merchant has added more than
// one message block; a single message needs no rotation.
(function () {
  var bar = document.querySelector('[data-cls-neera-top-bar]');
  if (!bar) return;

  var messages = Array.prototype.slice.call(
    bar.querySelectorAll('.cls-neera-top-bar__message')
  );
  if (messages.length < 2) return;

  var interval = parseInt(bar.dataset.interval, 10) || 4000;
  var activeIndex = messages.findIndex(function (message) {
    return message.hasAttribute('data-cls-neera-top-bar-active');
  });
  if (activeIndex < 0) activeIndex = 0;

  setInterval(function () {
    messages[activeIndex].removeAttribute('data-cls-neera-top-bar-active');
    activeIndex = (activeIndex + 1) % messages.length;
    messages[activeIndex].setAttribute('data-cls-neera-top-bar-active', '');
  }, interval);
})();

// Sticky mobile Add-to-Cart bar (node 25:48) — reveals after the user's configured
// scroll-depth threshold. Passive scroll listener + rAF + ticking guard.
(function () {
  var bar = document.querySelector('[data-cls-neera-sticky-bar]');
  if (!bar) return;

  var threshold = parseFloat(bar.dataset.scrollThreshold) || 20;
  var ticking = false;

  function update() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    bar.classList.toggle('cls-neera-sticky-bar--visible', progress >= threshold);
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  update();
})();

// Final CTA countdown timer (node 52:29) — rolling duration per visitor: the
// first time someone loads the page, a countdown of the configured length
// starts and is saved in their browser so it survives a refresh instead of
// resetting; if a visitor's countdown has already run out, a fresh one
// starts so the timer stays evergreen rather than freezing at zero.
(function () {
  var el = document.querySelector('[data-cls-neera-countdown]');
  if (!el) return;

  var daysEl = el.querySelector('[data-countdown-days]');
  var hoursEl = el.querySelector('[data-countdown-hours]');
  var minutesEl = el.querySelector('[data-countdown-minutes]');
  var secondsEl = el.querySelector('[data-countdown-seconds]');
  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  var durationMs = (parseFloat(el.dataset.durationHours) || 20) * 60 * 60 * 1000;
  var storageKey = 'clsNeeraCountdownEnd';
  var endTime = null;

  try {
    var stored = window.localStorage.getItem(storageKey);
    if (stored) endTime = parseInt(stored, 10);
  } catch (e) {
    endTime = null;
  }

  function startNewCountdown() {
    endTime = Date.now() + durationMs;
    try {
      window.localStorage.setItem(storageKey, String(endTime));
    } catch (e) {
      // localStorage unavailable (private mode, etc.) — countdown still
      // runs for this page view, just won't persist across a refresh.
    }
  }

  if (!endTime || endTime <= Date.now()) {
    startNewCountdown();
  }

  function pad(number) {
    return String(number).padStart(2, '0');
  }

  function update() {
    var remaining = endTime - Date.now();

    if (remaining <= 0) {
      startNewCountdown();
      remaining = endTime - Date.now();
    }

    var totalSeconds = Math.floor(remaining / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }

  update();
  setInterval(update, 1000);
})();

// FAQ accordion (node 25:2) — closes other items when one opens, using
// native <details>/<summary> for the actual expand/collapse mechanics.
(function () {
  var list = document.querySelector('[data-cls-neera-faq-list]');
  if (!list) return;

  var items = Array.prototype.slice.call(list.querySelectorAll('.cls-neera-faq__item'));
  if (items.length === 0) return;

  items.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;

      items.forEach(function (otherItem) {
        if (otherItem !== item && otherItem.open) {
          otherItem.open = false;
        }
      });
    });
  });
})();
