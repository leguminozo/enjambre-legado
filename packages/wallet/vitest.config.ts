import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/qr-token.ts', 'src/stamp-progress.ts'],
      thresholds: {
        lines: 80,
        functions: 90,
        statements: 75,
      },
    },
  },
});
