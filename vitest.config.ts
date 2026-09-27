import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // M5: api-server tests are pure Node — they build Fastify and never need DOM
    environmentMatchGlobs: [['**/api-server*.test.ts', 'node']],
    setupFiles: ['./tests/setup.ts'],
  },
});
