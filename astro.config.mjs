// @ts-check
import { defineConfig } from 'astro/config';
import { site } from './src/config/site.ts';

export default defineConfig({
  site: site.url,
  base: site.base,
  trailingSlash: 'ignore',
});
