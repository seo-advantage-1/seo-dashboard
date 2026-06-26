// ─────────────────────────────────────────────
// app.js — SEO Advantage dashboard
// ─────────────────────────────────────────────

const COLORS = [
  '#E9204F','#1A1A2E','#0ea5e9','#8b5cf6',
  '#f59e0b','#10b981','#f97316','#6366f1',
  '#ec4899','#14b8a6','#84cc16','#ef4444'
];

let clients = [];
let activeView = 'overview';
let activeFilter = 'all';
let activeSort = 'sessions';
let activeMetric = 'sessions';
let activeMetrics = new Set(['sessions','conversions']);
let activeClients = new Set();
let trendChart = null;
let drillChart = null;
let currentClient = null;

// ── Boot ─────────────────────────────────────
async function init() {
  clients = await fetchClients();
  activeClients = new Set(clients.slice(0, 4).map(c => c.id));
  renderOverview();
  renderTrendToggles();
  setupNav();
}

// ── Navigation ────────────────────────────────
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      const view = el.dataset.view;
      if (!view) return;
      navigateTo(view);
    });
  });
}

function navigateTo(view, clientId) {
  activeView = view;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  document.querySelectorAll('.view').forEach(el => {
    el.classList.toggle('active', el.id === 'view-' + view);
  });

  const titles = {
    overview: { title: 'All clients', sub: 'Organic traffic and conversions — month on month' },
    trends:   { title: 'Trend comparison', sub: 'Select clients to compare over time' },
    drilldown: { title: currentClient ? currentClient.name : 'Client detail', sub: 'Full performance breakdown' }
  };
  document.getElementById('topbar-title').textContent = titles[view].title;
  document.getElementById('topbar-meta').textContent = titles[view].sub;

  if (view === 'trends') renderTrendChart();
  if (view === 'drilldown' && clientId) openDrilldown(clientId);
}

// ── Overview ──────────────────────────────────
function renderOverview() {
  renderSummaryBar();
  renderTable();
}

function renderSummaryBar() {
  const totalSessions = clients.reduce((s, c) => s + c.organic_sessions, 0);
  const totalConversions = clients.reduce((s, c) => s + c.total_conversions, 0);
  const avgSessionsPct = clients.reduce((s, c) => s + c.sessions_mom_pct, 0) / clients.length;
  const avgConvPct = clients.reduce((s, c) => s + c.conversions_mom_pct, 0) / clients.length;
  const alertCount = clients.filter(c => c.sessions_mom_pct < -15 || c.conversions_mom_pct < -15).length;

  document.getElementById('stat-sessions').innerHTML = totalSessions.toLocaleString();
  document.getElementById('stat-client-count').innerHTML = clients.length;
  document.getElementById('stat-conversions').innerHTML = totalConversions.toLocaleString();
  document.getElementById('stat-portfolio').innerHTML = deltaHtml(avgSessionsPct);
  document.getElementById('stat-alerts').innerHTML = `<span style="color:${alertCount > 0 ? 'var(--red)' : 'var(--success-text)'}">${alertCount}</span>`;
}

function deltaHtml(pct) {
  const rounded = Math.round(pct * 10) / 10;
  const cls = rounded > 0 ? 'up' : rounded < -5 ? 'down' : 'flat';
  const sign = rounded > 0 ? '+' : '';
  return `<span class="delta ${cls}">${sign}${rounded.toFixed(1)}% vs last month</span>`;
}

