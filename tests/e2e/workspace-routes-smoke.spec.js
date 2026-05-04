import { expect, test } from '@playwright/test';
import { login } from './helpers/auth.js';

const WORKSPACE_ROUTES = [
  '/clients-workspace',
  '/warehouse',
  '/finance-planning',
  '/business-processes',
  '/meetings',
];

test.describe('Workspace routes smoke', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const path of WORKSPACE_ROUTES) {
    test(`loads ${path}`, async ({ page }) => {
      await page.goto(`/#${path}`);
      await expect.poll(() => page.url(), { timeout: 15000 }).toMatch(new RegExp(`#${path}(/|$|\\?)`));
      await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();
    });
  }
});
