/**
 * Cloudflare Worker — POST /api/mpi-upload?code=A0ZFGF&filename=<name>.pdf
 * ----------------------------------------------------------------------------
 * Receives the daily MPI PDF from the source (a scheduled task on the Windows box
 * that builds it) and stores it in KV, so /api/mpi serves it with NO WordPress.
 *
 * Auth:    Authorization: Bearer <MPI_UPLOAD_TOKEN>   (or ?token=...)
 * Body:    the raw PDF bytes (Content-Type application/pdf)
 * Needs:   NAV_KV binding + MPI_UPLOAD_TOKEN secret.
 * Stores:  KV "mpi-<code>-pdf" (bytes) + "mpi-<code>-meta" ({date, filename, uploadedAt}).
 */

const ALLOW_ORIGIN_DEFAULT = '*';
const MAX_BYTES = 24 * 1024 * 1024;

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = env.ALLOW_ORIGIN || ALLOW_ORIGIN_DEFAULT;
  const url = new URL(request.url);
  const code = (url.searchParams.get('code') || 'A0ZFGF').trim();

  const provided = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
    || (url.searchParams.get('token') || '').trim();
  if (!env.MPI_UPLOAD_TOKEN) return resp({ error: 'MPI_UPLOAD_TOKEN not configured' }, 500, origin);
  if (provided !== env.MPI_UPLOAD_TOKEN) return resp({ error: 'unauthorized' }, 401, origin);
  if (!env.NAV_KV) return resp({ error: 'NAV_KV not bound' }, 500, origin);

  const buf = await request.arrayBuffer();
  if (!buf || buf.byteLength < 100) return resp({ error: 'empty or too-small body' }, 400, origin);
  if (buf.byteLength > MAX_BYTES) return resp({ error: 'file too large' }, 413, origin);

  const filename = (url.searchParams.get('filename') || (code + '_MPI.pdf')).trim();
  const date = dateLabel(url.searchParams.get('date') || filename);

  await env.NAV_KV.put('mpi-' + code + '-pdf', buf);
  await env.NAV_KV.put('mpi-' + code + '-meta', JSON.stringify({
    date: date, filename: filename, uploadedAt: nowSydney(), bytes: buf.byteLength,
  }));

  return resp({ ok: true, code: code, date: date, bytes: buf.byteLength }, 200, origin);
}

export function onRequestOptions(context) {
  const origin = (context.env && context.env.ALLOW_ORIGIN) || ALLOW_ORIGIN_DEFAULT;
  return new Response(null, { headers: cors(origin) });
}

// "DD Mon YYYY" from a date param (DD.MM.YYYY / YYYY-MM-DD) or a filename whose
// leading digits are YYYYMMDD (or the older YYYYMDD).
function dateLabel(s) {
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  s = String(s == null ? '' : s).trim();
  let y, m, d, mt;
  if ((mt = s.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/))) { d = +mt[1]; m = +mt[2]; y = +mt[3]; }
  else if ((mt = s.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/))) { y = +mt[1]; m = +mt[2]; d = +mt[3]; }
  else if ((mt = s.match(/(\d{4})(\d{2})(\d{2})/))) { y = +mt[1]; m = +mt[2]; d = +mt[3]; }
  else if ((mt = s.match(/(\d{4})(\d)(\d{2})/))) { y = +mt[1]; m = +mt[2]; d = +mt[3]; }
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return '';
  return d + ' ' + MON[m - 1] + ' ' + y;
}

function nowSydney() {
  try {
    const f = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
    const p = {};
    f.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return p.year + '-' + p.month + '-' + p.day + ' ' + p.hour + ':' + p.minute;
  } catch (_) { return ''; }
}

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Vary': 'Origin',
  };
}

function resp(obj, status, origin) {
  const h = cors(origin);
  h['Content-Type'] = 'application/json; charset=utf-8';
  return new Response(JSON.stringify(obj), { status: status || 200, headers: h });
}
