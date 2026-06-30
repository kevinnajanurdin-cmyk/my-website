/**
 * Cloudflare Pages/Workers Function — GET /api/mpi?code=A0ZFGF
 * ----------------------------------------------------------------------------
 * Finds the latest Material Portfolio Information PDF in the (token-protected)
 * publishing directory and points at it — mirroring the old WordPress
 * "PDF Downloader" plugin, which served the newest PDF in that folder.
 *
 * Default: 302-redirect to the latest PDF (so a plain <a href="/api/mpi"> works).
 * ?json=1: returns { code, url, date } instead (so the page can show the date).
 *
 * Required SECRET (Cloudflare -> Settings -> Variables and Secrets, encrypted):
 *   MPI_FEED_BASE = https://www.zillerfm.com/<token>/   (dir of YYYYMMDD-<code>_MPI.pdf)
 * Optional var: MPI_CACHE_SECONDS (default 1800), ALLOW_ORIGIN (default *).
 */

const DEFAULTS = { ALLOW_ORIGIN: '*', MPI_CACHE_SECONDS: 1800 };

export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = env.ALLOW_ORIGIN || DEFAULTS.ALLOW_ORIGIN;
  const maxAge = num(env.MPI_CACHE_SECONDS, DEFAULTS.MPI_CACHE_SECONDS);
  const url = new URL(request.url);
  const code = (url.searchParams.get('code') || 'A0ZFGF').trim();
  const base = (env.MPI_FEED_BASE || '').trim();
  const wantJson = url.searchParams.get('json') === '1';

  try {
    // Prefer the self-hosted PDF in KV (uploaded from source via /api/mpi-upload);
    // fall back to the WordPress publishing dir until the upload pipeline is switched.
    try {
      if (env.NAV_KV) {
        const meta = await env.NAV_KV.get('mpi-' + code + '-meta', 'json');
        if (meta) {
          if (wantJson) return json({ code: code, url: '/api/mpi?code=' + encodeURIComponent(code), date: meta.date }, origin, maxAge);
          const pdf = await env.NAV_KV.get('mpi-' + code + '-pdf', 'arrayBuffer');
          if (pdf) {
            const ph = cors(origin);
            ph['Content-Type'] = 'application/pdf';
            ph['Content-Disposition'] = 'inline; filename="' + (meta.filename || (code + '_MPI.pdf')) + '"';
            ph['Cache-Control'] = 'public, max-age=' + maxAge;
            return new Response(pdf, { status: 200, headers: ph });
          }
        }
      }
    } catch (_) { /* fall through to the WordPress dir */ }

    if (!base) throw new Error('MPI_FEED_BASE not configured.');
    const latest = await findLatest(code, base);
    if (!latest) throw new Error('No MPI PDF found for ' + code + '.');
    if (wantJson) return json({ code: code, url: latest.url, date: latest.date }, origin, maxAge);
    const headers = cors(origin);
    headers['Location'] = latest.url;
    headers['Cache-Control'] = 'public, max-age=' + maxAge;
    return new Response(null, { status: 302, headers: headers });
  } catch (err) {
    return json({ code: code, url: null, date: null, error: msg(err) }, origin, 30);
  }
}

export function onRequestOptions(context) {
  return new Response(null, { headers: cors(context.env.ALLOW_ORIGIN || DEFAULTS.ALLOW_ORIGIN) });
}

async function findLatest(code, base) {
  const baseUrl = base.charAt(base.length - 1) === '/' ? base : base + '/';
  const res = await fetch(baseUrl);
  if (!res.ok) throw new Error('MPI directory fetch failed (HTTP ' + res.status + ').');
  const html = await res.text();

  const suffix = ('-' + code + '_MPI.pdf').toLowerCase();
  const re = /href\s*=\s*["']([^"']+\.pdf)["']/gi;
  let m, best = null;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    const name = (href.split('?')[0].split('#')[0].split('/').pop() || href);
    if (name.toLowerCase().indexOf(suffix) === -1) continue;
    const ts = mpiDate(name);
    if (Number.isNaN(ts)) continue;
    if (!best || ts > best.ts) best = { ts: ts, url: new URL(href, baseUrl).href };
  }
  return best ? { url: best.url, date: fmtDate(best.ts) } : null;
}

// Filenames: YYYYMMDD-<code>_MPI.pdf. Some are malformed as YYYYMDD (1-digit month).
function mpiDate(name) {
  const digits = (name.split('-')[0] || '').replace(/\D/g, '');
  if (digits.length < 7) return NaN;
  const year = digits.slice(0, 4);
  const rest = digits.slice(4);
  let month, day;
  if (rest.length === 4) { month = rest.slice(0, 2); day = rest.slice(2, 4); }
  else if (rest.length === 3) { month = rest.slice(0, 1); day = rest.slice(1, 3); }
  else return NaN;
  return Date.parse(year + '-' + pad(month) + '-' + pad(day) + 'T00:00:00Z');
}

function fmtDate(ts) {
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(ts);
  return d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
}

function pad(v) { return String(v).length < 2 ? '0' + v : String(v); }
function num(v, d) { const n = Number(v); return (v == null || v === '' || Number.isNaN(n)) ? d : n; }
function msg(e) { return String((e && e.message) || e); }

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
