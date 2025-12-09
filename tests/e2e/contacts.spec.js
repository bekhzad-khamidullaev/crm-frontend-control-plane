/**
 * E2E Tests for Contacts Module
 * 
 * These tests cover the complete user flow for working with contacts:
 * - Create → View → Edit → Delete
 * - Search and filtering
 * - Bulk actions
 * - Inline editing
 * 
 * Note: These tests require a running backend API or mock server
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

test.describe('Contacts Module E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/contacts`);
  });

  test('Complete CRUD flow: Create → View → Edit → Delete', async ({ page }) => {
    // Navigate to contacts list
    await expect(page.locator('h2')).toContainText('Контакты');

    // Create new contact
    await page.click('button:has-text("Создать контакт")');
    await expect(page.locator('h2')).toContainText('Создать новый контакт');

    // Fill form
    await page.fill('input[id*="first_name"]', 'E2E');
    await page.fill('input[id*="last_name"]', 'Test Contact');
    await page.fill('input[id*="email"]', 'e2e.contact@example.com');
    await page.fill('input[id*="phone"]', '+7 999 888-77-66');
    await page.fill('input[id*="company"]', 'E2E Test Company');
    await page.fill('input[id*="position"]', 'Test Manager');

    // Submit form
    await page.click('button:has-text("Создать")');
    
    // Wait for redirect to list
    await page.waitForURL(`${BASE_URL}/contacts`);
    await expect(page.locator('text=E2E Test Contact')).toBeVisible();

    // View contact details
    const contactRow = page.locator('tr:has-text("E2E Test Contact")');
    await contactRow.locator('button:has-text("Просмотр")').click();
    
    await expect(page.locator('h2')).toContainText('E2E Test Contact');
    await expect(page.locator('text=e2e.contact@example.com')).toBeVisible();
    await expect(page.locator('text=E2E Test Company')).toBeVisible();

    // Edit contact
    await page.click('button:has-text("Редактировать")');
    await expect(page.locator('h2')).toContainText('Редактировать контакт');
    
    await page.fill('input[id*="company"]', 'E2E Updated Company');
    await page.click('button:has-text("Обновить")');
    
    // Verify update
    await page.waitForURL(`${BASE_URL}/contacts`);
    await expect(page.locator('text=E2E Updated Company')).toBeVisible();

    // Delete contact
    const updatedContactRow = page.locator('tr:has-text("E2E Test Contact")');
    await updatedContactRow.locator('button:has-text("Удалить")').click();
    
    // Confirm deletion
    await page.click('.ant-popconfirm button:has-text("Да")');
    
    // Verify deletion
    await page.waitForTimeout(1000);
    await expect(page.locator('text=E2E Test Contact')).not.toBeVisible();
  });

  test('Search functionality', async ({ page }) => {
    await page.waitForSelector('table');
    
    const searchInput = page.locator('input[placeholder*="Поиск"]');
    await searchInput.fill('Анна');
    await page.click('button[aria-label*="search"]');
    
    await page.waitForTimeout(500);
    
    const tableRows = page.locator('tbody tr');
    const count = await tableRows.count();
    
    if (count > 0) {
      const firstRow = tableRows.first();
      const text = await firstRow.textContent();
      expect(text.toLowerCase()).toContain('анна');
    }
  });

  test('Pagination', async ({ page }) => {
    await page.waitForSelector('table');
    
    const pagination = page.locator('.ant-pagination');
    const isVisible = await pagination.isVisible();
    
    if (isVisible) {
      const nextButton = page.locator('.ant-pagination-next');
      const isDisabled = await nextButton.getAttribute('aria-disabled');
      
      if (isDisabled !== 'true') {
        await nextButton.click();
        await page.waitForTimeout(500);
        await expect(pagination).toBeVisible();
      }
    }
  });

  test('Toggle KPI statistics', async ({ page }) => {
    const kpiSection = page.locator('[data-testid="kpi"]').or(page.locator('text=Всего контактов'));
    
    await page.click('button:has-text("Скрыть статистику")');
    await page.waitForTimeout(300);
    
    await page.click('button:has-text("Показать статистику")');
    await page.waitForTimeout(300);
  });

  test('Inline edit functionality', async ({ page }) => {
    await page.waitForSelector('table');
    
    const emailCell = page.locator('tbody tr').first().locator('td').nth(2);
    await emailCell.click();
    
    const input = emailCell.locator('input');
    if (await input.isVisible()) {
      await input.fill('newemail@example.com');
      await input.blur();
      
      await page.waitForTimeout(1000);
      await expect(emailCell).toContainText('newemail@example.com');
    }
  });

  test('Bulk delete contacts', async ({ page }) => {
    await page.waitForSelector('table');
    
    const checkboxes = page.locator('tbody input[type="checkbox"]');
    const count = await checkboxes.count();
    
    if (count > 1) {
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      
      await page.waitForTimeout(500);
      
      const bulkDeleteButton = page.locator('button:has-text("Удалить")').first();
      if (await bulkDeleteButton.isVisible()) {
        await bulkDeleteButton.click();
        await page.click('.ant-modal button:has-text("Да")');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('Filter by type', async ({ page }) => {
    await page.waitForSelector('table');
    
    const typeFilterButton = page.locator('th:has-text("Тип")').locator('.ant-table-filter-trigger');
    
    if (await typeFilterButton.isVisible()) {
      await typeFilterButton.click();
      await page.click('.ant-dropdown .ant-checkbox-wrapper:first-child');
      await page.click('.ant-dropdown button:has-text("OK")');
      await page.waitForTimeout(1000);
    }
  });

  test('Export contacts', async ({ page }) => {
    await page.waitForSelector('table');
    
    const checkboxes = page.locator('tbody input[type="checkbox"]');
    const count = await checkboxes.count();
    
    if (count > 0) {
      await checkboxes.nth(0).check();
      await page.waitForTimeout(500);
      
      const exportButton = page.locator('button:has-text("Экспорт")');
      if (await exportButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBeTruthy();
      }
    }
  });

  test('View call logs', async ({ page }) => {
    const firstContact = page.locator('tbody tr').first();
    await firstContact.locator('button:has-text("Просмотр")').click();
    
    await page.click('text=История звонков');
    await page.waitForTimeout(500);
    
    const callsTable = page.locator('table').or(page.locator('text=Звонков с этим контактом пока не было'));
    await expect(callsTable).toBeVisible();
  });

  test('Navigate between pages', async ({ page }) => {
    // List → Create
    await page.click('button:has-text("Создать контакт")');
    await expect(page).toHaveURL(/\/contacts\/new/);
    
    // Create → List (back button)
    await page.click('button:has-text("Назад")');
    await expect(page).toHaveURL(/\/contacts$/);
    
    // List → Detail
    const firstContact = page.locator('tbody tr').first();
    await firstContact.locator('button:has-text("Просмотр")').click();
    await expect(page).toHaveURL(/\/contacts\/\d+$/);
    
    // Detail → Edit
    await page.click('button:has-text("Редактировать")');
    await expect(page).toHaveURL(/\/contacts\/\d+\/edit/);
    
    // Edit → List (cancel)
    await page.click('button:has-text("Отмена")');
    await expect(page).toHaveURL(/\/contacts$/);
  });
});
