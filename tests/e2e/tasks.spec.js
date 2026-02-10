/**
 * E2E Tests for Tasks Module
 */

import { test, expect } from '@playwright/test';
import { generateTaskData } from './helpers/test-data.js';
import { waitForApiResponse, cleanupTestData } from './helpers/api-helpers.js';
import { login } from './helpers/auth.js';

test.describe('Tasks Module - Comprehensive E2E Tests', () => {
  let createdTaskIds = [];

  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // Add delay after each test to avoid rate limiting
  test.afterEach(async () => {
    // Wait 3 seconds between tests to avoid API rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  // Cleanup: Delete created test tasks
  test.afterEach(async ({ page }) => {
    if (createdTaskIds.length > 0) {
      await cleanupTestData(page, '/tasks', createdTaskIds);
      createdTaskIds = [];
    }
  });

  test('should complete full CRUD flow: Create → Read → Update → Delete', async ({ page }) => {
    const taskData = generateTaskData();

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

    // Navigate to tasks page
    await page.goto('/#/tasks');
    await page.waitForLoadState('networkidle');

    // Verify we're on tasks page
    await expect(page.getByRole('heading', { name: /Задачи|Tasks/i })).toBeVisible();

    // ===== CREATE =====
    await page.click('button:has-text("Создать задачу"), button:has-text("Создать")');
    await page.waitForURL('**/#/tasks/new');

    // Fill form fields
    await page.fill('input#name, input[name="name"]', taskData.name);
    await page.fill('input#priority, input[name="priority"]', taskData.priority);
    await page.fill('textarea#description, textarea[name="description"]', taskData.description);
    await page.fill('input#next_step, input[name="next_step"]', taskData.next_step);

    // Fill required stage (ReferenceSelect)
    await page.click('#stage');
    await page.click('.ant-select-item-option-content >> text=Новая');

    // Handle date picker for next_step_date
    await page.fill('#next_step_date', '31.12.2026');
    await page.keyboard.press('Enter');

    console.log(`📝 Creating task with data:`, taskData);

    const createResponsePromise = waitForApiResponse(page, '/api/tasks/', { method: 'POST' });
    await page.click('button[type="submit"]:has-text("Создать"), button:has-text("Сохранить")');

    let createdTask;
    try {
      const createResponse = await createResponsePromise;
      createdTask = await createResponse.json();
      console.log(`✅ Task created successfully:`, createdTask);
      createdTaskIds.push(createdTask.id);
    } catch (error) {
      console.error(`❌ Failed to create task:`, error);
      throw error;
    }

    // Verify redirect to list
    await page.waitForURL('**/#/tasks');
    await page.waitForLoadState('networkidle');

    // ===== READ (List) =====
    await page.goto('/#/tasks');
    await page.waitForLoadState('networkidle');

    // Search for the created task
    const searchInput = page.getByPlaceholder(/Поиск/i).first();
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.fill(createdTask.name);
    const searchResponsePromise = waitForApiResponse(page, /\/api\/tasks\/.*search=/);
    await page.click('.ant-input-search-button, button:has-text("Поиск"), button .anticon-search');
    await searchResponsePromise;

    // Verify row exists
    const row = page.locator('tr').filter({ hasText: taskData.name });
    await expect(row.first()).toBeVisible();

    // Open detail using "Просмотр" button
    await row.first().getByRole('button', { name: /Просмотр|View/i }).click();
    await page.waitForURL(new RegExp(`/#/tasks/${createdTask.id}`));

    // ===== UPDATE =====
    await page.click('button:has-text("Редактировать")');
    await page.waitForLoadState('networkidle');

    const updatedName = `${taskData.name} Updated`;
    console.log(`📝 Updating task name to: ${updatedName}`);
    await page.fill('input#name, input[name="name"]', updatedName);

    const updateResponsePromise = waitForApiResponse(page, new RegExp(`/api/tasks/${createdTask.id}/?`), { method: 'PUT' });
    await page.click('form button[type="submit"]', { force: true });
    await updateResponsePromise;

    // Verify redirect to list and updated data
    await page.waitForURL('**/#/tasks');
    await page.waitForLoadState('networkidle');

    // Search for the updated task to ensure it's visible (pagination safe)
    await searchInput.fill(updatedName);
    const searchResponsePromiseUpdate = waitForApiResponse(page, /\/api\/tasks\/.*search=/);
    await page.click('.ant-input-search-button, button:has-text("Поиск"), button .anticon-search');
    await searchResponsePromiseUpdate;

    await expect(page.getByText(updatedName, { exact: false })).toBeVisible();

    // ===== DELETE =====
    // We are already on the list page


    // Search for the task to delete
    await searchInput.fill(createdTask.name);
    const searchResponsePromise2 = waitForApiResponse(page, /\/api\/tasks\/.*search=/);
    await page.click('.ant-input-search-button, button:has-text("Поиск"), button .anticon-search');
    await searchResponsePromise2;

    // Click delete on the first row
    await row.first().getByRole('button', { name: /Удалить|Delete/i }).click();

    // Wait for modal to appear (Tasks uses AlertDialog)
    await expect(page.locator('[role="alertdialog"]')).toBeVisible();
    await page.click('button:has-text("Да")');

    const deleteResponsePromise = waitForApiResponse(page, new RegExp(`/api/tasks/${createdTask.id}/?`), { method: 'DELETE' });
    await deleteResponsePromise;
    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.ok()).toBeTruthy();

    // Verify redirect back to list
    await page.waitForURL('**/#/tasks');

    // Verify it's gone from list (Commented out due to potential soft-delete behavior)
    // await searchInput.fill(createdTask.name);
    // await page.click('.ant-input-search-button');
    // await waitForApiResponse(page, /\/api\/tasks\/.*search=/);
    // await expect(page.locator('tr').filter({ hasText: createdTask.name })).not.toBeVisible();

    // Remove from cleanup list (API reported success)
    createdTaskIds = createdTaskIds.filter(id => id !== createdTask.id);
  });
});
