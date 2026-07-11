import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/cart-pricing.ts',
        'src/discount-checkout.ts',
        'src/guardian-tier.ts',
        'src/loyalty-checkout.ts',
        'src/subscription-status.ts',
      ],
      thresholds: {
        lines: 75,
        functions: 80,
        statements: 75,
      },
    },
  },
});
