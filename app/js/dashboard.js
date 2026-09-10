/**
 * dashboard.js — KPI counters, infrastructure nodes, pipeline timer, services map
 */

/* ── Infrastructure node data ─────────────────────────── */
const NODES = [
  { id: 'NODE-01', status: 'healthy',     cpu: 42, role: 'control-plane' },
  { id: 'NODE-02', status: 'healthy',     cpu: 38, role: 'control-plane' },
  { id: 'NODE-03', status: 'critical',    cpu: 91, role: 'worker' },
  { id: 'NODE-04', status: 'healthy',     cpu: 61, role: 'worker' },
  { id: 'NODE-05', status: 'healthy',     cpu: 55, role: 'worker' },
  { id: 'NODE-06', status: 'healthy',     cpu: 47, role: 'worker' },
  { id: 'NODE-07', status: 'warning',     cpu: 78, role: 'worker' },
  { id: 'NODE-08', status: 'healthy',     cpu: 33, role: 'worker' },
  { id: 'NODE-09', status: 'healthy',     cpu: 59, role: 'storage' },
  { id: 'NODE-10', status: 'maintenance', cpu: 0,  role: 'storage' },
  { id: 'NODE-11', status: 'warning',     cpu: 72, role: 'worker' },
  { id: 'NODE-12', status: 'healthy',     cpu: 44, role: 'worker' },
];

/* ── Microservice data ────────────────────────────────── */
const SERVICES = [
  { name: 'api-gateway',       status: 'healthy',     replicas: '4/4', latency: '42ms',  version: 'v2.9.1',  tags: ['ingress', 'public'] },
  { name: 'auth-service',      status: 'healthy',     replicas: '3/3', latency: '18ms',  version: 'v1.7.4',  tags: ['security', 'internal'] },
  { name: 'data-pipeline',     status: 'healthy',     replicas: '5/5', latency: '—',     version: 'v3.2.0',  tags: ['batch', 'etl'] },
  { name: 'cache-layer',       status: 'warning',     replicas: '3/3', latency: '3ms',   version: 'v7.0.4',  tags: ['redis', 'cache'] },
  { name: 'notification-svc',  status: 'warning',     replicas: '2/2', latency: '210ms', version: 'v1.3.2',  tags: ['messaging', 'async'] },
  { name: 'metrics-exporter',  status: 'healthy',     replicas: '2/2', latency: '—',     version: 'v0.14.0', tags: ['monitoring', 'prom'] },
  { name: 'storage-service',   status: 'healthy',     replicas: '3/3', latency: '8ms',   version: 'v2.1.5',  tags: ['blob', 'persistent'] },
  { name: 'cdn-proxy',         status: 'healthy',     replicas: '6/6', latency: '4ms',   version: 'v1.9.0',  tags: ['edge', 'public'] },
  { name: 'scheduler',         status: 'healthy',     replicas: '1/1', latency: '—',     version: 'v2.0.1',  tags: ['cron', 'internal'] },
  { name: 'log-aggregator',    status: 'healthy',     replicas: '2/2', latency: '—',     version: 'v1.5.8',  tags: ['logging', 'fluent'] },
  { name: 'vault-agent',       status: 'healthy',     replicas: '2/2', latency: '6ms',   version: 'v1.14.0', tags: ['secrets', 'security'] },
  { name: 'iam-sync',          status: 'healthy',     replicas: '1/1', latency: '—',     version: 'v0.9.3',  tags: ['iam', 'internal'] },
];

/* ── Helpers ──────────────────────────────────────────── */
const statusColors = {
  healthy:     '#34c759',
  warning:     '#ff9f0a',
  critical:    '#ff453a',
  maintenance: '#8a43e2',
};

/* ── KPI Counter Animation ────────────────────────────── */
/**
 * Animates a numeric value from 0 to `target` over `duration` ms
 * using easeOutQuart for a satisfying deceleration.
 */
function animateCounter(el, target, decimals, suffix, duration = 1600) {
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = target.toFixed(decimals) + suffix; // Ensure exact final value
  }
  requestAnimationFrame(tick);
}

function initKPICounters() {
  const cards = document.querySelectorAll('.kpi-card');
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        const card = entry.target;
        const idx  = [...cards].indexOf(card);

        // Stagger card reveal by index
        setTimeout(() => {
          card.classList.add('is-visible');

          // Animate any counter inside
          const el       = card.querySelector('[data-target]');
          if (!el) return;
          const target   = parseFloat(el.dataset.target);
          const decimals = parseInt(el.dataset.decimals || '0', 10);
          const suffix   = el.dataset.suffix || '';
          animateCounter(el, target, decimals, suffix);
        }, idx * 110);
      });
    },
    { threshold: 0.25 }
  );
  cards.forEach((c) => obs.observe(c));
}

/* ── Infrastructure Node Ring ─────────────────────────── */
const NODE_CIRC = 2 * Math.PI * 30; // r=30 → 188.5

function buildNodeRingSVG(cpu, status) {
  const offset = NODE_CIRC * (1 - Math.min(cpu, 100) / 100);
  const color  = statusColors[status] || '#888';
  const label  = cpu > 0 ? `${cpu}%` : 'MNT';

  return `
    <svg class="node-ring-svg" viewBox="0 0 72 72" aria-hidden="true">
      <circle class="node-ring__track" cx="36" cy="36" r="30"/>
      <circle
        class="node-ring__arc node-ring__arc--${status}"
        cx="36" cy="36" r="30"
        stroke-dasharray="${NODE_CIRC.toFixed(2)}"
        stroke-dashoffset="${NODE_CIRC.toFixed(2)}"
        data-target-offset="${offset.toFixed(2)}"
        transform="rotate(-90 36 36)"
      />
      <text
        class="node-ring__label"
        x="36" y="36"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="${color}"
      >${label}</text>
    </svg>
  `;
}

