import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/flow/**/*.test.tsx'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    css: false,
  },
  esbuild: { jsx: 'automatic', jsxImportSource: 'preact' },
});
