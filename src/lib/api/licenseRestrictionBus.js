export const LICENSE_RESTRICTION_EVENT = 'crm:license-restriction';
const RESTRICTIVE_CODES = new Set([
  'LICENSE_FEATURE_DISABLED',
  'LICENSE_MISSING',
  'LICENSE_SEAT_LIMIT_EXCEEDED',
  'LICENSE_EXPIRED',
  'LICENSE_REVOKED',
  'LICENSE_SUSPENDED',
  'LICENSE_INVALID_SIGNATURE',
  'LICENSE_BINDING_MISMATCH',
]);

function readValue(source, path) {
  return path.reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), source);
}

export function parseLicenseRestrictionPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const code =
    readValue(payload, ['code']) ||
    readValue(payload, ['details', 'code']) ||
    readValue(payload, ['error', 'code']);

  if (!RESTRICTIVE_CODES.has(code)) return null;

  const feature =
    readValue(payload, ['feature']) ||
    readValue(payload, ['details', 'feature']) ||
    readValue(payload, ['details', 'details', 'feature']) ||
    readValue(payload, ['meta', 'feature']) ||
    'unknown.feature';
  const message =
    readValue(payload, ['message']) ||
    readValue(payload, ['details', 'message']) ||
    readValue(payload, ['error', 'message']) ||
    '';

  return { code, feature: String(feature), message: String(message || '') };
}

export function emitLicenseRestriction(restriction) {
  if (typeof window === 'undefined' || !restriction) return;
  const BrowserCustomEvent = window.CustomEvent;
  if (typeof BrowserCustomEvent !== 'function') return;
  window.dispatchEvent(
    new BrowserCustomEvent(LICENSE_RESTRICTION_EVENT, {
      detail: {
        code: restriction.code || 'LICENSE_FEATURE_DISABLED',
        feature: restriction.feature || 'unknown.feature',
        message: restriction.message || '',
        timestamp: Date.now(),
      },
    }),
  );
}
