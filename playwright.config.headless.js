import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const STORAGE_STATE_PATH = 'tests/e2e/.auth/user.json';
const STORAGE_STATE = existsSync(STORAGE_STATE_PATH) ? STORAGE_STATE_PATH : undefined;

export default defineConfig({
  testDir: './tests/e2e',
  // Maximum time one test can run for
  timeout: 60 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        storageState: STORAGE_STATE,
      },
    },
  ],

  webServer: {
    command: `VITE_API_BASE_URL=${API_BASE_URL} VITE_PROXY_TARGET=${API_BASE_URL} npm run dev`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
