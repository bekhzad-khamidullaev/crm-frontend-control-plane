import { expect } from '@playwright/test';

/**
 * Shared login helper for E2E tests.
 * Handles rate limits, stale sessions, and supports credentials via env vars.
 * @param {import('@playwright/test').Page} page
 */
export async function login(page) {
  const username = process.env.E2E_USERNAME || 'admin';
  const password = process.env.E2E_PASSWORD || 't3sl@admin';
  const tokenEndpoints = [
    '/api/token/',
    'http://127.0.0.1:8080/api/token/',
  ];

  // API-first auth: use backend tied to current app/proxy first, then local fallback.
  for (const tokenUrl of tokenEndpoints) {
    const tokenResponse = await page.request
      .post(tokenUrl, { data: { username, password } })
      .catch(() => null);

    if (!tokenResponse || !tokenResponse.ok()) {
      continue;
    }

    const payload = await tokenResponse.json();
    if (!payload?.access) {
      continue;
    }

    await page.goto('/#/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ access, refresh }) => {
      sessionStorage.setItem('crm_access_token', access);
      localStorage.setItem('crm_access_token', access);
      if (refresh) {
        sessionStorage.setItem('crm_refresh_token', refresh);
        localStorage.setItem('crm_refresh_token', refresh);
      }
      const roles = JSON.stringify(['admin']);
      sessionStorage.setItem('enterprise_crm_roles', roles);
      localStorage.setItem('enterprise_crm_roles', roles);
    }, payload);

    await page.goto('/#/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/#\/dashboard/, { timeout: 30000 });
    return;
  }

  await page.goto('/#/dashboard', { waitUntil: 'domcontentloaded' });

  const passwordVisible = await page
    .locator('input[type="password"]')
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  const isLoginScreen = page.url().includes('/#/login') || passwordVisible;

  if (!isLoginScreen) {
    await expect(page).toHaveURL(/#\/dashboard/, { timeout: 30000 });
    return;
  }

  await page.waitForSelector('input[type="password"]', { timeout: 15000 });

  const usernameInput = page.locator('#login_username, input[name="username"], input[placeholder="admin"]').first();
  const passwordInput = page.locator('#login_password, input[type="password"]').first();
  await usernameInput.fill(username);
  await passwordInput.fill(password);

  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/token/') &&
          response.request().method() === 'POST',
        { timeout: 20000 }
      );

      await page.click('button[type="submit"]:has-text("Войти")');
      const response = await responsePromise;

      if (response.status() >= 200 && response.status() < 300) {
        await expect(page).toHaveURL(/#\/dashboard/, { timeout: 30000 });
        return;
      }

      if (response.status() === 429) {
        console.warn(`Login rate limited (Attempt ${attempt}/${maxAttempts}). Waiting ${attempt * 5}s...`);
        await page.waitForTimeout(attempt * 5000);
        continue;
      }

      const body = await response.text().catch(() => '');
      throw new Error(`Login failed with status ${response.status()}: ${body.slice(0, 250)}`);
    } catch (error) {
      console.warn(`Login attempt ${attempt} warning: ${error.message}`);
      if (attempt === maxAttempts) {
        throw new Error(`Login failed after ${maxAttempts} attempts: ${error.message}`);
      }
      await page.waitForTimeout(attempt * 2000);
    }
  }

  throw new Error(`Login failed after ${maxAttempts} attempts.`);
}
