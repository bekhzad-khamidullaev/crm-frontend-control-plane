import { expect, test } from '@playwright/test';
import { login } from './helpers/auth.js';
import { getAuthHeaders } from './helpers/api-auth.js';

const TEST_PREFIX = 'e2e-landing-gherkin';

async function ensureOk(response, label) {
  if (response.ok()) return;
  const body = await response.text().catch(() => '');
  throw new Error(`${label} failed: HTTP ${response.status()} ${body.slice(0, 500)}`);
}

function firstIdFromList(payload) {
  if (Array.isArray(payload)) return payload[0]?.id || null;
  if (Array.isArray(payload?.results)) return payload.results[0]?.id || null;
  return payload?.id || null;
}

function buildDraftSchema(title) {
  return {
    schema_version: 1,
    craft: { ROOT: { type: 'div' } },
    page: {
      meta: {
        title,
        description: 'E2E gherkin form validation',
        seo: {
          title,
          description: 'E2E gherkin form validation',
          og_title: title,
          og_description: 'E2E gherkin form validation',
          noindex: true,
        },
        ab_test: { control_variant: '', variants: [] },
      },
      theme: {
        primary: '#1f2937',
        background: '#f8fafc',
        text: '#111827',
        accent: '#2563eb',
      },
      sections: [
        {
          id: 'form-1',
          type: 'form',
          title: 'Оставьте заявку',
          subtitle: 'Проверка E2E формы',
          buttonText: 'Отправить',
          blockId: 'form-1',
          formKey: 'lead_main',
          sectionRole: 'lead_form',
          row_index: 1,
          fields: [
            { key: 'name', label: 'Имя', type: 'text', required: true },
            { key: 'phone', label: 'Телефон', type: 'tel', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
          ],
        },
      ],
    },
  };
}

async function createPublishedLanding(page) {
  const headers = await getAuthHeaders(page);
  const stamp = Date.now();
  const title = `E2E Gherkin Landing ${stamp}`;
  const slug = `${TEST_PREFIX}-${stamp}`;

  const leadSourceResp = await page.request.get('/api/crm/lead-sources/?page_size=1', { headers });
  await ensureOk(leadSourceResp, 'Get lead sources');
  const leadSourcePayload = await leadSourceResp.json();
  const leadSourceId = firstIdFromList(leadSourcePayload);

  const stageResp = await page.request.get('/api/crm/stages/?page_size=1', { headers });
  await ensureOk(stageResp, 'Get stages');
  const stagePayload = await stageResp.json();
  const stageId = firstIdFromList(stagePayload);

  const createResp = await page.request.post('/api/landings/', {
    headers,
    data: {
      title,
      slug,
      is_active: true,
      department: null,
      lead_source: leadSourceId,
    },
  });
  await ensureOk(createResp, 'Create landing');
  const created = await createResp.json();
  const landingId = created?.id;
  if (!landingId) {
    throw new Error('Create landing failed: id is missing in response');
  }

  const draftResp = await page.request.put(`/api/landings/${landingId}/draft/`, {
    headers: { ...headers, 'X-Draft-Version': '1' },
    data: buildDraftSchema(title),
  });
  await ensureOk(draftResp, 'Save draft');

  const bindingsResp = await page.request.put(`/api/landings/${landingId}/bindings/`, {
    headers,
    data: [
      {
        block_id: 'form-1',
        form_key: 'lead_main',
        lead_source: leadSourceId,
        stage_on_deal_create: stageId,
        create_deal: true,
        owner_strategy: 'inherit',
        fixed_owner: null,
        assignment_queue: null,
        sla_minutes: 15,
        dedup_window_minutes: 120,
        active: true,
      },
    ],
  });
  await ensureOk(bindingsResp, 'Save bindings');

  const publishResp = await page.request.post(`/api/landings/${landingId}/publish/`, { headers, data: {} });
  await ensureOk(publishResp, 'Publish landing');

  return { id: landingId, slug };
}

test.describe('Feature: Public Landing Form Validation (Gherkin)', () => {
  let landingId = null;
  let landingSlug = '';

  test.beforeEach(async ({ page }) => {
    await login(page);
    const landing = await createPublishedLanding(page);
    landingId = landing.id;
    landingSlug = landing.slug;
  });

  test.afterEach(async ({ page }) => {
    if (!landingId) return;
    try {
      const headers = await getAuthHeaders(page);
      await page.request.delete(`/api/landings/${landingId}/`, { headers });
    } catch {
      // best-effort cleanup
    } finally {
      landingId = null;
      landingSlug = '';
    }
  });

  test('Scenario: успешная отправка формы с валидным email', async ({ page }) => {
    let submitResponse = null;
    const uniquePart = Date.now();
    const nameInput = page.locator('input[placeholder="Имя"], input[placeholder="Name"]').first();
    const phoneInput = page.locator('input[placeholder="Телефон"], input[placeholder="Phone"]').first();
    const emailInput = page.locator('input[type="email"], input[placeholder="Email"]').first();

    await test.step('Given опубликованный лендинг с формой захвата', async () => {
      await page.goto(`/#/public-landing/${landingSlug}`);
      await expect(emailInput).toBeVisible();
    });

    await test.step('When пользователь заполняет валидные данные и нажимает Отправить', async () => {
      await nameInput.fill(`Gherkin User ${uniquePart}`);
      await phoneInput.fill(`+99890111${String(uniquePart).slice(-4)}`);
      await emailInput.fill(`gherkin.${uniquePart}@example.com`);

      const submitResponsePromise = page.waitForResponse((response) =>
        response.url().includes(`/api/public/landings/${landingSlug}/lead/`) &&
        response.request().method() === 'POST'
      );
      await page.getByRole('button', { name: /Отправить|Submit/i }).first().click();
      submitResponse = await submitResponsePromise;
      await ensureOk(submitResponse, 'Public lead submit');
    });

    await test.step('Then лид создаётся, отображается успех, поля очищаются', async () => {
      const payload = await submitResponse.json();
      expect(Number(payload?.lead_id || 0)).toBeGreaterThan(0);
      expect(payload?.dedup).toBeFalsy();
      expect(Number(payload?.deal_id || 0)).toBeGreaterThan(0);
      await expect(page.getByText(/Заявка отправлена/i)).toBeVisible();
      await expect(nameInput).toHaveValue('');
      await expect(phoneInput).toHaveValue('');
      await expect(emailInput).toHaveValue('');
    });
  });

  test('Scenario: блокировка отправки при невалидном email', async ({ page }) => {
    let submitRequests = 0;
    const uniquePart = Date.now();
    const nameInput = page.locator('input[placeholder="Имя"], input[placeholder="Name"]').first();
    const phoneInput = page.locator('input[placeholder="Телефон"], input[placeholder="Phone"]').first();
    const emailInput = page.locator('input[type="email"], input[placeholder="Email"]').first();

    await test.step('Given опубликованный лендинг с обязательным email', async () => {
      await page.goto(`/#/public-landing/${landingSlug}`);
      await expect(emailInput).toBeVisible();
      await page.route(`**/api/public/landings/${landingSlug}/lead/`, async (route) => {
        submitRequests += 1;
        await route.continue();
      });
    });

    await test.step('When пользователь вводит невалидный email и пытается отправить форму', async () => {
      await nameInput.fill(`Invalid Email User ${uniquePart}`);
      await phoneInput.fill(`+99890122${String(uniquePart).slice(-4)}`);
      await emailInput.fill('invalid-email');
      await page.getByRole('button', { name: /Отправить|Submit/i }).first().click();
    });

    await test.step('Then UI показывает ошибку email и submit-запрос не отправляется', async () => {
      await expect(page.getByText('Некорректный email')).toBeVisible();
      await expect(page.getByText('Проверьте корректность полей формы')).toBeVisible();
      await page.waitForTimeout(500);
      expect(submitRequests).toBe(0);
    });
  });
});
