/**
 * Cloudflare Worker — proxy Staffora API through staffora.info
 * Deploy: Cloudflare Dashboard → Workers → Create → paste this
 * Route: staffora.info/api/* and staffora.info/auth/*
 * Origin: https://staffora.apps.bot-hosting.cloud
 *
 * This avoids antivirus URL-blacklists on free bot-hosting domains.
 */
const ORIGIN = 'https://staffora.apps.bot-hosting.cloud';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api') && !url.pathname.startsWith('/auth')) {
      return fetch(request);
    }
    const target = ORIGIN + url.pathname + url.search;
    const headers = new Headers(request.headers);
    headers.set('Host', new URL(ORIGIN).host);
    headers.delete('cf-connecting-ip');
    const init = {
      method: request.method,
      headers,
      redirect: 'manual',
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.arrayBuffer();
    }
    const res = await fetch(target, init);
    // Rewrite Location redirects to stay on staffora.info when possible
    const outHeaders = new Headers(res.headers);
    const loc = outHeaders.get('Location');
    if (loc && loc.includes('bot-hosting.cloud')) {
      try {
        const u = new URL(loc);
        if (u.pathname.startsWith('/auth') || u.pathname.startsWith('/api')) {
          outHeaders.set('Location', url.origin + u.pathname + u.search);
        }
      } catch (_) {}
    }
    outHeaders.set('Access-Control-Allow-Origin', url.origin);
    outHeaders.set('Access-Control-Allow-Credentials', 'true');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: outHeaders });
  },
};
