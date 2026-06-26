// Google algorithm updates — Jun 2023 to May 2025
// month index 0 = Jun 2023, index 23 = May 2025
// type: 'core' | 'helpful' | 'spam' | 'policy'
// color coded by type, short label on axis, full detail on hover

const ALGORITHM_UPDATES = [
  { month: 2,  type: 'core',    short: 'Core',     full: 'Aug 2023 — Core update' },
  { month: 3,  type: 'helpful', short: 'HC',        full: 'Sep 2023 — Helpful content update' },
  { month: 4,  type: 'core',    short: 'Core',      full: 'Oct 2023 — Core update' },
  { month: 4,  type: 'spam',    short: 'Spam',      full: 'Oct 2023 — Spam update' },
  { month: 5,  type: 'core',    short: 'Core',      full: 'Nov 2023 — Core update' },
  { month: 9,  type: 'core',    short: 'Core',      full: 'Mar 2024 — Core update' },
  { month: 10, type: 'policy',  short: 'Policy',    full: 'Apr 2024 — Site reputation abuse enforcement' },
  { month: 11, type: 'spam',    short: 'Spam',      full: 'May 2024 — Spam update' },
  { month: 14, type: 'core',    short: 'Core',      full: 'Aug 2024 — Core update' },
  { month: 17, type: 'core',    short: 'Core',      full: 'Nov 2024 — Core update' },
  { month: 21, type: 'core',    short: 'Core',      full: 'Mar 2025 — Core update' },
];

const UPDATE_COLORS = {
  core:    '#E9204F',  // red   — biggest impact, most important
  helpful: '#8b5cf6',  // purple — helpful content specific
  spam:    '#f59e0b',  // amber  — spam
  policy:  '#0ea5e9',  // blue   — policy enforcement
};

const UPDATE_LABELS = {
  core:    'Core update',
  helpful: 'Helpful content',
  spam:    'Spam update',
  policy:  'Policy enforcement',
};
