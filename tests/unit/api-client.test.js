import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../src/lib/api/client.js';

function mockResponse(body, { status = 200, headers = { 'content-type': 'application/json' } } = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

describe('api client', () => {
  beforeEach(() => { global.fetch = vi.fn(); });

  it('applies base URL and parses JSON', async () => {
    fetch.mockResolvedValueOnce(mockResponse({ ok: true }));
    const res = await api.get('/api/leads/');
    expect(res.ok).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('normalizes HTTP errors', async () => {
    fetch.mockResolvedValueOnce(mockResponse({ detail: 'Invalid' }, { status: 400 }));
    await expect(api.get('/api/leads/')).rejects.toMatchObject({ status: 400, details: { detail: 'Invalid' } });
  });

  it('retries GET once on failure and then throws', async () => {
    fetch
      .mockRejectedValueOnce(new Error('Network'))
      .mockRejectedValueOnce(new Error('Network'));
    await expect(api.get('/api/leads/')).rejects.toBeInstanceOf(Error);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