function renderTable() {
  let rows = [...clients];

  if (activeFilter === 'alert') rows = rows.filter(c => c.sessions_mom_pct < -15 || c.conversions_mom_pct < -15);
  if (activeFilter === 'up')    rows = rows.filter(c => c.sessions_mom_pct > 5 && c.conversions_mom_pct > 0);

  if (activeSort === 'sessions') rows.sort((a, b) => b.organic_sessions - a.organic_sessions);
  if (activeSort === 'drop')     rows.sort((a, b) => Math.min(a.sessions_mom_pct, a.conversions_mom_pct) - Math.min(b.sessions_mom_pct, b.conversions_mom_pct));
  if (activeSort === 'name')     rows.sort((a, b) => a.name.localeCompare(b.name));

  const tbody = document.getElementById('client-tbody');
  tbody.innerHTML = rows.map((c, i) => {
    const color = COLORS[clients.indexOf(c) % COLORS.length];
    return `<tr onclick="openDrilldownFromTable('${c.id}')">
      <td class="client-name">
        <span class="status-dot" style="background:${statusColor(c)}"></span>${c.name}
      </td>
      <td class="r">${c.organic_sessions.toLocaleString()}</td>
      <td class="r">${badge(c.sessions_mom_pct)}</td>
      <td class="r">${c.total_conversions.toLocaleString()}</td>
      <td class="r">${badge(c.conversions_mom_pct)}</td>
      <td class="c">${sparkSVG(c.history.sessions, c.history.total_conversions, 96, 30, color)}</td>
      <td class="r">${statusBadge(c)}</td>
    </tr>`;
  }).join('');
}

function statusColor(c) {
  if (c.sessions_mom_pct < -15 || c.conversions_mom_pct < -15) return 'var(--red)';
  if (c.sessions_mom_pct > 5) return '#22c55e';
  return '#d1d5db';
}

function badge(pct) {
  const r = Math.round(pct * 10) / 10;
  const sign = r > 0 ? '+' : '';
  const cls = r > 0 ? 'up' : r < -5 ? 'down' : 'flat';
  return `<span class="badge ${cls}">${sign}${r.toFixed(1)}%</span>`;
}

function statusBadge(c) {
  if (c.sessions_mom_pct < -15 || c.conversions_mom_pct < -15)
    return `<span class="badge down">Alert</span>`;
  if (c.sessions_mom_pct > 5)
    return `<span class="badge up">Good</span>`;
  return `<span class="badge flat">Stable</span>`;
}

