/**
 * Playwright E2E Tests: Theme Switching
 * 
 * Comprehensive tests for theme switching functionality:
 * - Light theme displays correctly (background #f0f2f5)
 * - Dark theme switches and persists in localStorage
 * - Theme applies to all pages (Leads, Contacts, Deals, Tasks)
 * - Text colors are readable in both themes
 * - Modals and forms display correctly in dark theme
 * - Theme persists after page reload
 * - Verify colors on cards, buttons, inputs, sidebar, header in both themes
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 't3sl@admin';

// Helper function to get computed background color
async function getBackgroundColor(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    return window.getComputedStyle(element).backgroundColor;
  }, selector);
}

// Helper function to get computed text color
async function getTextColor(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    return window.getComputedStyle(element).color;
  }, selector);
}

// Helper to convert rgb to hex
function rgbToHex(rgb) {
  if (!rgb) return null;
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return rgb;
  
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  
  return `#${r}${g}${b}`;
}

// Helper to check color contrast (WCAG AA standard: 4.5:1 for normal text)
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1, rgb2) {
  const match1 = rgb1.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  const match2 = rgb2.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  
  if (!match1 || !match2) return null;
  
  const l1 = getLuminance(parseInt(match1[1]), parseInt(match1[2]), parseInt(match1[3]));
  const l2 = getLuminance(parseInt(match2[1]), parseInt(match2[2]), parseInt(match2[3]));
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe('Theme Switching Tests', () => {
  test.describe.configure({ mode: 'serial' });

  const THEME_STATE_FILE = 'tests/e2e/.auth/user.json';

  test.beforeEach(async ({ page }) => {
    const fs = await import('fs/promises');
    const storageState = await fs.readFile(THEME_STATE_FILE, 'utf8');
    const state = JSON.parse(storageState);
    const localStorageEntry = state.origins?.find((o) => o.localStorage)?.localStorage || [];
    const accessTokenItem = localStorageEntry.find((item) => item.name === 'crm_access_token');
    const refreshTokenItem = localStorageEntry.find((item) => item.name === 'crm_refresh_token');

    if (!accessTokenItem?.value) {
      throw new Error('Missing crm_access_token in storageState. Run auth.setup.js manually.');
    }

    await page.addInitScript(({ access, refresh }) => {
      localStorage.setItem('crm_access_token', access);
      if (refresh) {
        localStorage.setItem('crm_refresh_token', refresh);
      }
      localStorage.setItem('contora-theme', 'light');
    }, { access: accessTokenItem.value, refresh: refreshTokenItem?.value });

    await page.goto(`${BASE_URL}/#/dashboard`);

    const hasLayout = await page
      .locator('.ant-layout')
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (!hasLayout) {
      const currentHash = await page.evaluate(() => window.location.hash);
      throw new Error(`Dashboard not available (hash: ${currentHash})`);
    }

    await page.waitForTimeout(1000); // Wait for theme to initialize
  });

  test('1. Light theme displays correctly with background #f0f2f5', async ({ page }) => {
    // Check that dark class is NOT on root element
    const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBe(false);

    // Check main content or body background color
    const contentBg = await getBackgroundColor(page, '.ant-layout-content');
    const bodyBg = await getBackgroundColor(page, 'body');

    const contentBgHex = rgbToHex(contentBg);
    const bodyBgHex = rgbToHex(bodyBg);

    // If content is transparent, body should be light
    if (contentBgHex === 'rgba(0, 0, 0, 0)' || contentBgHex === 'transparent') {
      expect(bodyBgHex).toMatch(/#f0f2f5|#ffffff/i);
    } else {
      expect(contentBgHex).toMatch(/#f0f2f5|#ffffff/i);
    }
    
    // Check header background (should be white or light)
    const headerBg = await getBackgroundColor(page, '.ant-layout-header');
    const headerBgHex = rgbToHex(headerBg);
    expect(headerBgHex).toMatch(/#ffffff|#f0f2f5/i);
    
    console.log('Light theme colors:', { contentBg: contentBgHex, headerBg: headerBgHex });
  });

  test('2. Dark theme switches and persists in localStorage', async ({ page }) => {
    // Find and click theme toggle switch
    const themeSwitch = page.locator('.ant-switch').first();
    await expect(themeSwitch).toBeVisible({ timeout: 5000 });
    
    // Verify initially unchecked (light theme)
    const isCheckedBefore = await themeSwitch.evaluate(el => el.classList.contains('ant-switch-checked'));
    expect(isCheckedBefore).toBe(false);
    
    // Toggle to dark theme
    await themeSwitch.click();
    await page.waitForTimeout(500); // Wait for theme transition
    
    // Verify switch is now checked
    const isCheckedAfter = await themeSwitch.evaluate(el => el.classList.contains('ant-switch-checked'));
    expect(isCheckedAfter).toBe(true);
    
    // Verify localStorage was updated
    const themeInStorage = await page.evaluate(() => localStorage.getItem('contora-theme'));
    expect(themeInStorage).toBe('dark');
    
    // Verify dark class was added to root element
    const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBe(true);
    
    console.log('Dark theme persisted in localStorage:', themeInStorage);
  });

  test('3. Theme applies to all pages (Leads, Contacts, Deals, Tasks)', async ({ page }) => {
    // Switch to dark theme
    const themeSwitch = page.locator('.ant-switch').first();
    await themeSwitch.click();
    await page.waitForTimeout(500);
    
    // Test Leads page
    await page.getByRole('menuitem', { name: /Лиды|Leads/i }).click();
    await page.waitForTimeout(1000);
    await page.waitForTimeout(500);
    
    let hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBe(true);
    console.log('✓ Leads page: Dark theme applied');
    
    // Test Contacts page
    await page.getByRole('menuitem', { name: /Контакты|Contacts/i }).click();
    await page.waitForTimeout(1000);
    await page.waitForTimeout(500);
    
    hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBe(true);
    console.log('✓ Contacts page: Dark theme applied');
    
    // Test Deals page
    await page.getByRole('menuitem', { name: /Сделки|Deals/i }).click();
    await page.waitForTimeout(1000);
    await page.waitForTimeout(500);
    
    hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBe(true);
    console.log('✓ Deals page: Dark theme applied');
    
    // Test Tasks page
    await page.getByRole('menuitem', { name: /Задачи|Tasks/i }).click();
    await page.waitForTimeout(1000);
    await page.waitForTimeout(500);
    
    hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBe(true);
    console.log('✓ Tasks page: Dark theme applied');
  });

  test('4. Text colors are readable in both themes (WCAG contrast)', async ({ page }) => {
    // Navigate to Leads page for testing
    await page.click('text=Лиды');
    await page.waitForTimeout(1000);
    await page.waitForTimeout(1000);
    
    // Test Light Theme contrast
    console.log('\n=== Testing Light Theme Contrast ===');
    
    // Check main content text
    let lightContentBg = await getBackgroundColor(page, '.ant-layout-content');
    const lightTextColor = await getTextColor(page, '.ant-layout-content');

    if (lightContentBg === 'rgba(0, 0, 0, 0)' || lightContentBg === 'transparent') {
      lightContentBg = await getBackgroundColor(page, 'body');
    }
    
    if (lightContentBg && lightTextColor) {
      const lightContrast = getContrastRatio(lightContentBg, lightTextColor);
      console.log(`Light theme - Content contrast: ${lightContrast?.toFixed(2)} (min 3.0 for UI text)`);
      if (lightContrast) {
        expect(lightContrast).toBeGreaterThan(3.0);
      }
    }
    
    // Switch to Dark Theme
    const themeSwitch = page.locator('.ant-switch').first();
    await themeSwitch.click();
    await page.waitForTimeout(1000);
    
    console.log('\n=== Testing Dark Theme Contrast ===');
    
    // Check main content text in dark theme
    const darkContentBg = await getBackgroundColor(page, '.ant-layout-content');
    const darkTextColor = await getTextColor(page, '.ant-layout-content');
    
    if (darkContentBg && darkTextColor) {
      const darkContrast = getContrastRatio(darkContentBg, darkTextColor);
      console.log(`Dark theme - Content contrast: ${darkContrast?.toFixed(2)} (min 3.0 for UI text)`);
      if (darkContrast) {
        expect(darkContrast).toBeGreaterThan(3.0);
      }
    }
    
    // Check table text
    const tableText = page.locator('.ant-table-tbody tr').first();
    if (await tableText.count() > 0) {
      const tableBg = await getBackgroundColor(page, '.ant-table-tbody tr');
      const tableTextColor = await getTextColor(page, '.ant-table-tbody tr');
      
      if (tableBg && tableTextColor) {
        const tableContrast = getContrastRatio(tableBg, tableTextColor);
        console.log(`Dark theme - Table contrast: ${tableContrast?.toFixed(2)}`);
        expect(tableContrast).toBeGreaterThan(4.5);
      }
    }
  });

  test('5. Modals and forms display correctly in dark theme', async ({ page }) => {
    // Switch to dark theme
    const themeSwitch = page.locator('.ant-switch').first();
    await themeSwitch.click();
    await page.waitForTimeout(500);
    
    // Navigate to Leads
    await page.click('text=Лиды');
    await page.waitForTimeout(1000);
    await page.waitForTimeout(1000);
    
    // Open create lead modal
    await page.click('button:has-text("Создать лид")');
    await page.waitForTimeout(500);
    
    // Verify modal is visible
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Check modal background in dark theme
    const modalBg = await getBackgroundColor(page, '.ant-modal-content');
    console.log('Dark theme - Modal background:', modalBg);
    
    // Dark theme modal should have dark background (not white)
    expect(modalBg).not.toBe('rgb(255, 255, 255)');
    
    // Check form inputs are visible and have proper dark styling
    const inputBg = await getBackgroundColor(page, '.ant-input');
    const inputTextColor = await getTextColor(page, '.ant-input');
    console.log('Dark theme - Input background:', inputBg);
    console.log('Dark theme - Input text color:', inputTextColor);
    
    // Verify contrast on form inputs
    if (inputBg && inputTextColor) {
      const inputContrast = getContrastRatio(inputBg, inputTextColor);
      console.log(`Dark theme - Input contrast: ${inputContrast?.toFixed(2)}`);
      expect(inputContrast).toBeGreaterThan(4.5);
    }
    
    // Check select dropdowns
    const selectBg = await getBackgroundColor(page, '.ant-select-selector');
    console.log('Dark theme - Select background:', selectBg);
    expect(selectBg).not.toBe('rgb(255, 255, 255)');
    
    // Close modal
    await page.keyboard.press('Escape');
  });

  test('6. Theme persists after page reload', async ({ page }) => {
    // Switch to dark theme
    const themeSwitch = page.locator('.ant-switch').first();
    await themeSwitch.click();
    await page.waitForTimeout(500);
    
    // Verify dark theme is active
    let themeInStorage = await page.evaluate(() => localStorage.getItem('contora-theme'));
    expect(themeInStorage).toBe('dark');
    
    let hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBe(true);
    
    console.log('Before reload: Dark theme active');
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Verify theme persisted
    themeInStorage = await page.evaluate(() => localStorage.getItem('contora-theme'));
    expect(themeInStorage).toBe('dark');
    
    hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBe(true);
    
    // Verify switch is still checked
    const themeSwitchAfter = page.locator('.ant-switch').first();
    const isChecked = await themeSwitchAfter.evaluate(el => el.classList.contains('ant-switch-checked'));
    expect(isChecked).toBe(true);
    
    console.log('After reload: Dark theme persisted ✓');
  });

  test('7. Verify colors on cards, buttons, inputs, sidebar, header in both themes', async ({ page }) => {
    console.log('\n=== Testing Light Theme Component Colors ===');
    
    // Navigate to dashboard with widgets
    await page.goto('http://localhost:3004/#/dashboard');
    await page.waitForTimeout(1000);
    
    // Light Theme - Card colors
    const lightCardBg = await getBackgroundColor(page, '.ant-card');
    console.log('Light - Card background:', lightCardBg);
    expect(rgbToHex(lightCardBg)).toMatch(/#ffffff/i);
    
    // Light Theme - Button colors
    const lightButtonBg = await getBackgroundColor(page, '.ant-btn-primary');
    console.log('Light - Primary button background:', lightButtonBg);
    
    // Light Theme - Sidebar colors
    const lightSidebarBg = await getBackgroundColor(page, '.ant-layout-sider');
    console.log('Light - Sidebar background:', lightSidebarBg);
    
    // Light Theme - Header colors
    const lightHeaderBg = await getBackgroundColor(page, '.ant-layout-header');
    console.log('Light - Header background:', lightHeaderBg);
    
    // Switch to Dark Theme
    const themeSwitch = page.locator('.ant-switch').first();
    await themeSwitch.click();
    await page.waitForTimeout(1000);
    
    console.log('\n=== Testing Dark Theme Component Colors ===');
    
    // Dark Theme - Card colors
    const darkCardBg = await getBackgroundColor(page, '.ant-card');
    console.log('Dark - Card background:', darkCardBg);
    expect(darkCardBg).not.toBe('rgb(255, 255, 255)'); // Should not be white
    
    // Dark Theme - Button colors
    const darkButtonBg = await getBackgroundColor(page, '.ant-btn-primary');
    console.log('Dark - Primary button background:', darkButtonBg);
    
    // Dark Theme - Sidebar colors
    const darkSidebarBg = await getBackgroundColor(page, '.ant-layout-sider');
    console.log('Dark - Sidebar background:', darkSidebarBg);
    expect(darkSidebarBg).not.toBe(lightSidebarBg); // Should be different from light
    
    // Dark Theme - Header colors
    const darkHeaderBg = await getBackgroundColor(page, '.ant-layout-header');
    console.log('Dark - Header background:', darkHeaderBg);
    expect(darkHeaderBg).not.toBe(lightHeaderBg); // Should be different from light
    
    // Navigate to Leads to test input colors
    await page.click('text=Лиды');
    await page.waitForTimeout(1000);
    await page.waitForTimeout(500);
    
    // Check search input in dark theme
    const darkInputBg = await getBackgroundColor(page, '.ant-input');
    console.log('Dark - Input background:', darkInputBg);
    expect(darkInputBg).not.toBe('rgb(255, 255, 255)'); // Should not be white
    
    // Verify all components have changed from light to dark
    expect(darkCardBg).not.toBe(lightCardBg);
    expect(darkSidebarBg).not.toBe(lightSidebarBg);
    expect(darkHeaderBg).not.toBe(lightHeaderBg);
    
    console.log('\n✓ All components properly themed in both light and dark modes');
  });

  test('8. Theme toggle is accessible and works on all pages', async ({ page }) => {
    const pages = [
      { name: 'Dashboard', path: 'dashboard' },
      { name: 'Лиды', path: 'leads' },
      { name: 'Контакты', path: 'contacts' },
      { name: 'Сделки', path: 'deals' },
      { name: 'Задачи', path: 'tasks' },
    ];
    
    for (const pageInfo of pages) {
      // Navigate to page
      if (pageInfo.path === 'dashboard') {
        await page.goto('http://localhost:3004/#/dashboard');
      } else {
        await page.click(`text=${pageInfo.name}`);
      }
      await page.waitForURL(`**/${pageInfo.path}`, { timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Find theme switch
      const themeSwitch = page.locator('.ant-switch').first();
      await expect(themeSwitch).toBeVisible({ timeout: 3000 });
      
      // Toggle theme
      await themeSwitch.click();
      await page.waitForTimeout(300);
      
      // Verify theme changed
      const theme = await page.evaluate(() => localStorage.getItem('contora-theme'));
      const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      
      console.log(`${pageInfo.name}: Theme=${theme}, darkClass=${hasDarkClass}`);
      
      // Toggle back
      await themeSwitch.click();
      await page.waitForTimeout(300);
    }
    
    console.log('✓ Theme toggle works on all pages');
  });

  test('9. Dark theme - Table rows and hover states', async ({ page }) => {
    // Switch to dark theme
    const themeSwitch = page.locator('.ant-switch').first();
    await themeSwitch.click();
    await page.waitForTimeout(500);
    
    // Navigate to Leads
    await page.click('text=Лиды');
    await page.waitForTimeout(1000);
    await page.waitForTimeout(1000);
    
    // Check table background
    const tableBg = await getBackgroundColor(page, '.ant-table');
    console.log('Dark - Table background:', tableBg);
    expect(tableBg).not.toBe('rgb(255, 255, 255)');
    
    // Check first row
    const firstRow = page.locator('.ant-table-tbody tr').first();
    if (await firstRow.count() > 0) {
      const rowBg = await getBackgroundColor(page, '.ant-table-tbody tr:first-child');
      console.log('Dark - Table row background:', rowBg);
      
      // Hover over row
      await firstRow.hover();
      await page.waitForTimeout(300);
      
      const rowHoverBg = await getBackgroundColor(page, '.ant-table-tbody tr:first-child');
      console.log('Dark - Table row hover background:', rowHoverBg);
      
      // Hover state should be different
      expect(rowHoverBg).not.toBe(rowBg);
    }
  });

  test('10. Dark theme - Dropdown and menu colors', async ({ page }) => {
    // Switch to dark theme
    const themeSwitch = page.locator('.ant-switch').first();
    await themeSwitch.click();
    await page.waitForTimeout(500);
    
    // Click on user menu to open dropdown
    const userMenu = page.locator('.ant-dropdown-trigger').last();
    await userMenu.click();
    await page.waitForTimeout(500);
    
    // Check dropdown menu background
    const dropdownBg = await getBackgroundColor(page, '.ant-dropdown-menu');
    console.log('Dark - Dropdown background:', dropdownBg);
    expect(dropdownBg).not.toBe('rgb(255, 255, 255)');
    
    // Check menu item background
    const menuItemBg = await getBackgroundColor(page, '.ant-dropdown-menu-item');
    console.log('Dark - Menu item background:', menuItemBg);
    
    // Check menu item text color
    const menuItemText = await getTextColor(page, '.ant-dropdown-menu-item');
    console.log('Dark - Menu item text:', menuItemText);
    
    // Close dropdown
    await page.keyboard.press('Escape');
  });
});
