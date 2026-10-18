// @ts-check
import { defineConfig } from 'astro/config';
import { site } from './src/config/site.ts';

// En Vercel la web se sirve en la raíz del dominio; en GitHub Pages, en /englishweb.github.io/.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const onVercel = Boolean(process.env.VERCEL);

export default defineConfig({
  site: onVercel && vercelHost ? `https://${vercelHost}` : site.url,
  base: onVercel ? '/' : site.base,
  trailingSlash: 'ignore',
});
