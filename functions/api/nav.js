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
 * SOURCE-CSV COLUMN MAP — ported from the old plugin's loadcsvFile().
 *   >>> VALIDATE against a real feed file before go-live (see _private runbook): <<<
 *   col[1] = fund code   col[2] = effective date
 *   col[11] = NAV         col[12] = exit/redemption   col[13] = entry/application
 * Filenames are assumed to embed a date (the old code read DD.MM.YYYY from the
 * 4th dash-separated chunk); fileDate() also has generic date fallbacks.
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

  try {
    if (!base) throw new Error('PERENNIAL_FEED_BASE not configured.');
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
  const history = records.slice(0, cfg.NAV_HISTORY_LIMIT).map(function (r) { return { date: r.date, nav: r.nav }; });
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

function parseRowDate(s) {
  s = String(s == null ? '' : s).trim();
  if (!s) return { ts: NaN, display: '' };
  let ts = NaN, m;
  if ((m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/))) ts = Date.parse(m[3] + '-' + pad(m[2]) + '-' + pad(m[1]) + 'T00:00:00Z');
  else if ((m = s.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/))) ts = Date.parse(m[1] + '-' + pad(m[2]) + '-' + pad(m[3]) + 'T00:00:00Z');
  else { ts = Date.parse(s); if (Number.isNaN(ts)) ts = Date.parse(s.replace(/-/g, ' ')); }
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
