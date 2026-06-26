// Mock data — 24 months (Jun 2023 – May 2025)
// Replace SHEET_URL in js/api.js once BigQuery scheduled query is live.

const MONTHS_24 = [
  'Jun 23','Jul 23','Aug 23','Sep 23','Oct 23','Nov 23',
  'Dec 23','Jan 24','Feb 24','Mar 24','Apr 24','May 24',
  'Jun 24','Jul 24','Aug 24','Sep 24','Oct 24','Nov 24',
  'Dec 24','Jan 25','Feb 25','Mar 25','Apr 25','May 25'
];

function seeded(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function makeHistory(seed, baseS, endS, baseC, endC, posStart, posEnd) {
  const rnd = seeded(seed);
  const n = 24;
  const sessions = [], total_conversions = [], appraisal_leads = [], new_listing_leads = [], phonecall_clicks = [], avg_position = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // algo update dips at known months
    const algoDip = [2,3,4,5,9,11,14,17,21].includes(i) ? 0.88 : 1;
    const s = Math.max(1, Math.round((baseS + (endS - baseS) * t) * algoDip * (0.92 + rnd() * 0.16)));
    const c = Math.max(0, Math.round((baseC + (endC - baseC) * t) * algoDip * (0.90 + rnd() * 0.20)));
    sessions.push(s);
    total_conversions.push(c);
    appraisal_leads.push(Math.round(c * 0.40));
    new_listing_leads.push(Math.round(c * 0.35));
    phonecall_clicks.push(Math.round(c * 0.25));
    if (posStart) {
      const p = Math.round((posStart + (posEnd - posStart) * t) * (0.95 + rnd() * 0.10));
      avg_position.push(Math.max(1, p));
    }
  }
  const last = n - 1;
  const prev = n - 2;
  return {
    months: MONTHS_24, sessions, total_conversions, appraisal_leads, new_listing_leads, phonecall_clicks,
    avg_position: posStart ? avg_position : null,
    organic_sessions: sessions[last],
    total_conversions_latest: total_conversions[last],
    sessions_mom_pct: prev >= 0 && sessions[prev] > 0 ? Math.round(((sessions[last] - sessions[prev]) / sessions[prev]) * 1000) / 10 : 0,
    conversions_mom_pct: prev >= 0 && total_conversions[prev] > 0 ? Math.round(((total_conversions[last] - total_conversions[prev]) / total_conversions[prev]) * 1000) / 10 : 0,
  };
}

function client(id, name, seed, bS, eS, bC, eC, pS, pE) {
  const h = makeHistory(seed, bS, eS, bC, eC, pS, pE);
  return {
    id, name,
    organic_sessions: h.organic_sessions,
    total_conversions: h.total_conversions_latest,
    appraisal_leads: h.appraisal_leads[23],
    new_listing_leads: h.new_listing_leads[23],
    phonecall_clicks: h.phonecall_clicks[23],
    sessions_mom_pct: h.sessions_mom_pct,
    conversions_mom_pct: h.conversions_mom_pct,
    history: {
      months: h.months, sessions: h.sessions,
      total_conversions: h.total_conversions,
      appraisal_leads: h.appraisal_leads,
      new_listing_leads: h.new_listing_leads,
      phonecall_clicks: h.phonecall_clicks,
      avg_position: h.avg_position,
    }
  };
}

