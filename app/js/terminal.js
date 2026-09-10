/**
 * terminal.js — Simulated real-time ops log terminal
 *
 * Generates a continuous stream of realistic DevOps log messages
 * and appends them to the terminal body with typewriter-style timing.
 */

const LOG_POOL = [
  { level: 'INFO',  svc: 'api-gateway',       msg: 'Health check passed — 200 OK in 12ms' },
  { level: 'OK',    svc: 'deploy-agent',       msg: 'Canary phase complete — rolling to 100% production traffic' },
  { level: 'INFO',  svc: 'auth-service',       msg: 'Token rotation completed — 1,842 sessions refreshed' },
  { level: 'WARN',  svc: 'cache-layer',        msg: 'Redis eviction rate elevated — 2.1k evictions/sec' },
  { level: 'INFO',  svc: 'metrics-exporter',   msg: 'Prometheus scrape: 47 targets active, interval 15s' },
  { level: 'OK',    svc: 'data-pipeline',      msg: 'Batch job ETL-2847 completed — duration 4m 32s' },
  { level: 'INFO',  svc: 'node-exporter',      msg: 'NODE-04 disk at 61% — threshold 80%' },
  { level: 'WARN',  svc: 'notification-svc',   msg: 'Queue depth 847 — processing below expected throughput' },
  { level: 'INFO',  svc: 'cdn-proxy',          msg: 'Cache hit ratio 94.7% — all edge nodes healthy' },
  { level: 'DEBUG', svc: 'storage-service',    msg: 'GC cycle complete — 2.3 GB heap reclaimed' },
  { level: 'INFO',  svc: 'api-gateway',        msg: 'Rate limiter reset — 15,000 req/min capacity restored' },
  { level: 'OK',    svc: 'cert-manager',       msg: 'TLS certificate renewed — expires 2027-09-10' },
  { level: 'INFO',  svc: 'scheduler',          msg: 'Cron job cluster-cleanup executed successfully' },
  { level: 'WARN',  svc: 'NODE-07',            msg: 'CPU iowait >15% — possible disk contention' },
  { level: 'INFO',  svc: 'vault-agent',        msg: 'Secret lease renewed for db/prod/creds' },
  { level: 'OK',    svc: 'health-checker',     msg: 'All 24 service probes passed liveness check' },
  { level: 'INFO',  svc: 'log-aggregator',     msg: 'Fluent Bit: 1.2M log lines processed in last 60s' },
  { level: 'DEBUG', svc: 'tracing-agent',      msg: 'Jaeger: 48,291 spans sampled at 10% — export OK' },
  { level: 'INFO',  svc: 'iam-sync',           msg: 'Role bindings synchronized — 0 drift detected' },
  { level: 'WARN',  svc: 'data-pipeline',      msg: 'Checkpoint lag 38s — within SLO bounds (60s)' },
  { level: 'OK',    svc: 'backup-service',     msg: 'Snapshot complete — 2.8 TB archived to cold storage' },
  { level: 'INFO',  svc: 'api-gateway',        msg: 'P99 latency 84ms — SLO target <200ms ✓' },
  { level: 'ERROR', svc: 'NODE-03',            msg: 'IPMI: fan speed anomaly detected — monitoring escalated' },
  { level: 'INFO',  svc: 'autoscaler',         msg: 'HPA scaled data-pipeline from 3→5 replicas' },
  { level: 'OK',    svc: 'vulnerability-scan', msg: 'Container scan complete — 0 critical CVEs found' },
  { level: 'INFO',  svc: 'auth-service',       msg: 'OAuth2 token introspection: 99.94% success rate' },
  { level: 'DEBUG', svc: 'api-gateway',        msg: 'Upstream connection pool: 240/256 active connections' },
  { level: 'INFO',  svc: 'storage-service',    msg: 'PUT object ops: 4,200/min — latency avg 6ms' },
  { level: 'WARN',  svc: 'NODE-11',            msg: 'Disk write latency 28ms — threshold 20ms' },
  { level: 'OK',    svc: 'iam-sync',           msg: 'Service account rotation complete — 0 errors' },
  { level: 'INFO',  svc: 'metrics-exporter',   msg: 'Remote write queue depth: 0 — fully flushed' },
  { level: 'INFO',  svc: 'scheduler',          msg: 'Log rotation freed 14.2 GB — 6 files archived' },
  { level: 'DEBUG', svc: 'cache-layer',        msg: 'Cluster replication lag: 2ms — acceptable' },
  { level: 'INFO',  svc: 'cdn-proxy',          msg: 'SSL handshake time: avg 18ms — TLS 1.3 enabled' },
];

let cursor = 0;
let terminalEl = null;
const MAX_LINES = 60;

function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z';
}

function appendLine(entry) {
  if (!terminalEl) return;

  const line = document.createElement('div');
  line.className = 'log-line';

  const ts  = document.createElement('span');
  ts.className = 'log-line__ts';
  ts.textContent = getTimestamp();

  const lvl = document.createElement('span');
  lvl.className = `log-line__lvl log-line__lvl--${entry.level}`;
  lvl.textContent = `[${entry.level}]`;

  const svc = document.createElement('span');
  svc.className = 'log-line__svc';
  svc.textContent = entry.svc;

  const msg = document.createElement('span');
  msg.className = 'log-line__msg';
  msg.textContent = entry.msg;

  line.append(ts, lvl, svc, msg);
  terminalEl.appendChild(line);

  // Keep DOM lean — prune oldest lines
  while (terminalEl.children.length > MAX_LINES) {
    terminalEl.removeChild(terminalEl.firstChild);
  }

  // Auto-scroll only when user is near the bottom (within 40px).
  // If the user has scrolled up to read old logs, don't interrupt them.
  const distFromBottom = terminalEl.scrollHeight - terminalEl.scrollTop - terminalEl.clientHeight;
  if (distFromBottom < 40) {
    terminalEl.scrollTop = terminalEl.scrollHeight;
  }
}

function scheduleNextLine() {
  // Vary the interval to feel organic: fast bursts + occasional pauses
  const base = 900;
  const jitter = Math.random() * 2800;
  const delay = base + jitter;

  setTimeout(() => {
    const entry = LOG_POOL[cursor % LOG_POOL.length];
    cursor++;
    appendLine(entry);
    scheduleNextLine();
  }, delay);
}

export function initTerminal() {
  terminalEl = document.getElementById('terminal-body');
  if (!terminalEl) return;

  // Seed with 9 initial lines immediately
  const seedCount = 9;
  for (let i = 0; i < seedCount; i++) {
    appendLine(LOG_POOL[i % LOG_POOL.length]);
    cursor++;
  }

  // Start the live stream
  scheduleNextLine();
}
