/**
 * charts.js — SVG gauge rings & sparklines with simulated live metrics
 *
 * Gauge formula: circumference = 2π × r = 2π × 50 ≈ 314.159
 * stroke-dashoffset = circ × (1 - pct/100)
 */

const CIRC = 314.159; // 2π × 50

/** History buffers: 30 points per metric */
const history = { cpu: [], mem: [], net: [], disk: [] };

/** Guards against updateMetrics() running before initCharts() seeds history */
let _seeded = false;

/** Metric simulation config */
const config = {
  cpu:  { min: 32, max: 74, current: 0 },
  mem:  { min: 55, max: 82, current: 0 },
  net:  { min: 12, max: 68, current: 0 },
  disk: { min: 18, max: 58, current: 0 },
};

/* ── Helpers ─────────────────────────────────────────────── */
function rand(min, max) {
  return min + Math.random() * (max - min);
}

/** Smooth random walk clamped to [min, max] */
function nextValue(key) {
  const c = config[key];
  const delta = (Math.random() - 0.48) * 9;
  c.current = Math.max(c.min - 2, Math.min(c.max + 2, c.current + delta));
  return c.current;
}

function getEl(id) { return document.getElementById(id); }

/* ── Gauge ───────────────────────────────────────────────── */
function setGauge(id, pct) {
  const el = getEl(id);
  if (!el) return;
  const offset = CIRC * (1 - Math.min(pct, 100) / 100);
  el.style.strokeDashoffset = offset.toFixed(2);
}

function setGaugeText(id, text) {
  const el = getEl(id);
  if (el) el.textContent = text;
}

/* ── Sparklines ──────────────────────────────────────────── */
function buildPoints(data, W = 200, H = 60, pad = 4) {
  if (data.length < 2) return { line: '', fill: '' };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = pts.join(' ');
  const fill = `0,${H} ${pts.join(' ')} ${W},${H}`;
  return { line, fill };
}

function updateSparkline(key, data) {
  const lineEl = getEl(`spark-${key}-line`);
  const fillEl = getEl(`spark-${key}-fill`);
  if (!lineEl || !fillEl) return;
  const { line, fill } = buildPoints(data);
  lineEl.setAttribute('points', line);
  fillEl.setAttribute('points', fill);
}

/* ── Public: update all metrics ─────────────────────────── */
export function updateMetrics() {
  if (!_seeded) return; // Don't run before history is populated
  const now = new Date();
  const ts  = now.toUTCString().split(' ')[4] + ' UTC';

  // ── CPU
  const cpu = nextValue('cpu');
  history.cpu.push(cpu);
  if (history.cpu.length > 30) history.cpu.shift();
  setGauge('gauge-cpu', cpu);
  setGaugeText('gauge-cpu-pct', `${cpu.toFixed(0)}%`);
  updateSparkline('cpu', history.cpu);

  const avgCpu  = (history.cpu.reduce((a, b) => a + b, 0) / history.cpu.length).toFixed(1);
  const peakCpu = Math.max(...history.cpu).toFixed(0);
  const elAvg   = getEl('cpu-avg');  if (elAvg)  elAvg.textContent  = avgCpu + '%';
  const elPeak  = getEl('cpu-peak'); if (elPeak) elPeak.textContent = peakCpu + '%';

  // ── Memory
  const mem = nextValue('mem');
  history.mem.push(mem);
  if (history.mem.length > 30) history.mem.shift();
  setGauge('gauge-mem', mem);
  setGaugeText('gauge-mem-pct', `${mem.toFixed(0)}%`);
  updateSparkline('mem', history.mem);

  const usedGB = (mem / 100 * 128).toFixed(1);
  const freeGB = (128 - parseFloat(usedGB)).toFixed(1);
  const elUsed = getEl('mem-used'); if (elUsed) elUsed.textContent = usedGB + ' GB';
  const elFree = getEl('mem-free'); if (elFree) elFree.textContent = freeGB + ' GB';

  // ── Network I/O
  const net = nextValue('net');
  history.net.push(net);
  if (history.net.length > 30) history.net.shift();
  setGauge('gauge-net', net);
  setGaugeText('gauge-net-pct', `${net.toFixed(0)}%`);
  updateSparkline('net', history.net);

  const netIn  = (net * 0.65).toFixed(0) + ' MB/s';
  const netOut = (net * 0.35).toFixed(0) + ' MB/s';
  const elIn   = getEl('net-in');  if (elIn)  elIn.textContent  = netIn;
  const elOut  = getEl('net-out'); if (elOut) elOut.textContent = netOut;

  // ── Disk I/O
  const disk = nextValue('disk');
  history.disk.push(disk);
  if (history.disk.length > 30) history.disk.shift();
  setGauge('gauge-disk', disk);
  setGaugeText('gauge-disk-pct', `${disk.toFixed(0)}%`);
  updateSparkline('disk', history.disk);

  const diskR = (disk * 4.8).toFixed(0) + ' MB/s';
  const diskW = (disk * 2.2).toFixed(0) + ' MB/s';
  const elR   = getEl('disk-read');  if (elR) elR.textContent   = diskR;
  const elW   = getEl('disk-write'); if (elW) elW.textContent   = diskW;

  // ── Update scan timestamps
  document.querySelectorAll('#hero-last-scan, #footer-last-scan')
    .forEach((el) => { el.textContent = ts; });
}

/* ── Public: init charts ─────────────────────────────────── */
export function initCharts() {
  // Seed history with 20 plausible data points
  ['cpu', 'mem', 'net', 'disk'].forEach((key) => {
    const c = config[key];
    c.current = rand(c.min, c.max);
    for (let i = 0; i < 20; i++) {
      const delta = (Math.random() - 0.48) * 8;
      c.current = Math.max(c.min - 2, Math.min(c.max + 2, c.current + delta));
      history[key].push(c.current);
    }
  });
  _seeded = true; // History is now populated — updateMetrics() is safe to run

  // Observe metric cards — animate in + trigger initial gauge
  const metricCards = document.querySelectorAll('.metric-card');
  let chartsTriggered = false;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
      if (!chartsTriggered && [...metricCards].some((c) => c.classList.contains('is-visible'))) {
        chartsTriggered = true;
        updateMetrics();
      }
    },
    { threshold: 0.15 }
  );

  metricCards.forEach((card) => obs.observe(card));
}
