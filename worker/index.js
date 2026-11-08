import { pageSlug } from '../src/lib/wiki.js';

// Cloudflare runs this only for requests that no static file or _redirects rule answered. A page asked for in another
// spelling (/About_Kenshi, /about_kenshi.html) is sent to its lowercase-hyphen path when that path exists; anything
// else stays a plain 404.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const canonical = canonicalPath(url.pathname);
    if (canonical && canonical !== url.pathname && await exists(env, new URL(canonical, url))) {
      return Response.redirect(new URL(canonical + url.search, url).href, 301);
    }

    return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  },
};

export function canonicalPath(pathname) {
  let path;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const slug = pageSlug(path.replace(/\.html$/i, ''));
  return slug ? `/${slug}` : null;
}

// A page, or a _redirects rule that leads to one.
async function exists(env, url) {
  const response = await env.ASSETS.fetch(new Request(url, { method: 'HEAD', redirect: 'manual' }));
  return response.status < 400;
}
