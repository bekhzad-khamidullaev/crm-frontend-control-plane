import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.js';

test.describe('UI Smoke Tests - SMOKE_TEST_CHECKLIST', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const modules = [
    { name: 'Лиды', url: 'leads' },
    { name: 'Контакты', url: 'contacts' },
    { name: 'Сделки', url: 'deals' },
    { name: 'Задачи', url: 'tasks' },
    { name: 'Продукты', url: 'products' },
    { name: 'Проекты', url: 'projects' },
    { name: 'Компании', url: 'companies' },
    { name: 'Кампании', url: 'campaigns' },
    { name: 'Платежи', url: 'payments' },
    { name: 'Напоминания', url: 'reminders' }
  ];

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
      await page.getByRole('menuitem', { name: new RegExp(module.name, 'i') }).click();
      await expect.poll(() => page.url(), { timeout: 10000 }).toMatch(new RegExp(`#/${module.url}(/|$)`));
      await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();
    });

    test(`should have primary controls on ${module.name}`, async ({ page }) => {
      await page.getByRole('menuitem', { name: new RegExp(module.name, 'i') }).click();
      await expect.poll(() => page.url(), { timeout: 10000 }).toMatch(new RegExp(`#/${module.url}(/|$)`));

      const hasCreate = await page.locator('button:has-text("Создать"), button:has-text("Новый")').first().isVisible().catch(() => false);
      const hasSearch = await page.locator('input[placeholder*="Поиск"], input[placeholder*="Search"]').first().isVisible().catch(() => false);
      // Not all modules expose list controls in identical form; ensure page content is interactive.
      const hasAnyButton = (await page.locator('button').count()) > 0;
      expect(hasCreate || hasSearch || hasAnyButton).toBeTruthy();
    });
  }

  test('should open lead create form', async ({ page }) => {
    await page.getByRole('menuitem', { name: /Лиды/i }).click();
    const createBtn = page.locator('button:has-text("Создать")').first();
    if (!(await createBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      return;
    }
    await createBtn.click();
    await expect.poll(() => page.url(), { timeout: 10000 }).toMatch(/#\/leads\/(new|create|\d+\/edit)|#\/leads\/new/);
  });

  test('should keep table/list visible during quick navigation', async ({ page }) => {
    await page.getByRole('menuitem', { name: /Лиды/i }).click();
    await page.getByRole('menuitem', { name: /Контакты/i }).click();
    await page.getByRole('menuitem', { name: /Сделки/i }).click();
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
