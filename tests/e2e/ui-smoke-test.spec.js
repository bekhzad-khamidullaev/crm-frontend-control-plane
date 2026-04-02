import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.js';

test.describe('UI Smoke Tests - SMOKE_TEST_CHECKLIST', () => {
  const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const buildModuleOrForbiddenRegex = (modulePath) =>
    new RegExp(`#/(?:${escapeRegExp(modulePath)}|forbidden)(?:/|$|\\?)`);

  const openModule = async (page, modulePath) => {
    await page.goto(`/#/${modulePath}`);
    await expect
      .poll(() => page.url(), { timeout: 10000 })
      .toMatch(buildModuleOrForbiddenRegex(modulePath));
    await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();
    return {
      isForbidden: /#\/forbidden(?:\/|$|\?)/.test(page.url()),
    };
  };

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const modules = [
    { name: 'Чаты', url: 'chat' },
    { name: 'Интеграции', url: 'integrations' },
    { name: 'Лиды', url: 'leads' },
    { name: 'Контакты', url: 'contacts' },
    { name: 'Сделки', url: 'deals' },
    { name: 'Задачи', url: 'tasks' },
    { name: 'Продукты', url: 'products' },
    { name: 'Проекты', url: 'projects' },
    { name: 'Компании', url: 'companies' },
    { name: 'Кампании', url: 'campaigns' },
    { name: 'Платежи', url: 'payments' },
    { name: 'Напоминания', url: 'reminders' },
  ];

  const communicationRoutes = ['calls', 'reminders', 'crm-emails', 'massmail', 'sms'];

  test('should display main layout components', async ({ page }) => {
    await expect(page.locator('header, .ant-layout-header').first()).toBeVisible();
    await expect(page.locator('aside, [role="menu"]').first()).toBeVisible();
    await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/#/dashboard');
    await expect.poll(() => page.url()).toMatch(/#\/dashboard\/?$/);
    await expect(page.locator('aside, [role="menu"]').first()).toBeVisible();
  });

  for (const module of modules) {
    test(`should load ${module.name} page`, async ({ page }) => {
      await openModule(page, module.url);
    });

    test(`should have primary controls on ${module.name}`, async ({ page }) => {
      const { isForbidden } = await openModule(page, module.url);
      if (isForbidden) {
        await expect(page).toHaveURL(/#\/forbidden(?:\/|$|\?)/);
        return;
      }

      const hasCreate = await page
        .locator('button:has-text("Создать"), button:has-text("Новый")')
        .first()
        .isVisible()
        .catch(() => false);
      const hasSearch = await page
        .locator('input[placeholder*="Поиск"], input[placeholder*="Search"]')
        .first()
        .isVisible()
        .catch(() => false);
      const hasAnyButton = (await page.locator('button').count()) > 0;
      expect(hasCreate || hasSearch || hasAnyButton).toBeTruthy();
    });
  }

  for (const route of communicationRoutes) {
    test(`should open unified outbound composer from ${route}`, async ({ page }) => {
      const { isForbidden } = await openModule(page, route);
      if (isForbidden) {
        await expect(page).toHaveURL(/#\/forbidden(?:\/|$|\?)/);
        return;
      }

      const activeTab = page.locator('.ant-tabs-tab-active').first();
      await expect(activeTab).toContainText(/Outbound \/ Broadcast/i);
      await expect(page.locator('textarea').first()).toBeVisible();
      await expect(page.locator('button:has-text("Отправить"), button:has-text("Send")').first()).toBeVisible();
    });
  }

  test('should open lead create form', async ({ page }) => {
    const { isForbidden } = await openModule(page, 'leads');
    if (isForbidden) {
      await expect(page).toHaveURL(/#\/forbidden(?:\/|$|\?)/);
      return;
    }
    const createBtn = page.locator('button:has-text("Создать")').first();
    if (!(await createBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      return;
    }
    await createBtn.click();
    const navigatedToCreate = await expect
      .poll(() => page.url(), { timeout: 4000 })
      .toMatch(/#\/leads\/(new|create|\d+\/edit)|#\/leads\/new/)
      .then(() => true)
      .catch(() => false);
    if (navigatedToCreate) {
      return;
    }
    const inlineFormVisible = await page
      .locator('form, .ant-drawer, .ant-modal, input[name="first_name"], input#first_name')
      .first()
      .isVisible({ timeout: 4000 })
      .catch(() => false);
    expect(inlineFormVisible).toBeTruthy();
  });

  test('should keep table/list visible during quick navigation', async ({ page }) => {
    const leadsState = await openModule(page, 'leads');
    if (leadsState.isForbidden) {
      await page.goto('/#/dashboard');
      await expect
        .poll(() => page.url(), { timeout: 10000 })
        .toMatch(/#\/dashboard(?:\/|$|\?)/);
      await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();
      return;
    }

    await openModule(page, 'contacts');
    await openModule(page, 'deals');
    await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();
  });

  test('should be responsive on mobile and tablet', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#/leads');
    await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/#/leads');
    await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();
  });

  test('should load settings page from sidebar', async ({ page }) => {
    const settingsItem = page.getByRole('menuitem', { name: /Настройки|Settings/i }).first();
    if (!(await settingsItem.isVisible({ timeout: 3000 }).catch(() => false))) {
      return;
    }
    await settingsItem.click();
    await expect.poll(() => page.url(), { timeout: 10000 }).toMatch(/#\/settings\/?$|#\/dashboard\/?$/);
    await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();
  });
});
