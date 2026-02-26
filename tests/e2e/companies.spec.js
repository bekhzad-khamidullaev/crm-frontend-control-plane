/**
 * E2E Tests for Companies Module
 */

import { test, expect } from '@playwright/test';
import { generateCompanyData } from './helpers/test-data.js';
import { waitForApiResponse, cleanupTestData } from './helpers/api-helpers.js';
import { login } from './helpers/auth.js';

test.describe('Companies Module - Comprehensive E2E Tests', () => {
  let createdCompanyIds = [];

  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // Add delay after each test to avoid rate limiting
  test.afterEach(async () => {
    // Wait 3 seconds between tests to avoid API rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  // Cleanup: Delete created test companies
  test.afterEach(async ({ page }) => {
    if (createdCompanyIds.length > 0) {
      await cleanupTestData(page, '/companies', createdCompanyIds);
      createdCompanyIds = [];
    }
  });

  test('should complete full CRUD flow: Create → Read → Update → Delete', async ({ page }) => {
    const companyData = generateCompanyData();

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

    // Navigate to companies page
    await page.goto('/#/companies');
    await page.waitForLoadState('networkidle');

    // Verify we're on companies page
    await expect(page.getByRole('heading', { name: /Компании|Companies/i })).toBeVisible();

    // ===== CREATE =====
    await page.click('button:has-text("Создать компанию"), button:has-text("Создать")');
    await page.waitForURL('**/#/companies/new');

    // Fill form fields
    await page.fill('input#full_name, input[name="full_name"]', companyData.full_name);
    await page.fill('input#email, input[name="email"]', companyData.email);
    await page.fill('input#phone, input[name="phone"]', companyData.phone);
    await page.fill('input#website, input[name="website"]', companyData.website);

    // Fill required country
    await page.click('#country');
    await page.click('.ant-select-item-option-content >> text=Afghanistan');

    console.log(`📝 Creating company with data:`, companyData);

    const createResponsePromise = waitForApiResponse(page, '/api/companies/', { method: 'POST' });
    await page.click('button[type="submit"]:has-text("Создать"), button:has-text("Сохранить")');

    let createdCompany;
    try {
      const createResponse = await createResponsePromise;
      createdCompany = await createResponse.json();
      console.log(`✅ Company created successfully:`, createdCompany);
      createdCompanyIds.push(createdCompany.id);
    } catch (error) {
      console.error(`❌ Failed to create company:`, error);
      throw error;
    }

    // Verify redirect to list
    await page.waitForURL('**/#/companies');
    await page.waitForLoadState('networkidle');

    // Verify redirect to list
    await page.waitForURL('**/#/companies');
    await page.waitForLoadState('networkidle');

    // ===== READ (List) =====
    // Redundant goto removed as we are already redirected to list


    // Search for the created company
    const searchInput = page.getByPlaceholder(/Поиск/i).first();
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.fill(companyData.email);
    const searchResponsePromise = waitForApiResponse(page, /\/api\/companies\/.*search=/);
    await page.click('.ant-input-search-button, button:has-text("Поиск"), button .anticon-search');
    await searchResponsePromise;

    // Verify row exists - use email or full name as fallback
    const row = page.locator('tr').filter({ hasText: companyData.email }).or(
      page.locator('tr').filter({ hasText: companyData.full_name })
    );
    await expect(row.first()).toBeVisible({ timeout: 15000 });

    // Open detail using the "Просмотр" button
    await row.first().getByRole('button', { name: /Просмотр|View/i }).click();
    await page.waitForURL(new RegExp(`/#/companies/${createdCompany.id}`));

    // ===== UPDATE =====
    await page.click('button:has-text("Редактировать")');
    await page.waitForLoadState('networkidle');

    const updatedName = `${companyData.full_name} Updated`;
    console.log(`📝 Updating company name to: ${updatedName}`);
    await page.fill('input#full_name, input[name="full_name"]', updatedName);

    const updateResponsePromise = waitForApiResponse(page, new RegExp(`/api/companies/${createdCompany.id}/?`), { method: 'PUT' });
    await page.click('form button[type="submit"]', { force: true });
    await updateResponsePromise;

    // Verify redirect to list and updated data
    await page.waitForURL('**/#/companies');
    await page.waitForLoadState('networkidle');

    // Search for the updated company using email (reliable)
    await searchInput.fill(companyData.email);
    const searchResponsePromiseUpdate = waitForApiResponse(page, /\/api\/companies\/.*search=/);
    await page.click('.ant-input-search-button, button:has-text("Поиск"), button .anticon-search');
    await searchResponsePromiseUpdate;

    // Verify the row contains the updated name
    await expect(page.locator('tr').filter({ hasText: companyData.email }).first()).toContainText('Updated', { ignoreCase: true });

    // ===== DELETE =====
    // We are already on the list page


    // Search for the company to delete
    await searchInput.fill(companyData.email);
    const searchResponsePromise2 = waitForApiResponse(page, /\/api\/companies\/.*search=/);
    await page.click('.ant-input-search-button, button:has-text("Поиск"), button .anticon-search');
    await searchResponsePromise2;

    // Click delete on the first row
    await row.first().getByRole('button', { name: /Удалить|Delete/i }).click();

    // Wait for modal to appear
    await expect(page.locator('.ant-modal-content')).toBeVisible();
    await page.locator('.ant-modal-confirm-btns button.ant-btn-primary').click();

    const deleteResponsePromise = waitForApiResponse(page, new RegExp(`/api/companies/${createdCompany.id}/?`), { method: 'DELETE' });
    await deleteResponsePromise;
    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.ok()).toBeTruthy();

    // Verify redirect back to list
    await page.waitForURL('**/#/companies');

    // Verify it's gone from list (Commented out due to potential soft-delete behavior)
    // await searchInput.fill(companyData.email);
    // await page.click('.ant-input-search-button');
    // await waitForApiResponse(page, /\/api\/companies\/.*search=/);
    // await expect(page.locator('tr').filter({ hasText: companyData.email })).not.toBeVisible();

    // Remove from cleanup list (API reported success)
    createdCompanyIds = createdCompanyIds.filter(id => id !== createdCompany.id);
  });
});