function initInfraGrid() {
  const grid = document.getElementById('infra-grid');
  if (!grid) return;

  // Build all node elements
  const frag = document.createDocumentFragment();
  NODES.forEach((node) => {
    const el = document.createElement('div');
    el.className = `infra-node infra-node--${node.status}`;
    el.setAttribute('role', 'listitem');
    el.setAttribute('aria-label', `${node.id}: ${node.status}, CPU ${node.cpu}%`);
    el.innerHTML = `
      ${buildNodeRingSVG(node.cpu, node.status)}
      <span class="infra-node__name">${node.id}</span>
      <span class="infra-node__status-tag infra-node__status-tag--${node.status}">${node.status}</span>
      <span class="infra-node__role label">${node.role}</span>
    `;
    frag.appendChild(el);
  });
  grid.appendChild(frag);

  // Animate nodes + rings when grid scrolls into view
  const obs = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      obs.unobserve(grid);

      const nodeEls = grid.querySelectorAll('.infra-node');
      nodeEls.forEach((n, i) => {
        setTimeout(() => n.classList.add('is-visible'), i * 55);
      });

      // Animate rings after nodes appear
      setTimeout(() => {
        grid.querySelectorAll('.node-ring__arc').forEach((arc) => {
          const target = arc.dataset.targetOffset;
          arc.style.transition = 'stroke-dashoffset 1.3s cubic-bezier(0.16, 1, 0.3, 1)';
          arc.style.strokeDashoffset = target;
        });
      }, 380);
    },
    { threshold: 0.08 }
  );
  obs.observe(grid);
}

/* ── Pipeline Timer ───────────────────────────────────── */
function initPipeline() {
  const triggeredEl  = document.getElementById('pipeline-triggered');
  const elapsedEl    = document.getElementById('scan-elapsed');
  if (!triggeredEl) return;

  // Show trigger time as ~4 minutes ago
  const trigTime = new Date(Date.now() - 4 * 60 * 1000);
  triggeredEl.textContent = trigTime.toUTCString().split(' ')[4] + ' UTC';

  // Count up elapsed seconds for the "running" Sec Scan stage
  let elapsed = 47;
  const interval = setInterval(() => {
    elapsed++;
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    if (elapsedEl) elapsedEl.textContent = `${m}:${String(s).padStart(2, '0')}s`;

    // After ~90 more seconds, complete the scan stage and start deploy
    if (elapsed >= 140) {
      clearInterval(interval);
      completeScanStage();
    }
  }, 1000);
}

function completeScanStage() {
  const scanStage   = document.querySelector('[data-stage="scan"]');
  const deployStage = document.querySelector('[data-stage="deploy"]');
  if (!scanStage || !deployStage) return;

  // Transition scan to success
  scanStage.className = 'pipeline-stage pipeline-stage--success';
  const scanBubble = scanStage.querySelector('.pipeline-stage__bubble');
  if (scanBubble) {
    scanBubble.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  const durEl = scanStage.querySelector('.pipeline-stage__dur');
  if (durEl) durEl.textContent = '1:33s';

  // Fix connector
  const connector = scanStage.querySelector('.pipeline-stage__connector--partial');
  if (connector) connector.style.background = 'var(--clr-green)';

  // Transition deploy to running
  setTimeout(() => {
    deployStage.className = 'pipeline-stage pipeline-stage--running';
    const deployBubble = deployStage.querySelector('.pipeline-stage__bubble');
    if (deployBubble) {
      deployBubble.innerHTML = `<div class="pipeline-spinner" aria-hidden="true"></div>`;
    }
  }, 500);
}

/* ── Services Grid ────────────────────────────────────── */
function initServicesGrid() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;

  const frag = document.createDocumentFragment();
  SERVICES.forEach((svc) => {
    const card = document.createElement('article');
    card.className = `service-card service-card--${svc.status}`;
    card.setAttribute('aria-label', `${svc.name}: ${svc.status}, ${svc.replicas} replicas, latency ${svc.latency}`);
    card.innerHTML = `
      <div class="service-card__header">
        <span class="service-card__name">${svc.name}</span>
        <span class="service-card__dot service-card__dot--${svc.status}" title="${svc.status}"></span>
      </div>
      <div class="service-card__meta">
        <div class="service-meta-item">
          <span class="label">Replicas</span>
          <span>${svc.replicas}</span>
        </div>
        <div class="service-meta-item">
          <span class="label">Latency</span>
          <span>${svc.latency}</span>
        </div>
        <div class="service-meta-item">
          <span class="label">Version</span>
          <span class="font-mono">${svc.version}</span>
        </div>
        <div class="service-meta-item">
          <span class="label">Status</span>
          <span>${svc.status}</span>
        </div>
      </div>
      <div class="service-card__tags">
        ${svc.tags.map((t) => `<span class="svc-tag">${t}</span>`).join('')}
      </div>
    `;
    frag.appendChild(card);
  });
  grid.appendChild(frag);

  // Animate cards on scroll
  const obs = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      obs.unobserve(grid);
      grid.querySelectorAll('.service-card').forEach((c, i) => {
        setTimeout(() => c.classList.add('is-visible'), i * 55);
      });
    },
    { threshold: 0.06 }
  );
  obs.observe(grid);
}

/* ── Public entry point ───────────────────────────────── */
export function initDashboard() {
  initKPICounters();
  initInfraGrid();
  initPipeline();
  initServicesGrid();
}
