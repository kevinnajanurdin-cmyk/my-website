/**
 * Cloudflare Workers (Static Assets) entry for the Ziller site.
 * ----------------------------------------------------------------------------
 * Static files are served automatically from the assets directory (see the
 * [assets] block in wrangler.toml). This Worker only handles the dynamic API
 * routes. The handler logic lives in functions/api/*.js — those files are also
 * valid Cloudflare *Pages* Functions, so the code stays portable between the two
 * hosting models.
 *
 * Routing: assets are matched first; any request that is NOT a static file
 * (e.g. /api/inav, /api/nav) is sent here.
 */
import * as inav from './functions/api/inav.js';
import * as nav from './functions/api/nav.js';
import * as mpi from './functions/api/mpi.js';
import * as mpiUpload from './functions/api/mpi-upload.js';

export default {
  async fetch(request, env, ctx) {
    const pathname = new URL(request.url).pathname;
    // Pages Functions expect a context object; we only use request + env.
    const context = { request: request, env: env, ctx: ctx };

    if (pathname === '/api/inav') {
      return request.method === 'OPTIONS' ? inav.onRequestOptions(context) : inav.onRequestGet(context);
    }
    if (pathname === '/api/nav') {
      return request.method === 'OPTIONS' ? nav.onRequestOptions(context) : nav.onRequestGet(context);
    }
    if (pathname === '/api/mpi') {
      return request.method === 'OPTIONS' ? mpi.onRequestOptions(context) : mpi.onRequestGet(context);
    }
    if (pathname === '/api/mpi-upload') {
      if (request.method === 'OPTIONS') return mpiUpload.onRequestOptions(context);
      if (request.method === 'POST') return mpiUpload.onRequestPost(context);
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Anything else: serve a static asset (also returns the 404 page for unknown paths).
    return env.ASSETS.fetch(request);
  },

  // Daily NAV-history accumulator (Option B). Fires on the cron in wrangler.toml;
  // no-op until the NAV_KV namespace is bound.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(nav.runAccumulator(env));
  },
};
