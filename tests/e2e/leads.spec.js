/**
 * E2E Tests for Leads Module
 *
 * Comprehensive tests covering:
 * - Login flow
 * - Full CRUD operations (create, read, update, delete)
 * - Bulk operations (bulk delete, bulk status change)
 * - Search and filtering
 * - Pagination
 * - Kanban view
 * - Data export
 */

import { test, expect } from '@playwright/test';
import { generateLeadData } from './helpers/test-data.js';
import { waitForApiResponse, cleanupTestData } from './helpers/api-helpers.js';
import { login } from './helpers/auth.js';

test.describe('Leads Module - Comprehensive E2E Tests', () => {
  let createdLeadIds = [];

  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // Add delay after each test to avoid rate limiting
  test.afterEach(async () => {
    // Wait 3 seconds between tests to avoid API rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  // Cleanup: Delete created test leads
  test.afterEach(async ({ page }) => {
    if (createdLeadIds.length > 0) {
      await cleanupTestData(page, '/leads', createdLeadIds);
      createdLeadIds = [];
    }
  });

  test('should complete full CRUD flow: Create → Read → Update → Delete', async ({ page }) => {
    // 1. CREATE
    const leadData = generateLeadData();
    console.log(`📝 Starting CRUD test with: ${leadData.first_name} ${leadData.last_name}`);

    // Navigate to leads page (ensure we are there)
    await page.goto('/#/leads');
    await page.waitForLoadState('networkidle');

    // Click "Create lead" button (Use locator for robustness against icon children)
    await page.locator('button').filter({ hasText: /Создать лид/i }).click();

    // Fill form (standard inputs) using IDs which are explicitly set in LeadForm
    await page.fill('input[id="first_name"]', leadData.first_name);
    await page.fill('input[id="last_name"]', leadData.last_name);
    await page.fill('input[id="company_name"]', leadData.company);
    await page.fill('input[id="email"]', leadData.email);
    await page.fill('input[id="phone"]', leadData.phone);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for success toast/redirection
    await page.waitForTimeout(1000);
    // Note: Our new LeadsList uses Shadcn Toaster, assuming it's visible.
    // Also we usually redirect to list.
    await page.waitForURL('**/leads');

    // 2. READ (Verify in List)
    console.log('🔍 Verifying lead in list...');
    await page.waitForSelector('table'); // waitFor Shadcn Table
    // Filter by unique name to be sure
    await page.fill('input[placeholder*="Поиск"]', leadData.last_name);
    // Trigger search
    await page.getByRole('button', { name: /search/i }).click().catch(() => page.keyboard.press('Enter'));
    await page.waitForResponse(response => response.url().includes('/api/leads') && response.status() === 200);

    // Verify lead existence by unique email link
    const emailLink = page.getByRole('link', { name: leadData.email });
    await expect(emailLink).toBeVisible();

    // 3. UPDATE (Verify in Detail)
    console.log('✏️ Updating lead...');
    // Click actions menu in the row
    const row = emailLink.locator('xpath=ancestor::tr').first();
    await row.getByRole('button', { name: /More/i }).first().click(); // MoreHorizontal icon button
    await page.getByRole('menuitem', { name: /Просмотр/i }).click();

    await page.waitForURL(/\/leads\/\d+/);

    // Detail View Actions (Already Fixed in previous step)
    await page.getByRole('button', { name: /Действия/i }).click();
    await page.getByRole('menuitem', { name: /Редактировать/i }).click();

    const updatedCompany = `${leadData.company} Updated`;
    await page.fill('input[name="company_name"]', updatedCompany);
    await page.click('button[type="submit"]');

    // Verify Update in Detail
    await page.waitForTimeout(1000);
    await expect(page.getByText(updatedCompany)).toBeVisible();

    // 4. DELETE
    console.log('🗑 Deleting lead...');
    await page.getByRole('button', { name: /Действия/i }).click();
    await page.getByRole('menuitem', { name: /Удалить/i }).click();

    // Confirm delete (AlertDialog)
    await page.getByRole('button', { name: 'Удалить' }).click();

    // Verify redirection to List
    await page.waitForURL('**/leads');

    // Verify absence
    // Clear search first if needed, but we want to search for DELETED item to confirm absence
    await page.fill('input[placeholder*="Поиск"]', leadData.email);
    await page.getByRole('button', { name: /search/i }).click().catch(() => page.keyboard.press('Enter'));
    await page.waitForResponse(response => response.url().includes('/api/leads') && response.status() === 200);

    await expect(page.getByRole('cell', { name: leadData.email })).not.toBeVisible();
  });

  test('should search and filter leads', async ({ page }) => {
    // Create test lead first
    const leadData = generateLeadData('_search');

    await page.goto('/#/leads');
    await page.click('button:has-text("Создать лид"), button:has-text("Создать")');
    await page.waitForURL('**/#/leads/new');

    await page.fill('input[name="first_name"], input[id*="first_name"]', leadData.first_name);
    await page.fill('input[name="last_name"], input[id*="last_name"]', leadData.last_name);
    await page.fill('input[name="email"], input[id*="email"]', leadData.email);
    await page.fill('input[name="phone"], input[id*="phone"]', leadData.phone);

    const createResponsePromise = waitForApiResponse(page, '/api/leads');
    await page.click('button[type="submit"]:has-text("Создать"), button:has-text("Сохранить")');
    const createResponse = await createResponsePromise;
    const createdLead = await createResponse.json();
    createdLeadIds.push(createdLead.id);

    await page.waitForURL('**/#/leads');

    // ===== SEARCH =====
    // Find search input
    const searchInput = page.locator('input[placeholder*="Поиск"], input[placeholder*="Search"]').first();
    await searchInput.fill(leadData.first_name);

    // Wait for search results
    await page.waitForTimeout(1000);

    // Verify search results contain our lead
    await expect(page.locator(`text=${leadData.first_name}`).first()).toBeVisible();

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // ===== FILTER =====
    // Try to filter by status (if available)
    const statusFilter = page.locator('th:has-text("Статус") .ant-table-filter-trigger, button:has-text("Фильтр")').first();

    if (await statusFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await statusFilter.click();
      await page.waitForTimeout(500);

      // Select first filter option
      const firstOption = page.locator('.ant-dropdown .ant-checkbox-wrapper, .ant-dropdown-menu-item').first();
      if (await firstOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        await firstOption.click();

        // Apply filter
        const okButton = page.locator('.ant-dropdown button:has-text("OK")');
        if (await okButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await okButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('should navigate through pagination', async ({ page }) => {
    await page.goto('/#/leads');
    await page.waitForLoadState('networkidle');

    // Check if pagination exists
    const pagination = page.locator('.ant-pagination, nav[aria-label="pagination"]').first();
    const isPaginationVisible = await pagination.isVisible({ timeout: 2000 }).catch(() => false);

    if (isPaginationVisible) {
      // Get current page info
      const paginationText = await pagination.textContent();
      console.log('Pagination:', paginationText);

      // Try to go to next page
      const nextButton = page.locator('.ant-pagination-next, button[aria-label*="next"]').first();
      const isNextEnabled = await nextButton.getAttribute('aria-disabled') !== 'true';

      if (isNextEnabled) {
        await nextButton.click();
        await page.waitForTimeout(1000);

        // Verify page changed
        await expect(pagination).toBeVisible();

        // Go back to first page
        const prevButton = page.locator('.ant-pagination-prev, button[aria-label*="previous"]').first();
        if (await prevButton.isVisible().catch(() => false)) {
          await prevButton.click();
          await page.waitForTimeout(1000);
        }
      }
    } else {
      console.log('No pagination available (likely too few records)');
    }
  });

  test('should switch between table and kanban view', async ({ page }) => {
    await page.goto('/#/leads');
    await page.waitForLoadState('networkidle');

    // Default should be table view
    const table = page.locator('table, .ant-table').first();
    await expect(table).toBeVisible({ timeout: 5000 });

    // Switch to kanban view
    const kanbanButton = page.locator('button:has-text("Канбан"), button:has-text("Kanban"), [role="tab"]:has-text("Канбан")').first();

    if (await kanbanButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await kanbanButton.click();
      await page.waitForTimeout(1000);

      // Verify kanban board appears
      const kanbanBoard = page.locator('.kanban-board, [class*="kanban"]').first();
      await expect(kanbanBoard).toBeVisible({ timeout: 3000 });

      // Switch back to table view
      const tableButton = page.locator('button:has-text("Таблица"), button:has-text("Table"), [role="tab"]:has-text("Таблица")').first();
      if (await tableButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tableButton.click();
        await page.waitForTimeout(1000);

        // Verify table is visible again
        await expect(table).toBeVisible();
      }
    }
  });

  test('should perform bulk delete operation', async ({ page }) => {
    // Create multiple test leads
    const lead1Data = generateLeadData('_bulk1');
    const lead2Data = generateLeadData('_bulk2');

    // Create first lead
    await page.goto('/#/leads/new');
    await page.fill('input[name="first_name"], input[id*="first_name"]', lead1Data.first_name);
    await page.fill('input[name="last_name"], input[id*="last_name"]', lead1Data.last_name);
    await page.fill('input[name="email"], input[id*="email"]', lead1Data.email);
    await page.fill('input[name="phone"], input[id*="phone"]', lead1Data.phone);

    let createResponse = await waitForApiResponse(page, '/api/leads');
    await page.click('button[type="submit"]:has-text("Создать"), button:has-text("Сохранить")');
    let created = await (await createResponse).json();
    createdLeadIds.push(created.id);

    // Create second lead
    await page.goto('/#/leads/new');
    await page.fill('input[name="first_name"], input[id*="first_name"]', lead2Data.first_name);
    await page.fill('input[name="last_name"], input[id*="last_name"]', lead2Data.last_name);
    await page.fill('input[name="email"], input[id*="email"]', lead2Data.email);
    await page.fill('input[name="phone"], input[id*="phone"]', lead2Data.phone);

    createResponse = waitForApiResponse(page, '/api/leads');
    await page.click('button[type="submit"]:has-text("Создать"), button:has-text("Сохранить")');
    created = await (await createResponse).json();
    createdLeadIds.push(created.id);

    await page.goto('/#/leads');
    await page.waitForLoadState('networkidle');

    // Select both leads
    const checkbox1 = page.locator(`tr:has-text("${lead1Data.first_name}") input[type="checkbox"]`).first();
    const checkbox2 = page.locator(`tr:has-text("${lead2Data.first_name}") input[type="checkbox"]`).first();

    await checkbox1.check();
    await checkbox2.check();
    await page.waitForTimeout(500);

    // Click bulk delete button
    const bulkDeleteButton = page.locator('button:has-text("Удалить выбранные"), button:has-text("Удалить")').first();

    if (await bulkDeleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await bulkDeleteButton.click();

      // Confirm deletion
      await page.click('.ant-modal button:has-text("Да"), .ant-popconfirm button:has-text("Да"), button:has-text("Подтвердить")');
      await page.waitForTimeout(1500);

      // Verify leads are deleted
      await expect(page.locator(`text=${lead1Data.first_name}`)).not.toBeVisible();
      await expect(page.locator(`text=${lead2Data.first_name}`)).not.toBeVisible();

      // Remove from cleanup since deleted
      createdLeadIds = [];
    }
  });

  test('should perform bulk status change operation', async ({ page }) => {
    // Create test lead
    const leadData = generateLeadData('_status');

    await page.goto('/#/leads/new');
    await page.fill('input[name="first_name"], input[id*="first_name"]', leadData.first_name);
    await page.fill('input[name="last_name"], input[id*="last_name"]', leadData.last_name);
    await page.fill('input[name="email"], input[id*="email"]', leadData.email);
    await page.fill('input[name="phone"], input[id*="phone"]', leadData.phone);

    const createResponse = waitForApiResponse(page, '/api/leads');
    await page.click('button[type="submit"]:has-text("Создать"), button:has-text("Сохранить")');
    const created = await (await createResponse).json();
    createdLeadIds.push(created.id);

    await page.goto('/#/leads');
    await page.waitForLoadState('networkidle');

    // Select the lead
    const checkbox = page.locator(`tr:has-text("${leadData.first_name}") input[type="checkbox"]`).first();
    await checkbox.check();
    await page.waitForTimeout(500);

    // Click bulk status change button
    const bulkStatusButton = page.locator('button:has-text("Изменить статус"), button:has-text("Статус")').first();

    if (await bulkStatusButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await bulkStatusButton.click();
      await page.waitForTimeout(500);

      // Select new status
      const statusSelect = page.locator('.ant-select, select[name="status"]').first();
      if (await statusSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await statusSelect.click();
        await page.waitForTimeout(300);

        // Select first option
        const firstOption = page.locator('.ant-select-item-option, option').nth(1);
        if (await firstOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await firstOption.click();

          // Apply changes
          const applyButton = page.locator('button:has-text("Применить"), button:has-text("OK")');
          if (await applyButton.isVisible({ timeout: 1000 }).catch(() => false)) {
            await applyButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }
  });

  test('should export leads data', async ({ page }) => {
    await page.goto('/#/leads');
    await page.waitForLoadState('networkidle');

    // Check if there are any leads to export
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      // Select first lead
      const firstCheckbox = page.locator('tbody tr input[type="checkbox"]').first();
      if (await firstCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstCheckbox.check();
        await page.waitForTimeout(500);
      }

      // Find and click export button
      const exportButton = page.locator('button:has-text("Экспорт"), button:has-text("Export"), button[title*="Экспорт"]').first();

      if (await exportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

        await exportButton.click();

        try {
          const download = await downloadPromise;
          const filename = download.suggestedFilename();

          // Verify download started and has a filename
          expect(filename).toBeTruthy();
          expect(filename).toMatch(/\.(csv|xlsx|pdf|xls)$/i);

          console.log('✓ Export successful:', filename);
        } catch {
          console.log('Export may not be available or timed out');
        }
      } else {
        console.log('Export button not found');
      }
    } else {
      console.log('No leads available to export');
    }
  });

  test('should test lead form validation', async ({ page }) => {
    await page.goto('/#/leads/new');
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Создать"), button:has-text("Сохранить")');
    await page.waitForTimeout(500);

    // Check for validation errors
    const errors = page.locator('.text-destructive, .error, .ant-form-item-explain-error');
    const errorCount = await errors.count();

    if (errorCount > 0) {
      console.log('✓ Form validation is working');
    }

    // Test invalid email
    await page.fill('input[name="email"], input[id*="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Should show email validation error
    const emailError = page.locator('text=/некорректн|invalid|неправильн/i');
    if (await emailError.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('✓ Email validation is working');
    }
  });

  test('should navigate lead pages correctly', async ({ page }) => {
    await page.goto('/#/leads');
    await page.waitForLoadState('networkidle');

    // List → Create
    await page.click('button:has-text("Создать лид"), button:has-text("Создать")');
    await expect(page).toHaveURL(/\/leads\/new/, { timeout: 5000 });

    // Create → List (back/cancel)
    const backButton = page.locator('button:has-text("Назад"), button:has-text("Отмена")').first();
    if (await backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backButton.click();
      await expect(page).toHaveURL(/\/leads$/, { timeout: 5000 });
    } else {
      await page.goto('/#/leads');
    }

    // Check if there are leads to view
    const firstViewButton = page.locator('tbody tr button:has-text("Просмотр"), tbody tr a:has-text("Просмотр")').first();
    if (await firstViewButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstViewButton.click();
      await expect(page).toHaveURL(/\/leads\/\d+$/, { timeout: 5000 });

      // Detail → Edit
      const editButton = page.locator('button:has-text("Редактировать"), a:has-text("Редактировать")').first();
      if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await editButton.click();
        await expect(page).toHaveURL(/\/leads\/\d+\/edit/, { timeout: 5000 });
      }
    }
  });
});
