import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/shipping-rates.ts', 'src/couriers.ts'],
      thresholds: {
        lines: 65,
        functions: 50,
        statements: 65,
      },
    },
  },
});
