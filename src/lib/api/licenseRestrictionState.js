import resolveFeatureName from './licenseFeatureName';

export const LICENSE_RESTRICTION_STORAGE_KEY = 'crm_license_restriction_banner';
export const RESTRICTIVE_CODES = new Set([
  'LICENSE_FEATURE_DISABLED',
  'LICENSE_MISSING',
  'LICENSE_SEAT_LIMIT_EXCEEDED',
  'LICENSE_EXPIRED',
  'LICENSE_REVOKED',
  'LICENSE_SUSPENDED',
  'LICENSE_INVALID_SIGNATURE',
  'LICENSE_BINDING_MISMATCH',
]);

export function getFeatureRestrictionReason(feature, translate) {
  const t = typeof translate === 'function' ? translate : (key, fallback) => fallback || key;
  return t('dashboardPage.errors.licenseFeatureDisabledDescription', {
    feature: resolveFeatureName(String(feature || 'unknown.feature').trim() || 'unknown.feature', t),
  });
}

export function getLicenseRestrictionMessage(restriction, translate) {
  const t = typeof translate === 'function' ? translate : (key, fallback) => fallback || key;
  const code = String(restriction?.code || '').trim();
  const serverMessage = String(restriction?.message || '').trim();

  if (code === 'LICENSE_FEATURE_DISABLED') {
    return {
      message: t('dashboardPage.errors.licenseFeatureDisabled', 'Feature unavailable under current license'),
      description: getFeatureRestrictionReason(restriction?.feature, t),
    };
  }

  if (code === 'LICENSE_MISSING') {
    return {
      message: serverMessage || 'License is missing',
      description:
        serverMessage || 'Install or request a valid license artifact to restore protected modules.',
    };
  }

  if (code === 'LICENSE_SEAT_LIMIT_EXCEEDED') {
    return {
      message: serverMessage || 'License seat limit exceeded',
      description:
        serverMessage || 'Active user count is above the licensed limit. Reduce usage or expand the license.',
    };
  }

  if (code === 'LICENSE_EXPIRED') {
    return {
      message: serverMessage || 'License has expired',
      description:
        serverMessage || 'Renew the license to restore access to protected modules.',
    };
  }

  if (code === 'LICENSE_REVOKED') {
    return {
      message: serverMessage || 'License has been revoked',
      description:
        serverMessage || 'Issue and install a new license artifact to restore access.',
    };
  }

  if (code === 'LICENSE_INVALID_SIGNATURE') {
    return {
      message: serverMessage || 'License validation failed',
      description:
        serverMessage || 'The installed license artifact failed validation. Regenerate challenge or install a valid license.',
    };
  }

  if (code === 'LICENSE_BINDING_MISMATCH') {
    return {
      message: serverMessage || 'License binding mismatch',
      description:
        serverMessage || 'The installed license does not match this environment. Rebind or reinstall the correct license.',
    };
  }

  if (code === 'LICENSE_SUSPENDED') {
    return {
      message: serverMessage || 'License is suspended',
      description:
        serverMessage || 'Subscription is suspended. Contact the license administrator for recovery.',
    };
  }

  return {
    message: serverMessage || t('dashboardPage.errors.licenseRestriction', 'License restriction detected'),
    description:
      serverMessage ||
      t(
        'dashboardPage.errors.licenseRestrictionDescription',
        `Operation is restricted by current license state (${code || 'UNKNOWN'}).`,
      ),
  };
}

export function readStoredLicenseRestriction() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(LICENSE_RESTRICTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const code = String(parsed.code || '').trim();
    const feature = String(parsed.feature || '').trim();
    const message = String(parsed.message || '').trim();
    if (!RESTRICTIVE_CODES.has(code)) return null;
    return { code, feature: feature || 'unknown.feature', message };
  } catch {
    return null;
  }
}

export function storeLicenseRestriction(restriction) {
  if (typeof window === 'undefined') return;
  try {
    if (!restriction) {
      sessionStorage.removeItem(LICENSE_RESTRICTION_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(
      LICENSE_RESTRICTION_STORAGE_KEY,
      JSON.stringify({
        code: restriction.code || 'LICENSE_FEATURE_DISABLED',
        feature: restriction.feature || 'unknown.feature',
        message: restriction.message || '',
      }),
    );
  } catch {
    // Ignore storage failures; banner can still render from live event.
  }
}
