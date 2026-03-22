import resolveFeatureName from './licenseFeatureName.ts';

export const LICENSE_RESTRICTION_STORAGE_KEY = 'crm_license_restriction_banner';
export const RESTRICTIVE_CODES = new Set([
  'LICENSE_FEATURE_DISABLED',
  'LICENSE_SEAT_LIMIT_EXCEEDED',
  'LICENSE_EXPIRED',
  'LICENSE_REVOKED',
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
