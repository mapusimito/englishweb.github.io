// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import vercel from '@astrojs/vercel';
import { site } from './src/config/site.ts';

// En Vercel, la URL canónica sigue al dominio de producción del proyecto
// (si se añade un dominio propio, se usa automáticamente).
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export default defineConfig({
  site: vercelHost ? `https://${vercelHost}` : site.url,
  base: site.base,
  trailingSlash: 'ignore',
  // Preact solo se carga en el configurador de planes (isla interactiva).
  integrations: [preact()],
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
});
