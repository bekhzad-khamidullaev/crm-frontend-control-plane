import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearStoredLicenseFeatures, persistLicenseFeatures, readStoredLicenseFeatures } from '../../src/lib/api/licenseFeatures.js';
import { persistLicenseState } from '../../src/lib/api/licenseState.js';
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
    persistLicenseState({ installed: true, status: 'active', enforcement_mode: 'strict', features: [] });
    expect(canAccessRoute('dashboard')).toBe(false);
  });

  it('returns a license access descriptor for feature-gated routes', () => {
    persistLicenseState({ installed: true, status: 'active', enforcement_mode: 'strict', features: [] });
    expect(getRouteAccessState('dashboard')).toMatchObject({
      allowed: false,
      reason: 'license',
      feature: 'dashboard.core',
      code: 'LICENSE_FEATURE_DISABLED',
      permissions: [],
      roles: [],
    });
  });

  it('allows feature-gated routes once the feature is present', () => {
    persistLicenseState({ installed: true, status: 'active', enforcement_mode: 'strict', features: ['dashboard.core'] });
    persistLicenseFeatures(['dashboard.core']);

    expect(canAccessRoute('dashboard')).toBe(true);
  });

  it('stores route-level license restriction for forbidden page rendering', () => {
    persistLicenseState({ installed: true, status: 'active', enforcement_mode: 'strict', features: [] });
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

  it('blocks feature-gated routes when license status is expired even if the feature exists', () => {
    persistLicenseFeatures(['dashboard.core']);
    persistLicenseState({ installed: true, status: 'expired', enforcement_mode: 'strict', features: ['dashboard.core'] });

    expect(getRouteAccessState('dashboard')).toMatchObject({
      allowed: false,
      reason: 'license',
      feature: 'dashboard.core',
      code: 'LICENSE_EXPIRED',
    });
  });

  it('maps suspended status to a machine-readable restriction code in strict mode', () => {
    persistLicenseFeatures(['dashboard.core']);
    persistLicenseState({ installed: true, status: 'suspended', enforcement_mode: 'strict', features: ['dashboard.core'] });

    expect(getRouteAccessState('dashboard')).toMatchObject({
      allowed: false,
      reason: 'license',
      feature: 'dashboard.core',
      code: 'LICENSE_SUSPENDED',
    });
  });

  it('maps revoked status to a machine-readable restriction code in strict mode', () => {
    persistLicenseFeatures(['dashboard.core']);
    persistLicenseState({ installed: true, status: 'revoked', enforcement_mode: 'strict', features: ['dashboard.core'] });

    expect(getRouteAccessState('dashboard')).toMatchObject({
      allowed: false,
      reason: 'license',
      feature: 'dashboard.core',
      code: 'LICENSE_REVOKED',
    });
  });

  it('maps invalid status to a machine-readable restriction code in strict mode', () => {
    persistLicenseFeatures(['dashboard.core']);
    persistLicenseState({ installed: true, status: 'invalid', enforcement_mode: 'strict', features: ['dashboard.core'] });

    expect(getRouteAccessState('dashboard')).toMatchObject({
      allowed: false,
      reason: 'license',
      feature: 'dashboard.core',
      code: 'LICENSE_INVALID_SIGNATURE',
    });
  });

  it('does not block feature-gated routes in warn mode when the feature is missing', () => {
    persistLicenseState({ installed: false, status: 'missing', enforcement_mode: 'warn', features: [] });

    expect(canAccessRoute('dashboard')).toBe(true);
  });

  it('keeps grace status permissive when the feature is present', () => {
    persistLicenseFeatures(['dashboard.core']);
    persistLicenseState({ installed: true, status: 'grace', enforcement_mode: 'strict', features: ['dashboard.core'] });

    expect(canAccessRoute('dashboard')).toBe(true);
  });

  it('does not turn seat over-limit into a route restriction by itself', () => {
    persistLicenseFeatures(['dashboard.core']);
    persistLicenseState({
      installed: true,
      status: 'active',
      over_limit: true,
      enforcement_mode: 'strict',
      features: ['dashboard.core'],
    });

    expect(canAccessRoute('dashboard')).toBe(true);
  });
});
