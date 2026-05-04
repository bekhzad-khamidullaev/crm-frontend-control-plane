import { afterEach, describe, expect, it } from 'vitest';

import {
  getLicenseRestrictionMessage,
  readStoredLicenseRestriction,
  storeLicenseRestriction,
} from '../../src/lib/api/licenseRestrictionState.js';

describe('licenseRestrictionState', () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it('formats feature-disabled restriction with resolved feature name', () => {
    const message = getLicenseRestrictionMessage(
      { code: 'LICENSE_FEATURE_DISABLED', feature: 'ai.assist', message: '' },
      (key, vars) => {
        if (key === 'dashboardPage.errors.licenseFeatureDisabled') return 'Feature unavailable';
        if (key === 'dashboardPage.errors.licenseFeatureDisabledDescription') {
          return `Missing module: ${vars.feature}`;
        }
        return key;
      },
    );

    expect(message.message).toBe('Feature unavailable');
    expect(message.description).toContain('AI Chat');
  });

  it('ignores malformed stored restriction payload', () => {
    window.sessionStorage.setItem('crm_license_restriction_banner', '{"broken":');
    expect(readStoredLicenseRestriction()).toBeNull();
  });

  it('stores and clears restriction payload', () => {
    storeLicenseRestriction({ code: 'LICENSE_EXPIRED', feature: 'settings.core', message: 'Expired' });
    expect(readStoredLicenseRestriction()).toEqual({
      code: 'LICENSE_EXPIRED',
      feature: 'settings.core',
      message: 'Expired',
    });

    storeLicenseRestriction(null);
    expect(readStoredLicenseRestriction()).toBeNull();
  });

  it('formats invalid-signature restriction with explicit remediation copy', () => {
    const message = getLicenseRestrictionMessage({
      code: 'LICENSE_INVALID_SIGNATURE',
      feature: 'ai.assist',
      message: '',
    });

    expect(message.message).toBe('License validation failed');
    expect(message.description).toContain('failed validation');
  });

  it('formats binding-mismatch restriction with explicit remediation copy', () => {
    const message = getLicenseRestrictionMessage({
      code: 'LICENSE_BINDING_MISMATCH',
      feature: 'ai.assist',
      message: '',
    });

    expect(message.message).toBe('License binding mismatch');
    expect(message.description).toContain('does not match this environment');
  });
});
