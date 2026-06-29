/**
 * Cloudflare Pages Function — GET /api/nav?code=A0ZFGF
 * ----------------------------------------------------------------------------
 * NAV / Entry / Exit / Historical for the Ziller Global Fund.
 * Replicates the old WordPress `unitprices` updater: reads Perennial's private
 * CSV feed (a token-protected directory of dated CSV files), finds the latest
 * rows for the fund, and returns clean JSON.
 *
 * Required SECRET:
 *   PERENNIAL_FEED_BASE   e.g. https://perennial.net.au/<token>/  (trailing slash optional)
 * Optional vars (strings):
 *   NAV_LOOKBACK_DAYS (30)   NAV_HISTORY_LIMIT (30)   NAV_CACHE_SECONDS (3600)
 *   NAV_MAX_FILES (20)       ALLOW_ORIGIN (*)
 *
 * Response: { code, date, entry, exit, nav, history:[{date,nav}], error? }
 * Values are 4dp strings with NO leading "$" — the page adds it.
 *
 * SOURCE-CSV COLUMN MAP — confirmed against the live feed 2026-06-29:
 *   col[1] = "Fund code"      col[2] = "Valuation date" (US M/D/Y, e.g. 12/31/2025)
 *   col[11] = "NAV per unit"  col[12] = "NAV per unit - bid" (exit/redemption)
 *   col[13] = "NAV per unit - offer" (entry/application)
 * Filenames are "Daily-Unit-Price-DD.MM.YYYY.csv" (AU D.M.Y); fileDate() reads that.
 */

const DEFAULTS = {
  NAV_LOOKBACK_DAYS: 30,
  NAV_HISTORY_LIMIT: 30,
  NAV_CACHE_SECONDS: 3600,
  NAV_MAX_FILES: 20,
  ALLOW_ORIGIN: '*',
};

export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = env.ALLOW_ORIGIN || DEFAULTS.ALLOW_ORIGIN;
  const cfg = config(env);
  const url = new URL(request.url);
  const code = (url.searchParams.get('code') || 'A0ZFGF').trim();
  const base = (env.PERENNIAL_FEED_BASE || '').trim();
  const format = (url.searchParams.get('format') || 'json').toLowerCase();

  // Manual accumulator trigger (seed/refresh the KV full-history CSV — Option B).
  if (url.searchParams.get('accumulate') === '1') {
    return json({ accumulate: await runAccumulator(env) }, origin, 0);
  }

  try {
    if (!base) throw new Error('PERENNIAL_FEED_BASE not configured.');

    // Historical CSV download: serve the accumulated KV file if present (full history,
    // Option B), else generate the recent window from the feed on demand (Option A).
    if (format === 'csv') {
      let csv = null;
      if (env.NAV_KV) { try { csv = await env.NAV_KV.get(kvKey(code)); } catch (_) {} }
      if (!csv) { const built = await buildNav(code, base, cfg); csv = toCsv(code, built.history); }
      return csvResponse(csv, origin, cfg.NAV_CACHE_SECONDS);
    }
    const cache = caches.default;
    const key = new Request('https://nav-cache.internal/nav-' + encodeURIComponent(code));

    if (!url.searchParams.get('nocache')) {
      try { const hit = await cache.match(key); if (hit) return json(await hit.json(), origin, cfg.NAV_CACHE_SECONDS); } catch (_) {}
    }

    const result = await buildNav(code, base, cfg);
    try {
      await cache.put(key, new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=' + cfg.NAV_CACHE_SECONDS },
      }));
    } catch (_) {}
    return json(result, origin, cfg.NAV_CACHE_SECONDS);
  } catch (err) {
    return json({ code: code, error: msg(err) }, origin, 30);
  }
}

export function onRequestOptions(context) {
  return new Response(null, { headers: cors(context.env.ALLOW_ORIGIN || DEFAULTS.ALLOW_ORIGIN) });
}

