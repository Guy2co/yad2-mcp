import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Vitest only instruments files a test imports unless `include` is explicit.
      // Without this, a brand-new untested module lowers coverage by nothing at all.
      include: ['src/**/*.ts'],
      // index.ts is the MCP server bootstrap — exercised by the e2e suite, which runs
      // separately against dist/ and so cannot contribute to these numbers.
      exclude: ['src/__tests__/**', 'src/index.ts'],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
    exclude: ['**/node_modules/**', '**/dist/**'],
    // Runs the `*.test-d.ts` expect-type assertions. Without this they are
    // inert at runtime and only enforced incidentally by `tsc`.
    typecheck: { enabled: true },
  },
  resolve: {
    alias: {
      '../yad2-client.js': '../yad2-client.ts',
      '../formatters.js': '../formatters.ts',
      '../types.js': '../types.ts',
    },
  },
});
