const LICENSE_STATE_STORAGE_KEY = 'enterprise_crm_license_state';
const ENFORCEMENT_MODES = new Set(['warn', 'strict']);

function normalizeStatus(rawStatus = '') {
  return String(rawStatus || '').trim().toLowerCase();
}

function normalizeEnforcementMode(rawMode = '') {
  const normalized = String(rawMode || '').trim().toLowerCase();
  return ENFORCEMENT_MODES.has(normalized) ? normalized : 'warn';
}

export function normalizeLicenseState(rawState = {}) {
  const features = Array.isArray(rawState?.features)
    ? rawState.features
        .map((feature) => String(feature || '').trim().toLowerCase())
        .filter(Boolean)
    : [];
  const status = normalizeStatus(
    rawState?.status || (rawState?.installed === false ? 'missing' : '')
  );
  return {
    installed: rawState?.installed === undefined ? status !== 'missing' : Boolean(rawState.installed),
    status: status || 'unknown',
    over_limit: Boolean(rawState?.over_limit ?? rawState?.seat_usage?.over_limit),
    features: Array.from(new Set(features)),
    source: String(rawState?.source || '').trim().toLowerCase(),
    enforcement_mode: normalizeEnforcementMode(rawState?.enforcement_mode),
  };
}

export function readStoredLicenseState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(LICENSE_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return normalizeLicenseState(parsed);
  } catch {
    return null;
  }
}

export function persistLicenseState(rawState = {}) {
  const state = normalizeLicenseState(rawState);
  sessionStorage.setItem(LICENSE_STATE_STORAGE_KEY, JSON.stringify(state));
  localStorage.removeItem(LICENSE_STATE_STORAGE_KEY);
  return state;
}

export function clearStoredLicenseState() {
  sessionStorage.removeItem(LICENSE_STATE_STORAGE_KEY);
  localStorage.removeItem(LICENSE_STATE_STORAGE_KEY);
}

export function shouldEnforceLicenseFeatures(rawState) {
  if (!rawState || typeof rawState !== 'object') return false;
  return normalizeLicenseState(rawState).enforcement_mode === 'strict';
}

export function getLicenseStateRestriction(rawState) {
  if (!rawState || typeof rawState !== 'object') return null;
  const state = normalizeLicenseState(rawState);

  if (!shouldEnforceLicenseFeatures(state)) return null;

  if (!state.installed || state.status === 'missing') {
    return {
      code: 'LICENSE_MISSING',
      message: 'License is not installed.',
    };
  }

  if (state.status === 'expired') {
    return {
      code: 'LICENSE_EXPIRED',
      message: 'License has expired.',
    };
  }

  if (state.status === 'revoked') {
    return {
      code: 'LICENSE_REVOKED',
      message: 'License has been revoked.',
    };
  }

  if (state.status === 'invalid') {
    return {
      code: 'LICENSE_INVALID_SIGNATURE',
      message: 'License validation failed.',
    };
  }

  if (state.status === 'suspended') {
    return {
      code: 'LICENSE_SUSPENDED',
      message: 'License is suspended.',
    };
  }

  return null;
}

export { LICENSE_STATE_STORAGE_KEY };