async function buildNav(code, base, cfg) {
  const baseUrl = base.charAt(base.length - 1) === '/' ? base : base + '/';
  const indexRes = await fetch(baseUrl);
  if (!indexRes.ok) throw new Error('Feed index fetch failed (HTTP ' + indexRes.status + ').');
  const indexHtml = await indexRes.text();

  const now = Date.now();
  const minTs = now - cfg.NAV_LOOKBACK_DAYS * 86400000;
  const seen = {};
  const candidates = [];
  extractHrefs(indexHtml).forEach(function (href) {
    if (seen[href] || !/\.csv(\?|#|$)/i.test(href)) return;
    seen[href] = true;
    const ts = fileDate(href);
    if (!Number.isNaN(ts) && ts >= minTs && ts <= now + 86400000) candidates.push({ href: href, ts: ts });
  });
  candidates.sort(function (a, b) { return b.ts - a.ts; });

  const byDate = {};
  const files = candidates.slice(0, cfg.NAV_MAX_FILES);
  for (let f = 0; f < files.length; f++) {
    let text;
    try {
      const r = await fetch(new URL(files[f].href, baseUrl).href);
      if (!r.ok) continue;
      text = await r.text();
    } catch (_) { continue; }

    const rows = parseCsv(text);
    for (let i = 1; i < rows.length; i++) { // skip header row
      const c = rows[i];
      if (!c || c.length <= 13) continue;
      if (String(c[1]).trim() !== code) continue;
      const d = parseRowDate(c[2]);
      const k = d.display || String(d.ts);
      if (!byDate[k]) byDate[k] = { ts: d.ts, date: d.display, entry: fmt(c[13]), exit: fmt(c[12]), nav: fmt(c[11]) };
    }
  }

  const records = Object.keys(byDate).map(function (k) { return byDate[k]; })
    .filter(function (r) { return !Number.isNaN(r.ts); })
    .sort(function (a, b) { return b.ts - a.ts; });
  if (!records.length) throw new Error('No rows for ' + code + ' in last ' + cfg.NAV_LOOKBACK_DAYS + ' days.');

  const cur = records[0];
  const history = records.slice(0, cfg.NAV_HISTORY_LIMIT).map(function (r) { return { date: r.date, entry: r.entry, exit: r.exit, nav: r.nav }; });
  return { code: code, date: cur.date, entry: cur.entry, exit: cur.exit, nav: cur.nav, history: history };
}

// --- parsing helpers ---

function extractHrefs(html) {
  const out = [];
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

// Old plugin: split filename by '-', 4th chunk holds DD.MM.YYYY.csv. Plus fallbacks.
function fileDate(href) {
  const name = (href.split('?')[0].split('#')[0].split('/').pop() || href);
  const dash = name.split('-');
  if (dash.length > 3) {
    const dot = dash[3].split('.');
    if (dot.length >= 3) { const ts = Date.parse(dot[2] + '-' + pad(dot[1]) + '-' + pad(dot[0]) + 'T00:00:00Z'); if (!Number.isNaN(ts)) return ts; }
  }
  let g = name.match(/(\d{1,2})[.\-_](\d{1,2})[.\-_](\d{4})/);
  if (g) { const ts = Date.parse(g[3] + '-' + pad(g[2]) + '-' + pad(g[1]) + 'T00:00:00Z'); if (!Number.isNaN(ts)) return ts; }
  g = name.match(/(\d{4})[.\-_](\d{1,2})[.\-_](\d{1,2})/);
  if (g) { const ts = Date.parse(g[1] + '-' + pad(g[2]) + '-' + pad(g[3]) + 'T00:00:00Z'); if (!Number.isNaN(ts)) return ts; }
  return NaN;
}

// The Perennial feed's "Valuation date" column is US M/D/Y (e.g. "12/31/2025").
function parseRowDate(s) {
  s = String(s == null ? '' : s).trim();
  if (!s) return { ts: NaN, display: '' };
  let ts = NaN, m;
  if ((m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/))) {
    const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
    let month, day;
    if (a > 12) { day = a; month = b; }   // unambiguous D/M
    else { month = a; day = b; }          // M/D (this feed) — also handles day > 12
    ts = Date.parse(m[3] + '-' + pad(month) + '-' + pad(day) + 'T00:00:00Z');
  } else if ((m = s.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/))) {
    ts = Date.parse(m[1] + '-' + pad(m[2]) + '-' + pad(m[3]) + 'T00:00:00Z');
  } else {
    ts = Date.parse(s);
    if (Number.isNaN(ts)) ts = Date.parse(s.replace(/-/g, ' '));
  }
  return { ts: ts, display: Number.isNaN(ts) ? s : displayDate(ts) };
}

function displayDate(ts) {
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(ts);
  return pad(d.getUTCDate()) + '-' + MON[d.getUTCMonth()] + '-' + d.getUTCFullYear();
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function fmt(v) {
  const n = Number(String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n.toFixed(4) : null;
}

function pad(v) { return String(v).length < 2 ? '0' + v : String(v); }
function num(v, d) { const n = Number(v); return (v == null || v === '' || Number.isNaN(n)) ? d : n; }
function msg(e) { return String((e && e.message) || e); }

function config(env) {
  return {
    NAV_LOOKBACK_DAYS: num(env.NAV_LOOKBACK_DAYS, DEFAULTS.NAV_LOOKBACK_DAYS),
    NAV_HISTORY_LIMIT: num(env.NAV_HISTORY_LIMIT, DEFAULTS.NAV_HISTORY_LIMIT),
    NAV_CACHE_SECONDS: num(env.NAV_CACHE_SECONDS, DEFAULTS.NAV_CACHE_SECONDS),
    NAV_MAX_FILES: num(env.NAV_MAX_FILES, DEFAULTS.NAV_MAX_FILES),
  };
}

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(obj, origin, maxAge) {
  const headers = cors(origin);
  headers['Content-Type'] = 'application/json; charset=utf-8';
  headers['Cache-Control'] = 'public, max-age=' + (maxAge || 30);
  return new Response(JSON.stringify(obj), { status: 200, headers: headers });
}

// --- Historical CSV (Option A) + daily accumulator (Option B) ---

const CSV_HEADER = 'PRODUCT,APPLICATION,REDEMPTION,EFFECTIVE DATE,NAV PRICE';

function kvKey(code) { return 'nav-csv-' + code; }

function productName(code) {
  const MAP = { A0ZFGF: 'ZILLER GLOBAL FUND' };
  return MAP[code] || code;
}

// Build the WP-format CSV from a history array ([{date, entry, exit, nav}], newest first).
function toCsv(code, history) {
  const name = productName(code);
  const body = (history || []).map(function (h) {
    return [name, h.entry, h.exit, h.date, h.nav].join(',');
  }).join('\n');
  return CSV_HEADER + '\n' + body + (body ? '\n' : '');
}

function csvResponse(csv, origin, maxAge) {
  const h = cors(origin);
  h['Content-Type'] = 'text/csv; charset=utf-8';
  h['Content-Disposition'] = 'attachment; filename="NAV-history.csv"';
  h['Cache-Control'] = 'public, max-age=' + (maxAge || 300);
  return new Response(csv, { status: 200, headers: h });
}

// Parse our display dates ("24-Jun-2026") back to a sortable timestamp.
function parseDisplayDate(s) {
  const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const m = String(s == null ? '' : s).trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!m) return NaN;
  const mon = MON[m[2].toLowerCase()];
  if (mon == null) return NaN;
  return Date.UTC(parseInt(m[3], 10), mon, parseInt(m[1], 10));
}

function countRows(csv) {
  return String(csv || '').split(/\r?\n/).filter(function (l) { return l.trim(); }).length - 1;
}

// Merge recent feed rows into the existing accumulated CSV (dedupe by date, newest first).
function mergeCsv(code, existingCsv, recentHistory) {
  const rows = [], seen = {};
  const lines = String(existingCsv || '').split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split(',');
    if (cols.length < 5) continue;
    const d = cols[3].trim();
    const ts = parseDisplayDate(d);
    if (Number.isNaN(ts) || seen[d]) continue;
    seen[d] = true;
    rows.push({ ts: ts, line: lines[i] });
  }
  const name = productName(code);
  (recentHistory || []).forEach(function (h) {
    if (!h.date || seen[h.date]) return;
    const ts = parseDisplayDate(h.date);
    if (Number.isNaN(ts)) return;
    seen[h.date] = true;
    rows.push({ ts: ts, line: [name, h.entry, h.exit, h.date, h.nav].join(',') });
  });
  rows.sort(function (a, b) { return b.ts - a.ts; });
  return CSV_HEADER + '\n' + rows.map(function (r) { return r.line; }).join('\n') + (rows.length ? '\n' : '');
}

// Daily job: seed the KV CSV once (from the existing WordPress file so all history is
// preserved), then append new days from the Perennial feed. No-op until NAV_KV is bound.
export async function runAccumulator(env) {
  if (!env.NAV_KV) return 'no NAV_KV binding — skipped';
  const base = (env.PERENNIAL_FEED_BASE || '').trim();
  if (!base) return 'no PERENNIAL_FEED_BASE — skipped';
  const cfg = config(env);
  const code = (env.NAV_CODE || 'A0ZFGF').trim();
  const key = kvKey(code);

  let existing = null;
  try { existing = await env.NAV_KV.get(key); } catch (_) {}

  if (!existing) {
    // One-time seed from the existing WordPress full-history file.
    try {
      const r = await fetch('https://www.zillerfm.com/wp-content/plugins/unitprices/' + code + '.csv');
      if (r.ok) existing = await r.text();
    } catch (_) {}
    if (!existing || countRows(existing) < 1) { // fallback: a window from the feed
      const built = await buildNav(code, base, cfg);
      existing = toCsv(code, built.history);
    }
    await env.NAV_KV.put(key, existing);
    return 'seeded (' + countRows(existing) + ' rows)';
  }

  const built = await buildNav(code, base, cfg);
  const merged = mergeCsv(code, existing, built.history);
  await env.NAV_KV.put(key, merged);
  return 'merged (' + countRows(merged) + ' rows)';
}
