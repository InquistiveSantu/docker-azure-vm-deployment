/**
 * main.js — Application bootstrap
 *
 * Orchestrates all modules and sets up the live UTC clock.
 * Requires an HTTP server to run (ES modules cannot load via file://).
 * Quick local test:  npx serve ./app
 * Production:        Nginx serving the app/ directory
 */

import { initNav }                   from './nav.js';
import { initCharts, updateMetrics } from './charts.js';
import { initTerminal }              from './terminal.js';
import { initAlerts }                from './alerts.js';
import { initDashboard }             from './dashboard.js';

/* ── Live UTC Clock ──────────────────────────────────── */
function startClock() {
  const clockEl = document.getElementById('hero-clock');
  if (!clockEl) return;

  function tick() {
    const now = new Date();
    const hh  = String(now.getUTCHours()).padStart(2, '0');
    const mm  = String(now.getUTCMinutes()).padStart(2, '0');
    const ss  = String(now.getUTCSeconds()).padStart(2, '0');
    const str = `${hh}:${mm}:${ss} UTC`;

    clockEl.textContent = str;
    clockEl.setAttribute('aria-label', `Current UTC time: ${str}`);
    clockEl.setAttribute('datetime', now.toISOString());
  }

  tick();
  setInterval(tick, 1000);
}

/* ── Section Reveal on Scroll ────────────────────────── */
function initReveal() {
  const sections = document.querySelectorAll('.section');
  sections.forEach((s) => s.classList.add('section--hidden'));

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('section--hidden');
          entry.target.classList.add('section--visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.04 }
  );

  sections.forEach((s) => obs.observe(s));
}

/* ── Periodic Metric Refresh ─────────────────────────── */
function startMetricRefresh() {
  setInterval(updateMetrics, 5000);
}

/* ── Boot ────────────────────────────────────────────── */
function boot() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  startClock();
  initNav();
  initDashboard();
  initCharts();
  initTerminal();
  initAlerts();
  startMetricRefresh();

  if (!prefersReduced) {
    initReveal();
  }

  // Developer console signature
  console.log(
    '%c⬡ CYBEROPS COMMAND CENTER v3.7.1 — ONLINE',
    'color:#00c8ff; font-weight:700; font-size:13px; padding:4px 0;'
  );
  console.log(
    '%c  Build a3f9c2d · Cluster ALPHA-PROD-01 · Region East US 2',
    'color:#6b7280; font-size:11px;'
  );
}

/* Run after DOM is ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
