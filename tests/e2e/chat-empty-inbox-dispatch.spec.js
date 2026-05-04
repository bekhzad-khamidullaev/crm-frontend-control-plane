import { expect, test } from '@playwright/test';
import { login } from './helpers/auth.js';

const mockJson = (route, body, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

const installEmptyInboxDryRunMocks = async (page, capture) => {
  await page.route(/\/api\/settings\/omnichannel\/timeline\/(\?.*)?$/, async (route) => {
    await mockJson(route, {
      results: [],
      summary: {
        total: 0,
        queue: 0,
        active: 0,
        resolved: 0,
        breached: 0,
      },
    });
  });

  await page.route(/\/api\/chat-messages\/(\?.*)?$/, async (route) => {
    await mockJson(route, { results: [] });
  });

  await page.route(/\/api\/contacts\/(\?.*)?$/, async (route) => {
    await mockJson(route, {
      results: [
        {
          id: 1,
          first_name: 'Test',
          last_name: 'Contact',
          full_name: 'Test Contact',
          mobile_e164: '+998901112233',
        },
      ],
    });
  });

  await page.route(/\/api\/settings\/whatsapp\/accounts\/(\?.*)?$/, async (route) => {
    await mockJson(route, {
      results: [
        {
          id: 'wa-1',
          channel_id: 'wa-1',
          business_name: 'Test WA',
          phone_number: '+998901112233',
          is_active: true,
        },
      ],
    });
  });

  await page.route(/\/api\/settings\/telegram\/bots\/(\?.*)?$/, async (route) => {
    await mockJson(route, { results: [] });
  });
  await page.route(/\/api\/settings\/telegram\/users\/(\?.*)?$/, async (route) => {
    await mockJson(route, { results: [] });
  });
  await page.route(/\/api\/settings\/instagram\/accounts\/(\?.*)?$/, async (route) => {
    await mockJson(route, { results: [] });
  });
  await page.route(/\/api\/settings\/facebook\/pages\/(\?.*)?$/, async (route) => {
    await mockJson(route, { results: [] });
  });
  await page.route(/\/api\/sms\/providers\/(\?.*)?$/, async (route) => {
    await mockJson(route, []);
  });
  await page.route(/\/api\/crm-emails\/(\?.*)?$/, async (route) => {
    await mockJson(route, { results: [] });
  });
  await page.route(/\/api\/massmail\/email-accounts\/(\?.*)?$/, async (route) => {
    await mockJson(route, { results: [] });
  });
  await page.route(/\/api\/massmail\/mailings\/(\?.*)?$/, async (route) => {
    await mockJson(route, { results: [] });
  });
  await page.route(/\/api\/massmail\/messages\/(\?.*)?$/, async (route) => {
    await mockJson(route, { results: [] });
  });

  await page.route(/\/api\/settings\/omnichannel\/send\/(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    capture.payload = route.request().postDataJSON();
    await mockJson(route, {
      id: 'dry-run-message-1',
      status: 'queued',
    });
  });
};

test.describe('Chat Empty Inbox Dispatch Dry-Run', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('shows composer with empty inbox and allows dry-run outbound initiation', async ({
    page,
  }) => {
    const captured = { payload: null };
    await installEmptyInboxDryRunMocks(page, captured);

    await page.goto('/#/crm-emails');
    await expect.poll(() => page.url(), { timeout: 10000 }).toMatch(
      /#\/(?:crm-emails|forbidden)(?:\/|$|\?)/
    );
    if (/#\/forbidden(?:\/|$|\?)/.test(page.url())) {
      test.skip(true, 'CRM Email route is forbidden for current test user.');
    }

    await expect(page.locator('.ant-tabs-tab-active').first()).toContainText(
      /Outbound \/ Broadcast/i
    );

    const activePane = page.locator('.ant-tabs-tabpane-active').first();
    const formSelects = activePane.locator('.ant-form .ant-select');
    await expect(formSelects.nth(2)).toBeVisible();

    await formSelects.nth(2).click();
    await page
      .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')
      .first()
      .click();

    await activePane.locator('textarea').first().fill('Dry run: outbound initiation from empty inbox');

    await activePane
      .locator('button:has-text("Отправить"), button:has-text("Send")')
      .first()
      .click();

    await expect
      .poll(() => captured.payload, { timeout: 10000 })
      .toMatchObject({
        channel: 'whatsapp',
        channel_id: 'wa-1',
        contact_id: '1',
        text: 'Dry run: outbound initiation from empty inbox',
        to: '+998901112233',
      });
  });
});
