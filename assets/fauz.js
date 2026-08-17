/* FAUZ Cosmetics — theme JS
   Cart drawer (Shopify AJAX Cart API), quick-add, PDP gallery/qty/accordions, mobile nav. */
(function () {
  'use strict';

  /* ---------- Money formatting ---------- */

  function formatMoney(cents, format) {
    format = format || (window.FAUZ && window.FAUZ.moneyFormat) || 'Rs. {{amount_no_decimals}}';
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;

    function addCommas(num) {
      return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    var amount = cents / 100;
    switch ((format.match(placeholderRegex) || [])[1]) {
      case 'amount':
        value = addCommas(amount.toFixed(2).split('.')[0]) + '.' + amount.toFixed(2).split('.')[1];
        break;
      case 'amount_no_decimals':
        value = addCommas(Math.round(amount));
        break;
      case 'amount_with_comma_separator':
        value = String(amount.toFixed(2)).replace('.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = addCommas(Math.round(amount));
        break;
      default:
        value = addCommas(Math.round(amount));
    }
    return format.replace(placeholderRegex, value);
  }

  /* ---------- Cart drawer ---------- */

  function openCart() {
    document.body.classList.add('fz-cart-open');
    var drawer = document.getElementById('FzCartDrawer');
    if (drawer) drawer.setAttribute('aria-hidden', 'false');
  }

  function closeCart() {
    document.body.classList.remove('fz-cart-open');
    var drawer = document.getElementById('FzCartDrawer');
    if (drawer) drawer.setAttribute('aria-hidden', 'true');
  }

  // Inline, non-blocking message inside the drawer (used for sold-out / cart errors)
  function showCartNote(message) {
    var body = document.querySelector('.fz-drawer__body');
    if (!body) { alert(message); return; }
    var existing = body.querySelector('.fz-cart-note');
    if (existing) existing.remove();
    var note = document.createElement('div');
    note.className = 'fz-cart-note';
    note.setAttribute('role', 'status');
    note.textContent = message;
    body.prepend(note);
    setTimeout(function () { note.remove(); }, 6000);
  }

  function refreshCart(open) {
    return fetch(window.location.pathname + '?sections=cart-drawer')
      .then(function (r) { return r.json(); })
      .then(function (sections) {
        var html = sections['cart-drawer'];
        if (!html) return;
        var tpl = document.createElement('div');
        tpl.innerHTML = html;
        var fresh = tpl.querySelector('#FzCartDrawerInner');
        var current = document.getElementById('FzCartDrawerInner');
        if (fresh && current) current.replaceWith(fresh);
        var freshCount = tpl.querySelector('[data-cart-count]');
        if (freshCount) {
          document.querySelectorAll('[data-cart-count]').forEach(function (el) {
            el.textContent = freshCount.textContent;
          });
        }
        if (open) openCart();
      });
  }

  function addToCart(variantId, quantity) {
    return fetch((window.FAUZ && window.FAUZ.cartAddUrl) || '/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: Number(variantId), quantity: quantity || 1 })
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw e; });
      return r.json();
    });
  }

  function changeLine(line, quantity) {
    return fetch((window.FAUZ && window.FAUZ.cartChangeUrl) || '/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ line: Number(line), quantity: Number(quantity) })
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) throw data;
        return data;
      });
    });
  }

  /* ---------- Event delegation ---------- */

  document.addEventListener('click', function (e) {
    var t;

    // Open cart
    t = e.target.closest('[data-cart-open]');
    if (t) { e.preventDefault(); openCart(); return; }

    // Close cart (button or overlay)
    t = e.target.closest('[data-cart-close]');
    if (t) { e.preventDefault(); closeCart(); return; }

    // Quick add from product cards
    t = e.target.closest('[data-quick-add]');
    if (t) {
      e.preventDefault();
      e.stopPropagation();
      var vid = t.getAttribute('data-quick-add');
      if (!vid) return;
      t.disabled = true;
      var addError = null;
      addToCart(vid, 1)
        .catch(function (err) {
          addError = (err && err.description) || 'Could not add to cart.';
        })
        .then(function () { return refreshCart(true); })
        .then(function () {
          if (addError) showCartNote(addError);
          t.disabled = false;
        });
      return;
    }

    // Cart line qty +/- and remove
    t = e.target.closest('[data-line-change]');
    if (t) {
      e.preventDefault();
      var line = t.getAttribute('data-line');
      var qty = t.getAttribute('data-line-change');
      var row = t.closest('.fz-cart-row');
      if (row) row.style.opacity = '0.5';
      var lineError = null;
      changeLine(line, qty)
        .catch(function (err) {
          lineError = (err && err.description) || 'Could not update the cart.';
        })
        .then(function () { return refreshCart(false); })
        .then(function () { if (lineError) showCartNote(lineError); });
      return;
    }

    // PDP qty stepper
    t = e.target.closest('[data-qty-change]');
    if (t) {
      e.preventDefault();
      var wrap = t.closest('[data-buy-area]');
      if (!wrap) return;
      var input = wrap.querySelector('[data-qty-input]');
      var num = wrap.querySelector('[data-qty-num]');
      var q = Math.max(1, Number(input.value) + Number(t.getAttribute('data-qty-change')));
      input.value = q;
      if (num) num.textContent = q;
      var cta = wrap.querySelector('[data-atc-price]');
      if (cta) {
        var unit = Number(cta.getAttribute('data-unit-price'));
        cta.textContent = formatMoney(unit * q);
      }
      return;
    }

    // PDP gallery thumbs
    t = e.target.closest('[data-thumb]');
    if (t) {
      e.preventDefault();
      var main = document.querySelector('[data-main-image]');
      if (main) {
        main.src = t.getAttribute('data-thumb');
        var srcset = t.getAttribute('data-thumb-srcset');
        if (srcset) main.srcset = srcset; else main.removeAttribute('srcset');
      }
      document.querySelectorAll('[data-thumb]').forEach(function (b) { b.classList.remove('is-active'); });
      t.classList.add('is-active');
      return;
    }

    // Accordions
    t = e.target.closest('[data-acc-toggle]');
    if (t) {
      e.preventDefault();
      var acc = t.closest('.fz-acc');
      var wasOpen = acc.classList.contains('is-open');
      acc.parentElement.querySelectorAll('.fz-acc').forEach(function (a) {
        a.classList.remove('is-open');
        var s = a.querySelector('.fz-acc__sym');
        if (s) s.textContent = '+';
        var btn = a.querySelector('[data-acc-toggle]');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        acc.classList.add('is-open');
        var sym = acc.querySelector('.fz-acc__sym');
        if (sym) sym.textContent = '−';
        t.setAttribute('aria-expanded', 'true');
      }
      return;
    }

    // Mobile menu
    t = e.target.closest('[data-menu-toggle]');
    if (t) {
      e.preventDefault();
      var nav = document.getElementById('FzMobileNav');
      if (nav) {
        var isOpen = nav.classList.toggle('is-open');
        t.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
      return;
    }
  });

  // ESC closes drawer
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCart();
  });

  // PDP add-to-cart form: intercept, add via AJAX, open drawer
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-fz-atc-form]');
    if (!form) return;
    e.preventDefault();
    var btn = form.querySelector('[type="submit"]');
    var variantId = form.querySelector('[name="id"]').value;
    var qtyInput = form.querySelector('[data-qty-input]');
    var qty = qtyInput ? Number(qtyInput.value) : 1;
    if (btn) btn.disabled = true;
    var atcError = null;
    addToCart(variantId, qty)
      .catch(function (err) {
        atcError = (err && err.description) || 'Could not add to cart.';
      })
      .then(function () { return refreshCart(true); })
      .then(function () {
        if (atcError) showCartNote(atcError);
        if (btn) btn.disabled = false;
      });
  });
})();
