import { defineConfig, devices } from '@playwright/test';

const PORT = 3002;
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E smoke de Campo (POS).
 * Sin login real: middleware público limitado vía E2E_SKIP_AUTH si se configura.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      E2E_SKIP_AUTH: process.env.E2E_SKIP_AUTH ?? '1',
    },
  },
});
