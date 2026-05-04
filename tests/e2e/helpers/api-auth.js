let cachedAccessToken = null;

export async function getApiAccessToken(page) {
  if (cachedAccessToken) return cachedAccessToken;
  const username = process.env.E2E_USERNAME || 'admin';
  const password = process.env.E2E_PASSWORD || 't3sl@admin';

  const response = await page.request.post('/api/token/', {
    data: { username, password },
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok()) {
    throw new Error(`Unable to fetch API token: ${response.status()}`);
  }

  const payload = await response.json();
  cachedAccessToken = payload.access;
  return cachedAccessToken;
}

export async function getAuthHeaders(page) {
  const token = await getApiAccessToken(page);
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
