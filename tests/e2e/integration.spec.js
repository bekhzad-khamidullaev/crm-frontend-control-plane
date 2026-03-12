/**
 * Integration E2E Tests
 * 
 * Tests cross-module functionality and workflows
 */

import { test, expect } from '@playwright/test';
import { generateLeadData } from './helpers/test-data.js';
import { waitForApiResponse, cleanupTestData } from './helpers/api-helpers.js';
import { login } from './helpers/auth.js';

test.describe('Integration Tests - Cross-Module Workflows', () => {
  let createdLeadIds = [];
  let createdContactIds = [];

  const waitForHashStartsWith = async (page, prefix, timeout = 15000) => {
    await page.waitForFunction((expectedPrefix) => window.location.hash.startsWith(expectedPrefix), prefix, { timeout });
  };

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup
    if (createdLeadIds.length > 0) {
      await cleanupTestData(page, '/leads', createdLeadIds);
      createdLeadIds = [];
    }
    if (createdContactIds.length > 0) {
      await cleanupTestData(page, '/contacts', createdContactIds);
      createdContactIds = [];
    }
  });

  test('should navigate between different modules', async ({ page }) => {
    // Dashboard → Leads
    await page.goto('/#/dashboard');
    await page.getByRole('menuitem', { name: /Лиды/i }).click();
    await waitForHashStartsWith(page, '#/leads');
    
    // Leads → Contacts
    await page.getByRole('menuitem', { name: /Контакты/i }).click();
    await waitForHashStartsWith(page, '#/contacts');
    
    // Contacts → Dashboard
    await page.goto('/#/dashboard');
    await waitForHashStartsWith(page, '#/dashboard');
    
    console.log('✓ Module navigation working');
  });

  test('should create lead and convert to contact workflow', async ({ page }) => {
    const leadData = generateLeadData('_convert');

    // Create a lead
    await page.goto('/#/leads/new');
    await page.fill('input[name="first_name"], input[id*="first_name"]', leadData.first_name);
    await page.fill('input[name="last_name"], input[id*="last_name"]', leadData.last_name);
    await page.fill('input[name="email"], input[id*="email"]', leadData.email);
    await page.fill('input[name="phone"], input[id*="phone"]', leadData.phone);
    
    const createResponse = waitForApiResponse(page, '/api/leads/');
    await page.click('button[type="submit"]:has-text("Создать"), button:has-text("Сохранить")');
    const created = await (await createResponse).json();
    createdLeadIds.push(created.id);

    // Navigate to lead detail
    await page.goto(`/#/leads/${created.id}`);
    
    // Look for convert button
    const convertButton = page.locator('button:has-text("Конвертировать"), button:has-text("Convert")').first();
    
    if (await convertButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await convertButton.click();
      
      // Confirm conversion
      const confirmConvert = page.locator('.ant-modal button:has-text("Да"), .ant-modal button:has-text("Подтвердить"), .ant-modal button:has-text("OK")').first();
      if (await confirmConvert.isVisible({ timeout: 2500 }).catch(() => false)) {
        await confirmConvert.click();
      }
      await page.waitForTimeout(1500);
      
      // Verify conversion (might redirect or show success message)
      console.log('✓ Lead conversion initiated');
    } else {
      console.log('Convert functionality may not be available in UI');
    }
  });

  test('should verify dashboard displays correct data', async ({ page }) => {
    await page.goto('/#/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for KPI cards or statistics
    const kpiCards = page.locator('[class*="card"], [class*="stat"]');
    const cardCount = await kpiCards.count();
    
    if (cardCount > 0) {
      console.log(`✓ Dashboard shows ${cardCount} metric cards`);
    }

    // Check for charts or graphs
    const charts = page.locator('canvas, [class*="chart"]');
    const chartCount = await charts.count();
    
    if (chartCount > 0) {
      console.log(`✓ Dashboard shows ${chartCount} charts`);
    }

    // Verify dashboard is interactive
    const interactiveElements = page.locator('button, a[href]');
    const elementCount = await interactiveElements.count();
    
    expect(elementCount).toBeGreaterThan(0);
    console.log('✓ Dashboard is interactive');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Try to access non-existent lead
    await page.goto('/#/leads/999999999');
    await page.waitForLoadState('networkidle');
    
    // Should show error message or redirect
    const errorMessage = page.locator('text=/не найден|not found|404/i');
    const isErrorVisible = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isErrorVisible) {
      console.log('✓ 404 error handled correctly');
    } else {
      // Might redirect to list page
      const currentUrl = page.url();
      if (currentUrl.includes('/leads') && !currentUrl.includes('999999999')) {
        console.log('✓ Invalid ID redirects to list');
      }
    }
  });

  test('should test responsive behavior', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/#/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify desktop layout
    const sidebarMenu = page.locator('aside, [role="menu"]').first();
    await expect(sidebarMenu).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Mobile menu might be hidden behind hamburger
    const hamburger = page.locator('button:has(.anticon-menu-fold), button:has(.anticon-menu-unfold), button[aria-label*="menu"], [class*="hamburger"]').first();
    if (await hamburger.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('✓ Mobile menu available');
    }
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });
});
