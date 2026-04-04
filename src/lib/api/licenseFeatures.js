const LICENSE_FEATURE_STORAGE_KEY = 'enterprise_crm_license_features';

export function normalizeLicenseFeatures(rawFeatures = []) {
  if (!Array.isArray(rawFeatures)) return [];
  const normalized = new Set();
  rawFeatures.forEach((feature) => {
    const value = String(feature || '').trim().toLowerCase();
    if (!value) return;
    normalized.add(value);
  });
  return Array.from(normalized);
}

export function persistLicenseFeatures(rawFeatures = []) {
  const features = normalizeLicenseFeatures(rawFeatures);
  const serialized = JSON.stringify(features);
  sessionStorage.setItem(LICENSE_FEATURE_STORAGE_KEY, serialized);
  localStorage.removeItem(LICENSE_FEATURE_STORAGE_KEY);
  return features;
}

export function readStoredLicenseFeatures() {
  try {
    const raw = sessionStorage.getItem(LICENSE_FEATURE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return normalizeLicenseFeatures(parsed);
    if (parsed && Array.isArray(parsed.features)) return normalizeLicenseFeatures(parsed.features);
  } catch {
    return [];
  }
  return [];
}

export function clearStoredLicenseFeatures() {
  sessionStorage.removeItem(LICENSE_FEATURE_STORAGE_KEY);
  localStorage.removeItem(LICENSE_FEATURE_STORAGE_KEY);
}

export { LICENSE_FEATURE_STORAGE_KEY };
