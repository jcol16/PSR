// ─── SHARED NAVIGATION SCRIPT ────────────────────────────
// Single source of truth for nav scroll, theme-switching,
// hamburger toggling, and orientation-change fixes.
// Included by index.html and all inner pages via <script src>.
// ─────────────────────────────────────────────────────────

(function () {
  const nav       = document.getElementById('main-nav');
  const hamburger = document.getElementById('nav-hamburger');
  const mobileNav = document.getElementById('mobile-nav');

  // ── Scroll: add .scrolled class ──
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // ── Nav theme: switch text dark/light based on which section is under the nav ──
  const themedSections = Array.from(document.querySelectorAll('[data-nav-theme]'));
  function updateNavTheme() {
    const navBottom = nav.getBoundingClientRect().bottom;

    // 1. Prefer explicit data-nav-theme sections (homepage)
    let theme = null;
    themedSections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= navBottom && rect.bottom > navBottom) {
        theme = section.dataset.navTheme;
      }
    });

    // 2. Fallback: detect background colour of the element under the nav
    if (theme === null) {
      const els = document.elementsFromPoint(window.innerWidth / 2, navBottom + 1);
      for (const el of els) {
        if (el === nav || nav.contains(el)) continue;
        const bg = window.getComputedStyle(el).backgroundColor;
        if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') continue;
        const [r, g, b] = bg.match(/\d+/g).map(Number);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        theme = luminance > 0.5 ? 'light' : 'dark';
        break;
      }
      if (theme === null) theme = 'dark';
    }

    nav.classList.toggle('nav--light', theme === 'light');
  }
  window.addEventListener('scroll', updateNavTheme, { passive: true });
  updateNavTheme();
  window.addEventListener('load', updateNavTheme);

  // ── Mobile hamburger toggle ──
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      mobileNav.setAttribute('aria-hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link tap
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Reset mobile nav when viewport crosses 768px breakpoint ──
  function closeMobileNavIfDesktop() {
    if (window.innerWidth > 768 && hamburger && mobileNav) {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  // ── Force-repaint backdrop-filter elements on iOS Safari after orientation change ──
  function repaintBackdropFilters() {
    [nav, document.querySelector('.nav-links'), mobileNav, hamburger].forEach(el => {
      if (!el) return;
      const wbf = el.style.webkitBackdropFilter;
      el.style.webkitBackdropFilter = 'none';
      el.offsetHeight; // force reflow
      el.style.webkitBackdropFilter = wbf;
    });
  }

  window.addEventListener('resize', closeMobileNavIfDesktop, { passive: true });

  window.addEventListener('orientationchange', () => {
    // orientationchange fires before viewport dimensions update on iOS — defer
    setTimeout(() => {
      closeMobileNavIfDesktop();
      repaintBackdropFilters();
    }, 150);
  });
})();
