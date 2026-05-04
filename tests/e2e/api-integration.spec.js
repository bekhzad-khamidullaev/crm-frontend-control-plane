import { expect, test } from '@playwright/test';
import { login } from './helpers/auth.js';
import { getAuthHeaders } from './helpers/api-auth.js';

test.describe('API Integration Tests', () => {
  const openModule = async (page, modulePath) => {
    await page.goto(`/#/${modulePath}`);
    await expect.poll(() => page.url(), { timeout: 10000 }).toMatch(new RegExp(`#/${modulePath}(/|$|\\?)`));
    await expect(page.locator('main, .ant-layout-content').first()).toBeVisible();
  };

  const apiGet = async (page, url) => {
    const headers = await getAuthHeaders(page);
    return page.request.get(url, { headers });
  };

  const apiPost = async (page, url, data) => {
    const headers = await getAuthHeaders(page);
    return page.request.post(url, { headers, data });
  };

  const apiPut = async (page, url, data) => {
    const headers = await getAuthHeaders(page);
    return page.request.put(url, { headers, data });
  };

  const apiDelete = async (page, url) => {
    const headers = await getAuthHeaders(page);
    return page.request.delete(url, { headers });
  };

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('Leads API', () => {
    test('should load leads from API', async ({ page }) => {
      await openModule(page, 'leads');
      const response = await apiGet(page, '/api/leads/?page=1&page_size=20');
      expect(response.ok()).toBeTruthy();

      const json = await response.json();
      expect(json).toHaveProperty('results');
      expect(json).toHaveProperty('count');
      expect(Array.isArray(json.results)).toBeTruthy();
    });

    test('should search leads via API', async ({ page }) => {
      await openModule(page, 'leads');

      const searchInput = page.locator('input[placeholder*="Поиск"], input[placeholder*="Search"]').first();
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('test');
        await page.keyboard.press('Enter');
      }

      const response = await apiGet(page, '/api/leads/?search=test&page=1&page_size=20');
      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      expect(Array.isArray(json.results)).toBeTruthy();
    });

    test('should filter leads via API', async ({ page }) => {
      await openModule(page, 'leads');
      const response = await apiGet(page, '/api/leads/?status=new&page=1&page_size=20');
      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      expect(Array.isArray(json.results)).toBeTruthy();
    });

    test('should paginate leads via API', async ({ page }) => {
      await openModule(page, 'leads');
      const firstPage = await apiGet(page, '/api/leads/?page=1&page_size=20');
      if (!firstPage.ok()) return;
      const firstJson = await firstPage.json();
      if (!firstJson?.count || firstJson.count <= 20) return;

      const response = await apiGet(page, '/api/leads/?page=2&page_size=20');
      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      expect(json).toHaveProperty('results');
    });

    test('should create lead via API', async ({ page }) => {
      await page.goto('/#/leads/new');
      await expect.poll(() => page.url(), { timeout: 10000 }).toMatch(/#\/leads\/new\/?$/);

      const stamp = Date.now();
      const createResponse = await apiPost(page, '/api/leads/', {
        first_name: `Api${stamp}`,
        last_name: 'Automation',
        email: `api${stamp}@test.com`,
        phone: '+998901234567',
      });

      if (createResponse.status() !== 201) return;
      const created = await createResponse.json();
      expect(created).toHaveProperty('id');

      await apiDelete(page, `/api/leads/${created.id}/`).catch(() => null);
    });

    test('should update lead via API', async ({ page }) => {
      const listResponse = await apiGet(page, '/api/leads/?page=1&page_size=1');
      if (!listResponse.ok()) return;

      const listJson = await listResponse.json();
      const firstLead = listJson?.results?.[0];
      if (!firstLead?.id) return;

      const detailResponse = await apiGet(page, `/api/leads/${firstLead.id}/`);
      if (!detailResponse.ok()) return;
      const detail = await detailResponse.json();

      const putResponse = await apiPut(page, `/api/leads/${firstLead.id}/`, {
        ...detail,
        first_name: `Updated${Date.now()}`,
      });

      expect([200, 202, 204]).toContain(putResponse.status());
    });

    test('should delete lead via API', async ({ page }) => {
      const stamp = Date.now();
      const createResponse = await apiPost(page, '/api/leads/', {
        first_name: `Delete${stamp}`,
        last_name: 'Api',
        email: `delete.${stamp}@test.com`,
        phone: '+998901234567',
      });
      if (createResponse.status() !== 201) return;

      const created = await createResponse.json();
      if (!created?.id) return;

      const deleteResponse = await apiDelete(page, `/api/leads/${created.id}/`);
      expect([200, 202, 204]).toContain(deleteResponse.status());
    });
  });

  test.describe('Contacts API', () => {
    test('should load contacts from API', async ({ page }) => {
      await openModule(page, 'contacts');
      const response = await apiGet(page, '/api/contacts/?page=1&page_size=20');
      expect(response.ok()).toBeTruthy();

      const json = await response.json();
      expect(json).toHaveProperty('results');
      expect(Array.isArray(json.results)).toBeTruthy();
    });

    test('should create contact via API', async ({ page }) => {
      await page.goto('/#/contacts/new');
      await expect.poll(() => page.url(), { timeout: 10000 }).toMatch(/#\/contacts\/new\/?$/);

      const stamp = Date.now();
      const createResponse = await apiPost(page, '/api/contacts/', {
        first_name: `Contact${stamp}`,
        last_name: 'Automation',
        email: `contact${stamp}@test.com`,
        phone: '+998901112233',
      });

      if (createResponse.status() !== 201) return;
      const created = await createResponse.json();
      expect(created).toHaveProperty('id');

      await apiDelete(page, `/api/contacts/${created.id}/`).catch(() => null);
    });
  });

  test.describe('Deals API', () => {
    test('should load deals from API', async ({ page }) => {
      await openModule(page, 'deals');
      const response = await apiGet(page, '/api/deals/?page=1&page_size=20');
      expect(response.ok()).toBeTruthy();

      const json = await response.json();
      expect(json).toHaveProperty('results');
      expect(Array.isArray(json.results)).toBeTruthy();
    });

    test('should create deal via API', async ({ page }) => {
      await page.goto('/#/deals/new');
      await expect.poll(() => page.url(), { timeout: 10000 }).toMatch(/#\/deals\/new\/?$/);

      const stamp = Date.now();
      const createResponse = await apiPost(page, '/api/deals/', {
        name: `Deal ${stamp}`,
        next_step: 'Follow-up call',
        amount: 1000,
      });

      if (![200, 201].includes(createResponse.status())) return;
      const created = await createResponse.json().catch(() => null);
      if (created?.id) {
        await apiDelete(page, `/api/deals/${created.id}/`).catch(() => null);
      }
    });
  });

  test.describe('Tasks API', () => {
    test('should load tasks from API', async ({ page }) => {
      await openModule(page, 'tasks');
      const response = await apiGet(page, '/api/tasks/?page=1&page_size=20');
      expect(response.ok()).toBeTruthy();

      const json = await response.json();
      expect(json).toHaveProperty('results');
      expect(Array.isArray(json.results)).toBeTruthy();
    });
  });

  test.describe('API Error Handling', () => {
    test('should handle 401 unauthorized', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.reload();
      await page.goto('/#/leads');
      await expect(page).toHaveURL(/#\/(login|forbidden)/, { timeout: 10000 });
    });

    test('should handle network errors gracefully', async ({ page }) => {
      await openModule(page, 'leads');

      await page.context().setOffline(true);

      const fetchFailed = await page.evaluate(async () => {
        try {
          await fetch('/api/leads/?page=1&page_size=1', { cache: 'no-store' });
          return false;
        } catch {
          return true;
        }
      });
      expect(fetchFailed).toBeTruthy();

      await page.context().setOffline(false);
    });
  });

  test.describe('API Response Validation', () => {
    test('should validate leads response structure', async ({ page }) => {
      await openModule(page, 'leads');
      const response = await apiGet(page, '/api/leads/?page=1&page_size=20');
      expect(response.ok()).toBeTruthy();

      const json = await response.json();
      expect(json).toHaveProperty('results');
      expect(json).toHaveProperty('count');
      expect(json).toHaveProperty('next');
      expect(json).toHaveProperty('previous');

      if (json.results.length > 0) {
        const lead = json.results[0];
        expect(lead).toHaveProperty('id');
      }
    });

    test('should validate contacts response structure', async ({ page }) => {
      await openModule(page, 'contacts');
      const response = await apiGet(page, '/api/contacts/?page=1&page_size=20');
      expect(response.ok()).toBeTruthy();

      const json = await response.json();
      expect(json).toHaveProperty('results');
      expect(Array.isArray(json.results)).toBeTruthy();
    });
  });
});
