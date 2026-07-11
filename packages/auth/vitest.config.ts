import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/role-redirect.ts',
        'src/internal-api-secret.ts',
        'src/notification-preferences.ts',
      ],
      thresholds: {
        lines: 50,
        functions: 40,
        statements: 50,
      },
    },
  },
});
