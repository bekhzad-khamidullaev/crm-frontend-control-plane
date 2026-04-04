/**
 * Authentication setup for E2E tests
 * This file handles login and stores authentication state
 */

import { test as setup } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080';
const USERNAME = 'admin';
const PASSWORD = 't3sl@admin';

// NOTE: This setup is optional and should be run manually when tokens expire.
// Run: npx playwright test tests/e2e/auth.setup.js --config=playwright.config.headless.js
setup('authenticate', async ({ page, request }) => {
  // Request token directly from API to avoid UI flakiness/rate limits
  let tokenResponse = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    tokenResponse = await request.post(`${API_BASE_URL}/api/token/`, {
      data: { username: USERNAME, password: PASSWORD },
    });

    if (tokenResponse.ok()) {
      break;
    }

    if (tokenResponse.status() === 429) {
      const retryAfter = Number(tokenResponse.headers()['retry-after'] || 0);
      const waitMs = Math.max(10000, retryAfter * 1000 || 0) + attempt * 2000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    throw new Error(`Token request failed: HTTP ${tokenResponse.status()}`);
  }

  if (!tokenResponse || !tokenResponse.ok()) {
    throw new Error(`Token request failed after retries: HTTP ${tokenResponse?.status?.()}`);
  }

  const tokenData = await tokenResponse.json();
  const access = tokenData.access;
  const refresh = tokenData.refresh;

  if (!access) {
    throw new Error('Token response missing access token');
  }

  // Navigate to app origin and set localStorage tokens
  await page.goto(BASE_URL);
  await page.evaluate(
    ({ accessToken, refreshToken }) => {
      sessionStorage.setItem('crm_access_token', accessToken);
      localStorage.setItem('crm_access_token', accessToken);
      if (refreshToken) {
        sessionStorage.setItem('crm_refresh_token', refreshToken);
        localStorage.setItem('crm_refresh_token', refreshToken);
      }
      localStorage.setItem('enterprise_crm_locale', 'ru');
      localStorage.setItem('enterprise_crm-theme', 'light');
    },
    { accessToken: access, refreshToken: refresh }
  );

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
