import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts']
  },
  resolve: {
    alias: {
      '$app/environment': fileURLToPath(new URL('./tests/stubs/app-environment.ts', import.meta.url))
    }
  }
});
