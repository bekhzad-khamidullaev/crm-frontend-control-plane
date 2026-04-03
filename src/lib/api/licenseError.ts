type AnyError = {
  code?: string;
  data?: any;
  details?: any;
  body?: any;
  status_code?: number;
  response?: {
    status?: number;
    data?: any;
  };
};

function normalizeLicenseCode(code: unknown): string {
  const raw = String(code || '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  if (!raw) return '';
  return raw.startsWith('LICENSE_') ? raw : `LICENSE_${raw}`;
}

function readPayloadCandidates(error: AnyError | null | undefined): any[] {
  if (!error || typeof error !== 'object') return [];
  return [
    error,
    error.data,
    error.details,
    error.body,
    error.response?.data,
    error.response?.data?.details,
    error.response?.data?.body,
  ].filter(Boolean);
}

function pickByPath(source: any, path: string[]): any {
  return path.reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), source);
}

function findFirst(paths: string[][], candidates: any[]): any {
  for (const candidate of candidates) {
    for (const path of paths) {
      const value = pickByPath(candidate, path);
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
  }
  return null;
}

export type LicenseRestriction = {
  code: string;
  feature?: string;
  message?: string;
};

export function parseLicenseRestriction(error: AnyError | null | undefined): LicenseRestriction | null {
  const candidates = readPayloadCandidates(error);
  const code = findFirst(
    [
      ['code'],
      ['details', 'code'],
      ['error', 'code'],
    ],
    candidates
  );

  const restrictiveCodes = new Set([
    'LICENSE_FEATURE_DISABLED',
    'LICENSE_MISSING',
    'LICENSE_SEAT_LIMIT_EXCEEDED',
    'LICENSE_EXPIRED',
    'LICENSE_REVOKED',
    'LICENSE_SUSPENDED',
    'LICENSE_INVALID_SIGNATURE',
    'LICENSE_BINDING_MISMATCH',
  ]);
  const normalizedCode = normalizeLicenseCode(code);
  if (!restrictiveCodes.has(normalizedCode)) return null;

  const feature = findFirst(
    [
      ['feature'],
      ['details', 'feature'],
      ['details', 'details', 'feature'],
      ['meta', 'feature'],
    ],
    candidates
  );

  const message = findFirst(
    [
      ['message'],
      ['details', 'message'],
      ['error', 'message'],
    ],
    candidates
  );

  return {
    code: normalizedCode,
    feature: feature ? String(feature) : undefined,
    message: message ? String(message) : undefined,
  };
}

export default parseLicenseRestriction;
