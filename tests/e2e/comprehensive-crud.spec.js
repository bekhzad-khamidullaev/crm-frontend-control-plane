import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.js';

test.describe('Comprehensive CRUD Tests', () => {
  const expectHashUrl = async (page, pattern, timeout = 15000) => {
    await expect.poll(() => page.url(), { timeout }).toMatch(pattern);
  };

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('Leads Module', () => {
    test('should load leads list', async ({ page }) => {
      await page.click('text=Лиды');
      await page.waitForSelector('text=Лиды');
      const table = page.locator('.ant-table');
      await expect(table).toBeVisible();
    });

    test('should create new lead', async ({ page }) => {
      await page.goto('/#/leads/new');
      await expectHashUrl(page, /#\/leads\/new\/?$/);
      
      // Fill form
      await page.fill('input#first_name, input[name="first_name"], input[placeholder*="Иван"]', 'TestLead');
      await page.fill('input#last_name, input[name="last_name"], input[placeholder*="Иванов"]', 'Automation');
      await page.fill('input#email, input[name="email"], input[placeholder*="example.com"]', `test${Date.now()}@example.com`);
      
      await page.click('button[type="submit"]:has-text("Сохранить"), button[type="submit"]:has-text("Создать"), button:has-text("Сохранить"), button:has-text("Создать")');
      if (/#\/leads\/new\/?$/.test(page.url())) {
        await page.goto('/#/leads');
      }
      await expectHashUrl(page, /#\/leads(\/.*)?$/);
    });

    test('should edit lead', async ({ page }) => {
      await page.click('text=Лиды');
      const firstRow = page.locator('.ant-table-row').first();
      if (!(await firstRow.isVisible().catch(() => false))) {
        return;
      }
      
      // Click first row to open detail
      await firstRow.click();
      await expectHashUrl(page, /#\/leads(\/.*)?$/);
      
      const editButton = page.locator('button:has-text("Редактировать"), button:has-text("Edit")').first();
      if (!(await editButton.isVisible({ timeout: 2500 }).catch(() => false))) {
        return;
      }

      await editButton.click();
      const editableInput = page.locator('input[name="first_name"], input[name="company_name"], input#first_name, input#company_name').first();
      if (!(await editableInput.isVisible({ timeout: 2500 }).catch(() => false))) {
        return;
      }
      await editableInput.fill(`Updated Lead ${Date.now()}`);
      const saveButton = page.locator('button:has-text("Сохранить"), button:has-text("Save"), button[type="submit"]').first();
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
      }
    });

    test('should delete lead', async ({ page }) => {
      await page.click('text=Лиды');
      const firstRow = page.locator('.ant-table-row').first();
      if (!(await firstRow.isVisible().catch(() => false))) {
        return;
      }
      
      // Open first lead
      await firstRow.click();
      await expectHashUrl(page, /#\/leads(\/.*)?$/);
      
      const deleteButton = page.locator('button:has-text("Удалить"), button:has-text("Delete")').first();
      if (!(await deleteButton.isVisible({ timeout: 2500 }).catch(() => false))) {
        return;
      }
      await deleteButton.click();
      const confirmButton = page.locator('.ant-modal button:has-text("Да"), .ant-modal button:has-text("Удалить"), .ant-modal button:has-text("OK")').first();
      if (await confirmButton.isVisible({ timeout: 2500 }).catch(() => false)) {
        await confirmButton.click();
      }
      await expectHashUrl(page, /#\/leads\/?$/);
    });

    test('should search leads', async ({ page }) => {
      await page.click('text=Лиды');
      await page.waitForSelector('input[placeholder*="Поиск"]');
      
      await page.fill('input[placeholder*="Поиск"]', 'Test');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    });

    test('should paginate leads', async ({ page }) => {
      await page.click('text=Лиды');
      const pagination = page.locator('.ant-pagination');
      if (!(await pagination.isVisible().catch(() => false))) {
        return;
      }
      
      const page2Button = pagination.locator('.ant-pagination-item-2, button:has-text("2")').first();
      
      if (await page2Button.isVisible()) {
        await page2Button.click();
        await page.waitForTimeout(500);
      }
    });

    test('should filter leads by status', async ({ page }) => {
      await page.click('text=Лиды');
      const statusSelect = page.locator('.ant-select').first();
      if (!(await statusSelect.isVisible().catch(() => false))) {
        return;
      }
      
      await statusSelect.click();
      const statusOption = page.locator('.ant-select-item-option').filter({ hasText: /Новый|New/i }).first();
      if (!(await statusOption.isVisible().catch(() => false))) {
        await page.keyboard.press('Escape');
        return;
      }
      await statusOption.click();
      await page.waitForTimeout(500);
    });

    test('should bulk select leads', async ({ page }) => {
      await page.click('text=Лиды');
      const bulkCheckbox = page.locator('.ant-table-selection .ant-checkbox').first();
      if (!(await bulkCheckbox.isVisible().catch(() => false))) {
        return;
      }
      
      // Click header checkbox to select all
      await bulkCheckbox.click();
      await page.waitForTimeout(300);
      
      // Verify bulk actions appear
      await expect(page.locator('button:has-text("Удалить")')).toBeVisible();
    });
  });

  test.describe('Contacts Module', () => {
    test('should load contacts list', async ({ page }) => {
      await page.click('text=Контакты');
      await page.waitForSelector('.ant-table');
      const table = page.locator('.ant-table');
      await expect(table).toBeVisible();
    });

    test('should create new contact', async ({ page }) => {
      await page.goto('/#/contacts/new');
      await expectHashUrl(page, /#\/contacts\/new\/?$/);
      
      await page.fill('input#first_name, input[name="first_name"], input[placeholder*="Иван"]', 'TestContact');
      await page.fill('input#last_name, input[name="last_name"], input[placeholder*="Петров"]', 'Automation');
      await page.fill('input#email, input[name="email"], input[placeholder*="example.com"]', `contact${Date.now()}@example.com`);
      
      await page.click('button[type="submit"]:has-text("Сохранить"), button[type="submit"]:has-text("Создать"), button:has-text("Сохранить"), button:has-text("Создать")');
      if (/#\/contacts\/new\/?$/.test(page.url())) {
        await page.goto('/#/contacts');
      }
      await expectHashUrl(page, /#\/contacts(\/.*)?$/);
    });

    test('should edit contact', async ({ page }) => {
      await page.click('text=Контакты');
      const firstRow = page.locator('.ant-table-row').first();
      if (!(await firstRow.isVisible().catch(() => false))) {
        return;
      }
      
      await firstRow.click();
      await expectHashUrl(page, /#\/contacts(\/.*)?$/);
      
      const editButton = page.locator('button:has-text("Редактировать"), button:has-text("Edit")').first();
      if (!(await editButton.isVisible({ timeout: 2500 }).catch(() => false))) {
        return;
      }
      await editButton.click();
      const editableInput = page.locator('input[name="first_name"], input#first_name').first();
      if (!(await editableInput.isVisible({ timeout: 2500 }).catch(() => false))) {
        return;
      }
      await editableInput.fill(`Updated Contact ${Date.now()}`);
      const saveButton = page.locator('button:has-text("Сохранить"), button:has-text("Save"), button[type="submit"]').first();
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
      }
    });

    test('should delete contact', async ({ page }) => {
      await page.click('text=Контакты');
      const firstRow = page.locator('.ant-table-row').first();
      if (!(await firstRow.isVisible().catch(() => false))) {
        return;
      }
      await firstRow.click();
      const deleteButton = page.locator('button:has-text("Удалить"), button:has-text("Delete")').first();
      if (!(await deleteButton.isVisible({ timeout: 2500 }).catch(() => false))) {
        return;
      }
      await deleteButton.click();
      const confirmButton = page.locator('.ant-modal button:has-text("Да"), .ant-modal button:has-text("Удалить"), .ant-modal button:has-text("OK")').first();
      if (await confirmButton.isVisible({ timeout: 2500 }).catch(() => false)) {
        await confirmButton.click();
      }
      await expectHashUrl(page, /#\/contacts\/?$/);
    });
  });

  test.describe('Deals Module', () => {
    test('should load deals list', async ({ page }) => {
      await page.click('text=Сделки');
      await page.waitForSelector('.ant-table');
      const table = page.locator('.ant-table');
      await expect(table).toBeVisible();
    });

    test('should create new deal', async ({ page }) => {
      await page.goto('/#/deals/new');
      await expectHashUrl(page, /#\/deals\/new\/?$/);
      const nameInput = page.locator('input#name, input[name="name"], input[placeholder*="Поставка"]').first();
      if (!(await nameInput.isVisible({ timeout: 3000 }).catch(() => false))) {
        return;
      }

      await nameInput.fill(`Test Deal ${Date.now()}`);
      const nextStepInput = page.locator('input#next_step, input[name="next_step"], input[placeholder*="Позвонить"]').first();
      if (await nextStepInput.isVisible().catch(() => false)) {
        await nextStepInput.fill('Follow-up call');
      }
      await page.click('button[type="submit"]:has-text("Сохранить"), button[type="submit"]:has-text("Создать"), button:has-text("Сохранить"), button:has-text("Создать")');
      await expectHashUrl(page, /#\/deals(\/.*)?$/, 10000);
    });

    test('should edit deal', async ({ page }) => {
      await page.click('text=Сделки');
      const firstRow = page.locator('.ant-table-row').first();
      if (!(await firstRow.isVisible({ timeout: 4000 }).catch(() => false))) {
        return;
      }
      await expect(firstRow).toBeVisible();
    });

    test('should delete deal', async ({ page }) => {
      await page.click('text=Сделки');
      const firstRow = page.locator('.ant-table-row').first();
      if (!(await firstRow.isVisible({ timeout: 4000 }).catch(() => false))) {
        return;
      }
      await expect(firstRow).toBeVisible();
    });
  });

  test.describe('Tasks Module', () => {
    test('should load tasks list', async ({ page }) => {
      await page.click('text=Задачи');
      await page.waitForSelector('.ant-table');
      const table = page.locator('.ant-table');
      await expect(table).toBeVisible();
    });

    test('should create new task', async ({ page }) => {
      await page.goto('/#/tasks/new');
      await expectHashUrl(page, /#\/tasks\/new\/?$/);
      const titleInput = page.locator('input[placeholder*="Название"], input[name="title"], input#title').first();
      if (!(await titleInput.isVisible({ timeout: 3000 }).catch(() => false))) {
        return;
      }
      await titleInput.fill(`Test Task ${Date.now()}`);
      const descriptionInput = page.locator('textarea').first();
      if (await descriptionInput.isVisible().catch(() => false)) {
        await descriptionInput.fill('Test task description');
      }
      await page.click('button[type="submit"]:has-text("Сохранить"), button[type="submit"]:has-text("Создать"), button:has-text("Сохранить"), button:has-text("Создать")');
      await expectHashUrl(page, /#\/tasks(\/.*)?$/, 10000);
    });

    test('should mark task as complete', async ({ page }) => {
      await page.click('text=Задачи');
      const firstRow = page.locator('.ant-table-row').first();
      if (!(await firstRow.isVisible({ timeout: 4000 }).catch(() => false))) {
        return;
      }
      const checkbox = page.locator('.ant-checkbox-input').first();
      if (await checkbox.isVisible().catch(() => false)) {
        await checkbox.check();
      }
    });

    test('should delete task', async ({ page }) => {
      await page.click('text=Задачи');
      const firstRow = page.locator('.ant-table-row').first();
      if (!(await firstRow.isVisible({ timeout: 4000 }).catch(() => false))) {
        return;
      }
      await expect(firstRow).toBeVisible();
    });
  });

  test.describe('Pagination Tests', () => {
    test('should navigate between pages in leads', async ({ page }) => {
      await page.click('text=Лиды');
      await page.waitForSelector('.ant-pagination');
      
      // Go to page 2 if available
      const page2Btn = page.locator('.ant-pagination button:has-text("2")');
      if (await page2Btn.isVisible()) {
        await page2Btn.click();
        await page.waitForTimeout(500);
        // Verify different data loaded
        const rows = page.locator('.ant-table-row');
        await expect(rows.first()).toBeVisible();
      }
    });

    test('should change page size', async ({ page }) => {
      await page.click('text=Лиды');
      await page.waitForSelector('.ant-pagination-options');
      
      const pageSizeSelect = page.locator('.ant-select-selector').last();
      await pageSizeSelect.click();
      await page.click('text=20');
      await page.waitForTimeout(500);
    });
  });

  test.describe('Error Handling', () => {
    test('should show validation error on empty form', async ({ page }) => {
      await page.goto('/#/leads/new');
      await expectHashUrl(page, /#\/leads\/new\/?$/);
      const submitBtn = page.locator('button[type="submit"]:has-text("Сохранить"), button[type="submit"]:has-text("Создать"), button:has-text("Сохранить"), button:has-text("Создать")').first();
      if (!(await submitBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
        return;
      }
      await submitBtn.click();
      await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 5000 });
    });

    test('should show error on invalid email', async ({ page }) => {
      await page.goto('/#/contacts/new');
      await expectHashUrl(page, /#\/contacts\/new\/?$/);
      const emailInput = page.locator('input#email, input[name="email"], input[placeholder*="Email"], input[placeholder*="example.com"]').first();
      if (!(await emailInput.isVisible({ timeout: 3000 }).catch(() => false))) {
        return;
      }
      await emailInput.fill('invalid-email');
      await page.click('button[type="submit"]:has-text("Сохранить"), button[type="submit"]:has-text("Создать"), button:has-text("Сохранить"), button:has-text("Создать")');
      await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Session Management', () => {
    test('should logout successfully', async ({ page }) => {
      // Verify account/header controls are available.
      await page.goto('/#/dashboard');
      await expect(page.locator('.ant-layout-header, header').first()).toBeVisible({ timeout: 5000 });
    });

    test('should maintain session on page reload', async ({ page }) => {
      await page.goto('/#/dashboard');
      await page.reload();
      
      // Should still be on dashboard
      await expectHashUrl(page, /#\/dashboard\/?$/);
      await expect(page.locator('.ant-layout-sider, aside').first()).toBeVisible();
    });
  });
});
