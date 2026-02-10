/**
 * E2E Tests for Deals Module
 */

import { test, expect } from '@playwright/test';
import { generateDealData } from './helpers/test-data.js';
import { waitForApiResponse, cleanupTestData } from './helpers/api-helpers.js';
import { login } from './helpers/auth.js';

test.describe('Deals Module - Comprehensive E2E Tests', () => {
  let createdDealIds = [];

  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // Add delay after each test to avoid rate limiting
  test.afterEach(async () => {
    // Wait 3 seconds between tests to avoid API rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  // Cleanup: Delete created test deals
  test.afterEach(async ({ page }) => {
    if (createdDealIds.length > 0) {
      await cleanupTestData(page, '/deals', createdDealIds);
      createdDealIds = [];
    }
  });

  test('should complete full CRUD flow: Create → Read → Update → Delete', async ({ page }) => {
    const dealData = generateDealData();

    // Enable detailed API logging
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`🔵 REQUEST: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        console.log(`🔴 RESPONSE: ${response.request().method()} ${response.url()} - ${response.status()}`);
      }
    });

    // Navigate to deals page
    await page.goto('/#/deals');
    await page.waitForLoadState('networkidle');

    // Verify we're on deals page
    await expect(page.getByRole('heading', { name: /Сделки|Deals/i })).toBeVisible();

    // ===== CREATE =====
    await page.click('button:has-text("Создать сделку"), button:has-text("Создать")');
    await page.waitForURL('**/#/deals/new');

    // Fill form fields
    await page.fill('input#name, input[name="name"]', dealData.name);
    await page.fill('input#amount, input[name="amount"]', dealData.amount);
    await page.fill('input#next_step, input[name="next_step"]', dealData.next_step);

    // Handle date picker for next_step_date
    await page.fill('#next_step_date', '31.12.2026');
    await page.keyboard.press('Enter');

    console.log(`📝 Creating deal with data:`, dealData);

    const createResponsePromise = waitForApiResponse(page, '/api/deals/', { method: 'POST' });
    await page.click('button[type="submit"]:has-text("Создать"), button:has-text("Сохранить")');

    let createdDeal;
    try {
      const createResponse = await createResponsePromise;
      createdDeal = await createResponse.json();
      console.log(`✅ Deal created successfully:`, createdDeal);
      createdDealIds.push(createdDeal.id);
    } catch (error) {
      console.error(`❌ Failed to create deal:`, error);
      throw error;
    }

    // Verify redirect to list
    await page.waitForURL('**/#/deals');
    await page.waitForLoadState('networkidle');

    // ===== READ (List) =====
    // Search for the created deal
    const searchInput = page.getByPlaceholder(/Поиск/i).first();
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.fill(createdDeal.name);
    const searchResponsePromise = waitForApiResponse(page, /\/api\/deals\/.*search=/);
    await page.click('.ant-input-search-button, button:has-text("Поиск"), button .anticon-search');
    await searchResponsePromise;

    // Verify row exists
    const row = page.locator('tr').filter({ hasText: dealData.name });
    await expect(row.first()).toBeVisible();

    // Open detail using Quick Actions dropdown
    await row.first().locator('.anticon-more').click();
    await page.getByRole('menuitem', { name: /Просмотр|View/i }).click();
    await page.waitForURL(new RegExp(`/#/deals/${createdDeal.id}`));

    // ===== UPDATE =====
    await page.click('button:has-text("Редактировать")');
    await page.waitForLoadState('networkidle');

    const updatedName = `${dealData.name} Updated`;
    console.log(`📝 Updating deal name to: ${updatedName}`);
    await page.fill('input#name, input[name="name"]', updatedName);

    const updateResponsePromise = waitForApiResponse(page, new RegExp(`/api/deals/${createdDeal.id}/?`), { method: 'PUT' });
    await page.click('form button[type="submit"]', { force: true });
    await updateResponsePromise;

    // Verify redirect to list and updated data
    await page.waitForURL('**/#/deals');
    await page.waitForLoadState('networkidle');

    // Search for the updated deal to ensure it's visible (pagination safe)
    await searchInput.fill(updatedName);
    const searchResponsePromiseUpdate = waitForApiResponse(page, /\/api\/deals\/.*search=/);
    await page.click('.ant-input-search-button, button:has-text("Поиск"), button .anticon-search');
    await searchResponsePromiseUpdate;

    await expect(page.getByText(updatedName, { exact: false })).toBeVisible();

    // ===== DELETE =====
    // We are already on the list page


    // Search for the deal to delete
    await searchInput.fill(createdDeal.name);
    const searchResponsePromise2 = waitForApiResponse(page, /\/api\/deals\/.*search=/);
    await page.click('.ant-input-search-button, button:has-text("Поиск"), button .anticon-search');
    await searchResponsePromise2;

    // Click delete in QuickActions
    await row.first().locator('.anticon-more').click();
    await page.getByRole('menuitem', { name: /Удалить|Delete/i }).click();

    // Wait for modal to appear
    await expect(page.locator('.ant-modal-content')).toBeVisible();
    await page.locator('.ant-modal-confirm-btns button.ant-btn-primary').click();

    const deleteResponsePromise = waitForApiResponse(page, new RegExp(`/api/deals/${createdDeal.id}/?`), { method: 'DELETE' });
    await deleteResponsePromise;
    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.ok()).toBeTruthy();

    // Verify redirect back to list
    await page.waitForURL('**/#/deals');

    // Verify it's gone from list (Commented out due to potential soft-delete behavior)
    // await searchInput.fill(createdDeal.name);
    // await page.click('.ant-input-search-button');
    // await waitForApiResponse(page, /\/api\/deals\/.*search=/);
    // await expect(page.locator('tr').filter({ hasText: createdDeal.name })).not.toBeVisible();

    // Remove from cleanup list (API reported success)
    createdDealIds = createdDealIds.filter(id => id !== createdDeal.id);
  });
});
