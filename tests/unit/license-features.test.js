import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearStoredLicenseFeatures, persistLicenseFeatures, readStoredLicenseFeatures } from '../../src/lib/api/licenseFeatures.js';
import {
  buildRouteLicenseRestriction,
  clearStoredRouteLicenseRestriction,
  readStoredRouteLicenseRestriction,
  storeRouteLicenseRestriction,
} from '../../src/lib/licensePageRestriction.js';

vi.mock('../../src/lib/api/auth.js', () => ({
  getUserFromToken: vi.fn(() => ({})),
  getToken: vi.fn(() => 'test-token'),
  isAuthenticated: vi.fn(() => true),
  isTokenExpired: vi.fn(() => false),
}));

import { canAccessRoute, getRouteAccessState } from '../../src/lib/rbac.js';
import * as auth from '../../src/lib/api/auth.js';

describe('license feature storage and route gating', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
    auth.isAuthenticated.mockReturnValue(true);
    auth.getUserFromToken.mockReturnValue({});
    sessionStorage.setItem('enterprise_crm_roles', JSON.stringify(['admin']));
    sessionStorage.setItem('enterprise_crm_permissions', JSON.stringify(['auth.view_user']));
  });

  it('persists normalized license features in session storage', () => {
    persistLicenseFeatures(['Dashboard.Core', 'dashboard.core', '  ai.assist  ', '', null]);

    expect(readStoredLicenseFeatures()).toEqual(['dashboard.core', 'ai.assist']);
    expect(localStorage.removeItem).toHaveBeenCalledWith('enterprise_crm_license_features');
  });

  it('clears stored license features', () => {
    persistLicenseFeatures(['dashboard.core']);
    clearStoredLicenseFeatures();

    expect(readStoredLicenseFeatures()).toEqual([]);
  });

  it('blocks feature-gated routes when the license feature is missing', () => {
    expect(canAccessRoute('dashboard')).toBe(false);
  });

  it('returns a license access descriptor for feature-gated routes', () => {
    expect(getRouteAccessState('dashboard')).toEqual({
      allowed: false,
      reason: 'license',
      feature: 'dashboard.core',
      permissions: [],
      roles: [],
    });
  });

  it('allows feature-gated routes once the feature is present', () => {
    persistLicenseFeatures(['dashboard.core']);

    expect(canAccessRoute('dashboard')).toBe(true);
  });

  it('stores route-level license restriction for forbidden page rendering', () => {
    const restriction = buildRouteLicenseRestriction('dashboard', getRouteAccessState('dashboard'));
    storeRouteLicenseRestriction(restriction);

    expect(readStoredRouteLicenseRestriction()).toMatchObject({
      code: 'LICENSE_FEATURE_DISABLED',
      feature: 'dashboard.core',
      routeName: 'dashboard',
    });

    clearStoredRouteLicenseRestriction();
    expect(readStoredRouteLicenseRestriction()).toBeNull();
  });
});
