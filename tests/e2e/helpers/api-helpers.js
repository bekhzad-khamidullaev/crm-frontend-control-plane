/**
 * API helpers for E2E tests
 */

/**
 * Wait for an API response matching the given URL pattern and optional method
 * @param {Page} page - Playwright page object
 * @param {string|RegExp} urlPattern - URL pattern to match
 * @param {Object|number} [options] - Options object { method, timeout } or timeout in ms
 * @returns {Promise<Response>} The API response
 */
export async function waitForApiResponse(page, urlPattern, options = {}) {
  const method = typeof options === 'object' ? options.method : undefined;
  const timeout = typeof options === 'object' ? options.timeout || 60000 : options || 60000;

  console.log(`⏳ Waiting for API response matching: ${urlPattern}${method ? ` [${method}]` : ''}`);

  return await page.waitForResponse(
    (response) => {
      const url = response.url();
      const matchesUrl = typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);

      if (!matchesUrl) return false;

      const matchesMethod = !method || response.request().method().toUpperCase() === method.toUpperCase();
      if (!matchesMethod) return false;

      const status = response.status();
      console.log(`✅ API Response: ${response.request().method()} ${url} - ${status}`);

      // Log response body for debugging (async, don't await)
      response.text().then(body => {
        if (status >= 400) {
          console.error(`❌ Error Response Body:`, body.substring(0, 500));
        } else {
          console.log(`📦 Response Body Preview:`, body.substring(0, 200));
        }
      }).catch(() => {});

      return response.status() >= 200 && response.status() < 300;
    },
    { timeout }
  );
}

/**
 * Wait for navigation and page load
 */
export async function waitForNavigation(page, urlPattern, timeout = 5000) {
  await page.waitForURL(urlPattern, { timeout });
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Delete test data via API
 */
export async function cleanupTestData(page, endpoint, ids) {
  for (const id of ids) {
    try {
      await page.request.delete(`/api${endpoint}/${id}/`);
    } catch (error) {
      console.warn(`Failed to cleanup ${endpoint}/${id}:`, error.message);
    }
  }
}

/**
 * Create test data via API
 */
export async function createTestData(page, endpoint, data) {
  const response = await page.request.post(`/api${endpoint}/`, {
    data,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create test data: ${response.status()}`);
  }

  return await response.json();
}
