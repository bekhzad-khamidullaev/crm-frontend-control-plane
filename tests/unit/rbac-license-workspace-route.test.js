import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/api/auth.js', () => ({
  isAuthenticated: vi.fn(),
  getUserFromToken: vi.fn(),
  getToken: vi.fn(),
  isTokenExpired: vi.fn(),
  parseJWT: vi.fn(),
  clearToken: vi.fn(),
}));

describe('RBAC license workspace route access', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
    const auth = await import('../../src/lib/api/auth.js');
    auth.isAuthenticated.mockReturnValue(true);
    auth.getUserFromToken.mockReturnValue({});
    auth.getToken.mockReturnValue('test-token');
    auth.isTokenExpired.mockReturnValue(false);
    auth.parseJWT.mockReturnValue({});
  });

  it('denies opening license workspace for non-admin roles even when license is missing', async () => {
    sessionStorage.setItem('enterprise_crm_roles', JSON.stringify(['sales']));
    sessionStorage.setItem('enterprise_crm_permissions', JSON.stringify([]));
    sessionStorage.setItem(
      'enterprise_crm_license_state',
      JSON.stringify({
        installed: false,
        status: 'missing',
        over_limit: false,
        features: [],
        enforcement_mode: 'strict',
      }),
    );

    const { canAccessRoute, getRouteAccessState } = await import('../../src/lib/rbac.js');

    expect(canAccessRoute('license-workspace')).toBe(false);
    expect(getRouteAccessState('license-workspace')).toMatchObject({
      allowed: false,
      reason: 'permission',
      roles: ['admin'],
      permissions: ['settings.view_systemsettings'],
    });
  });

  it('allows opening license workspace for admin when license is missing in strict mode', async () => {
    sessionStorage.setItem('enterprise_crm_roles', JSON.stringify(['admin']));
    sessionStorage.setItem('enterprise_crm_permissions', JSON.stringify([]));
    sessionStorage.setItem(
      'enterprise_crm_license_state',
      JSON.stringify({
        installed: false,
        status: 'missing',
        over_limit: false,
        features: [],
        enforcement_mode: 'strict',
      }),
    );

    const { canAccessRoute, getRouteAccessState } = await import('../../src/lib/rbac.js');

    expect(canAccessRoute('license-workspace')).toBe(true);
    expect(getRouteAccessState('license-workspace')).toMatchObject({
      allowed: true,
      reason: null,
    });
  });

  it('allows opening license workspace for CRM admin permission when license is missing in strict mode', async () => {
    sessionStorage.setItem('enterprise_crm_roles', JSON.stringify(['manager']));
    sessionStorage.setItem(
      'enterprise_crm_permissions',
      JSON.stringify(['settings.view_systemsettings']),
    );
    sessionStorage.setItem(
      'enterprise_crm_license_state',
      JSON.stringify({
        installed: false,
        status: 'missing',
        over_limit: false,
        features: [],
        enforcement_mode: 'strict',
      }),
    );

    const { canAccessRoute, getRouteAccessState } = await import('../../src/lib/rbac.js');

    expect(canAccessRoute('license-workspace')).toBe(true);
    expect(getRouteAccessState('license-workspace')).toMatchObject({
      allowed: true,
      reason: null,
    });
  });
});
