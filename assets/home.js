/* FAUZ — Homepage premium interactions (GSAP + ScrollTrigger + Lenis) */
(function () {
  'use strict';

  if (!window.FAUZ || !window.FAUZ.isHome) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    if (reducedMotion || typeof gsap === 'undefined') {
      initIngredientTabs();
      initHeaderScrollBasic();
      document.body.classList.add('is-motion-reduced');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var lenis = null;
    if (typeof Lenis !== 'undefined') {
      lenis = new Lenis({
        duration: 1.1,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true,
        touchMultiplier: 1.2
      });

      document.documentElement.classList.add('lenis');
      document.body.classList.add('lenis', 'lenis-smooth');

      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    initHeaderScroll(lenis);
    initHero();
    initMarquee();
    initShowcase();
    initIngredients();
    initEditorial();
    initFooterVideo();
    initIngredientTabs();
    initScrollRefresh();

    ScrollTrigger.refresh();
  });

  function initScrollRefresh() {
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        ScrollTrigger.refresh(true);
      }, 250);
    });

    window.addEventListener('orientationchange', function () {
      setTimeout(function () {
        ScrollTrigger.refresh(true);
      }, 400);
    });
  }

  /* ---------- Header ---------- */

  function initHeaderScroll(lenis) {
    var header = document.querySelector('[data-header]');
    var announcement = document.querySelector('.fz-announcement');
    if (!header) return;

    var onScroll = function (scrollY) {
      var scrolled = scrollY > 48;
      header.classList.toggle('is-scrolled', scrolled);
      if (announcement) announcement.classList.toggle('is-hidden', scrolled);
    };

    if (lenis) {
      lenis.on('scroll', function (e) { onScroll(e.scroll); });
    } else {
      window.addEventListener('scroll', function () { onScroll(window.scrollY); }, { passive: true });
    }

    onScroll(lenis ? lenis.scroll : window.scrollY);
  }

  function initHeaderScrollBasic() {
    var header = document.querySelector('[data-header]');
    if (!header) return;
    window.addEventListener('scroll', function () {
      header.classList.toggle('is-scrolled', window.scrollY > 48);
    }, { passive: true });
  }

  /* ---------- Hero ---------- */

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;

    var revealEls = hero.querySelectorAll('[data-hero-reveal]');
    if (revealEls.length) {
      gsap.set(revealEls, { y: 36, opacity: 0 });
      gsap.to(revealEls, {
        y: 0,
        opacity: 1,
        duration: 1.05,
        stagger: 0.14,
        ease: 'power3.out',
        delay: 0.2,
        clearProps: 'transform'
      });
    }

    var visual = hero.querySelector('[data-hero-visual]');
    if (visual) {
      gsap.from(visual, {
        y: 64,
        opacity: 0,
        duration: 1.3,
        ease: 'power3.out',
        delay: 0.35
      });
    }

    var scaleEl = hero.querySelector('[data-hero-scale]');
    if (scaleEl) {
      gsap.to(scaleEl, {
        scale: 1.06,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    hero.querySelectorAll('[data-hero-parallax]').forEach(function (el) {
      var amount = parseFloat(el.getAttribute('data-hero-parallax')) || 0.2;
      gsap.to(el, {
        y: amount * 120,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  }

  /* ---------- Marquee ---------- */

  function initMarquee() {
    var track = document.querySelector('[data-marquee-track]');
    if (!track) return;

    var groups = track.querySelectorAll('.fz-marquee-premium__group');
    if (!groups.length) return;

    var groupWidth = groups[0].offsetWidth;
    if (!groupWidth) return;

    var marqTween = gsap.to(track, {
      x: -groupWidth,
      duration: 28,
      ease: 'none',
      repeat: -1
    });

    var marquee = document.querySelector('[data-marquee]');
    if (marquee) {
      marquee.addEventListener('mouseenter', function () {
        marqTween.timeScale(0.35);
      });
      marquee.addEventListener('mouseleave', function () {
        marqTween.timeScale(1);
      });
    }
  }

  /* ---------- Product showcase ---------- */

  function initShowcase() {
    var section = document.querySelector('[data-showcase]');
    var track = document.querySelector('[data-showcase-track]');
    if (!section || !track) return;

    var slides = track.querySelectorAll('[data-showcase-card]');
    var counterCurrent = document.querySelector('[data-showcase-current]');
    var counterTotal = document.querySelector('[data-showcase-total]');

    if (counterTotal) {
      counterTotal.textContent = String(slides.length).padStart(2, '0');
    }

    if (slides.length < 2) return;

    var mm = gsap.matchMedia();

    mm.add('(max-width: 900px)', function () {
      if (counterCurrent) counterCurrent.textContent = '01';

      var mobileStage = section.querySelector('.fz-showcase__stage');
      if (!mobileStage) return;

      var onMobileScroll = function () {
        var slideWidth = slides[0].offsetWidth || window.innerWidth;
        var index = Math.round(mobileStage.scrollLeft / slideWidth);
        index = Math.max(0, Math.min(index, slides.length - 1));
        if (counterCurrent) {
          counterCurrent.textContent = String(index + 1).padStart(2, '0');
        }
      };

      mobileStage.addEventListener('scroll', onMobileScroll, { passive: true });

      return function () {
        mobileStage.removeEventListener('scroll', onMobileScroll);
      };
    });

    mm.add('(min-width: 901px)', function () {
      function getSlideWidth() {
        return window.innerWidth;
      }

      function getTotalScroll() {
        return getSlideWidth() * (slides.length - 1);
      }

      var tween = gsap.to(track, {
        x: function () { return -getTotalScroll(); },
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: function () { return '+=' + getTotalScroll(); },
          pin: '.fz-showcase__pin',
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 0.55,
          invalidateOnRefresh: true,
          snap: slides.length > 1 ? {
            snapTo: function (value) {
              var step = 1 / (slides.length - 1);
              return Math.round(value / step) * step;
            },
            duration: { min: 0.12, max: 0.28 },
            ease: 'power1.inOut'
          } : false,
          onUpdate: function (self) {
            if (!counterCurrent || slides.length < 2) return;
            var index = Math.round(self.progress * (slides.length - 1));
            counterCurrent.textContent = String(index + 1).padStart(2, '0');
          }
        }
      });

      return function () {
        if (tween && tween.scrollTrigger) tween.scrollTrigger.kill();
        tween.kill();
        gsap.set(track, { clearProps: 'transform' });
      };
    });
  }

  /* ---------- Ingredients scroll story ---------- */

  function initIngredients() {
    var section = document.querySelector('[data-ingredients]');
    if (!section) return;

    var panels = section.querySelectorAll('[data-ingredient-panel]');
    var triggers = section.querySelectorAll('[data-ingredient-trigger]');
    if (panels.length < 2) return;

    var mm = gsap.matchMedia();

    mm.add('(min-width: 1101px)', function () {
      function getHeaderOffset() {
        var root = getComputedStyle(document.documentElement);
        var h = parseFloat(root.getPropertyValue('--fz-header-height')) || 100;
        return h + 24;
      }

      var layout = section.querySelector('.fz-ingredients__layout');

      function getScrollDistance() {
        return Math.max(window.innerHeight * 0.55, 440) * (panels.length - 1);
      }

      var st = ScrollTrigger.create({
        trigger: section,
        start: function () {
          var headerOffset = getHeaderOffset();
          if (!layout) return 'top top+=' + headerOffset;
          var available = window.innerHeight - headerOffset;
          var layoutHeight = layout.offsetHeight;
          var centerOffset = Math.max(0, (available - layoutHeight) / 2);
          return 'top top+=' + (headerOffset + centerOffset);
        },
        end: function () { return '+=' + getScrollDistance(); },
        pin: layout || '.fz-ingredients__layout',
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var index = Math.round(self.progress * (panels.length - 1));
          activateIngredient(index, triggers, panels);
        }
      });

      return function () {
        st.kill();
      };
    });
  }

  function activateIngredient(index, triggers, panels) {
    triggers.forEach(function (btn, i) {
      btn.classList.toggle('is-active', i === index);
    });
    panels.forEach(function (panel, i) {
      panel.classList.toggle('is-active', i === index);
    });
  }

  function initIngredientTabs() {
    var section = document.querySelector('[data-ingredients]');
    if (!section) return;

    var triggers = section.querySelectorAll('[data-ingredient-trigger]');
    var panels = section.querySelectorAll('[data-ingredient-panel]');

    triggers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var index = parseInt(btn.getAttribute('data-ingredient-trigger'), 10);
        activateIngredient(index, triggers, panels);
      });
    });
  }

  /* ---------- Editorial ---------- */

  function initEditorial() {
    document.querySelectorAll('[data-editorial-block]').forEach(function (block) {
      var mediaInner = block.querySelector('[data-editorial-scale]');
      var mediaImg = block.querySelector('.fz-editorial__img');
      var copy = block.querySelector('[data-editorial-copy]');

      if (mediaImg) {
        gsap.fromTo(mediaImg, { scale: 1.06 }, {
          scale: 1,
          ease: 'none',
          transformOrigin: 'center center',
          scrollTrigger: {
            trigger: block,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      } else if (mediaInner) {
        gsap.fromTo(mediaInner, { scale: 1.06 }, {
          scale: 1,
          ease: 'none',
          transformOrigin: 'center center',
          scrollTrigger: {
            trigger: block,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      }

      if (copy) {
        gsap.from(copy.children, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: block,
            start: 'top 75%'
          }
        });
      }
    });
  }

  /* ---------- Footer video ---------- */

  function initFooterVideo() {
    var section = document.querySelector('[data-footer-video]');
    var content = section && section.querySelector('[data-footer-video-content]');
    if (!section || !content) return;

    gsap.from(content.children, {
      y: 36,
      opacity: 0,
      duration: 1,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 70%'
      }
    });

    var video = section.querySelector('video');
    if (video && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            video.play().catch(function () {});
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.25 });
      observer.observe(video);
    }
  }
})();
