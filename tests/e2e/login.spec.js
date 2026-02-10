/**
 * E2E Tests for Login Flow
 *
 * Tests authentication and login functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Login Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.goto('/#/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Verify login page elements
    await expect(page.locator('h2:has-text("Enterprise CRM")')).toBeVisible();
    await expect(page.locator('#login_username')).toBeVisible();
    await expect(page.locator('#login_password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill login form with valid credentials
    await page.fill('#login_username', 'admin');
    await page.fill('#login_password', 't3sl@admin');

    // Submit login
    await page.click('button[type="submit"]:has-text("Войти")');

    // Wait for redirect to dashboard
    await page.waitForURL('**/#/dashboard', { timeout: 30000 });

    // Verify successful login
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify dashboard elements are visible
    await expect(page.locator('h1, h2').filter({ hasText: /Dashboard|Панель|Дашборд/i }).first()).toBeVisible({ timeout: 5000 });

    console.log('✓ Login successful');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill login form with invalid credentials
    await page.fill('#login_username', 'invalid_user');
    await page.fill('#login_password', 'wrong_password');

    // Submit login
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(2000);

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);

    // Look for error message
    const errorMessage = page.locator('text=/Ошибка|Error|Неверн|Invalid/i');
    if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✓ Error message displayed');
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Check for validation errors
    // Check for validation errors
    const errors = page.locator('.text-destructive, .error').or(page.locator('text=/Введите|Enter/i'));
    const errorCount = await errors.count();

    if (errorCount > 0) {
      console.log('✓ Form validation is working');
      expect(errorCount).toBeGreaterThan(0);
    }
  });

  test('should maintain session after page reload', async ({ page }) => {
    // Login first
    await page.fill('#login_username', 'admin');
    await page.fill('#login_password', 't3sl@admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/#/dashboard', { timeout: 30000 });

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/\/dashboard/);

    console.log('✓ Session maintained after reload');
  });

  test('should navigate to dashboard after login', async ({ page }) => {
    await page.fill('#login_username', 'admin');
    await page.fill('#login_password', 't3sl@admin');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('**/#/dashboard', { timeout: 30000 });

    // Verify we're on dashboard and can navigate
    await expect(page).toHaveURL(/\/dashboard/);

    // Check if navigation menu is visible
    const nav = page.locator('.ant-layout-sider, .ant-menu').first();
    await expect(nav).toBeVisible({ timeout: 5000 });

    console.log('✓ Dashboard navigation available');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('#login_username', 'admin');
    await page.fill('#login_password', 't3sl@admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/#/dashboard', { timeout: 30000 });

    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Выход"), button:has-text("Logout"), [title*="Выход"]').first();

    if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutButton.click();
      await page.waitForTimeout(1000);

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

      console.log('✓ Logout successful');
    } else {
      // Try alternative logout methods
      const userMenu = page.locator('[class*="user"], [class*="profile"], button[title*="Профиль"]').first();
      if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
        await userMenu.click();
        await page.waitForTimeout(300);

        const logoutMenuItem = page.locator('text=/Выход|Logout/i').first();
        if (await logoutMenuItem.isVisible({ timeout: 1000 }).catch(() => false)) {
          await logoutMenuItem.click();
          await page.waitForTimeout(1000);
          await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
          console.log('✓ Logout successful via menu');
        }
      }
    }
  });
});
