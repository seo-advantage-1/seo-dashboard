# SEO Advantage — Client Dashboard

Internal dashboard for monitoring organic traffic and conversions across all SEO clients.

## Stack
- Vanilla JS + Chart.js — no build step required
- Google Sheets as data source (fed by BigQuery scheduled query)
- Hosted on GitHub Pages

## Local development

Just open `index.html` in a browser. No server needed — it runs entirely client-side.

```bash
# Or serve locally with any static server
npx serve .
```

## Switching from mock data to live data

1. Ensure the BigQuery scheduled query is running and writing to your Google Sheet
2. Publish the Google Sheet: **File → Share → Publish to web → CSV format**
3. Open `js/api.js`
4. Replace `YOUR_SHEET_ID` in `SHEET_URL` with your actual Sheet ID
5. Set `USE_MOCK = false`

The Sheet ID is the long string in the Sheet URL:
`https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`

## Project structure

```
seo-dashboard/
├── index.html          — main app shell (all three views)
├── css/
│   └── styles.css      — brand styles (Manrope, SEO Advantage colours)
├── js/
│   ├── api.js          — data fetching layer (swap mock → Sheets here)
│   └── app.js          — all UI logic, charts, navigation
├── data/
│   └── mock.js         — mock client data for development
└── README.md
```

## Deploying to GitHub Pages

1. Create a new GitHub repo (private recommended for internal tools)
2. Push this folder as the root of the repo
3. Go to **Settings → Pages → Source → Deploy from branch → main → / (root)**
4. GitHub will give you a URL like `https://youragency.github.io/seo-dashboard`
5. Share that URL with your team — no login required beyond knowing the URL

## Adding a new client

Once the BigQuery wildcard view is set up, new clients are added automatically
the moment their GA4 property is linked to the GCP project. No dashboard code changes needed.

## Google Sheets API note

The dashboard fetches the Sheet as a published CSV — no API key required.
This only works if the Sheet is published publicly (not editable, just readable).
The data itself is not sensitive (aggregated metrics only, no PII).

## Updating algorithm update markers

Edit the `ALGORITHM_UPDATES` array in `data/mock.js` (or wherever you move it).
Google announces core updates at: https://developers.google.com/search/updates/core-updates
