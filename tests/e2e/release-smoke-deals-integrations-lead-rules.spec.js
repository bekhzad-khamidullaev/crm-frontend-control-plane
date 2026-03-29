import { expect, test } from '@playwright/test';

async function loginByUi(page) {
  const username = process.env.E2E_USERNAME || 'admin';
  const password = process.env.E2E_PASSWORD || 't3sl@admin';

  await page.goto('/#/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/#/login', { waitUntil: 'domcontentloaded' });

  const loginButton = page.locator('button[type="submit"], button:has-text("Войти")').first();
  const canSeeLogin = await loginButton.isVisible({ timeout: 5000 }).catch(() => false);
  if (canSeeLogin) {
    await page
      .locator('#login_username, input[name="username"], input[placeholder="admin"]')
      .first()
      .fill(username);
    await page.locator('#login_password, input[type="password"]').first().fill(password);
    await loginButton.click();
  }

  await expect(page).toHaveURL(/#\/dashboard/, { timeout: 30000 });
}

test.describe('Release Smoke: Deals + Integrations + Lead Rules', () => {
  test('covers deals kanban and lead-rules create flow from integrations workspace', async ({
    page,
  }) => {
    await loginByUi(page);

    await page.goto('/#/deals');
    await expect(page).toHaveURL(/#\/deals(\?|\/|$)/, { timeout: 10000 });
    await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();

    const kanbanToggle = page
      .locator('button:has-text("Канбан"), button:has-text("Kanban"), .ant-segmented')
      .first();
    await expect(kanbanToggle).toBeVisible();
    await kanbanToggle.click({ force: true });
    const hasKanbanSurface =
      (await page.locator('[data-testid*="kanban"], .deals-kanban-board, .ant-card').count()) > 0;
    expect(hasKanbanSurface).toBeTruthy();

    await page.goto('/#/integrations');
    await expect(page).toHaveURL(/#\/integrations(\?|\/|$)/, { timeout: 10000 });
    await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();

    const leadRulesTab = page
      .locator(
        '[role="tab"]:has-text("Лид Rules"), [role="tab"]:has-text("Lead Rules"), [role="tab"]:has-text("Lead rules")'
      )
      .first();
    await expect(leadRulesTab).toBeVisible();
    await leadRulesTab.click();

    const createRuleButton = page
      .locator(
        'button:has-text("Новое правило"), button:has-text("Создать первое правило"), button:has-text("Создать правило")'
      )
      .first();
    await expect(createRuleButton).toBeVisible();
    await createRuleButton.click();

    const ruleModal = page
      .locator('.ant-modal:has-text("Новое правило"), .ant-modal:has-text("Редактирование правила")')
      .first();
    await expect(ruleModal).toBeVisible();
    await expect(page.locator('.ant-modal:visible input').first()).toBeVisible();
  });
});
