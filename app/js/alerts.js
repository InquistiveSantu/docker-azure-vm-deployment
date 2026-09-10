/**
 * alerts.js — Alert feed: initial render, filtering, and live injection
 */

/* ── Static alert data ─────────────────────────────────── */
const INITIAL_ALERTS = [
  { id: 1,  sev: 'critical', svc: 'NODE-03',           msg: 'IPMI fan speed anomaly — hardware alert triggered',               time: '2m ago' },
  { id: 2,  sev: 'warning',  svc: 'cache-layer',        msg: 'Redis eviction rate 2.1k/sec — approaching 3k threshold',         time: '5m ago' },
  { id: 3,  sev: 'warning',  svc: 'NODE-07',            msg: 'CPU iowait >15% sustained for 8 consecutive minutes',             time: '8m ago' },
  { id: 4,  sev: 'info',     svc: 'api-gateway',        msg: 'Deployment canary complete — all traffic shifted to v2.9.1',      time: '12m ago' },
  { id: 5,  sev: 'warning',  svc: 'notification-svc',   msg: 'Queue depth 847 — SLO compliance at 78%',                        time: '15m ago' },
  { id: 6,  sev: 'info',     svc: 'cert-manager',       msg: 'TLS certificate renewed — 365-day validity confirmed',            time: '18m ago' },
  { id: 7,  sev: 'info',     svc: 'autoscaler',         msg: 'HPA event: data-pipeline scaled 3→5 replicas',                   time: '21m ago' },
  { id: 8,  sev: 'info',     svc: 'backup-service',     msg: 'Daily snapshot archived — 2.8 TB to cold storage',               time: '34m ago' },
  { id: 9,  sev: 'info',     svc: 'vault-agent',        msg: 'Secrets rotation complete — all credentials updated',            time: '45m ago' },
  { id: 10, sev: 'warning',  svc: 'data-pipeline',      msg: 'Checkpoint lag 38s — approaching SLO boundary of 60s',           time: '52m ago' },
  { id: 11, sev: 'info',     svc: 'iam-sync',           msg: 'Role bindings resync complete — 0 config drift detected',        time: '1h ago' },
  { id: 12, sev: 'info',     svc: 'metrics-exporter',   msg: 'Prometheus remote write queue flushed successfully',             time: '1h 10m ago' },
  { id: 13, sev: 'info',     svc: 'health-checker',     msg: 'All 24 services passed liveness & readiness probes',             time: '1h 22m ago' },
  { id: 14, sev: 'info',     svc: 'scheduler',          msg: 'Log rotation job complete — 14 GB reclaimed from /var/log',      time: '2h ago' },
  { id: 15, sev: 'info',     svc: 'vulnerability-scan', msg: '0 critical CVEs in latest container image scan',                 time: '3h ago' },
];

/* ── Live injection pool ───────────────────────────────── */
const LIVE_ALERTS = [
  { sev: 'info',     svc: 'api-gateway',      msg: 'Request rate nominal — 8,240 req/min across 4 replicas' },
  { sev: 'warning',  svc: 'cache-layer',       msg: 'Memory pressure increasing — Redis at 87% utilization' },
  { sev: 'info',     svc: 'deploy-agent',      msg: 'Build #848 queued — triggered by push to main' },
  { sev: 'info',     svc: 'log-aggregator',   msg: 'Log pipeline flushed — 0 dropped entries in last 60s' },
  { sev: 'warning',  svc: 'NODE-11',           msg: 'Disk write latency spike: 28ms avg (threshold 20ms)' },
  { sev: 'info',     svc: 'auth-service',      msg: 'OAuth2 introspection rate: 4,200 req/min — within SLO' },
  { sev: 'info',     svc: 'cdn-proxy',         msg: 'Edge node cache warmed — hit ratio improved to 96.1%' },
  { sev: 'info',     svc: 'backup-service',    msg: 'Incremental snapshot complete — 120 GB delta archived' },
];

let feedEl     = null;
let liveIdx    = 0;
let idCounter  = 200;
let activeFilter = 'all';

/* ── DOM builder ───────────────────────────────────────── */
function buildAlertItem(alert) {
  const li = document.createElement('li');
  li.className = 'alert-item';
  li.dataset.severity = alert.sev;

  const sev = document.createElement('span');
  sev.className = `alert-item__sev alert-item__sev--${alert.sev}`;
  sev.textContent = alert.sev.toUpperCase();

  const svc = document.createElement('span');
  svc.className = 'alert-item__svc';
  svc.textContent = alert.svc;

  const msg = document.createElement('span');
  msg.className = 'alert-item__msg';
  msg.textContent = alert.msg;

  const time = document.createElement('span');
  time.className = 'alert-item__time';
  time.textContent = alert.time || 'just now';

  li.append(sev, svc, msg, time);
  return li;
}

/* ── Filter logic ──────────────────────────────────────── */
function applyFilter(filter) {
  activeFilter = filter;

  // Update button states
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.toggle('filter-btn--active', btn.dataset.filter === filter);
    btn.setAttribute('aria-pressed', btn.dataset.filter === filter ? 'true' : 'false');
  });

  // Show/hide items
  if (!feedEl) return;
  feedEl.querySelectorAll('.alert-item').forEach((item) => {
    const visible = filter === 'all' || item.dataset.severity === filter;
    item.style.display = visible ? '' : 'none';
  });
}

/* ── Live alert injection ──────────────────────────────── */
function injectLiveAlert() {
  const data = {
    ...LIVE_ALERTS[liveIdx % LIVE_ALERTS.length],
    id: ++idCounter,
    time: 'just now',
  };
  liveIdx++;

  const item = buildAlertItem(data);
  feedEl.insertBefore(item, feedEl.firstChild);

  // Respect active filter
  if (activeFilter !== 'all' && data.sev !== activeFilter) {
    item.style.display = 'none';
  }

  // Prune to max 20 items
  while (feedEl.children.length > 20) {
    feedEl.removeChild(feedEl.lastChild);
  }

  // Schedule next injection (8–20s randomised)
  const delay = 8000 + Math.random() * 12000;
  setTimeout(injectLiveAlert, delay);
}

/* ── Public: init ──────────────────────────────────────── */
export function initAlerts() {
  feedEl = document.getElementById('alert-feed');
  if (!feedEl) return;

  // Render initial alerts
  const frag = document.createDocumentFragment();
  INITIAL_ALERTS.forEach((a) => frag.appendChild(buildAlertItem(a)));
  feedEl.appendChild(frag);

  // Wire up filter buttons
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.setAttribute('aria-pressed', btn.dataset.filter === 'all' ? 'true' : 'false');
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });

  // Start live injection after 12s
  setTimeout(injectLiveAlert, 12000);
}
