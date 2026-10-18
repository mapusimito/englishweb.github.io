// @ts-check
import { defineConfig } from 'astro/config';
import { site } from './src/config/site.ts';

// En Vercel, la URL canónica sigue al dominio de producción del proyecto
// (si se añade un dominio propio, se usa automáticamente).
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export default defineConfig({
  site: vercelHost ? `https://${vercelHost}` : site.url,
  base: site.base,
  trailingSlash: 'ignore',
});
