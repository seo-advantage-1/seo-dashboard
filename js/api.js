// ─────────────────────────────────────────────────────────────
// api.js — data layer
//
// Currently uses mock data from data/mock.js.
// When BigQuery scheduled query is live:
//   1. Create a Google Sheet with your scheduled query output
//   2. Publish the sheet: File → Share → Publish to web → CSV
//   3. Replace SHEET_URL below with the published CSV URL
//   4. Set USE_MOCK = false
// ─────────────────────────────────────────────────────────────

const USE_MOCK = true;

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/gviz/tq?tqx=out:csv&sheet=anton_zhouk';

async function fetchClients() {
  if (USE_MOCK) {
    return Promise.resolve(MOCK_CLIENTS);
  }

  try {
    const res = await fetch(SHEET_URL);
    const csv = await res.text();
    return parseSheet(csv);
  } catch (err) {
    console.error('Sheet fetch failed, falling back to mock data:', err);
    return MOCK_CLIENTS;
  }
}

function parseSheet(csv) {
  const lines = csv.trim().split('\n').slice(1); // skip header row
  const byClient = {};

  lines.forEach(line => {
    const cols = line.split(',').map(c => c.replace(/"/g, '').trim());
    const [month, client, sessions, appraisal, listing, phonecall, total, ses_pct, conv_pct] = cols;

    if (!byClient[client]) {
      byClient[client] = {
        id: client.toLowerCase().replace(/\s+/g, '-'),
        name: client,
        history: { months: [], sessions: [], appraisal_leads: [], new_listing_leads: [], phonecall_clicks: [], total_conversions: [] }
      };
    }

    const c = byClient[client];
    c.history.months.push(month);
    c.history.sessions.push(parseInt(sessions));
    c.history.appraisal_leads.push(parseInt(appraisal));
    c.history.new_listing_leads.push(parseInt(listing));
    c.history.phonecall_clicks.push(parseInt(phonecall));
    c.history.total_conversions.push(parseInt(total));
  });

  // derive latest month stats and MoM from history
  return Object.values(byClient).map(c => {
    const last = c.history.sessions.length - 1;
    c.organic_sessions = c.history.sessions[last];
    c.total_conversions = c.history.total_conversions[last];
    c.appraisal_leads = c.history.appraisal_leads[last];
    c.new_listing_leads = c.history.new_listing_leads[last];
    c.phonecall_clicks = c.history.phonecall_clicks[last];
    c.sessions_mom_pct = last > 0
      ? ((c.history.sessions[last] - c.history.sessions[last - 1]) / c.history.sessions[last - 1]) * 100
      : 0;
    c.conversions_mom_pct = last > 0
      ? ((c.history.total_conversions[last] - c.history.total_conversions[last - 1]) / c.history.total_conversions[last - 1]) * 100
      : 0;
    return c;
  });
}
