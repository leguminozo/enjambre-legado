import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/components/pos/cart-math.ts', 'src/lib/format.ts'],
      // sale-qr vive en @enjambre/sale-qr (coverage allí)
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
});