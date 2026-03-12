import { expect, test } from '@playwright/test';
import { login } from './helpers/auth.js';

test.describe('Permissions deny form access', () => {
  test('redirects to forbidden for user without create permission on payments form', async ({ page }) => {
    await login(page);

    await page.route('**/api/users/me/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 101,
          username: 'limited.user',
          roles: ['manager'],
          permissions: ['crm.view_payment'],
        }),
      });
    });

    await page.evaluate(() => {
      const roles = JSON.stringify(['manager']);
      const permissions = JSON.stringify(['crm.view_payment']);
      sessionStorage.setItem('enterprise_crm_roles', roles);
      localStorage.setItem('enterprise_crm_roles', roles);
      sessionStorage.setItem('enterprise_crm_permissions', permissions);
      localStorage.setItem('enterprise_crm_permissions', permissions);
    });

    await page.goto('/#/payments/new');

    await expect.poll(() => page.url()).toMatch(/#\/forbidden/);
    await expect(page.getByText(/access denied/i)).toBeVisible();
    await expect(page.getByText(/новый платеж/i)).not.toBeVisible();
    await expect(page.getByLabel(/сумма/i)).not.toBeVisible();
  });
});
