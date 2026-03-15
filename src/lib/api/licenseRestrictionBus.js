export const LICENSE_RESTRICTION_EVENT = 'crm:license-restriction';

function readValue(source, path) {
  return path.reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), source);
}

export function parseLicenseRestrictionPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const code =
    readValue(payload, ['code']) ||
    readValue(payload, ['details', 'code']) ||
    readValue(payload, ['error', 'code']);

  if (code !== 'LICENSE_FEATURE_DISABLED') return null;

  const feature =
    readValue(payload, ['feature']) ||
    readValue(payload, ['details', 'feature']) ||
    readValue(payload, ['details', 'details', 'feature']) ||
    readValue(payload, ['meta', 'feature']) ||
    'unknown.feature';

  return { code, feature: String(feature) };
}

export function emitLicenseRestriction(restriction) {
  if (typeof window === 'undefined' || !restriction) return;
  window.dispatchEvent(
    new CustomEvent(LICENSE_RESTRICTION_EVENT, {
      detail: {
        code: restriction.code || 'LICENSE_FEATURE_DISABLED',
        feature: restriction.feature || 'unknown.feature',
        timestamp: Date.now(),
      },
    }),
  );
}
