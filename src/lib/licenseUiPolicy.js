export const LICENSE_ACCESS_POLICIES = Object.freeze({
  HIDE: 'hide',
  BANNER: 'banner',
});

function resolveConfiguredPolicy() {
  const raw =
    typeof import.meta !== 'undefined' && import.meta?.env?.VITE_LICENSE_ACCESS_POLICY
      ? String(import.meta.env.VITE_LICENSE_ACCESS_POLICY).trim().toLowerCase()
      : '';

  if (raw === LICENSE_ACCESS_POLICIES.HIDE) {
    return LICENSE_ACCESS_POLICIES.HIDE;
  }

  if (raw === LICENSE_ACCESS_POLICIES.BANNER) {
    return LICENSE_ACCESS_POLICIES.BANNER;
  }

  // Default policy: hide restricted modules and show license denied on direct links.
  return LICENSE_ACCESS_POLICIES.HIDE;
}

export const LICENSE_ACCESS_POLICY = resolveConfiguredPolicy();

export function isBannerLicensePolicy() {
  return LICENSE_ACCESS_POLICY === LICENSE_ACCESS_POLICIES.BANNER;
}

export function canSeeNavRoute(accessState) {
  if (accessState?.allowed) return true;
  if (!accessState) return false;
  if (accessState.reason === 'license') {
    return isBannerLicensePolicy();
  }
  return false;
}

export function shouldRedirectForbidden(accessState) {
  if (accessState?.allowed) return false;
  if (!accessState) return true;
  if (accessState.reason === 'license') {
    return !isBannerLicensePolicy();
  }
  return true;
}
