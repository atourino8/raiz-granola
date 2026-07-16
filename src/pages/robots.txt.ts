import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  const origin = import.meta.env.PUBLIC_SITE_URL || new URL(request.url).origin;
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /cuenta',
    'Disallow: /api/',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