function sparkSVG(sess, conv, w, h, color) {
  function line(arr, stroke, width) {
    const mn = Math.min(...arr), mx = Math.max(...arr), rng = mx - mn || 1;
    const pts = arr.map((v, i) =>
      `${Math.round(i * (w - 4) / (arr.length - 1) + 2)},${Math.round(h - 3 - ((v - mn) / rng) * (h - 6))}`
    ).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  return `<svg width="${w}" height="${h}" style="display:block;margin:0 auto">
    ${line(sess, color, 1.5)}
    ${line(conv, 'rgba(26,26,46,0.25)', 1)}
  </svg>`;
}

// ── Filter / sort controls ────────────────────
function setFilter(f, el) {
  activeFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active', 'danger'));
  el.classList.add('active');
  if (f === 'alert') el.classList.add('danger');
  renderTable();
}

function setSort(val) {
  activeSort = val;
  renderTable();
}

// ── Trend view ────────────────────────────────
function renderTrendToggles() {
  const wrap = document.getElementById('client-toggles');
  wrap.innerHTML = clients.map((c, i) => {
    const color = COLORS[i % COLORS.length];
    const on = activeClients.has(c.id);
    return `<div class="client-toggle ${on ? 'on' : ''}" id="tog-${c.id}" onclick="toggleClient('${c.id}', this)">
      <span class="cdot" id="cdot-${c.id}" style="background:${color};opacity:${on ? 1 : 0.25}"></span>
      ${c.name}
    </div>`;
  }).join('');
}

function toggleClient(id, el) {
  if (activeClients.has(id)) {
    if (activeClients.size <= 1) return;
    activeClients.delete(id);
    el.classList.remove('on');
    document.getElementById('cdot-' + id).style.opacity = '0.25';
  } else {
    activeClients.add(id);
    el.classList.add('on');
    document.getElementById('cdot-' + id).style.opacity = '1';
  }
  renderTrendChart();
}

function setMetric(m, el) {
  if (activeMetrics.has(m)) {
    if (activeMetrics.size <= 1) return; // always keep at least one
    activeMetrics.delete(m);
    el.classList.remove('active');
  } else {
    activeMetrics.add(m);
    el.classList.add('active');
  }
  renderTrendChart();
}

function renderTrendChart() {
  const active = clients.filter(c => activeClients.has(c.id));
  const labels = clients[0].history.months;
  const datasets = [];

  // line styles per metric so clients are distinguishable by dash pattern
  const metricStyle = {
    sessions:     { dash: [],      width: 2   },
    conversions:  { dash: [5,3],   width: 2   },
    avg_position: { dash: [2,2],   width: 1.5 },
  };

  const metricLabel = {
    sessions:     'Sessions',
    conversions:  'Conversions',
    avg_position: 'Avg. position',
  };

  active.forEach(c => {
    const idx = clients.indexOf(c);
    const color = COLORS[idx % COLORS.length];

    if (activeMetrics.has('sessions')) {
      datasets.push({
        label: `${c.name} — sessions`,
        data: c.history.sessions,
        borderColor: color,
        backgroundColor: 'transparent',
        borderWidth: metricStyle.sessions.width,
        borderDash: metricStyle.sessions.dash,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.35,
        yAxisID: 'y',
      });
    }

    if (activeMetrics.has('conversions')) {
      datasets.push({
        label: `${c.name} — conversions`,
        data: c.history.total_conversions,
        borderColor: color,
        backgroundColor: 'transparent',
        borderWidth: metricStyle.conversions.width,
        borderDash: metricStyle.conversions.dash,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.35,
        yAxisID: 'y1',
      });
    }

    if (activeMetrics.has('avg_position') && c.history.avg_position) {
      datasets.push({
        label: `${c.name} — avg. position`,
        data: c.history.avg_position,
        borderColor: color,
        backgroundColor: 'transparent',
        borderWidth: metricStyle.avg_position.width,
        borderDash: metricStyle.avg_position.dash,
        pointRadius: 2,
        pointHoverRadius: 4,
        tension: 0.35,
        yAxisID: 'y2',
      });
    }
  });

  const annotations = {};
  ALGORITHM_UPDATES.forEach((u, i) => {
    const color = UPDATE_COLORS[u.type];
    annotations['u' + i] = {
      type: 'line',
      xMin: u.month, xMax: u.month,
      borderColor: color,
      borderWidth: 1.5,
      borderDash: [4, 3],
      enter({ element }) { element.label.options.display = true; return true; },
      leave({ element }) { element.label.options.display = false; return true; },
      label: {
        display: false,
        content: u.full,
        position: 'start',
        font: { size: 11, family: 'Manrope', weight: '600' },
        color: '#fff',
        backgroundColor: color,
        padding: { x: 8, y: 4 },
        borderRadius: 4,
        yAdjust: 20,
      }
    };
  });

  const ctx = document.getElementById('trend-chart').getContext('2d');
  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: { family: 'Manrope', size: 11 },
            color: '#5a5a7a',
            padding: 12,
            usePointStyle: true,
            pointStyleWidth: 8,
            generateLabels: chart => chart.data.datasets.map((ds, i) => ({
              text: ds.label,
              fillStyle: ds.borderColor,
              strokeStyle: ds.borderColor,
              lineWidth: ds.borderWidth,
              lineDash: ds.borderDash,
              hidden: false,
              datasetIndex: i,
              pointStyle: 'line',
            }))
          }
        },
        annotation: { annotations },
        tooltip: {
          backgroundColor: '#fff',
          borderColor: '#e4e4ee',
          borderWidth: 1,
          titleColor: '#1A1A2E',
          bodyColor: '#5a5a7a',
          padding: 10,
          titleFont: { family: 'Manrope', weight: '600' },
          bodyFont: { family: 'Manrope' },
          callbacks: {
            label: ctx => {
              const isPosition = ctx.dataset.label.includes('position');
              const val = ctx.parsed.y;
              return `${ctx.dataset.label}: ${isPosition ? '#' + val : val.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#f0f0f5' },
          ticks: { color: '#9898b0', font: { family: 'Manrope', size: 11 } }
        },
        y: {
          position: 'left',
          display: activeMetrics.has('sessions'),
          grid: { color: '#f0f0f5' },
          title: { display: true, text: 'Sessions', color: '#9898b0', font: { family: 'Manrope', size: 10 } },
          ticks: {
            color: '#9898b0',
            font: { family: 'Manrope', size: 11 },
            callback: v => v >= 1000 ? Math.round(v / 1000) + 'k' : v
          }
        },
        y1: {
          position: 'right',
          display: activeMetrics.has('conversions'),
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Conversions', color: '#9898b0', font: { family: 'Manrope', size: 10 } },
          ticks: { color: '#9898b0', font: { family: 'Manrope', size: 11 } }
        },
        y2: {
          position: 'right',
          display: activeMetrics.has('avg_position'),
          reverse: true, // lower position = better, so flip axis
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Avg. position (lower = better)', color: '#9898b0', font: { family: 'Manrope', size: 10 } },
          ticks: {
            color: '#9898b0',
            font: { family: 'Manrope', size: 11 },
            callback: v => '#' + v
          }
        }
      }
    },
    plugins: [window.ChartAnnotation || {}]
  });
}

// ── Drilldown view ────────────────────────────
function openDrilldownFromTable(id) {
  navigateTo('drilldown', id);
}

function openDrilldown(id) {
  const c = clients.find(cl => cl.id === id);
  if (!c) return;
  currentClient = c;

  document.getElementById('drilldown-name').textContent = c.name;
  document.getElementById('dd-sessions').textContent = c.organic_sessions.toLocaleString();
  document.getElementById('dd-conversions').textContent = c.total_conversions.toLocaleString();
  document.getElementById('dd-sessions-delta').innerHTML = deltaHtml(c.sessions_mom_pct);
  document.getElementById('dd-conv-delta').innerHTML = deltaHtml(c.conversions_mom_pct);

  // conversion breakdown
  const total = c.appraisal_leads + c.new_listing_leads + c.phonecall_clicks;
  renderConvCard('conv-appraisal', 'Appraisal leads', c.appraisal_leads, total);
  renderConvCard('conv-listing', 'New listing leads', c.new_listing_leads, total);
  renderConvCard('conv-phone', 'Phone call clicks', c.phonecall_clicks, total);

  // trend chart
  renderDrillChart(c);
}

function renderConvCard(id, label, value, total) {
  const el = document.getElementById(id);
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  el.querySelector('.conv-label').textContent = label;
  el.querySelector('.conv-value').textContent = value.toLocaleString();
  el.querySelector('.conv-bar').style.width = pct + '%';
}

function renderDrillChart(c) {
  const ctx = document.getElementById('drill-chart').getContext('2d');
  if (drillChart) drillChart.destroy();

  drillChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: c.history.months,
      datasets: [
        {
          label: 'Organic sessions',
          data: c.history.sessions,
          borderColor: '#E9204F',
          backgroundColor: 'rgba(233,32,79,0.06)',
          fill: true,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Appraisal leads',
          data: c.history.appraisal_leads,
          borderColor: '#1A1A2E',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderDash: [],
          tension: 0.4,
          yAxisID: 'y1'
        },
        {
          label: 'New listing leads',
          data: c.history.new_listing_leads,
          borderColor: '#8b5cf6',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.4,
          yAxisID: 'y1'
        },
        {
          label: 'Phone clicks',
          data: c.history.phonecall_clicks,
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: { family: 'Manrope', size: 11 },
            color: '#5a5a7a',
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 8
          }
        },
        tooltip: {
          backgroundColor: '#fff',
          borderColor: '#e4e4ee',
          borderWidth: 1,
          titleColor: '#1A1A2E',
          bodyColor: '#5a5a7a',
          padding: 10,
          titleFont: { family: 'Manrope', weight: '600' },
          bodyFont: { family: 'Manrope' },
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#f0f0f5' },
          ticks: { color: '#9898b0', font: { family: 'Manrope', size: 11 } }
        },
        y: {
          position: 'left',
          grid: { color: '#f0f0f5' },
          ticks: {
            color: '#9898b0',
            font: { family: 'Manrope', size: 11 },
            callback: v => v >= 1000 ? Math.round(v / 1000) + 'k' : v
          }
        },
        y1: {
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#9898b0', font: { family: 'Manrope', size: 11 } }
        }
      }
    }
  });
}

function goBack() {
  navigateTo('overview');
}

// ── Start ─────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.ChartAnnotation) Chart.register(window.ChartAnnotation);
    init();
  }, 300);
});
