import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/client.ts'],
      thresholds: {
        lines: 25,
        functions: 15,
        statements: 25,
      },
    },
  },
});
