import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '../../src/lib/api/client';
import { createUser, updateUserAccess } from '../../src/lib/api/user';

describe('user admin API helpers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('createUser falls back to /api/auth/users/ when /api/users/ is unavailable', async () => {
    api.post
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValueOnce({ id: 77 });

    const response = await createUser({ username: 'u1' });

    expect(response).toEqual({ id: 77 });
    expect(api.post).toHaveBeenNthCalledWith(1, '/api/users/', { body: { username: 'u1' } });
    expect(api.post).toHaveBeenNthCalledWith(2, '/api/auth/users/', { body: { username: 'u1' } });
  });

  it('updateUserAccess writes direct PATCH payload when endpoint supports it', async () => {
    api.patch.mockResolvedValueOnce({ ok: true });

    const response = await updateUserAccess(15, {
      roles: ['manager'],
      groups: ['sales'],
      permissions: ['auth.view_user'],
      is_staff: false,
      is_superuser: false,
    });

    expect(response).toEqual({ ok: true });
    expect(api.patch).toHaveBeenCalledWith('/api/users/15/', {
      body: {
        is_staff: true,
        is_superuser: false,
        groups: ['sales'],
        permissions: ['auth.view_user'],
      },
    });
  });

  it('updateUserAccess falls back to /groups and /permissions actions when direct PATCH is unsupported', async () => {
    api.patch
      .mockRejectedValueOnce({ status: 405 })
      .mockRejectedValueOnce({ status: 405 });
    api.put
      .mockResolvedValueOnce({ groupsUpdated: true })
      .mockResolvedValueOnce({ permissionsUpdated: true });

    const response = await updateUserAccess(19, {
      roles: ['admin'],
      groups: ['managers'],
      permissions: ['auth.view_user'],
      is_staff: false,
      is_superuser: false,
    });

    expect(response).toEqual({ groupsUpdated: true, permissionsUpdated: true });
    expect(api.put).toHaveBeenNthCalledWith(1, '/api/users/19/groups/', {
      body: { groups: ['managers'] },
    });
    expect(api.put).toHaveBeenNthCalledWith(2, '/api/users/19/permissions/', {
      body: { permissions: ['auth.view_user'] },
    });
  });

  it('updateUserAccess throws when no writable endpoint is available', async () => {
    api.patch
      .mockRejectedValueOnce({ status: 404 })
      .mockRejectedValueOnce({ status: 404 });
    api.put.mockRejectedValue({ status: 404 });

    await expect(
      updateUserAccess(22, {
        groups: ['team-a'],
        permissions: ['auth.view_user'],
      })
    ).rejects.toThrow('User access update endpoint is unavailable');
  });
});
