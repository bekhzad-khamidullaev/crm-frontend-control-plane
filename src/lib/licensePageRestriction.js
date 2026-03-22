const LICENSE_ROUTE_RESTRICTION_STORAGE_KEY = 'enterprise_crm_route_license_restriction';

export function buildRouteLicenseRestriction(routeName, accessState) {
  if (!accessState || accessState.reason !== 'license' || !accessState.feature) {
    return null;
  }
  return {
    code: 'LICENSE_FEATURE_DISABLED',
    feature: String(accessState.feature || 'unknown.feature'),
    routeName: String(routeName || ''),
    message: '',
    timestamp: Date.now(),
  };
}

export function readStoredRouteLicenseRestriction() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(LICENSE_ROUTE_RESTRICTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      code: String(parsed.code || 'LICENSE_FEATURE_DISABLED'),
      feature: String(parsed.feature || 'unknown.feature'),
      routeName: String(parsed.routeName || ''),
      message: String(parsed.message || ''),
      timestamp: Number(parsed.timestamp || 0),
    };
  } catch {
    return null;
  }
}

export function storeRouteLicenseRestriction(restriction) {
  if (typeof window === 'undefined' || !restriction) return;
  try {
    sessionStorage.setItem(LICENSE_ROUTE_RESTRICTION_STORAGE_KEY, JSON.stringify(restriction));
  } catch {
    // ignore storage failures
  }
}

export function clearStoredRouteLicenseRestriction() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(LICENSE_ROUTE_RESTRICTION_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}

