/**
 * Cloudflare Pages Function — GET /api/inav?code=ZILR
 * ----------------------------------------------------------------------------
 * Live indicative NAV (iNAV) for the Ziller Global Fund Active ETF.
 * Replicates the old WordPress `IceApiClient`: authenticates to ICE Data
 * Services, fetches the intraday quote, returns clean JSON { code, price, asOf }.
 *
 * Required SECRETS (Cloudflare Pages -> Settings -> Environment variables, encrypted):
 *   ICE_USERNAME, ICE_PASSWORD
 * Optional vars (wrangler.toml [vars], all strings):
 *   ICE_BASE_URL              (default https://inav.ice.com)
 *   ICE_TOKEN_CACHE_SECONDS   (default 7200 = 2h, matches the old plugin transient)
 *   INAV_CACHE_SECONDS        (default 60, matches the old plugin)
 *   ALLOW_ORIGIN              (default *)
 *
 * Response: { code, price: "4.5688"|null, asOf: "As at hh:mm:ss AM dd/mm/yyyy"|null, error? }
 * NOTE: `price` has NO leading "$" — the page adds it.
 */

const DEFAULTS = {
  ICE_BASE_URL: 'https://inav.ice.com',
  ICE_TOKEN_CACHE_SECONDS: 7200,
  INAV_CACHE_SECONDS: 60,
  ALLOW_ORIGIN: '*',
};

export async function onRequestGet(context) {
  const { request, env } = context;
  const cfg = config(env);
  const origin = env.ALLOW_ORIGIN || DEFAULTS.ALLOW_ORIGIN;
  const url = new URL(request.url);
  const code = (url.searchParams.get('code') || 'ZILR').trim();

  // TEMP diagnostic: ?debug=1 reveals only the LENGTHS of the stored secrets
  // (never their values) to catch a mis-paste. Removed once iNAV is confirmed.
  if (url.searchParams.get('debug') === '1') {
    return json({
      ICE_USERNAME_len: (env.ICE_USERNAME || '').length,
      ICE_PASSWORD_len: (env.ICE_PASSWORD || '').length,
      ICE_BASE_URL: cfg.ICE_BASE_URL,
    }, origin, 5);
  }

  try {
    if (!env.ICE_USERNAME || !env.ICE_PASSWORD) {
      throw new Error('ICE credentials not configured (set ICE_USERNAME / ICE_PASSWORD).');
    }
    const quote = await getQuote(code, env, cfg);
    const etf = quote && quote.quote && quote.quote.etf;
    if (!etf || !etf.length || etf[0].inav == null) {
      return json({ code: code, price: null, asOf: null, error: 'iNAV unavailable' }, origin, 30);
    }
    return json({ code: code, price: String(etf[0].inav), asOf: asAtSydney() }, origin, cfg.INAV_CACHE_SECONDS);
  } catch (err) {
    return json({ code: code, price: null, asOf: null, error: msg(err) }, origin, 15);
  }
}

export function onRequestOptions(context) {
  return new Response(null, { headers: cors(context.env.ALLOW_ORIGIN || DEFAULTS.ALLOW_ORIGIN) });
}

// --- ICE Data Services client (token cached ~2h, quote cached ~60s) ---

async function getToken(env, cfg) {
  const cache = caches.default;
  const key = new Request('https://inav-cache.internal/ice-token');
  try {
    const hit = await cache.match(key);
    if (hit) { const t = await hit.text(); if (t) return t; }
  } catch (_) {}

  const res = await fetch(cfg.ICE_BASE_URL + '/api/1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: env.ICE_USERNAME, password: env.ICE_PASSWORD }),
  });
  const bodyText = await res.text();
  let data = {};
  try { data = JSON.parse(bodyText); } catch (_) {}
  if (!data || !data.token) {
    throw new Error('ICE token request failed (HTTP ' + res.status + '): ' + bodyText.slice(0, 300));
  }

  try {
    await cache.put(key, new Response(data.token, {
      headers: { 'Cache-Control': 'max-age=' + cfg.ICE_TOKEN_CACHE_SECONDS },
    }));
  } catch (_) {}
  return data.token;
}

async function getQuote(code, env, cfg) {
  const cache = caches.default;
  const key = new Request('https://inav-cache.internal/ice-quote-' + encodeURIComponent(code));
  try {
    const hit = await cache.match(key);
    if (hit) { const j = await hit.json(); if (j) return j; }
  } catch (_) {}

  const token = await getToken(env, cfg);
  const res = await fetch(cfg.ICE_BASE_URL + '/api/1/pricing/quotes?t=' + encodeURIComponent(code), {
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
  });
  const data = await res.json().catch(function () { return {}; });
  try {
    await cache.put(key, new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=' + cfg.INAV_CACHE_SECONDS },
    }));
  } catch (_) {}
  return data;
}

// --- helpers ---

function config(env) {
  return {
    ICE_BASE_URL: (env.ICE_BASE_URL || DEFAULTS.ICE_BASE_URL).replace(/\/+$/, ''),
    ICE_TOKEN_CACHE_SECONDS: num(env.ICE_TOKEN_CACHE_SECONDS, DEFAULTS.ICE_TOKEN_CACHE_SECONDS),
    INAV_CACHE_SECONDS: num(env.INAV_CACHE_SECONDS, DEFAULTS.INAV_CACHE_SECONDS),
  };
}

function num(v, d) { const n = Number(v); return (v == null || v === '' || Number.isNaN(n)) ? d : n; }
function msg(e) { return String((e && e.message) || e); }

// Matches the old plugin's "As at h:i:s A d/m/Y" in Australia/Sydney time.
function asAtSydney() {
  const fmt = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney', hour12: true,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = {};
  fmt.formatToParts(new Date()).forEach(function (part) { p[part.type] = part.value; });
  return 'As at ' + p.hour + ':' + p.minute + ':' + p.second + ' ' +
    String(p.dayPeriod || '').toUpperCase() + ' ' + p.day + '/' + p.month + '/' + p.year;
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
