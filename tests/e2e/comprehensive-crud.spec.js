import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 't3sl@admin';

// Helper function to login
async function login(page) {
  await page.goto(`${BASE_URL}/#/dashboard`);

  const needsLogin = await page
    .locator('input[type="password"]')
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (needsLogin) {
    const usernameInput = page.locator('input[placeholder="Имя пользователя"], input[name="username"], input[type="text"]');
    await usernameInput.first().fill(ADMIN_USERNAME);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);

    let loginResponse = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const loginResponsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/token/') && response.request().method() === 'POST'
      );

      await page.click('button[type="submit"]');

      loginResponse = await loginResponsePromise.catch(() => null);
      if (!loginResponse) {
        await page.waitForTimeout(1000);
        continue;
      }
      if (loginResponse.status() === 429) {
        await page.waitForTimeout(2000 * (attempt + 1));
        continue;
      }
      if (!loginResponse.ok()) {
        throw new Error(`Login failed: HTTP ${loginResponse.status()}`);
      }
      break;
    }

    if (!loginResponse || !loginResponse.ok()) {
      throw new Error('Login failed after retries');
    }

    await page.waitForFunction(() => window.location.hash.includes('/dashboard'), null, { timeout: 60000 });
    await page.waitForTimeout(1000);
  } else {
    await page.waitForSelector('.ant-layout', { timeout: 60000 });
  }
}

