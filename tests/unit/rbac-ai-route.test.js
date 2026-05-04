import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/api/auth.js', () => ({
  isAuthenticated: vi.fn(),
  getUserFromToken: vi.fn(),
  getToken: vi.fn(),
  isTokenExpired: vi.fn(),
  parseJWT: vi.fn(),
  clearToken: vi.fn(),
}));

describe('RBAC AI route gating', () => {
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

  it('blocks ai-chat route without ai.assist feature even with chat permission', async () => {
    sessionStorage.setItem('enterprise_crm_roles', JSON.stringify(['admin']));
    sessionStorage.setItem('enterprise_crm_permissions', JSON.stringify(['chat.view_chatmessage']));
    sessionStorage.setItem('enterprise_crm_license_features', JSON.stringify(['communications.chat']));
    sessionStorage.setItem(
      'enterprise_crm_license_state',
      JSON.stringify({
        installed: true,
        status: 'active',
        over_limit: false,
        features: ['communications.chat'],
        enforcement_mode: 'strict',
      })
    );

    const { canAccessRoute } = await import('../../src/lib/rbac.js');

    expect(canAccessRoute('ai-chat')).toBe(false);
  });

  it('allows ai-chat route when ai.assist feature and chat permission are present', async () => {
    sessionStorage.setItem('enterprise_crm_roles', JSON.stringify(['admin']));
    sessionStorage.setItem('enterprise_crm_permissions', JSON.stringify(['chat.view_chatmessage']));
    sessionStorage.setItem('enterprise_crm_license_features', JSON.stringify(['ai.assist']));
    sessionStorage.setItem(
      'enterprise_crm_license_state',
      JSON.stringify({
        installed: true,
        status: 'active',
        over_limit: false,
        features: ['ai.assist'],
        enforcement_mode: 'strict',
      })
    );

    const { canAccessRoute } = await import('../../src/lib/rbac.js');

    expect(canAccessRoute('ai-chat')).toBe(true);
  });

  it('blocks ai-chat route when license state is expired even if feature is present', async () => {
    sessionStorage.setItem('enterprise_crm_roles', JSON.stringify(['admin']));
    sessionStorage.setItem('enterprise_crm_permissions', JSON.stringify(['chat.view_chatmessage']));
    sessionStorage.setItem('enterprise_crm_license_features', JSON.stringify(['ai.assist']));
    sessionStorage.setItem(
      'enterprise_crm_license_state',
      JSON.stringify({
        installed: true,
        status: 'expired',
        over_limit: false,
        features: ['ai.assist'],
        enforcement_mode: 'strict',
      })
    );

    const { canAccessRoute, getRouteAccessState } = await import('../../src/lib/rbac.js');

    expect(canAccessRoute('ai-chat')).toBe(false);
    expect(getRouteAccessState('ai-chat')).toMatchObject({
      allowed: false,
      reason: 'license',
      feature: 'ai.assist',
      code: 'LICENSE_EXPIRED',
    });
  });

  it('treats ai.assist as unavailable when license state is expired even if feature is cached', async () => {
    sessionStorage.setItem('enterprise_crm_license_features', JSON.stringify(['ai.assist']));
    sessionStorage.setItem(
      'enterprise_crm_license_state',
      JSON.stringify({
        installed: true,
        status: 'expired',
        over_limit: false,
        features: ['ai.assist'],
        enforcement_mode: 'strict',
      })
    );

    const { hasAnyFeature } = await import('../../src/lib/rbac.js');

    expect(hasAnyFeature('ai.assist')).toBe(false);
  });

  it('does not hard-block ai-chat route in warn mode when feature is missing', async () => {
    sessionStorage.setItem('enterprise_crm_roles', JSON.stringify(['admin']));
    sessionStorage.setItem('enterprise_crm_permissions', JSON.stringify(['chat.view_chatmessage']));
    sessionStorage.setItem('enterprise_crm_license_features', JSON.stringify(['communications.chat']));
    sessionStorage.setItem(
      'enterprise_crm_license_state',
      JSON.stringify({
        installed: true,
        status: 'active',
        over_limit: true,
        features: ['communications.chat'],
        enforcement_mode: 'warn',
      })
    );

    const { canAccessRoute, getRouteAccessState, hasAnyFeature } = await import('../../src/lib/rbac.js');

    expect(canAccessRoute('ai-chat')).toBe(true);
    expect(getRouteAccessState('ai-chat')).toMatchObject({
      allowed: true,
      reason: null,
    });
    expect(hasAnyFeature('ai.assist')).toBe(true);
  });
});
