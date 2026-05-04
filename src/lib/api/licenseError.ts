import { t } from '../i18n/index.js';

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
  message?: string;
};

export function formatLicenseRestrictionMessage(code: string = 'LICENSE_FEATURE_DISABLED'): string {
  switch (String(code || '').trim()) {
    case 'LICENSE_MISSING':
      return 'License is missing';
    case 'LICENSE_SEAT_LIMIT_EXCEEDED':
      return 'License seat limit exceeded';
    case 'LICENSE_EXPIRED':
      return 'License has expired';
    case 'LICENSE_REVOKED':
      return 'License has been revoked';
    case 'LICENSE_SUSPENDED':
      return 'License is suspended';
    case 'LICENSE_INVALID_SIGNATURE':
      return 'License validation failed';
    case 'LICENSE_BINDING_MISMATCH':
      return 'License binding mismatch';
    case 'LICENSE_FEATURE_DISABLED':
    default:
      return t('dashboardPage.errors.licenseFeatureDisabled');
  }
}

export function parseLicenseRestriction(
  error: AnyError | null | undefined
): LicenseRestriction | null {
  const candidates = readPayloadCandidates(error);
  const code = findFirst([['code'], ['details', 'code'], ['error', 'code']], candidates);

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
  if (!restrictiveCodes.has(String(code || ''))) return null;

  const feature =
    findFirst(
      [['feature'], ['details', 'feature'], ['details', 'details', 'feature'], ['meta', 'feature']],
      candidates
    ) || 'unknown.feature';
  const message =
    findFirst([['message'], ['details', 'message'], ['error', 'message']], candidates) || undefined;

  return {
    code,
    feature,
    message,
  };
}

export default parseLicenseRestriction;
