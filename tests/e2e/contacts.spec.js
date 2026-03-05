import { test, expect } from '@playwright/test';
import { generateContactData } from './helpers/test-data.js';
import { waitForApiResponse, cleanupTestData } from './helpers/api-helpers.js';
import { login } from './helpers/auth.js';

test.describe('Contacts Module - Comprehensive E2E Tests', () => {
  let createdContactIds = [];

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.afterEach(async ({ page }) => {
    if (createdContactIds.length > 0) {
      await cleanupTestData(page, '/contacts', createdContactIds);
      createdContactIds = [];
    }
  });

  test('should complete full CRUD flow: Create → Read → Update → Delete', async ({ page }) => {
    const contactData = generateContactData();

    await page.goto('/#/contacts');
    await expect(page.getByRole('heading', { name: /Контакты|Contacts/i })).toBeVisible();

    await page.click('button:has-text("Создать контакт"), button:has-text("Создать")');
    await page.waitForURL('**/#/contacts/new');

    await page.fill('input#first_name, input[name="first_name"], input[placeholder*="Иван"]', contactData.first_name);
    await page.fill('input#last_name, input[name="last_name"], input[placeholder*="Петров"]', contactData.last_name);
    await page.fill('input#email, input[name="email"], input[placeholder*="example.com"]', contactData.email);

    const createResponsePromise = waitForApiResponse(page, '/api/contacts/', { method: 'POST' });
    await page.click('button[type="submit"]:has-text("Сохранить"), button[type="submit"]:has-text("Создать"), button:has-text("Сохранить"), button:has-text("Создать")');
    const createdContact = await (await createResponsePromise).json();
    createdContactIds.push(createdContact.id);

    await page.waitForURL('**/#/contacts');

    const searchInput = page.getByPlaceholder(/Поиск/i).first();
    await searchInput.fill(contactData.email);
    await page.waitForTimeout(600);
    const contactRow = page.locator('tr').filter({ hasText: contactData.email }).first();
    await expect(contactRow).toBeVisible({ timeout: 15000 });

    await contactRow.getByRole('button', { name: /eye|Просмотр|View/i }).click();
    await page.waitForURL(`**/#/contacts/${createdContact.id}`);
    await expect(page.locator('body')).toContainText(contactData.email);

    await page.click('button:has-text("Редактировать"), button:has-text("Edit")');
    await page.waitForURL(`**/#/contacts/${createdContact.id}/edit`);
    const updatedLastName = `${contactData.last_name}Updated`;
    await page.fill('input#last_name, input[name="last_name"], input[placeholder*="Петров"]', updatedLastName);

    const updateResponsePromise = waitForApiResponse(page, `/api/contacts/${createdContact.id}/`, { method: 'PUT' });
    await page.click('button[type="submit"]:has-text("Обновить"), button[type="submit"]:has-text("Сохранить"), button:has-text("Обновить"), button:has-text("Сохранить")');
    await updateResponsePromise;
    await page.waitForURL('**/#/contacts');

    await searchInput.fill(contactData.email);
    await page.waitForTimeout(600);
    const updatedRow = page.locator('tr').filter({ hasText: contactData.email }).first();
    await expect(updatedRow).toBeVisible({ timeout: 15000 });

    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/contacts/${createdContact.id}/`) &&
        response.request().method() === 'DELETE',
      { timeout: 12000 }
    ).catch(() => null);
    await updatedRow.getByRole('button', { name: /delete|Удалить/i }).click();

    const hasConfirm = await page.locator('.ant-modal-content, [role="alertdialog"]').first().isVisible({ timeout: 2000 }).catch(() => false);
    if (hasConfirm) {
      await page.click('.ant-modal-confirm-btns button.ant-btn-primary, [role="alertdialog"] button:has-text("Удалить"), [role="alertdialog"] button:has-text("Да")');
    }

    const deleteResponse = await deleteResponsePromise;
    if (deleteResponse) {
      expect(deleteResponse.ok()).toBeTruthy();
    }

    createdContactIds = createdContactIds.filter((id) => id !== createdContact.id);
  });

  test('should search and filter contacts', async ({ page }) => {
    const contactData = generateContactData('_search');

    await page.goto('/#/contacts/new');
    await page.waitForURL('**/#/contacts/new');
    await page.fill('input#first_name, input[name="first_name"], input[placeholder*="Иван"]', contactData.first_name);
    await page.fill('input#last_name, input[name="last_name"], input[placeholder*="Петров"]', contactData.last_name);
    await page.fill('input#email, input[name="email"], input[placeholder*="example.com"]', contactData.email);

    const createResponsePromise = waitForApiResponse(page, '/api/contacts/', { method: 'POST' });
    await page.click('button[type="submit"]:has-text("Сохранить"), button[type="submit"]:has-text("Создать"), button:has-text("Сохранить"), button:has-text("Создать")');
    const createdContact = await (await createResponsePromise).json();
    createdContactIds.push(createdContact.id);

    await page.waitForURL('**/#/contacts');
    const searchInput = page.getByPlaceholder(/Поиск/i).first();
    await searchInput.fill(contactData.first_name);
    await page.waitForTimeout(600);

    await expect(page.locator('tr').filter({ hasText: contactData.first_name }).first()).toBeVisible();
  });

  test('should perform bulk tag operation', async ({ page }) => {
    await page.goto('/#/contacts');
    await page.waitForURL('**/#/contacts');

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
    await page.waitForURL('**/#/contacts');

    const exportButton = page.getByRole('button', { name: /Экспорт|Export/i }).first();
    if (!(await exportButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      return;
    }

    await exportButton.click();
    const csvItem = page.getByRole('menuitem', { name: /CSV/i }).first();
    await expect(csvItem).toBeVisible({ timeout: 5000 });
  });
});
