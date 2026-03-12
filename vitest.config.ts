import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
  resolve: {
    alias: {
      '../yad2-client.js': '../yad2-client.ts',
      '../formatters.js': '../formatters.ts',
      '../types.js': '../types.ts',
    },
  },
});
