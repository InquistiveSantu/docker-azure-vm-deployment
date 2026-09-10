/**
 * nav.js — Navbar: scroll-spy, glass solidify, mobile drawer + focus trap
 */

export function initNav() {
  const navbar      = document.getElementById('navbar');
  const navToggle   = document.getElementById('nav-toggle');
  const navDrawer   = document.getElementById('nav-drawer');
  const navLinks    = document.querySelectorAll('.navbar__link');
  const drawerLinks = document.querySelectorAll('.nav-drawer__link');
  const sections    = document.querySelectorAll('section[id], header[id="hero"]');

  if (!navbar || !navToggle || !navDrawer) return;

  /* ── Scroll solidify (debounced via rAF) ──────────────────── */
  let rafId = 0;
  window.addEventListener('scroll', () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      navbar.classList.toggle('is-scrolled', window.scrollY > 80);
    });
  }, { passive: true });

  /* ── Scroll-spy via IntersectionObserver ──────────────────── */
  const spyObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.dataset.spy === id);
          });
        }
      });
    },
    {
      rootMargin: `-${navbar.offsetHeight + 16}px 0px -55% 0px`,
      threshold: 0,
    }
  );
  sections.forEach((s) => spyObs.observe(s));

  /* ── Mobile drawer helpers ────────────────────────────────── */
  function openDrawer() {
    navDrawer.hidden = false;
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    // Move focus to first focusable element in drawer
    const first = navDrawer.querySelector('.nav-drawer__link');
    if (first) first.focus();
  }

  function closeDrawer() {
    navDrawer.hidden = true;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.classList.remove('is-open');
    document.body.style.overflow = '';
    navToggle.focus();
  }

  navToggle.addEventListener('click', () => {
    navDrawer.hidden ? openDrawer() : closeDrawer();
  });

  // Close on drawer link click
  drawerLinks.forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !navDrawer.hidden) closeDrawer();
  });

  // Focus trap within open drawer
  navDrawer.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = [...navDrawer.querySelectorAll('.nav-drawer__link')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Close drawer if viewport grows past mobile width
  const mq = window.matchMedia('(min-width: 768px)');
  mq.addEventListener('change', (e) => {
    if (e.matches && !navDrawer.hidden) closeDrawer();
  });
}