test.describe('Comprehensive CRUD Tests', () => {
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
      await page.click('text=Лиды');
      await page.click('button:has-text("Создать")');
      
      // Fill form
      await page.fill('input[placeholder*="Имя"]', 'Test Lead');
      await page.fill('input[placeholder*="Email"]', `test${Date.now()}@example.com`);
      await page.fill('input[placeholder*="Телефон"]', '+1234567890');
      
      await page.click('button:has-text("Сохранить")');
      await page.waitForURL('**/leads/**');
      await expect(page.locator('text=Test Lead')).toBeVisible();
    });

    test('should edit lead', async ({ page }) => {
      await page.click('text=Лиды');
      await page.waitForSelector('.ant-table-row');
      
      // Click first row to open detail
      await page.click('.ant-table-row:first-child');
      await page.waitForURL('**/leads/**');
      
      // Edit
      await page.click('button:has-text("Редактировать")');
      await page.fill('input[value*="Test"]', 'Updated Lead');
      await page.click('button:has-text("Сохранить")');
      
      await expect(page.locator('text=Updated Lead')).toBeVisible();
    });

    test('should delete lead', async ({ page }) => {
      await page.click('text=Лиды');
      await page.waitForSelector('.ant-table-row');
      
      // Open first lead
      await page.click('.ant-table-row:first-child');
      await page.waitForURL('**/leads/**');
      
      // Delete
      await page.click('button:has-text("Удалить")');
      await page.click('button:has-text("Да")'); // Confirm
      
      await page.waitForURL('**/leads');
    });

    test('should search leads', async ({ page }) => {
      await page.click('text=Лиды');
      await page.waitForSelector('input[placeholder*="Поиск"]');
      
      await page.fill('input[placeholder*="Поиск"]', 'Test');
      await page.waitForTimeout(500);
      
      const rows = page.locator('.ant-table-row');
      await expect(rows).toHaveCount(1);
    });

    test('should paginate leads', async ({ page }) => {
      await page.click('text=Лиды');
      await page.waitForSelector('.ant-pagination');
      
      const pagination = page.locator('.ant-pagination');
      const page2Button = pagination.locator('button:has-text("2")');
      
      if (await page2Button.isVisible()) {
        await page2Button.click();
        await page.waitForTimeout(500);
      }
    });

    test('should filter leads by status', async ({ page }) => {
      await page.click('text=Лиды');
      await page.waitForSelector('select, .ant-select');
      
      const statusSelect = page.locator('.ant-select').first();
      await statusSelect.click();
      await page.click('text=Новый');
      await page.waitForTimeout(500);
    });

    test('should bulk select leads', async ({ page }) => {
      await page.click('text=Лиды');
      await page.waitForSelector('.ant-checkbox');
      
      // Click header checkbox to select all
      await page.click('.ant-table-selection .ant-checkbox');
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
      await page.click('text=Контакты');
      await page.click('button:has-text("Создать")');
      
      await page.fill('input[placeholder*="Имя"]', 'Test Contact');
      await page.fill('input[placeholder*="Email"]', `contact${Date.now()}@example.com`);
      await page.fill('input[placeholder*="Компания"]', 'Test Company');
      
      await page.click('button:has-text("Сохранить")');
      await page.waitForURL('**/contacts/**');
    });

    test('should edit contact', async ({ page }) => {
      await page.click('text=Контакты');
      await page.waitForSelector('.ant-table-row');
      
      await page.click('.ant-table-row:first-child');
      await page.waitForURL('**/contacts/**');
      
      await page.click('button:has-text("Редактировать")');
      await page.fill('input[value*="Test"]', 'Updated Contact');
      await page.click('button:has-text("Сохранить")');
    });

    test('should delete contact', async ({ page }) => {
      await page.click('text=Контакты');
      await page.click('.ant-table-row:first-child');
      await page.click('button:has-text("Удалить")');
      await page.click('button:has-text("Да")');
      await page.waitForURL('**/contacts');
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
      await page.click('text=Сделки');
      await page.click('button:has-text("Создать")');
      
      await page.fill('input[placeholder*="Название"]', 'Test Deal');
      await page.fill('input[placeholder*="Сумма"]', '10000');
      
      await page.click('button:has-text("Сохранить")');
      await page.waitForURL('**/deals/**');
    });

    test('should edit deal', async ({ page }) => {
      await page.click('text=Сделки');
      await page.click('.ant-table-row:first-child');
      
      await page.click('button:has-text("Редактировать")');
      await page.fill('input[value*="Test"]', 'Updated Deal');
      await page.click('button:has-text("Сохранить")');
    });

    test('should delete deal', async ({ page }) => {
      await page.click('text=Сделки');
      await page.click('.ant-table-row:first-child');
      await page.click('button:has-text("Удалить")');
      await page.click('button:has-text("Да")');
      await page.waitForURL('**/deals');
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
      await page.click('text=Задачи');
      await page.click('button:has-text("Создать")');
      
      await page.fill('input[placeholder*="Название"]', 'Test Task');
      await page.fill('textarea', 'Test task description');
      
      await page.click('button:has-text("Сохранить")');
      await page.waitForURL('**/tasks/**');
    });

    test('should mark task as complete', async ({ page }) => {
      await page.click('text=Задачи');
      await page.click('.ant-table-row:first-child');
      
      const checkbox = page.locator('.ant-checkbox-input').first();
      await checkbox.check();
      
      await page.waitForTimeout(500);
    });

    test('should delete task', async ({ page }) => {
      await page.click('text=Задачи');
      await page.click('.ant-table-row:first-child');
      await page.click('button:has-text("Удалить")');
      await page.click('button:has-text("Да")');
      await page.waitForURL('**/tasks');
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
      await page.click('text=Лиды');
      await page.click('button:has-text("Создать")');
      
      await page.click('button:has-text("Сохранить")');
      
      // Should show error
      await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
    });

    test('should show error on invalid email', async ({ page }) => {
      await page.click('text=Контакты');
      await page.click('button:has-text("Создать")');
      
      await page.fill('input[placeholder*="Email"]', 'invalid-email');
      await page.click('button:has-text("Сохранить")');
      
      // Should show error
      await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('should logout successfully', async ({ page }) => {
      // Click user menu
      await page.click('.ant-dropdown-trigger, [role="button"]:has-text("admin")');
      
      // Click logout
      await page.click('text=Выход');
      
      // Should redirect to login
      await page.waitForURL('**/login');
      await expect(page.locator('text=Enterprise CRM')).toBeVisible();
    });

    test('should maintain session on page reload', async ({ page }) => {
      await page.goto(`${BASE_URL}/#/dashboard`);
      await page.reload();
      
      // Should still be on dashboard
      await page.waitForURL('**/dashboard');
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });
  });
});