const MOCK_CLIENTS = [
  client('greetings-from-hell',       'Greetings From Hell',                  1,  500,  380,  22,  14,  24, 16),
  client('cerulean-space',            'Cerulean Space',                        2, 1600, 2100,  72,  95,  20, 11),
  client('gs-logistics',              'G&S Logistics',                         3, 1100,  880,  38,  28,  26, 20),
  client('seo-advantage-main',        'SEO Advantage (Main)',                  4, 2800, 3900, 120, 160,  13,  7),
  client('jw-beauty-jp',              'JW Beauty JP',                          5, 1900, 2600,  66,  88,  21, 12),
  client('tabuu',                     'Tabuu',                                 6,  640,  920,  20,  30,  30, 19),
  client('digicom-wireless',          'Digicom Wireless',                      7, 1300,  980,  50,  38,  18, 15),
  client('eastside-eye',              'Eastside Eye',                          8,  440,  610,  18,  26,  32, 22),
  client('jw-beauty-kr-usa',          'JW Beauty KR (USA)',                    9, 1400, 1900,  50,  68,  25, 15),
  client('jw-beauty-kr-korea',        'JW Beauty KR (Korea)',                 10, 1800, 2400,  62,  84,  23, 13),
  client('rocketams',                 'RocketAMS',                            11, 1100, 1450,  44,  60,  20, 11),
  client('hard-metals',               'Hard Metals',                          12,  560,  440,  20,  14,  28, 25),
  client('plunketts',                 'Plunketts',                            13,  760,  960,  28,  38,  22, 16),
  client('club-mandalay',             'Club Mandalay',                        14,  700,  580,  26,  18,  24, 21),
  client('vision-corporate',          'Vision Corporate Interiors',           15,  620,  820,  22,  32,  27, 18),
  client('melbourne-brain-spine',     'Melbourne Brain and Spine Clinic',     16,  820, 1100,  36,  48,  18, 10),
  client('lean6-melbourne',           'Lean 6 (Melbourne)',                   17,  460,  640,  18,  26,  30, 20),
  client('lean6-sydney',              'Lean 6 (Sydney)',                      18,  400,  560,  14,  22,  33, 22),
  client('the-herbivore',             'The Herbivore',                        19, 1100, 1650,  44,  66,  21, 13),
  client('family-mediators',          'Family Mediators Australia',           20,  260,  360,  10,  14,  36, 26),
  client('blinds-melbourne',          'Blinds Melbourne VIC',                 21,  720,  940,  28,  36,  24, 16),
  client('royal-derby',               'Royal Derby Hotel',                    22,  820,  680,  30,  22,  21, 19),
  client('dominance',                 'Dominance',                            23,  360,  520,  12,  20,  33, 24),
  client('business-reset',            'Business Reset',                       24,  320,  420,  10,  16,  29, 21),
  client('theatrical-supplies',       'Theatrical Supplies of Australia',     25,  340,  270,  12,   9,  39, 35),
  client('promocolour',               'Promocolour',                          26,  540,  720,  20,  28,  26, 18),
  client('tabuu-secondary',           'Tabuu (Secondary Campaign)',           27,  280,  410,  10,  15,  34, 25),
  client('vein-artery',               'Vein Artery Specialist',               28,  680,  940,  26,  38,  23, 14),
  client('luxe-chauffeurs',           'Luxe Chauffeurs Melbourne',            29,  620,  520,  22,  18,  27, 23),
  client('binance',                   'Binance',                              30,10000,14000, 400, 560,   9,  4),
  client('the-tree-expert',           'The Tree Expert',                      31,  380,  540,  14,  22,  30, 21),
  client('flatpack-professor',        'Flatpack Professor',                   32,  300,  460,  10,  18,  35, 26),
  client('coinbase',                  'Coinbase',                             33, 8000,11500, 320, 440,  11,  5),
  client('seo-advantage',             'SEO Advantage',                        34, 2300, 3200,  90, 130,  14,  8),
  client('mudflaps',                  'Mudflaps',                             35,  360,  280,  12,   8,  41, 37),
  client('civil-and-demo',            'Civil and Demo',                       36,  340,  480,  12,  20,  31, 22),
  client('bagmasters',                'Bagmasters',                           37,  460,  620,  16,  24,  28, 19),
  client('d-squared-electrical',      'D Squared Electrical',                 38,  360,  500,  12,  20,  32, 23),
  client('complete-water-damage',     'Complete Water Damage Services',       39,  560,  760,  20,  30,  25, 16),
  client('clearlight-designs',        'Clearlight Designs',                   40,  440,  580,  16,  22,  29, 20),
  client('melbourne-shutters',        'Melbourne Shutters & Blinds',          41,  640,  860,  24,  34,  23, 15),
  client('anton-zhouk',               'Anton Zhouk',                          42,  480,  373,  20,  10,  12, 11),
  client('mobile-direct',             'Mobile Direct',                        43,  520,  720,  18,  28,  27, 18),
  client('mari-design',               'Mari Design',                          44,  300,  440,  10,  18,  33, 24),
  client('centaur',                   'Centaur',                              45,  900, 1710,  80, 107,  19,  8),
  client('atlas-investigations',      'Atlas Investigations',                 46,  380,  520,  12,  20,  30, 21),
  client('bailin-support',            'Bailin Support',                       47,  280,  390,  10,  14,  36, 27),
];
