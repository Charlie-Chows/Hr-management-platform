(function () {
  'use strict';

  function getCtaId() {
    if (window.location.hash) {
      var h = window.location.hash.replace(/^#/, '');
      if (document.getElementById(h)) return h;
    }
    if (window.history.state && window.history.state.ctaId) {
      if (document.getElementById(window.history.state.ctaId)) return window.history.state.ctaId;
    }
    var saved = sessionStorage.getItem('stackly_cta_return_' + window.location.pathname);
    if (saved) {
      var s = saved.replace(/^#/, '');
      if (document.getElementById(s)) return s;
    }
    return 'cta';
  }

  function isCtaNav() {
    var p = window.location.pathname;
    return Boolean(window.location.hash) ||
           Boolean(window.history.state && window.history.state.returnToCta) ||
           Boolean(sessionStorage.getItem('stackly_cta_return_' + p));
  }

  function getTarget() {
    var id = getCtaId();
    var byId = document.getElementById(id);
    if (byId) return byId;
    return document.getElementById('cta') ||
           document.getElementById('engagement') ||
           document.querySelector('.about-cta, .services-cta, .blog-cta, .cta-section, .ways-grid, .engagement-grid');
  }

  function doScroll() {
    if (!isCtaNav()) return false;

    var loader = document.getElementById('page-loader');
    if (loader) {
      loader.classList.add('is-hidden');
      loader.setAttribute('aria-hidden', 'true');
    }
    document.documentElement.classList.add('has-cta-hash', 'no-loader');

    var target = getTarget();
    if (target) {
      try {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
      } catch (e) {
        var top = target.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo(0, Math.max(0, top));
      }
      return true;
    }
    return false;
  }

  function restore() {
    if (!isCtaNav()) return;
    doScroll();
    if (window.requestAnimationFrame) requestAnimationFrame(doScroll);
    setTimeout(doScroll, 50);
    setTimeout(doScroll, 150);
    setTimeout(doScroll, 300);
    setTimeout(doScroll, 600);
    if (window.ScrollTrigger) {
      setTimeout(function () { window.ScrollTrigger.refresh(); }, 150);
    }
  }

  // Intercept any click inside a CTA section across the page
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a, button');
    if (!link) return;
    var ctaSection = link.closest('section[id], #cta, #engagement, .about-cta, .services-cta, .blog-cta, .cta-section, .ways-grid');
    if (!ctaSection && link.closest('.engagement-grid, .engagement-card')) {
      ctaSection = document.getElementById('engagement');
    }
    if (ctaSection) {
      var targetId = (ctaSection.id && ctaSection.id !== '') ? ctaSection.id : 'cta';
      try {
        var url = new URL(window.location.href);
        url.hash = targetId;
        window.history.replaceState({ returnToCta: true, ctaId: targetId }, '', url.href);
        sessionStorage.setItem('stackly_cta_return_' + window.location.pathname, '#' + targetId);
      } catch (err) {}
    }
  }, true);

  // Pageshow (handles bfcache back navigation)
  window.addEventListener('pageshow', function (e) {
    if (isCtaNav()) {
      restore();
    } else {
      var loader = document.getElementById('page-loader');
      if (loader && e.persisted) {
        loader.classList.add('is-hidden');
        loader.setAttribute('aria-hidden', 'true');
      }
    }
  });

  // Popstate
  window.addEventListener('popstate', function () {
    if (isCtaNav()) {
      restore();
    }
  });

  // DOMContentLoaded & Load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restore);
  } else {
    restore();
  }
  window.addEventListener('load', restore);

  // Expose on window
  window.StacklyCta = {
    isCtaNav: isCtaNav,
    restore: restore
  };
})();
