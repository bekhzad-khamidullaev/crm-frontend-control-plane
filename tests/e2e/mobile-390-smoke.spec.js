import { expect, test } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.describe('Mobile 390 Smoke', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    const username = process.env.E2E_USERNAME || 'admin';
    const password = process.env.E2E_PASSWORD || 't3sl@admin';

    await page.goto('/#/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/#/login', { waitUntil: 'domcontentloaded' });

    const loginButton = page.locator('button[type="submit"], button:has-text("Войти")').first();
    const canSeeLogin = await loginButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (canSeeLogin) {
      await page.locator('#login_username, input[name="username"], input[placeholder="admin"]').first().fill(username);
      await page.locator('#login_password, input[type="password"]').first().fill(password);
      await loginButton.click();
    }

    await expect(page).toHaveURL(/#\/dashboard/, { timeout: 30000 });
  });

  test('covers drawer, key lists, dashboard cards, create flow and integrations settings', async ({
    page,
  }) => {
    await expect(page).toHaveURL(/#\/dashboard/, { timeout: 30000 });
    await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();

    const mobileMenuToggle = page.locator('.ant-layout-header button').first();
    await expect(mobileMenuToggle).toBeVisible();
    await mobileMenuToggle.click();

    const mobileDrawer = page.locator('.ant-drawer-content').first();
    const drawerMask = page.locator('.ant-drawer-mask').first();
    await expect(mobileDrawer).toBeVisible();
    await expect(drawerMask).toBeVisible();
    const viewport = page.viewportSize() || MOBILE_VIEWPORT;
    await page.mouse.click(Math.max(viewport.width - 10, 10), 80);
    await expect(mobileDrawer).toBeHidden();

    const listRoutes = ['/leads', '/contacts', '/deals', '/tasks'];
    for (const route of listRoutes) {
      await page.goto(`/#${route}`);
      await expect(page).toHaveURL(new RegExp(`#${route}(\\?|/|$)`), { timeout: 10000 });
      await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();
      const hasListContent = (await page.locator('.ant-table, .ant-card, .ant-list').count()) > 0;
      expect(hasListContent).toBeTruthy();
    }

    await page.goto('/#/dashboard');
    await expect(page.locator('[data-widget-key], .ant-statistic').first()).toBeVisible();

    await page.goto('/#/leads');
    const createButtonCandidates = [
      'button:has-text("Создать")',
      'button:has-text("Новый")',
      'button:has-text("Create")',
      'button:has-text("Add")',
    ];

    let createClicked = false;
    for (const selector of createButtonCandidates) {
      const button = page.locator(selector).first();
      const isVisible = await button.isVisible({ timeout: 800 }).catch(() => false);
      if (!isVisible) continue;
      await button.click();
      createClicked = true;
      break;
    }

    if (!createClicked) {
      await page.goto('/#/leads/new');
    } else {
      await page.waitForTimeout(700);
    }

    const createRouteMatched = /#\/(leads|contacts|deals|tasks)\/(new|create|\d+\/edit)/.test(
      page.url()
    );
    const createFormVisible = await page
      .locator('form, .ant-form, .ant-drawer .ant-form, .ant-modal .ant-form')
      .first()
      .isVisible()
      .catch(() => false);
    expect(createRouteMatched || createFormVisible).toBeTruthy();

    await page.goto('/#/integrations');
    await expect(page).toHaveURL(/#\/integrations/, { timeout: 10000 });
    await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();
    await expect(page.getByText(/Интеграц|Integrations|Настройки/i).first()).toBeVisible();
  });
});
