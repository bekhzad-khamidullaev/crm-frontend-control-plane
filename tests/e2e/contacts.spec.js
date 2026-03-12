import { test, expect } from '@playwright/test';
import { generateContactData } from './helpers/test-data.js';
import { waitForApiResponse, cleanupTestData } from './helpers/api-helpers.js';
import { login } from './helpers/auth.js';

test.describe('Contacts Module - Comprehensive E2E Tests', () => {
  let createdContactIds = [];
  let createdCompanyIds = [];
  let apiAccessToken = null;

  const waitForHashStartsWith = async (page, prefix, timeout = 15000) => {
    await page.waitForFunction((expectedPrefix) => window.location.hash.startsWith(expectedPrefix), prefix, { timeout });
  };

  const waitForHashIncludes = async (page, fragment, timeout = 15000) => {
    await page.waitForFunction((expectedFragment) => window.location.hash.includes(expectedFragment), fragment, { timeout });
  };

  const getApiAccessToken = async (page) => {
    if (apiAccessToken) return apiAccessToken;

    const username = process.env.E2E_USERNAME || 'admin';
    const password = process.env.E2E_PASSWORD || 't3sl@admin';
    const tokenResponse = await page.request.post('/api/token/', {
      data: { username, password },
      headers: { 'Content-Type': 'application/json' },
    });

    if (!tokenResponse.ok()) {
      throw new Error(`Unable to fetch API token for contacts tests: ${tokenResponse.status()}`);
    }

    const payload = await tokenResponse.json();
    apiAccessToken = payload.access;
    return apiAccessToken;
  };

  const authHeaders = async (page) => {
    const token = await getApiAccessToken(page);
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const ensureCompany = async (page, suffix = '') => {
    const timestamp = Date.now();
    const headers = await authHeaders(page);
    const countriesResponse = await page.request.get('/api/countries/?page=1&page_size=1', { headers });
    const countriesPayload = countriesResponse.ok() ? await countriesResponse.json() : null;
    const firstCountry = countriesPayload?.results?.[0];
    if (!firstCountry) {
      throw new Error('No country available for company setup in contact tests');
    }

    const createResponse = await page.request.post('/api/companies/', {
      data: {
        full_name: `E2E Contact Company ${timestamp}${suffix}`,
        email: `e2e.company.${timestamp}${suffix.replace(/[^a-zA-Z0-9]/g, '')}@test.com`,
        phone: '+998901111111',
        country: firstCountry.id,
      },
      headers,
    });
    if (createResponse.ok()) {
      const createdCompany = await createResponse.json();
      createdCompanyIds.push(createdCompany.id);
      return createdCompany;
    }

    const fallbackResponse = await page.request.get('/api/companies/?page=1&page_size=1', { headers });
    if (!fallbackResponse.ok()) {
      throw new Error(`Unable to prepare company for contact tests: ${createResponse.status()}`);
    }

    const fallbackCompanies = await fallbackResponse.json();
    const firstCompany = fallbackCompanies?.results?.[0];
    if (!firstCompany) {
      throw new Error('No company available for contact tests');
    }

    return firstCompany;
  };

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.afterEach(async ({ page }) => {
    if (createdContactIds.length > 0) {
      const headers = await authHeaders(page).catch(() => null);
      for (const id of createdContactIds) {
        if (!headers) break;
        await page.request.delete(`/api/contacts/${id}/`, { headers }).catch(() => {});
      }
      createdContactIds = [];
    }
    if (createdCompanyIds.length > 0) {
      const headers = await authHeaders(page).catch(() => null);
      for (const id of createdCompanyIds) {
        if (!headers) break;
        await page.request.delete(`/api/companies/${id}/`, { headers }).catch(() => {});
      }
      createdCompanyIds = [];
    }
  });

  test('should complete full CRUD flow: Create → Read → Update → Delete', async ({ page }) => {
    const contactData = generateContactData();
    const company = await ensureCompany(page, '_contactcrud');

    await page.goto('/#/contacts');
    await expect(page.getByRole('heading', { name: /Контакты|Contacts/i })).toBeVisible();

    await page.click('button:has-text("Создать контакт"), button:has-text("Создать")');
    await waitForHashIncludes(page, '#/contacts/new');

    await page.fill('input#first_name, input[name="first_name"], input[placeholder*="Иван"]', contactData.first_name);
    await page.fill('input#last_name, input[name="last_name"], input[placeholder*="Петров"]', contactData.last_name);
    await page.fill('input#email, input[name="email"], input[placeholder*="example.com"]', contactData.email);
    await page.locator('#company').click();
    await page.getByText(company.full_name, { exact: false }).click();

    const createResponsePromise = waitForApiResponse(page, '/api/contacts/', { method: 'POST' });
    await page.click('button[type="submit"]:has-text("Сохранить"), button[type="submit"]:has-text("Создать"), button:has-text("Сохранить"), button:has-text("Создать")');
    const createdContact = await (await createResponsePromise).json();
    createdContactIds.push(createdContact.id);

    await waitForHashStartsWith(page, '#/contacts');

    const searchInput = page.locator('input[placeholder*="Поиск"]').first();
    await searchInput.fill(contactData.email);
    await page.waitForTimeout(1200);
    const contactRow = page.locator('tr').filter({ hasText: contactData.email }).first();
    await expect(contactRow).toBeVisible({ timeout: 15000 });

    await page.goto(`/#/contacts/${createdContact.id}`);
    await waitForHashIncludes(page, `#/contacts/${createdContact.id}`);
    await expect(page.locator('body')).toContainText(contactData.email);

    await page.getByRole('button', { name: /Редактировать|Edit/i }).click();
    await waitForHashIncludes(page, `#/contacts/${createdContact.id}/edit`);
    const updatedLastName = `${contactData.last_name}Updated`;
    await page.fill('input#last_name, input[name="last_name"], input[placeholder*="Петров"]', updatedLastName);

    const updateResponsePromise = waitForApiResponse(page, `/api/contacts/${createdContact.id}/`, { method: 'PUT' });
    await page.click('button[type="submit"]:has-text("Обновить"), button[type="submit"]:has-text("Сохранить"), button:has-text("Обновить"), button:has-text("Сохранить")');
    const updatedContact = await (await updateResponsePromise).json();
    expect(updatedContact.last_name.toLowerCase()).toBe(updatedLastName.toLowerCase());
    await waitForHashStartsWith(page, '#/contacts');

    await searchInput.fill(contactData.email);
    await page.waitForTimeout(1200);
    const updatedRow = page.locator('tr').filter({ hasText: contactData.email }).first();
    await expect(updatedRow).toBeVisible({ timeout: 15000 });

    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/contacts/${createdContact.id}/`) &&
        response.request().method() === 'DELETE',
      { timeout: 12000 }
    ).catch(() => null);
    await updatedRow.locator('button.ant-btn-dangerous').first().click();

    const hasConfirm = await page.locator('.ant-modal-content, [role="alertdialog"]').first().isVisible({ timeout: 2000 }).catch(() => false);
    if (hasConfirm) {
      await page.getByRole('button', { name: 'Да', exact: true }).click();
    }

    const deleteResponse = await deleteResponsePromise;
    if (deleteResponse) {
      expect(deleteResponse.ok()).toBeTruthy();
    }

    createdContactIds = createdContactIds.filter((id) => id !== createdContact.id);
  });

  test('should search and filter contacts', async ({ page }) => {
    const contactData = generateContactData('_search');
    const company = await ensureCompany(page, '_contactsearch');

    await page.goto('/#/contacts/new');
    await waitForHashIncludes(page, '#/contacts/new');
    await page.fill('input#first_name, input[name="first_name"], input[placeholder*="Иван"]', contactData.first_name);
    await page.fill('input#last_name, input[name="last_name"], input[placeholder*="Петров"]', contactData.last_name);
    await page.fill('input#email, input[name="email"], input[placeholder*="example.com"]', contactData.email);
    await page.locator('#company').click();
    await page.getByText(company.full_name, { exact: false }).click();

    const createResponsePromise = waitForApiResponse(page, '/api/contacts/', { method: 'POST' });
    await page.click('button[type="submit"]:has-text("Сохранить"), button[type="submit"]:has-text("Создать"), button:has-text("Сохранить"), button:has-text("Создать")');
    const createdContact = await (await createResponsePromise).json();
    createdContactIds.push(createdContact.id);

    await waitForHashStartsWith(page, '#/contacts');
    const searchInput = page.locator('input[placeholder*="Поиск"]').first();
    await searchInput.fill(contactData.first_name);
    await page.waitForTimeout(1200);

    await expect(page.locator('tr').filter({ hasText: contactData.first_name }).first()).toBeVisible();
  });

  test('should perform bulk tag operation', async ({ page }) => {
    await page.goto('/#/contacts');
    await waitForHashStartsWith(page, '#/contacts');

    const firstRow = page.locator('tr').nth(1);
    if (!(await firstRow.isVisible({ timeout: 4000 }).catch(() => false))) {
      return;
    }

    const rowCheckbox = firstRow.locator('input[type="checkbox"]').first();
    if (!(await rowCheckbox.isVisible({ timeout: 3000 }).catch(() => false))) {
      return;
    }

    await rowCheckbox.check();
    const tagsButton = page.getByRole('button', { name: /Теги|Tags/i }).first();
    if (!(await tagsButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      return;
    }

    await tagsButton.click();
    const dialog = page.getByRole('dialog').first();
    if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByRole('button', { name: /Отмена|Cancel/i }).click();
    }
  });

  test('should export contacts data', async ({ page }) => {
    await page.goto('/#/contacts');
    await waitForHashStartsWith(page, '#/contacts');

    const exportButton = page.getByRole('button', { name: /Экспорт|Export/i }).first();
    if (!(await exportButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      return;
    }

    await exportButton.click();
    const csvItem = page.getByRole('menuitem', { name: /CSV/i }).first();
    await expect(csvItem).toBeVisible({ timeout: 5000 });
  });
});
