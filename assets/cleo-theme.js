(() => {
  'use strict';

  window.CleoCartAssetVersion = '3.2.0';

  /* --------------------------------------------------------------------------
   * Shared utilities
   * -------------------------------------------------------------------------- */

  const moneyFormatter = (() => {
    const currency =
      window.Shopify?.currency?.active ||
      document.documentElement.dataset.currency ||
      'USD';

    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
      });
    } catch (_error) {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
      });
    }
  })();

  const formatMoney = (value) =>
    moneyFormatter.format(Number(value || 0) / 100);

  const shopifyRoot = window.Shopify?.routes?.root || '/';
  const normalizedShopifyRoot = shopifyRoot.endsWith('/')
    ? shopifyRoot
    : `${shopifyRoot}/`;

  const cartRoute = (path = '') =>
    `${normalizedShopifyRoot}${String(path).replace(/^\/+/, '')}`;

  const fetchJson = async (url, options = {}) => {
    const { headers = {}, ...requestOptions } = options;

    const response = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...requestOptions,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
    });

    const contentType = response.headers.get('content-type') || '';
    let payload = null;

    if (contentType.includes('application/json')) {
      payload = await response.json();
    } else {
      const responseText = await response.text();

      try {
        payload = responseText ? JSON.parse(responseText) : null;
      } catch (_error) {
        payload = responseText || null;
      }
    }

    if (!response.ok) {
      const responseMessage =
        typeof payload === 'string'
          ? payload
          : payload?.description || payload?.message;

      throw new Error(
        responseMessage || `Request failed (${response.status})`
      );
    }

    return payload;
  };

  const fetchText = async (url, options = {}) => {
    const { headers = {}, ...requestOptions } = options;

    const response = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...requestOptions,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'X-Requested-With': 'XMLHttpRequest',
        ...headers,
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        responseText || `Request failed (${response.status})`
      );
    }

    return responseText;
  };

  const safeStorage = {
    get(storage, key) {
      try {
        return storage.getItem(key);
      } catch (_error) {
        return null;
      }
    },

    set(storage, key, value) {
      try {
        storage.setItem(key, value);
        return true;
      } catch (_error) {
        return false;
      }
    },

    remove(storage, key) {
      try {
        storage.removeItem(key);
      } catch (_error) {
        // Storage can be unavailable in private browsing mode.
      }
    },
  };

  const setDrawerOpen = (drawer, open) => {
    if (!drawer) return;

    drawer.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('cleo-drawer-open', open);
  };

  /* --------------------------------------------------------------------------
   * Cleo cart drawer
   *
   * Important: the Liquid section remains the source of truth for cart markup.
   * After each cart mutation, this script re-renders the complete Shopify
   * section. That keeps prices, discounts, goal progress, labels, free gifts,
   * quantity controls, remove controls, upsells, and footer totals synchronized.
   * -------------------------------------------------------------------------- */

  const cartState = {
    mutationInProgress: false,
    giftSyncInProgress: false,
    refreshTimeout: null,
    timerInterval: null,
    previousFocus: null,
  };

  const getCartSection = () =>
    document.querySelector('[data-cleo-drawer-section]');

  const cleanSectionId = (value) =>
    String(value || '')
      .trim()
      .replace(/^shopify-section-/, '');

  const getCartSectionId = (section = getCartSection()) => {
    if (!section) return '';

    const directId = cleanSectionId(section.dataset.sectionId);
    if (directId) return directId;

    const dataSectionOwner = section.closest('[data-section-id]');
    const ownerDataId = cleanSectionId(
      dataSectionOwner?.getAttribute('data-section-id')
    );
    if (ownerDataId) return ownerDataId;

    const shopifyWrapper = section.closest('[id^="shopify-section-"]');
    const wrapperId = cleanSectionId(shopifyWrapper?.id);
    if (wrapperId) return wrapperId;

    const ownIdMatch = String(section.id || '').match(
      /^CleoCartDrawerSection-(.+)$/
    );
    if (ownIdMatch?.[1]) return cleanSectionId(ownIdMatch[1]);

    return '';
  };

  const getCartDrawer = () => {
    const section = getCartSection();

    return (
      section?.querySelector('.cleo-cart-drawer') ||
      section?.querySelector('#cart-drawer') ||
      document.querySelector('.cleo-cart-drawer#cart-drawer') ||
      document.getElementById('cart-drawer')
    );
  };

  const getCartItemCount = (cart) =>
    Math.max(0, Number(cart?.item_count || 0));

  const isCartDrawerOpen = () =>
    Boolean(getCartSection()?.classList.contains('is-open'));

  const setCartOpenerState = (open) => {
    document
      .querySelectorAll(
        '[data-cleo-cart-open], [data-cart-drawer-open], [aria-controls="cart-drawer"]'
      )
      .forEach((element) => {
        element.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
  };

  const openCartDrawer = ({ focusClose = true } = {}) => {
    const section = getCartSection();
    const drawer = getCartDrawer();

    if (!section || !drawer) return false;

    if (focusClose) {
      cartState.previousFocus = document.activeElement;
    }

    section.classList.add('is-open');
    drawer.removeAttribute('hidden');
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('cleo-cart-drawer-open');
    setCartOpenerState(true);

    if (focusClose) {
      window.requestAnimationFrame(() => {
        drawer
          .querySelector('[data-cleo-cart-close]')
          ?.focus({ preventScroll: true });
      });
    }

    return true;
  };

  const closeCartDrawer = ({ restoreFocus = true } = {}) => {
    const section = getCartSection();
    const drawer = getCartDrawer();

    if (!section || !drawer) return false;

    section.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('cleo-cart-drawer-open');
    setCartOpenerState(false);

    if (
      restoreFocus &&
      cartState.previousFocus &&
      typeof cartState.previousFocus.focus === 'function'
    ) {
      cartState.previousFocus.focus({ preventScroll: true });
    }

    return true;
  };

  const setCartBusy = (busy) => {
    const section = getCartSection();

    if (!section) return;

    section.classList.toggle('is-busy', busy);
    section.setAttribute('aria-busy', busy ? 'true' : 'false');

    section
      .querySelectorAll(
        '[data-cleo-cart-change], [data-cleo-add-upsell]'
      )
      .forEach((button) => {
        button.disabled = busy;
        button.setAttribute('aria-disabled', busy ? 'true' : 'false');
      });
  };

  const showCartError = (message) => {
    const errorElement = getCartSection()?.querySelector(
      '[data-cleo-cart-error]'
    );

    if (!errorElement) {
      console.error('[Cleo cart]', message);
      return;
    }

    errorElement.textContent =
      message || 'The cart could not be updated. Please try again.';
    errorElement.hidden = false;

    window.clearTimeout(errorElement._cleoHideTimeout);
    errorElement._cleoHideTimeout = window.setTimeout(() => {
      errorElement.hidden = true;
    }, 5000);
  };

  const updateExternalCartCount = (cartOrCount) => {
    const count =
      typeof cartOrCount === 'number'
        ? Math.max(0, cartOrCount)
        : getCartItemCount(cartOrCount);

    const cartSection = getCartSection();

    if (cartSection) {
      cartSection.dataset.cartCount = String(count);
    }

    const textCountSelectors = [
      '.cleo-cart-count',
      '[data-header-cart-count]',
      'cart-count',
      '.cart-count-bubble span[aria-hidden="true"]',
      '.cart-count-bubble .cart-count',
    ];

    document
      .querySelectorAll(textCountSelectors.join(','))
      .forEach((element) => {
        if (element.closest('[data-cleo-drawer-section]')) return;
        element.textContent = String(count);
        element.dataset.count = String(count);
      });

    document
      .querySelectorAll(
        '[data-cart-count]:not([data-cleo-drawer-section])'
      )
      .forEach((element) => {
        element.dataset.cartCount = String(count);

        if (
          element.childElementCount === 0 &&
          ['SPAN', 'SMALL', 'B', 'STRONG'].includes(element.tagName)
        ) {
          element.textContent = String(count);
        }
      });

    document
      .querySelectorAll('cart-dot, .header__cart-dot')
      .forEach((dot) => {
        dot.classList.toggle('is-visible', count > 0);
        dot.setAttribute('data-count', String(count));
      });
  };

  const fetchCart = () =>
    fetchJson(`${cartRoute('cart.js')}?timestamp=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

  const isCompleteCart = (cart) =>
    Boolean(
      cart &&
        Array.isArray(cart.items) &&
        typeof cart.item_count === 'number'
    );

  const getFreeGiftConfig = () => {
    const section = getCartSection();

    if (!section) {
      return {
        enabled: false,
        giftVariantId: 0,
        threshold: 0,
        removeBelowThreshold: false,
      };
    }

    return {
      enabled: section.dataset.autoAddGift === 'true',
      giftVariantId: Number(section.dataset.giftVariantId || 0),
      threshold: Number(section.dataset.giftThreshold || 0),
      removeBelowThreshold: section.dataset.removeGift === 'true',
    };
  };

  const isFreeGiftItem = (item) =>
    String(item?.properties?._cleo_free_gift) === 'true';

  const syncFreeGift = async (cart) => {
    const config = getFreeGiftConfig();

    if (
      !config.enabled ||
      !config.giftVariantId ||
      config.threshold <= 0 ||
      !isCompleteCart(cart) ||
      cartState.giftSyncInProgress
    ) {
      return {
        cart,
        changed: false,
      };
    }

    const giftItem = cart.items.find(
      (item) =>
        Number(item.variant_id) === config.giftVariantId &&
        isFreeGiftItem(item)
    );

    const qualifyingSubtotal = cart.items.reduce((subtotal, item) => {
      if (isFreeGiftItem(item)) return subtotal;
      return subtotal + Number(item.final_line_price || 0);
    }, 0);

    const giftUnlocked = qualifyingSubtotal >= config.threshold;
    cartState.giftSyncInProgress = true;

    try {
      if (giftUnlocked && !giftItem) {
        await fetchJson(cartRoute('cart/add.js'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [
              {
                id: config.giftVariantId,
                quantity: 1,
                properties: {
                  _cleo_free_gift: 'true',
                },
              },
            ],
          }),
        });

        return {
          cart: await fetchCart(),
          changed: true,
        };
      }

      if (giftUnlocked && giftItem && Number(giftItem.quantity) !== 1) {
        const updatedCart = await fetchJson(cartRoute('cart/change.js'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: giftItem.key,
            quantity: 1,
          }),
        });

        return {
          cart: isCompleteCart(updatedCart)
            ? updatedCart
            : await fetchCart(),
          changed: true,
        };
      }

      if (
        !giftUnlocked &&
        giftItem &&
        config.removeBelowThreshold
      ) {
        const updatedCart = await fetchJson(cartRoute('cart/change.js'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: giftItem.key,
            quantity: 0,
          }),
        });

        return {
          cart: isCompleteCart(updatedCart)
            ? updatedCart
            : await fetchCart(),
          changed: true,
        };
      }
    } catch (error) {
      console.warn('[Cleo cart] Free gift sync failed.', error);
    } finally {
      cartState.giftSyncInProgress = false;
    }

    return {
      cart,
      changed: false,
    };
  };

  const extractCartSectionHtml = (html) => {
    if (!html || typeof html !== 'string') return '';

    const parser = new DOMParser();
    const parsedDocument = parser.parseFromString(html, 'text/html');
    const parsedSection = parsedDocument.querySelector(
      '[data-cleo-drawer-section]'
    );

    return parsedSection?.outerHTML || '';
  };

  const fetchCartSectionHtml = async () => {
    const currentSection = getCartSection();

    if (!currentSection) {
      throw new Error('Cleo cart drawer markup could not be found.');
    }

    const sectionId = getCartSectionId(currentSection);

    if (sectionId) {
      currentSection.dataset.sectionId = sectionId;

      const sectionUrl = new URL(window.location.href);
      sectionUrl.searchParams.delete('section_id');
      sectionUrl.searchParams.set('sections', sectionId);
      sectionUrl.searchParams.set('_cleo_cart', String(Date.now()));

      try {
        const sections = await fetchJson(sectionUrl.toString(), {
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        const sectionHtml = sections?.[sectionId];

        if (sectionHtml) {
          return sectionHtml;
        }
      } catch (sectionError) {
        console.warn(
          '[Cleo cart] Section Rendering API failed; using full-page fallback.',
          sectionError
        );
      }
    }

    /*
     * Some themes render the drawer through a snippet, app block, or an
     * overlay group that does not expose data-section-id. In that case the
     * normal Shopify Section Rendering API cannot be addressed. Fetching the
     * current storefront page still returns fresh Liquid cart markup because
     * Shopify reads the updated cart cookie on every request.
     */
    const pageUrl = new URL(window.location.href);
    pageUrl.searchParams.delete('sections');
    pageUrl.searchParams.delete('section_id');
    pageUrl.searchParams.set('_cleo_cart_page', String(Date.now()));

    const pageHtml = await fetchText(pageUrl.toString(), {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    const fallbackSectionHtml = extractCartSectionHtml(pageHtml);

    if (!fallbackSectionHtml) {
      throw new Error(
        'Fresh cart drawer markup could not be found in the storefront response.'
      );
    }

    return fallbackSectionHtml;
  };

  const replaceCartSection = (sectionHtml, shouldOpen) => {
    const currentSection = getCartSection();

    if (!currentSection) {
      throw new Error('Current Cleo cart drawer section was not found.');
    }

    const resolvedSectionId = getCartSectionId(currentSection);
    const template = document.createElement('template');
    template.innerHTML = sectionHtml.trim();

    const nextSection = template.content.querySelector(
      '[data-cleo-drawer-section]'
    );

    if (!nextSection) {
      throw new Error('Updated Cleo cart drawer markup was not found.');
    }

    if (!nextSection.dataset.sectionId && resolvedSectionId) {
      nextSection.dataset.sectionId = resolvedSectionId;
    }

    nextSection.classList.remove('is-open', 'is-busy');
    nextSection.setAttribute('aria-busy', 'false');
    currentSection.replaceWith(nextSection);

    initCartTimer();

    if (shouldOpen) {
      openCartDrawer({ focusClose: false });
    } else {
      closeCartDrawer({ restoreFocus: false });
    }

    return nextSection;
  };

  const renderCartSection = async ({ open = null } = {}) => {
    const shouldOpen = open === null ? isCartDrawerOpen() : Boolean(open);
    const sectionHtml = await fetchCartSectionHtml();
    return replaceCartSection(sectionHtml, shouldOpen);
  };

  const reconcileCart = async ({
    open = null,
    cart = null,
    syncGift = true,
    render = true,
  } = {}) => {
    let currentCart = isCompleteCart(cart) ? cart : await fetchCart();

    if (syncGift) {
      const giftResult = await syncFreeGift(currentCart);
      currentCart = giftResult.cart;
    }

    updateExternalCartCount(currentCart);

    if (render) {
      await renderCartSection({ open });
    }

    return currentCart;
  };

  const dispatchCartUpdated = (cart, source) => {
    document.dispatchEvent(
      new CustomEvent('cart:updated', {
        bubbles: true,
        detail: {
          cart,
          source,
        },
      })
    );
  };

  const runCartMutation = async (mutation, source) => {
    if (cartState.mutationInProgress) return null;

    cartState.mutationInProgress = true;
    setCartBusy(true);

    try {
      const responseCart = await mutation();
      const currentCart = await reconcileCart({
        open: true,
        cart: isCompleteCart(responseCart) ? responseCart : null,
        syncGift: true,
        render: true,
      });

      dispatchCartUpdated(currentCart, source);
      return currentCart;
    } catch (error) {
      console.error('[Cleo cart] Cart mutation failed.', error);

      try {
        await reconcileCart({
          open: true,
          syncGift: false,
          render: true,
        });
      } catch (refreshError) {
        console.error(
          '[Cleo cart] Cart recovery refresh failed.',
          refreshError
        );
      }

      showCartError(error.message);
      return null;
    } finally {
      cartState.mutationInProgress = false;
      setCartBusy(false);
    }
  };

  const changeCartLine = (key, quantity) => {
    const safeQuantity = Math.max(0, Number(quantity || 0));

    if (!key || Number.isNaN(safeQuantity)) {
      showCartError('Missing cart line information.');
      return Promise.resolve(null);
    }

    return runCartMutation(
      () =>
        fetchJson(cartRoute('cart/change.js'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: key,
            quantity: safeQuantity,
          }),
        }),
      'cleo-cart-drawer'
    );
  };

  const addCartVariant = (
    variantId,
    quantity = 1,
    properties = undefined
  ) => {
    const safeVariantId = Number(variantId || 0);
    const safeQuantity = Math.max(1, Number(quantity || 1));

    if (!safeVariantId) {
      showCartError('This product variant is unavailable.');
      return Promise.resolve(null);
    }

    const item = {
      id: safeVariantId,
      quantity: safeQuantity,
    };

    if (properties && typeof properties === 'object') {
      item.properties = properties;
    }

    return runCartMutation(
      () =>
        fetchJson(cartRoute('cart/add.js'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items: [item] }),
        }),
      'cleo-cart-upsell'
    );
  };

  const scrollCartUpsells = (direction) => {
    const track = getCartSection()?.querySelector(
      '[data-cleo-upsell-track]'
    );

    if (!track) return;

    const card = track.querySelector('.cleo-upsell-card');
    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '10');
    const distance = card
      ? card.getBoundingClientRect().width + gap
      : track.clientWidth * 0.5;

    track.scrollBy({
      left: direction * distance,
      behavior: 'smooth',
    });
  };

  const isCartLink = (link) => {
    if (!link?.href) return false;

    try {
      const linkUrl = new URL(link.href, window.location.origin);
      const cartUrl = new URL(cartRoute('cart'), window.location.origin);

      return (
        linkUrl.origin === window.location.origin &&
        linkUrl.pathname.replace(/\/+$/, '') ===
          cartUrl.pathname.replace(/\/+$/, '')
      );
    } catch (_error) {
      return false;
    }
  };

  const handleCartClick = (event) => {
    const closeButton = event.target.closest?.('[data-cleo-cart-close]');

    if (closeButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeCartDrawer();
      return;
    }

    const cartChangeButton = event.target.closest?.(
      '[data-cleo-cart-change]'
    );

    if (cartChangeButton) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (cartState.mutationInProgress) return;

      changeCartLine(
        cartChangeButton.dataset.lineKey,
        cartChangeButton.dataset.quantity
      );
      return;
    }

    const upsellButton = event.target.closest?.(
      '[data-cleo-add-upsell]'
    );

    if (upsellButton) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (cartState.mutationInProgress) return;

      addCartVariant(
        upsellButton.dataset.variantId,
        upsellButton.dataset.quantity || 1
      );
      return;
    }

    if (event.target.closest?.('[data-cleo-upsell-previous]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      scrollCartUpsells(-1);
      return;
    }

    if (event.target.closest?.('[data-cleo-upsell-next]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      scrollCartUpsells(1);
      return;
    }

    const cartOpener = event.target.closest?.(
      '[data-cleo-cart-open], [data-cart-drawer-open], [aria-controls="cart-drawer"]'
    );

    if (cartOpener) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openCartDrawer();

      reconcileCart({
        open: true,
        syncGift: true,
        render: true,
      }).catch((error) => {
        console.error('[Cleo cart] Unable to open cart drawer.', error);
        showCartError(error.message);
      });
      return;
    }

    const link = event.target.closest?.('a[href]');

    if (
      link &&
      isCartLink(link) &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      link.target !== '_blank'
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openCartDrawer();

      reconcileCart({
        open: true,
        syncGift: true,
        render: true,
      }).catch((error) => {
        console.error('[Cleo cart] Unable to open cart drawer.', error);
        showCartError(error.message);
      });
    }
  };

  const trapCartFocus = (event) => {
    if (event.key !== 'Tab' || !isCartDrawerOpen()) return;

    const drawer = getCartDrawer();

    if (!drawer) return;

    const focusableElements = Array.from(
      drawer.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(
      (element) =>
        element.offsetWidth > 0 ||
        element.offsetHeight > 0 ||
        element === document.activeElement
    );

    if (!focusableElements.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const initCartTimer = () => {
    window.clearInterval(cartState.timerInterval);
    cartState.timerInterval = null;

    const section = getCartSection();
    const timerElement = section?.querySelector('[data-cleo-timer]');

    if (!section || !timerElement) return;

    const itemCount = Math.max(0, Number(section.dataset.cartCount || 0));
    const minutes = Math.max(
      1,
      Number(section.dataset.reservationMinutes || 5)
    );
    const cartToken = section.dataset.cartToken || 'default';
    const storageKey = `cleo-cart-reservation-${cartToken}`;

    if (itemCount <= 0) {
      safeStorage.remove(window.sessionStorage, storageKey);
      return;
    }

    const duration = minutes * 60 * 1000;
    const now = Date.now();
    let expiry = Number(
      safeStorage.get(window.sessionStorage, storageKey) || 0
    );

    if (!expiry || expiry <= now) {
      expiry = now + duration;
      safeStorage.set(window.sessionStorage, storageKey, String(expiry));
    }

    const updateTimer = () => {
      const remainingSeconds = Math.max(
        0,
        Math.ceil((expiry - Date.now()) / 1000)
      );
      const remainingMinutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;

      timerElement.textContent = `${String(remainingMinutes).padStart(
        2,
        '0'
      )}:${String(seconds).padStart(2, '0')}`;

      if (remainingSeconds <= 0) {
        window.clearInterval(cartState.timerInterval);
        cartState.timerInterval = null;
      }
    };

    updateTimer();
    cartState.timerInterval = window.setInterval(updateTimer, 1000);
  };

  const scheduleCartRefresh = ({
    open = null,
    cart = null,
    syncGift = true,
  } = {}) => {
    window.clearTimeout(cartState.refreshTimeout);

    cartState.refreshTimeout = window.setTimeout(() => {
      reconcileCart({
        open,
        cart,
        syncGift,
        render: true,
      }).catch((error) => {
        console.error('[Cleo cart] Scheduled refresh failed.', error);
      });
    }, 100);
  };

  window.CleoCart = Object.assign(window.CleoCart || {}, {
    addVariant: addCartVariant,
    changeLine: changeCartLine,
    close: closeCartDrawer,
    open: openCartDrawer,
    refresh: (options = {}) => reconcileCart(options),
    refreshAndOpen: () =>
      reconcileCart({ open: true, syncGift: true, render: true }),
    render: (cart, open = isCartDrawerOpen()) =>
      reconcileCart({
        open,
        cart: isCompleteCart(cart) ? cart : null,
        syncGift: false,
        render: true,
      }),
  });

  window.CleoCartDrawer = Object.assign(window.CleoCartDrawer || {}, {
    addVariant: addCartVariant,
    changeLine: changeCartLine,
    close: closeCartDrawer,
    init: () => {
      initCartTimer();
    },
    open: openCartDrawer,
    refresh: (open = null) =>
      reconcileCart({ open, syncGift: true, render: true }),
  });

  document.addEventListener('click', handleCartClick, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isCartDrawerOpen()) {
      event.preventDefault();
      closeCartDrawer();
      return;
    }

    trapCartFocus(event);
  });

  document.addEventListener('cart:refresh', (event) => {
    const open =
      typeof event.detail?.open === 'boolean'
        ? event.detail.open
        : isCartDrawerOpen();

    scheduleCartRefresh({
      open,
      cart: isCompleteCart(event.detail?.cart)
        ? event.detail.cart
        : null,
      syncGift: true,
    });
  });

  ['cart:updated', 'product:added', 'ajaxProduct:added'].forEach(
    (eventName) => {
      document.addEventListener(eventName, (event) => {
        const source = String(event.detail?.source || '');

        if (source.startsWith('cleo-')) return;

        const open =
          typeof event.detail?.open === 'boolean'
            ? event.detail.open
            : eventName !== 'cart:updated'
              ? true
              : isCartDrawerOpen();

        scheduleCartRefresh({
          open,
          cart: isCompleteCart(event.detail?.cart)
            ? event.detail.cart
            : null,
          syncGift: true,
        });
      });
    }
  );

  /* --------------------------------------------------------------------------
   * Sliders and media
   * -------------------------------------------------------------------------- */

  const updateSliderButtons = (slider) => {
    if (!slider) return;

    const maxScroll = slider.scrollWidth - slider.clientWidth - 2;
    const atStart = slider.scrollLeft <= 2;
    const atEnd = slider.scrollLeft >= maxScroll;

    document
      .querySelectorAll(`[data-cleo-slider="#${slider.id}"]`)
      .forEach((button) => {
        const direction = button.getAttribute('data-direction');
        button.disabled =
          maxScroll <= 2 || (direction === 'prev' ? atStart : atEnd);
      });
  };

  const initSliders = (scope = document) => {
    scope.querySelectorAll('[id]').forEach((slider) => {
      if (!document.querySelector(`[data-cleo-slider="#${slider.id}"]`)) {
        return;
      }

      if (slider.dataset.cleoSliderReady === 'true') return;

      slider.dataset.cleoSliderReady = 'true';
      slider.addEventListener(
        'scroll',
        () => updateSliderButtons(slider),
        { passive: true }
      );

      updateSliderButtons(slider);
    });
  };

  const refreshAllSliderButtons = () => {
    document
      .querySelectorAll('[data-cleo-slider-ready="true"]')
      .forEach((slider) => updateSliderButtons(slider));
  };

  window.addEventListener('resize', refreshAllSliderButtons, {
    passive: true,
  });

  const initVideoCarousels = (scope = document) => {
    scope.querySelectorAll('[data-cleo-video-track]').forEach((track) => {
      if (track.dataset.cleoVideoReady === 'true') return;

      track.dataset.cleoVideoReady = 'true';

      const featured =
        track.querySelector('[data-cleo-video-featured]') ||
        track.querySelector('.cleo-videos__slide');

      if (!featured) return;

      window.requestAnimationFrame(() => {
        track.scrollLeft =
          featured.offsetLeft -
          (track.clientWidth - featured.clientWidth) / 2;
      });
    });
  };

  /* --------------------------------------------------------------------------
   * Clipboard and popups
   * -------------------------------------------------------------------------- */

  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.append(input);
    input.select();

    const copied = document.execCommand('copy');
    input.remove();
    return copied;
  };

  const popupTabStorageKey = (key) => `${key}:tab-hidden`;

  const setPopupTabVisible = (key, visible) => {
    if (!key) return;

    document.querySelectorAll('[data-cleo-popup-tab]').forEach((tab) => {
      if (tab.getAttribute('data-cleo-popup-tab') !== key) return;

      tab.classList.toggle('is-visible', visible);
      tab.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });
  };

  const closeCleoPopup = (popup, persist = true) => {
    if (!popup) return;

    const key = popup.getAttribute('data-cleo-popup');
    popup.classList.remove('is-open');

    if (!key || !persist) return;

    safeStorage.set(window.localStorage, key, 'closed');
    safeStorage.remove(window.localStorage, popupTabStorageKey(key));
    setPopupTabVisible(key, true);
  };

  const openCleoPopup = (key) => {
    const popup = Array.from(
      document.querySelectorAll('[data-cleo-popup]')
    ).find((element) => element.getAttribute('data-cleo-popup') === key);

    if (!popup) return;

    safeStorage.remove(window.localStorage, key);
    setPopupTabVisible(key, false);
    popup.classList.add('is-open');
    popup
      .querySelector('[data-cleo-popup-close]')
      ?.focus({ preventScroll: true });
  };

  const hideCleoPopupTab = (tab) => {
    if (!tab) return;

    const key = tab.getAttribute('data-cleo-popup-tab');

    if (key) {
      safeStorage.set(
        window.localStorage,
        popupTabStorageKey(key),
        'true'
      );
    }

    tab.classList.remove('is-visible');
    tab.setAttribute('aria-hidden', 'true');
  };

  /* --------------------------------------------------------------------------
   * Product and bundle selection
   * -------------------------------------------------------------------------- */

  const syncBundleSelection = (input) => {
    if (!input) return;

    const formId = input.getAttribute('form');
    const form = formId ? document.getElementById(formId) : input.closest('form');
    const scope = input.closest('.cleo-product-page') || document;
    const idInput = form?.querySelector('[name="id"]');
    const quantityInput = form?.querySelector(
      '[data-cleo-product-quantity], [name="quantity"]'
    );
    const price = scope.querySelector('[data-cleo-product-price]');
    const compare = scope.querySelector('[data-cleo-product-compare]');
    const submit = form?.querySelector('[type="submit"]');
    const submitText = submit?.querySelector('[data-cleo-submit-text]');
    const available = input.dataset.available !== 'false';

    if (idInput) idInput.value = input.value;

    if (quantityInput && input.dataset.quantity) {
      quantityInput.value = input.dataset.quantity;
    }

    if (price && input.dataset.price) {
      price.textContent = formatMoney(input.dataset.price);
    }

    if (compare) {
      const comparePrice = Number(input.dataset.compare || 0);
      const priceValue = Number(input.dataset.price || 0);
      const hasComparePrice = comparePrice > priceValue;

      compare.textContent = hasComparePrice
        ? formatMoney(comparePrice)
        : '';
      compare.hidden = !hasComparePrice;
    }

    if (submit) submit.disabled = !available;

    if (submitText) {
      submitText.textContent = available ? 'Add to cart' : 'Sold out';
    }

    const group = input.closest('.cleo-bundle__cards');

    group?.querySelectorAll('.cleo-bundle-card').forEach((card) => {
      card.classList.toggle('is-selected', card.contains(input));
    });
  };

  const updateBundleCardsForVariant = (scope, variant) => {
    if (!scope || !variant) return;

    scope.querySelectorAll('[data-cleo-bundle-variant]').forEach((input) => {
      const priceMultiplier = Number(
        input.dataset.priceMultiplier || input.dataset.quantity || 1
      );
      const compareMultiplier = Number(
        input.dataset.compareMultiplier || input.dataset.quantity || 1
      );
      const baseCompare =
        Number(variant.compare_at_price || 0) > Number(variant.price || 0)
          ? Number(variant.compare_at_price || 0)
          : Number(variant.price || 0);
      const bundlePrice = Math.ceil(
        Number(variant.price || 0) * priceMultiplier
      );
      const bundleCompare = Math.ceil(baseCompare * compareMultiplier);
      const card = input.closest('.cleo-bundle-card');
      const cardPrice = card?.querySelector('[data-cleo-bundle-price]');
      const cardCompare = card?.querySelector(
        '[data-cleo-bundle-compare]'
      );

      input.value = variant.id;
      input.dataset.price = String(bundlePrice);
      input.dataset.compare = String(bundleCompare);
      input.dataset.available = String(Boolean(variant.available));

      if (cardPrice) {
        cardPrice.textContent = formatMoney(bundlePrice);
      }

      if (cardCompare) {
        const hasComparePrice = bundleCompare > bundlePrice;

        cardCompare.textContent = hasComparePrice
          ? formatMoney(bundleCompare)
          : '';
        cardCompare.hidden = !hasComparePrice;
      }
    });

    const checkedBundle =
      scope.querySelector('[data-cleo-bundle-variant]:checked') ||
      scope.querySelector('[data-cleo-bundle-variant]');

    syncBundleSelection(checkedBundle);
  };

  const parseVariants = (form) => {
    try {
      return JSON.parse(
        form.querySelector('[data-cleo-variants]')?.textContent || '[]'
      );
    } catch (error) {
      console.warn('[Cleo product] Invalid variant JSON.', error);
      return [];
    }
  };

  const initProductForms = (scope = document) => {
    scope.querySelectorAll('[data-cleo-bundle-variant]').forEach((input) => {
      if (input.dataset.cleoBundleReady === 'true') return;

      input.dataset.cleoBundleReady = 'true';
      input.addEventListener('change', () => syncBundleSelection(input));

      if (input.checked) {
        syncBundleSelection(input);
      }
    });

    scope
      .querySelectorAll(
        '[data-cleo-product-form], .cleo-product__form, .cleo-product-form'
      )
      .forEach((form) => {
        if (form.dataset.cleoProductReady === 'true') return;

        form.dataset.cleoProductReady = 'true';

        const variants = parseVariants(form);
        const idInput = form.querySelector('[name="id"]');
        const productScope = form.closest('.cleo-product-page') || document;
        const price = productScope.querySelector(
          '[data-cleo-product-price]'
        );
        const compare = productScope.querySelector(
          '[data-cleo-product-compare]'
        );
        const submit = form.querySelector('[type="submit"]');
        const submitText = submit?.querySelector('[data-cleo-submit-text]');
        const escapeSelector =
          window.CSS?.escape ||
          ((value) => String(value).replace(/["\\]/g, '\\$&'));
        const externalOptionSelector = form.id
          ? `[data-cleo-option][form="${escapeSelector(form.id)}"]`
          : '';
        const externalOptionInputs = externalOptionSelector
          ? Array.from(document.querySelectorAll(externalOptionSelector))
          : [];
        const optionInputs = [
          ...form.querySelectorAll('[data-cleo-option]'),
          ...externalOptionInputs,
        ];
        const optionGroups = [
          ...form.querySelectorAll('[data-cleo-option-index]'),
          ...Array.from(
            document.querySelectorAll('[data-cleo-option-index]')
          ).filter((group) =>
            externalOptionInputs.some((input) => group.contains(input))
          ),
        ];

        const syncVariant = () => {
          const selected = optionGroups.map(
            (group) =>
              group.querySelector('[data-cleo-option]:checked')?.value
          );
          const variant = variants.find((item) =>
            item.options.every(
              (option, index) => option === selected[index]
            )
          );

          if (!variant) return;

          if (idInput) idInput.value = variant.id;
          if (price) price.textContent = formatMoney(variant.price);

          if (compare) {
            const hasComparePrice =
              variant.compare_at_price > variant.price;

            compare.textContent = hasComparePrice
              ? formatMoney(variant.compare_at_price)
              : '';
            compare.hidden = !hasComparePrice;
          }

          if (submit) submit.disabled = !variant.available;

          if (submitText) {
            submitText.textContent = variant.available
              ? 'Add to cart'
              : 'Sold out';
          }

          updateBundleCardsForVariant(productScope, variant);

          const url = new URL(window.location.href);
          url.searchParams.set('variant', variant.id);
          window.history.replaceState({}, '', url.toString());
        };

        optionInputs.forEach((input) => {
          input.addEventListener('change', syncVariant);
        });

        syncVariant();
      });
  };

  /* --------------------------------------------------------------------------
   * Non-cart click controls
   * -------------------------------------------------------------------------- */

  document.addEventListener('click', async (event) => {
    const popupTabClose = event.target.closest(
      '[data-cleo-popup-tab-close]'
    );

    if (popupTabClose) {
      event.preventDefault();
      hideCleoPopupTab(
        popupTabClose.closest('[data-cleo-popup-tab]')
      );
      return;
    }

    const popupOpen = event.target.closest('[data-cleo-popup-open]');

    if (popupOpen) {
      event.preventDefault();
      openCleoPopup(popupOpen.getAttribute('data-cleo-popup-open'));
      return;
    }

    const drawerToggle = event.target.closest('[data-cleo-drawer-toggle]');

    if (drawerToggle) {
      const drawer = document.querySelector(
        drawerToggle.getAttribute('data-cleo-drawer-toggle')
      );

      setDrawerOpen(drawer, !drawer?.classList.contains('is-open'));
      return;
    }

    const drawerClose = event.target.closest('[data-cleo-drawer-close]');

    if (drawerClose) {
      setDrawerOpen(
        drawerClose.closest('.cleo-drawer, .cleo-mobile-menu'),
        false
      );
      return;
    }

    const sliderButton = event.target.closest('[data-cleo-slider]');

    if (sliderButton) {
      event.preventDefault();

      const slider = document.querySelector(
        sliderButton.getAttribute('data-cleo-slider')
      );
      const direction =
        sliderButton.getAttribute('data-direction') === 'prev' ? -1 : 1;
      const card = slider?.querySelector(':scope > *');

      if (slider && card) {
        const styles = getComputedStyle(slider);
        const gap = Number.parseFloat(
          styles.columnGap || styles.gap || '24'
        );
        const distance = card.getBoundingClientRect().width + gap;

        slider.scrollBy({
          left: direction * distance,
          behavior: 'smooth',
        });

        window.setTimeout(() => updateSliderButtons(slider), 280);
      }

      return;
    }

    const shoppableVideo = event.target.closest(
      '[data-cleo-shoppable-video]'
    );

    if (shoppableVideo) {
      if (shoppableVideo.paused) {
        shoppableVideo.play().catch(() => {});
      } else {
        shoppableVideo.pause();
      }

      return;
    }

    const popoverToggle = event.target.closest(
      '[data-cleo-popover-toggle]'
    );

    if (popoverToggle) {
      const popover = document.getElementById(
        popoverToggle.getAttribute('aria-controls')
      );

      popover?.classList.toggle('is-open');
      return;
    }

    if (
      !event.target.closest(
        '[data-cleo-popover], [data-cleo-popover-toggle]'
      )
    ) {
      document
        .querySelectorAll('[data-cleo-popover].is-open')
        .forEach((popover) => popover.classList.remove('is-open'));
    }

    if (event.target.closest('[data-cleo-filter-toggle]')) {
      event.preventDefault();
      document.documentElement.classList.add('cleo-filter-open');
      return;
    }

    if (event.target.closest('[data-cleo-filter-close]')) {
      document.documentElement.classList.remove('cleo-filter-open');
      return;
    }

    const layoutButton = event.target.closest('[data-cleo-layout]');

    if (layoutButton) {
      const switcher = layoutButton.closest(
        '[data-cleo-layout-switch], collection-layout-switch'
      );
      const target = switcher
        ? document.getElementById(switcher.getAttribute('aria-controls'))
        : null;
      const value = layoutButton.getAttribute('data-cleo-layout');
      const device =
        switcher?.getAttribute('data-device') ||
        switcher?.getAttribute('device');

      switcher?.querySelectorAll('[data-cleo-layout]').forEach((button) => {
        button.classList.toggle('is-active', button === layoutButton);
      });

      if (target && device === 'mobile') {
        target.setAttribute('collection-mobile-layout', value);
      }

      if (target && device === 'desktop') {
        target.setAttribute('collection-desktop-layout', value);
      }

      return;
    }

    const quantityButton = event.target.closest('[data-cleo-qty]');

    if (quantityButton) {
      event.preventDefault();

      const selector = quantityButton.closest(
        'quantity-selector, .quantity-selector'
      );
      const input = selector?.querySelector('input[type="number"]');

      if (!input) return;

      const step = Number(input.step || 1);
      const min = Number(input.min || 0);
      const current = Number(input.value || min);
      const next =
        quantityButton.getAttribute('data-cleo-qty') === 'plus'
          ? current + step
          : Math.max(min, current - step);

      input.value = String(next);
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    const galleryThumb = event.target.closest(
      '[data-cleo-gallery-thumb]'
    );

    if (galleryThumb) {
      event.preventDefault();

      const gallery = document.querySelector(
        galleryThumb.getAttribute('data-cleo-gallery-thumb')
      );
      const position =
        Number(galleryThumb.getAttribute('data-media-position')) - 1;
      const target = gallery?.children[position];

      if (gallery && target) {
        gallery.scrollTo({
          left: target.offsetLeft,
          behavior: 'smooth',
        });

        galleryThumb
          .closest('product-gallery-navigation')
          ?.querySelectorAll('[data-cleo-gallery-thumb]')
          .forEach((button) => {
            button.setAttribute(
              'aria-current',
              button === galleryThumb ? 'true' : 'false'
            );
          });
      }

      return;
    }

    const copyButton = event.target.closest('[data-cleo-copy]');

    if (copyButton) {
      const label = copyButton.querySelector('small');
      const original = label?.textContent;
      const copied = await copyText(
        copyButton.getAttribute('data-cleo-copy')
      );

      if (label) {
        label.textContent = copied ? 'Copied' : 'Copy failed';
      }

      window.setTimeout(() => {
        if (label && original) label.textContent = original;
      }, 1400);

      return;
    }

    const popupClose = event.target.closest('[data-cleo-popup-close]');

    if (popupClose) {
      const popup = popupClose.closest('.cleo-popup');
      if (popup) closeCleoPopup(popup);
    }
  });

  document.addEventListener('keydown', (event) => {
    const shoppableVideo = event.target.closest?.(
      '[data-cleo-shoppable-video]'
    );

    if (
      shoppableVideo &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();

      if (shoppableVideo.paused) {
        shoppableVideo.play().catch(() => {});
      } else {
        shoppableVideo.pause();
      }

      return;
    }

    if (event.key !== 'Escape') return;

    document.documentElement.classList.remove('cleo-filter-open');
    document
      .querySelectorAll('.cleo-popup.is-open')
      .forEach((element) => closeCleoPopup(element));
    document
      .querySelectorAll('.cleo-mobile-menu.is-open')
      .forEach((element) => element.classList.remove('is-open'));
    document.documentElement.classList.remove('cleo-drawer-open');
    document
      .querySelectorAll('[data-cleo-popover].is-open')
      .forEach((popover) => popover.classList.remove('is-open'));
  });

  /* --------------------------------------------------------------------------
   * AJAX product add forms
   * -------------------------------------------------------------------------- */

  const cleoAjaxFormSelector = [
    '[data-cleo-quick-add]',
    '.cleo-quick-add',
    '[data-cleo-ajax-cart]',
    '[data-cleo-product-form]',
    '.cleo-product__form',
    '.cleo-product-form',
  ].join(',');

  const genericAjaxFormSelector = [
    'product-form form',
    '.product-card__form form',
  ].join(',');

  const shouldHandleAjaxForm = (form) => {
    if (!form || form.dataset.cleoNoAjax === 'true') return false;

    if (form.matches(cleoAjaxFormSelector)) return true;

    if (!form.matches(genericAjaxFormSelector)) return false;

    return getCartSection()?.dataset.interceptAdd === 'true';
  };

  document.addEventListener(
    'submit',
    async (event) => {
      const form = event.target.closest('form');

      if (!shouldHandleAjaxForm(form) || !window.fetch) return;

      let actionUrl;

      try {
        actionUrl = new URL(form.action, window.location.origin);
      } catch (_error) {
        return;
      }

      if (!actionUrl.pathname.includes('/cart/add')) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (form.dataset.cleoSubmitting === 'true') return;
      form.dataset.cleoSubmitting = 'true';

      const button = event.submitter || form.querySelector('[type="submit"]');
      const label =
        button?.querySelector('[data-cleo-submit-text]') || button;
      const originalLabel = label?.textContent;
      const originalDisabled = button?.disabled;

      if (label) label.textContent = 'Adding...';
      if (button) button.disabled = true;

      try {
        await fetchJson(cartRoute('cart/add.js'), {
          method: 'POST',
          body: new FormData(form),
        });

        const cart = await reconcileCart({
          open: true,
          syncGift: true,
          render: true,
        });

        dispatchCartUpdated(cart, 'cleo-product-form');

        if (label) label.textContent = 'Added';
      } catch (error) {
        console.error('[Cleo cart] Product add failed.', error);
        openCartDrawer();
        showCartError(error.message);

        if (label) label.textContent = 'Try again';
      } finally {
        window.setTimeout(() => {
          if (label && originalLabel) {
            label.textContent = originalLabel;
          }

          if (button) {
            button.disabled = Boolean(originalDisabled);
          }

          form.dataset.cleoSubmitting = 'false';
        }, 1200);
      }
    },
    true
  );

  /* --------------------------------------------------------------------------
   * Initialization
   * -------------------------------------------------------------------------- */

  const initPopups = (scope = document) => {
    scope.querySelectorAll('[data-cleo-popup]').forEach((popup) => {
      if (popup.dataset.cleoPopupReady === 'true') return;

      popup.dataset.cleoPopupReady = 'true';
      const key = popup.getAttribute('data-cleo-popup');

      if (safeStorage.get(window.localStorage, key)) {
        setPopupTabVisible(
          key,
          !safeStorage.get(
            window.localStorage,
            popupTabStorageKey(key)
          )
        );
        return;
      }

      window.setTimeout(() => {
        setPopupTabVisible(key, false);
        popup.classList.add('is-open');
        popup
          .querySelector('[data-cleo-popup-close]')
          ?.focus({ preventScroll: true });
      }, 900);
    });
  };

  const initializeScope = (scope = document) => {
    const cartSection = getCartSection();
    const resolvedSectionId = getCartSectionId(cartSection);

    if (cartSection && resolvedSectionId) {
      cartSection.dataset.sectionId = resolvedSectionId;
    }

    initSliders(scope);
    initVideoCarousels(scope);
    initProductForms(scope);
    initPopups(scope);
    initCartTimer();
  };

  initializeScope();

  document.addEventListener('shopify:section:load', (event) => {
    initializeScope(event.target);
  });

  document.addEventListener('shopify:section:unload', () => {
    window.clearInterval(cartState.timerInterval);
    cartState.timerInterval = null;
  });

  fetchCart()
    .then(async (cart) => {
      updateExternalCartCount(cart);

      const giftResult = await syncFreeGift(cart);

      if (giftResult.changed) {
        updateExternalCartCount(giftResult.cart);
        await renderCartSection({ open: false });
      }
    })
    .catch((error) => {
      console.warn('[Cleo cart] Initial cart sync failed.', error);
    });
})();
