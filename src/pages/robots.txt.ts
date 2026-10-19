import type { APIRoute } from 'astro';
import { withBase } from '../config/paths';

export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? '';
  const body = `User-agent: *
Allow: /

Sitemap: ${new URL(withBase('sitemap.xml'), origin).href}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
