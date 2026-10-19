import type { APIRoute } from 'astro';
import { withBase } from '../config/paths';

/**
 * Mapa del sitio. Solo la portada: privacidad y aviso legal llevan noindex.
 * La URL base sigue al dominio de producción (astro.config.mjs → site).
 */
export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? '';
  const urls = [new URL(withBase(), origin).href];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${loc}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
