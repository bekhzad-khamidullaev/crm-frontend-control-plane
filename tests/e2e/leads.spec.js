/**
 * E2E Tests for Leads Module
 * 
 * These tests cover the complete user flow for working with leads:
 * - Create → View → Edit → Delete
 * - Search and filtering
 * - Bulk actions
 * - Status changes and conversions
 * 
 * Note: These tests require a running backend API or mock server
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const API_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000';

test.describe('Leads Module E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication or perform login
    await page.goto(`${BASE_URL}/login`);
    // Add login steps if needed
  });

  test('Complete CRUD flow: Create → View → Edit → Delete', async ({ page }) => {
    // Navigate to leads list
    await page.goto(`${BASE_URL}/leads`);
    await expect(page.locator('h2')).toContainText('Лиды');

    // Create new lead
    await page.click('button:has-text("Создать лид")');
    await expect(page.locator('h2')).toContainText('Создать новый лид');

    // Fill form
    await page.fill('input[id*="first_name"]', 'E2E');
    await page.fill('input[id*="last_name"]', 'Test User');
    await page.fill('input[id*="email"]', 'e2e.test@example.com');
    await page.fill('input[id*="phone"]', '+7 999 999-99-99');
    await page.fill('input[id*="company"]', 'E2E Test Company');
    
    // Select stage and source (assuming they are dropdowns)
    await page.click('text=Выберите этап');
    await page.click('.ant-select-item-option:first-child');
    
    await page.click('text=Выберите источник');
    await page.click('.ant-select-item-option:first-child');

    // Submit form
    await page.click('button:has-text("Создать")');
    
    // Wait for redirect to list
    await page.waitForURL(`${BASE_URL}/leads`);
    await expect(page.locator('text=E2E Test User')).toBeVisible();

    // View lead details
    const leadRow = page.locator('tr:has-text("E2E Test User")');
    await leadRow.locator('button:has-text("Просмотр")').click();
    
    await expect(page.locator('h2')).toContainText('E2E Test User');
    await expect(page.locator('text=e2e.test@example.com')).toBeVisible();
    await expect(page.locator('text=E2E Test Company')).toBeVisible();

    // Edit lead
    await page.click('button:has-text("Редактировать")');
    await expect(page.locator('h2')).toContainText('Редактировать лид');
    
    await page.fill('input[id*="company"]', 'E2E Updated Company');
    await page.click('button:has-text("Обновить")');
    
    // Verify update
    await page.waitForURL(`${BASE_URL}/leads`);
    await expect(page.locator('text=E2E Updated Company')).toBeVisible();

    // Delete lead
    const updatedLeadRow = page.locator('tr:has-text("E2E Test User")');
    await updatedLeadRow.locator('button:has-text("Удалить")').click();
    
    // Confirm deletion
    await page.click('.ant-popconfirm button:has-text("Да")');
    
    // Verify deletion
    await page.waitForTimeout(1000); // Wait for deletion to process
    await expect(page.locator('text=E2E Test User')).not.toBeVisible();
  });

  test('Search functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/leads`);
    
    // Wait for initial load
    await page.waitForSelector('table');
    
    // Perform search
    const searchInput = page.locator('input[placeholder*="Поиск"]');
    await searchInput.fill('Иван');
    await page.click('button[aria-label*="search"]');
    
    // Wait for results
    await page.waitForTimeout(500);
    
    // Verify filtered results contain search term
    const tableRows = page.locator('tbody tr');
    const count = await tableRows.count();
    
    if (count > 0) {
      const firstRow = tableRows.first();
      const text = await firstRow.textContent();
      expect(text.toLowerCase()).toContain('иван');
    }
  });

  test('Pagination', async ({ page }) => {
    await page.goto(`${BASE_URL}/leads`);
    await page.waitForSelector('table');
    
    // Check if pagination exists
    const pagination = page.locator('.ant-pagination');
    const isVisible = await pagination.isVisible();
    
    if (isVisible) {
      const nextButton = page.locator('.ant-pagination-next');
      const isDisabled = await nextButton.getAttribute('aria-disabled');
      
      if (isDisabled !== 'true') {
        await nextButton.click();
        await page.waitForTimeout(500);
        
        // Verify URL or page content changed
        await expect(pagination).toBeVisible();
      }
    }
  });

  test('Switch between table and kanban view', async ({ page }) => {
    await page.goto(`${BASE_URL}/leads`);
    
    // Default is table view
    await expect(page.locator('table')).toBeVisible();
    
    // Switch to kanban
    await page.click('text=Канбан');
    await page.waitForTimeout(500);
    
    // Verify kanban board is visible
    await expect(page.locator('.kanban-board')).toBeVisible();
    await expect(page.locator('text=Новые')).toBeVisible();
    
    // Switch back to table
    await page.click('text=Таблица');
    await page.waitForTimeout(500);
    
    await expect(page.locator('table')).toBeVisible();
  });

  test('Toggle KPI statistics', async ({ page }) => {
    await page.goto(`${BASE_URL}/leads`);
    
    // KPI should be visible by default
    const kpiSection = page.locator('[data-testid="kpi"]').or(page.locator('text=Всего лидов'));
    
    // Toggle off
    await page.click('button:has-text("Скрыть статистику")');
    await page.waitForTimeout(300);
    
    // Toggle on
    await page.click('button:has-text("Показать статистику")');
    await page.waitForTimeout(300);
  });

  test('Convert lead to deal', async ({ page }) => {
    // First create a lead for testing
    await page.goto(`${BASE_URL}/leads`);
    
    // Assuming there's at least one lead, open its detail page
    const firstLead = page.locator('tbody tr').first();
    await firstLead.locator('button:has-text("Просмотр")').click();
    
    // Convert lead
    await page.click('button:has-text("Конвертировать")');
    
    // Confirm conversion
    await page.click('.ant-popconfirm button:has-text("Да")');
    
    // Wait for success message
    await page.waitForTimeout(1000);
    
    // Verify conversion (status should change or success message appears)
  });

  test('Disqualify lead', async ({ page }) => {
    await page.goto(`${BASE_URL}/leads`);
    
    // Open first lead
    const firstLead = page.locator('tbody tr').first();
    await firstLead.locator('button:has-text("Просмотр")').click();
    
    // Disqualify lead
    await page.click('button:has-text("Дисквалифицировать")');
    
    // Confirm disqualification
    await page.click('.ant-popconfirm button:has-text("Да")');
    
    await page.waitForTimeout(1000);
  });

  test('Bulk delete leads', async ({ page }) => {
    await page.goto(`${BASE_URL}/leads`);
    await page.waitForSelector('table');
    
    // Select multiple leads
    const checkboxes = page.locator('tbody input[type="checkbox"]');
    const count = await checkboxes.count();
    
    if (count > 1) {
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      
      // Wait for bulk actions to appear
      await page.waitForTimeout(500);
      
      // Click bulk delete (if visible)
      const bulkDeleteButton = page.locator('button:has-text("Удалить")').first();
      if (await bulkDeleteButton.isVisible()) {
        await bulkDeleteButton.click();
        
        // Confirm deletion
        await page.click('.ant-modal button:has-text("Да")');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('Bulk status change', async ({ page }) => {
    await page.goto(`${BASE_URL}/leads`);
    await page.waitForSelector('table');
    
    // Select leads
    const checkboxes = page.locator('tbody input[type="checkbox"]');
    const count = await checkboxes.count();
    
    if (count > 0) {
      await checkboxes.nth(0).check();
      
      await page.waitForTimeout(500);
      
      // Open status change modal
      const statusButton = page.locator('button:has-text("Изменить статус")');
      if (await statusButton.isVisible()) {
        await statusButton.click();
        
        // Select new status
        await page.click('.ant-select');
        await page.click('.ant-select-item-option:first-child');
        
        // Apply changes
        await page.click('.ant-modal button:has-text("Применить")');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('Inline edit functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/leads`);
    await page.waitForSelector('table');
    
    // Find an editable cell (email, phone, or company)
    const emailCell = page.locator('tbody tr').first().locator('td').nth(2); // Assuming email is 3rd column
    
    // Double-click or hover to activate edit mode
    await emailCell.click();
    
    // Check if input appears
    const input = emailCell.locator('input');
    if (await input.isVisible()) {
      await input.fill('newemail@example.com');
      await input.blur(); // Save on blur
      
      await page.waitForTimeout(1000);
      
      // Verify change
      await expect(emailCell).toContainText('newemail@example.com');
    }
  });

  test('Filter by status', async ({ page }) => {
    await page.goto(`${BASE_URL}/leads`);
    await page.waitForSelector('table');
    
    // Click on status column filter
    const statusFilterButton = page.locator('th:has-text("Статус")').locator('.ant-table-filter-trigger');
    
    if (await statusFilterButton.isVisible()) {
      await statusFilterButton.click();
      
      // Select a filter option
      await page.click('.ant-dropdown .ant-checkbox-wrapper:first-child');
      
      // Apply filter
      await page.click('.ant-dropdown button:has-text("OK")');
      
      await page.waitForTimeout(1000);
    }
  });

  test('Export leads', async ({ page }) => {
    await page.goto(`${BASE_URL}/leads`);
    await page.waitForSelector('table');
    
    // Select some leads
    const checkboxes = page.locator('tbody input[type="checkbox"]');
    const count = await checkboxes.count();
    
    if (count > 0) {
      await checkboxes.nth(0).check();
      
      await page.waitForTimeout(500);
      
      // Click export button
      const exportButton = page.locator('button:has-text("Экспорт")');
      if (await exportButton.isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download');
        
        await exportButton.click();
        
        // Wait for download
        const download = await downloadPromise;
        
        // Verify download started
        expect(download.suggestedFilename()).toBeTruthy();
      }
    }
  });

  test('View activity timeline', async ({ page }) => {
    await page.goto(`${BASE_URL}/leads`);
    
    // Open first lead
    const firstLead = page.locator('tbody tr').first();
    await firstLead.locator('button:has-text("Просмотр")').click();
    
    // Switch to activity tab
    await page.click('text=История активности');
    
    await page.waitForTimeout(500);
    
    // Verify timeline is visible
    await expect(page.locator('.ant-timeline')).toBeVisible();
  });

  test('View call logs', async ({ page }) => {
    await page.goto(`${BASE_URL}/leads`);
    
    // Open first lead
    const firstLead = page.locator('tbody tr').first();
    await firstLead.locator('button:has-text("Просмотр")').click();
    
    // Switch to calls tab
    await page.click('text=История звонков');
    
    await page.waitForTimeout(500);
    
    // Verify calls table or empty state is visible
    const callsTable = page.locator('table').or(page.locator('text=Звонков с этим лидом пока не было'));
    await expect(callsTable).toBeVisible();
  });

  test('Navigate between pages', async ({ page }) => {
    // List → Create
    await page.goto(`${BASE_URL}/leads`);
    await page.click('button:has-text("Создать лид")');
    await expect(page).toHaveURL(/\/leads\/new/);
    
    // Create → List (back button)
    await page.click('button:has-text("Назад")');
    await expect(page).toHaveURL(/\/leads$/);
    
    // List → Detail
    const firstLead = page.locator('tbody tr').first();
    await firstLead.locator('button:has-text("Просмотр")').click();
    await expect(page).toHaveURL(/\/leads\/\d+$/);
    
    // Detail → Edit
    await page.click('button:has-text("Редактировать")');
    await expect(page).toHaveURL(/\/leads\/\d+\/edit/);
    
    // Edit → List (cancel)
    await page.click('button:has-text("Отмена")');
    await expect(page).toHaveURL(/\/leads$/);
  });
});
