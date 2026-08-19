/* FAUZ — Inner pages (collection, product, contact, FAQ, policies) */
(function () {
  'use strict';

  if (window.FAUZ && window.FAUZ.isHome) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    initPageReveal();
    initCollectionSort();
    initProductVariants();
    initStickyAtc();
    initProductGallery();
    initReadMore();
  });

  function initPageReveal() {
    if (reducedMotion) return;
    var els = document.querySelectorAll('[data-page-reveal]');
    if (!els.length || !('IntersectionObserver' in window)) return;

    els.forEach(function (el) {
      el.classList.add('is-page-hidden');
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-page-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { observer.observe(el); });
  }

  function initCollectionSort() {
    var select = document.querySelector('[data-collection-sort]');
    if (!select) return;
    select.addEventListener('change', function () {
      var url = new URL(window.location.href);
      url.searchParams.set('sort_by', select.value);
      window.location.href = url.toString();
    });
  }

  function initProductVariants() {
    var root = document.querySelector('[data-product-form]');
    if (!root) return;

    var variantsEl = document.getElementById('FzProductVariants');
    if (!variantsEl) return;

    var variants;
    try {
      variants = JSON.parse(variantsEl.textContent);
    } catch (e) {
      return;
    }

    var idInput = root.querySelector('[name="id"]');
    var priceEl = root.querySelector('[data-atc-price]');
    var atcBtn = root.querySelector('[type="submit"]');
    var selected = {};

    root.querySelectorAll('[data-option-value]').forEach(function (btn) {
      var position = btn.getAttribute('data-option-position');
      var value = btn.getAttribute('data-option-value');
      if (btn.classList.contains('is-selected')) {
        selected[position] = value;
      }
      btn.addEventListener('click', function () {
        root.querySelectorAll('[data-option-position="' + position + '"]').forEach(function (b) {
          b.classList.remove('is-selected');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed', 'true');
        selected[position] = value;
        syncVariant();
      });
    });

    function syncVariant() {
      var match = variants.find(function (variant) {
        return variant.options.every(function (opt, i) {
          return selected[String(i + 1)] === opt;
        });
      });

      if (!match) return;

      if (idInput) idInput.value = match.id;

      if (priceEl) {
        priceEl.setAttribute('data-unit-price', match.price);
        var qty = root.querySelector('[data-qty-input]');
        var q = qty ? Math.max(1, Number(qty.value)) : 1;
        updateAtcPrice(match.price, q);
      }

      var headerPrice = document.querySelector('[data-product-price]');
      if (headerPrice && window.FAUZ && typeof window.FAUZ.formatMoney === 'function') {
        headerPrice.textContent = window.FAUZ.formatMoney(match.price);
      } else if (headerPrice) {
        headerPrice.textContent = (match.price / 100).toFixed(0);
      }

      if (atcBtn) {
        atcBtn.disabled = !match.available;
        var label = atcBtn.querySelector('[data-atc-price]');
        if (!match.available) {
          atcBtn.disabled = true;
        } else if (label) {
          atcBtn.disabled = false;
        }
      }

      var stickyBtn = document.querySelector('[data-sticky-atc-trigger]');
      if (stickyBtn) {
        stickyBtn.disabled = !match.available;
        stickyBtn.textContent = match.available ? 'Add to cart' : 'Sold out';
      }

      root.querySelectorAll('[data-option-value]').forEach(function (btn) {
        var pos = Number(btn.getAttribute('data-option-position')) - 1;
        var val = btn.getAttribute('data-option-value');
        var available = variants.some(function (variant) {
          if (!variant.available || variant.options[pos] !== val) return false;
          return variant.options.every(function (opt, i) {
            if (i === pos) return true;
            return !selected[String(i + 1)] || selected[String(i + 1)] === opt;
          });
        });
        btn.classList.toggle('is-unavailable', !available);
        btn.disabled = !available;
      });
    }

    function updateAtcPrice(unitCents, qty) {
      if (!priceEl) return;
      var cents = unitCents * qty;
      if (window.FAUZ && typeof window.FAUZ.formatMoney === 'function') {
        priceEl.textContent = window.FAUZ.formatMoney(cents);
      } else {
        priceEl.textContent = (cents / 100).toFixed(0);
      }
      var stickyPrice = document.querySelector('[data-sticky-atc-price]');
      if (stickyPrice) {
        stickyPrice.textContent = priceEl.textContent;
      }
    }

    syncVariant();
  }

  function initStickyAtc() {
    var bar = document.querySelector('[data-sticky-atc]');
    var buy = document.querySelector('[data-buy-area]');
    if (!bar || !buy || !('IntersectionObserver' in window)) return;

    if (!window.matchMedia('(max-width: 900px)').matches) return;

    var dismissed = false;
    try {
      dismissed = sessionStorage.getItem('fz-sticky-atc-dismissed') === '1';
    } catch (e) {}

    if (dismissed) bar.classList.add('is-dismissed');

    function setVisible(show) {
      if (dismissed) return;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
    }

    var observer = new IntersectionObserver(function (entries) {
      setVisible(!entries[0].isIntersecting);
    }, { threshold: 0, rootMargin: '0px 0px -12px 0px' });

    observer.observe(buy);

    var dismissBtn = bar.querySelector('[data-sticky-atc-dismiss]');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function () {
        dismissed = true;
        try {
          sessionStorage.setItem('fz-sticky-atc-dismissed', '1');
        } catch (e) {}
        bar.classList.remove('is-visible');
        bar.classList.add('is-dismissed');
        bar.setAttribute('aria-hidden', 'true');
      });
    }

    var stickyBtn = bar.querySelector('[data-sticky-atc-trigger]');
    if (stickyBtn) {
      stickyBtn.addEventListener('click', function () {
        if (stickyBtn.disabled) return;
        var form = document.querySelector('[data-fz-atc-form]');
        if (form) form.requestSubmit();
      });
    }
  }

  function initProductGallery() {
    var root = document.querySelector('[data-gallery-thumbs]');
    if (!root) return;

    var thumbs = root.querySelectorAll('[data-thumb]');
    if (!thumbs.length) return;

    var main = document.querySelector('[data-main-image]');
    var current = 0;

    function setActive(index) {
      if (index < 0) index = thumbs.length - 1;
      if (index >= thumbs.length) index = 0;
      current = index;

      var thumb = thumbs[current];
      if (main) {
        main.src = thumb.getAttribute('data-thumb');
        var srcset = thumb.getAttribute('data-thumb-srcset');
        if (srcset) main.srcset = srcset;
        else main.removeAttribute('srcset');
      }

      thumbs.forEach(function (btn, i) {
        btn.classList.toggle('is-active', i === current);
      });

      if (thumb.scrollIntoView) {
        thumb.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      }
    }

    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener('click', function (e) {
        e.preventDefault();
        setActive(i);
      });
    });

    var prev = document.querySelector('[data-gallery-prev]');
    var next = document.querySelector('[data-gallery-next]');
    if (prev) prev.addEventListener('click', function () { setActive(current - 1); });
    if (next) next.addEventListener('click', function () { setActive(current + 1); });

    var stage = document.querySelector('[data-gallery-stage]');
    if (!stage || thumbs.length < 2) return;

    var startX = 0;
    var startY = 0;
    var tracking = false;

    stage.addEventListener('touchstart', function (e) {
      if (!e.touches.length) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });

    stage.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var touch = e.changedTouches[0];
      if (!touch) return;
      var dx = touch.clientX - startX;
      var dy = touch.clientY - startY;
      if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy)) return;
      setActive(dx < 0 ? current + 1 : current - 1);
    }, { passive: true });
  }

  function initReadMore() {
    var wrap = document.querySelector('[data-readmore]');
    if (!wrap) return;

    var content = wrap.querySelector('[data-readmore-content]');
    var toggle = wrap.querySelector('[data-readmore-toggle]');
    if (!content || !toggle) return;

    content.classList.add('is-clamped');
    if (content.scrollHeight <= content.clientHeight + 2) {
      content.classList.remove('is-clamped');
      return;
    }

    toggle.hidden = false;
    toggle.addEventListener('click', function () {
      var isCollapsed = content.classList.toggle('is-clamped');
      toggle.textContent = isCollapsed ? 'Read more' : 'Read less';
    });
  }
})();
