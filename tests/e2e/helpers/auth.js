import { expect } from '@playwright/test';

/**
 * Robust login helper with retry logic for handling rate limits (429) and network flakyiness.
 * @param {import('@playwright/test').Page} page
 */
export async function login(page) {
  // If already logged in and on dashboard, skip
  if (page.url().includes('/#/dashboard')) {
    return;
  }

  await page.goto('/#/login');

  // Check if we are unexpectedly redirected to dashboard (session reuse)
  try {
    await page.waitForSelector('#login_username', { state: 'visible', timeout: 5000 });
  } catch (e) {
    if (page.url().includes('/#/dashboard')) {
      return;
    }
  }

  // Fill credentials
  await page.fill('#login_username', 'admin');
  await page.fill('#login_password', 't3sl@admin');

  // Retry logic for login submission with aggressive backoff
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Setup listener before clicking
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/token/') &&
          response.request().method() === 'POST',
        { timeout: 10000 }
      );

      // Click login
      await page.click('button[type="submit"]:has-text("Войти")');

      const response = await responsePromise;

      if (response.status() >= 200 && response.status() < 300) {
        // Success
        await page.waitForURL('**/#/dashboard', { timeout: 30000 });
        await expect(page).toHaveURL(/.*\/#\/dashboard/);
        return;
      } else if (response.status() === 429) {
        // Rate limited - use aggressive backoff: 5s, 10s, 15s, 20s, 25s
        console.warn(`Login rate limited (Attempt ${attempt}/${maxAttempts}). Waiting ${attempt * 5}s...`);
        await page.waitForTimeout(attempt * 5000);
        continue; // Try again
      } else {
        // Other error
        console.error(`Login failed with status ${response.status()}`);
        // Can't easily recover from 401 without changing creds, but maybe temporary server error
      }
    } catch (error) {
      // Network error or timeout
      console.warn(`Login attempt ${attempt} warning: ${error.message}`);
      if (attempt === maxAttempts) {
        throw new Error(`Login failed after ${maxAttempts} attempts: ${error.message}`);
      }
      await page.waitForTimeout(attempt * 2000);
    }
  }

  throw new Error(`Login failed after ${maxAttempts} attempts due to persistent rate limiting.`);
}
