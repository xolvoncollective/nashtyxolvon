import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
    baseURL: 'http://localhost:3099',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
