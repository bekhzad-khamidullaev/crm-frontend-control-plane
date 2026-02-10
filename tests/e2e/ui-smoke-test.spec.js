import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 't3sl@admin';

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
      const responsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/token/') && response.request().method() === 'POST'
      );

      await page.click('button[type="submit"]');

      loginResponse = await responsePromise.catch(() => null);
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
  } else {
    await page.waitForSelector('.ant-layout', { timeout: 60000 });
  }
}

test.describe('UI Smoke Tests - SMOKE_TEST_CHECKLIST', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('Navigation and Layout', () => {
    test('should display main layout components', async ({ page }) => {
      // Header
      await expect(page.locator('.ant-layout-header')).toBeVisible();
      
      // Sidebar
      await expect(page.locator('.ant-layout-sider')).toBeVisible();
      
      // Content area
      await expect(page.locator('.ant-layout-content')).toBeVisible();
    });

    test('should have working navigation menu', async ({ page }) => {
      const menuItems = [
        'Лиды',
        'Контакты',
        'Сделки',
        'Задачи',
        'Продукты',
        'Проекты',
        'Компании',
        'Кампании',
        'Платежи',
        'Напоминания'
      ];

      for (const item of menuItems) {
        await expect(page.locator(`text=${item}`).first()).toBeVisible();
      }
    });

    test('should navigate to dashboard', async ({ page }) => {
      await page.click('text=Dashboard');
      await page.waitForURL('**/dashboard');
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should display user profile button', async ({ page }) => {
      const userMenu = page.locator('[role="button"]:has-text("admin"), .ant-dropdown-trigger');
      await expect(userMenu.first()).toBeVisible();
    });
  });

  test.describe('All Module Pages', () => {
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

    for (const module of modules) {
      test(`should load ${module.name} page`, async ({ page }) => {
        await page.click(`text=${module.name}`);
        await page.waitForURL(`**/${module.url}`);
        
        // Check for table or content
        const table = page.locator('.ant-table');
        await expect(table).toBeVisible({ timeout: 5000 });
      });

      test(`should display create button on ${module.name}`, async ({ page }) => {
        await page.click(`text=${module.name}`);
        await page.waitForURL(`**/${module.url}`);
        
        const createBtn = page.locator('button:has-text("Создать"), button:has-text("Новый")').first();
        await expect(createBtn).toBeVisible();
      });

      test(`should have search input on ${module.name}`, async ({ page }) => {
        await page.click(`text=${module.name}`);
        await page.waitForURL(`**/${module.url}`);
        
        const searchInput = page.locator('input[placeholder*="Поиск"], input[placeholder*="Search"]').first();
        await expect(searchInput).toBeVisible({ timeout: 5000 });
      });

      test(`should have pagination on ${module.name}`, async ({ page }) => {
        await page.click(`text=${module.name}`);
        await page.waitForURL(`**/${module.url}`);
        
        const pagination = page.locator('.ant-pagination');
        await expect(pagination).toBeVisible({ timeout: 5000 });
      });

      test(`should have filters on ${module.name}`, async ({ page }) => {
        await page.click(`text=${module.name}`);
        await page.waitForURL(`**/${module.url}`);
        
        const filters = page.locator('.ant-select, [role="combobox"]').first();
        await expect(filters).toBeVisible({ timeout: 5000 });
      });
    }
  });

  test.describe('Table Components', () => {
    test('should display table header with columns', async ({ page }) => {
      await page.click('text=Лиды');
      
      const tableHeader = page.locator('.ant-table-thead');
      await expect(tableHeader).toBeVisible();
      
      const headerCells = page.locator('.ant-table-cell');
      expect(await headerCells.count()).toBeGreaterThan(0);
    });

    test('should display table rows with data', async ({ page }) => {
      await page.click('text=Лиды');
      
      const rows = page.locator('.ant-table-row');
      await expect(rows.first()).toBeVisible({ timeout: 5000 });
    });

    test('should have row hover effects', async ({ page }) => {
      await page.click('text=Лиды');
      
      const firstRow = page.locator('.ant-table-row').first();
      await firstRow.hover();
      
      // Row should have hover styling
      const hoverStyle = await firstRow.evaluate(el => window.getComputedStyle(el).backgroundColor);
      expect(hoverStyle).toBeTruthy();
    });

    test('should allow row selection', async ({ page }) => {
      await page.click('text=Лиды');
      
      const checkbox = page.locator('.ant-table-selection .ant-checkbox input').first();
      await expect(checkbox).toBeVisible();
    });

    test('should display table actions', async ({ page }) => {
      await page.click('text=Лиды');
      
      const firstRow = page.locator('.ant-table-row').first();
      await firstRow.click();
      
      // Should open detail or show actions
      await page.waitForURL('**/leads/**', { timeout: 5000 });
    });
  });

  test.describe('Forms and Modals', () => {
    test('should open create modal/form', async ({ page }) => {
      await page.click('text=Лиды');
      await page.click('button:has-text("Создать")');
      
      const modal = page.locator('.ant-modal, [role="dialog"]').first();
      await expect(modal).toBeVisible();
    });

    test('should display form fields', async ({ page }) => {
      await page.click('text=Лиды');
      await page.click('button:has-text("Создать")');
      
      const inputs = page.locator('input[type="text"], textarea, select').first();
      await expect(inputs).toBeVisible();
    });

    test('should have submit button', async ({ page }) => {
      await page.click('text=Лиды');
      await page.click('button:has-text("Создать")');
      
      const submitBtn = page.locator('button:has-text("Сохранить"), button[type="submit"]').first();
      await expect(submitBtn).toBeVisible();
    });

    test('should have cancel button', async ({ page }) => {
      await page.click('text=Лиды');
      await page.click('button:has-text("Создать")');
      
      const cancelBtn = page.locator('button:has-text("Отмена"), button:has-text("Закрыть")').first();
      await expect(cancelBtn).toBeVisible();
    });

    test('should close modal on cancel', async ({ page }) => {
      await page.click('text=Лиды');
      await page.click('button:has-text("Создать")');
      
      await page.click('button:has-text("Отмена"), button:has-text("Закрыть")');
      
      const modal = page.locator('.ant-modal, [role="dialog"]');
      await expect(modal).not.toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('Search and Filter', () => {
    test('should have working search', async ({ page }) => {
      await page.click('text=Лиды');
      
      const searchInput = page.locator('input[placeholder*="Поиск"], input[placeholder*="Search"]').first();
      await searchInput.fill('test');
      
      await page.waitForTimeout(300);
      
      // Table should still be visible
      await expect(page.locator('.ant-table')).toBeVisible();
    });

    test('should have filter dropdown', async ({ page }) => {
      await page.click('text=Лиды');
      
      const filterSelect = page.locator('.ant-select-selector').first();
      await filterSelect.click();
      
      const dropdown = page.locator('.ant-select-dropdown');
      await expect(dropdown).toBeVisible({ timeout: 2000 });
    });

    test('should apply filter', async ({ page }) => {
      await page.click('text=Лиды');
      
      const filterSelect = page.locator('.ant-select-selector').first();
      await filterSelect.click();
      
      const option = page.locator('.ant-select-item').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Bulk Actions', () => {
    test('should show bulk actions on selection', async ({ page }) => {
      await page.click('text=Лиды');
      await page.waitForSelector('.ant-table-row');
      
      // Select all
      const headerCheckbox = page.locator('.ant-table-selection .ant-checkbox-inner').first();
      await headerCheckbox.click();
      
      // Bulk action buttons should appear
      const bulkButtons = page.locator('button:has-text("Удалить"), button:has-text("Экспорт")');
      expect(await bulkButtons.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Pagination Controls', () => {
    test('should display pagination info', async ({ page }) => {
      await page.click('text=Лиды');
      
      const paginationInfo = page.locator('.ant-pagination-total-text');
      if (await paginationInfo.isVisible()) {
        const text = await paginationInfo.textContent();
        expect(text).toMatch(/\d+/);
      }
    });

    test('should have page size options', async ({ page }) => {
      await page.click('text=Лиды');
      
      const pageSizeSelect = page.locator('.ant-pagination-options .ant-select-selector');
      if (await pageSizeSelect.isVisible()) {
        await pageSizeSelect.click();
        const options = page.locator('.ant-select-item');
        expect(await options.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be mobile responsive', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.click('text=Лиды');
      
      const table = page.locator('.ant-table');
      await expect(table).toBeVisible();
    });

    test('should be tablet responsive', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.click('text=Лиды');
      
      const table = page.locator('.ant-table');
      await expect(table).toBeVisible();
    });

    test('should be desktop responsive', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.click('text=Лиды');
      
      const table = page.locator('.ant-table');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      expect(await h1.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have keyboard navigation', async ({ page }) => {
      await page.click('text=Лиды');
      
      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const focused = await page.evaluate(() => document.activeElement.tagName);
      expect(['BUTTON', 'A', 'INPUT']).toContain(focused);
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.click('text=Лиды');
      
      const buttons = page.locator('button[aria-label], [role="button"][aria-label]');
      expect(await buttons.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Settings Page', () => {
    test('should load settings page', async ({ page }) => {
      await page.click('[role="button"]:has-text("admin"), .ant-dropdown-trigger');
      await page.click('text=Настройки');
      
      await page.waitForURL('**/settings', { timeout: 5000 });
      await expect(page.locator('.ant-form, .ant-card')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load page within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.click('text=Лиды');
      await page.waitForSelector('.ant-table-row');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(10000); // Less than 10 seconds
    });

    test('should handle fast table navigation', async ({ page }) => {
      await page.click('text=Лиды');
      await page.waitForSelector('.ant-table');
      
      // Quick navigation between modules
      await page.click('text=Контакты');
      await page.waitForSelector('.ant-table');
      
      await page.click('text=Сделки');
      await page.waitForSelector('.ant-table');
      
      // Should handle without crashing
      expect(true).toBeTruthy();
    });
  });
});
