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
  feature: string;
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

  if (code !== 'LICENSE_FEATURE_DISABLED') return null;

  const feature = findFirst(
    [
      ['feature'],
      ['details', 'feature'],
      ['details', 'details', 'feature'],
      ['meta', 'feature'],
    ],
    candidates
  ) || 'unknown.feature';

  return {
    code,
    feature,
  };
}

export default parseLicenseRestriction;
