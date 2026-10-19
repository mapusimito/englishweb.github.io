import { defineConfig } from '@playwright/test';

// Pruebas de navegador sobre la web ya compilada (npm run build && npm run test:e2e).
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4350' },
  webServer: {
    command: 'npx serve dist -l 4350',
    url: 'http://localhost:4350',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    { name: 'escritorio', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'movil', use: { viewport: { width: 375, height: 700 }, hasTouch: true } },
  ],
});
