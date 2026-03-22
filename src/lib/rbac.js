import { getUserFromToken, isAuthenticated } from './api/auth.js';
import { readStoredLicenseFeatures } from './api/licenseFeatures.js';
import {
  getLicenseStateRestriction,
  readStoredLicenseState,
  shouldEnforceLicenseFeatures,
} from './api/licenseState.js';
import { mergeRoles, normalizeRoles, rolesFromTokenPayload } from './roles.js';
import { getRouteMeta, parseHash } from '../router.js';

const WRITE_ROLES = ['admin', 'manager'];
const ROUTE_WRITE_PERMISSION_MAP = {
  'leads-list': 'crm.change_lead',
  'leads-detail': 'crm.change_lead',
  'contacts-list': 'crm.change_contact',
  'contacts-detail': 'crm.change_contact',
  'companies-list': 'crm.change_company',
  'companies-detail': 'crm.change_company',
  'deals-list': 'crm.change_deal',
  'deals-detail': 'crm.change_deal',
  'tasks-list': 'tasks.change_task',
  'tasks-detail': 'tasks.change_task',
  'projects-list': 'tasks.change_project',
  'projects-detail': 'tasks.change_project',
  'payments-list': 'crm.change_payment',
  'payments-detail': 'crm.change_payment',
  'reminders-list': 'common.change_reminder',
  'reminders-detail': 'common.change_reminder',
  'campaigns-list': 'marketing.change_campaign',
  'campaigns-detail': 'marketing.change_campaign',
  'memos-list': 'tasks.change_memo',
  'memos-detail': 'tasks.change_memo',
  'products-list': 'crm.change_product',
  'products-detail': 'crm.change_product',
  'landing-builder': 'landings.change_landingpage',
};

function normalizePermissions(rawPermissions = []) {
  if (!Array.isArray(rawPermissions)) return [];
  const normalized = new Set();
  rawPermissions.forEach((permission) => {
    const value = String(permission || '').trim().toLowerCase();
    if (!value) return;
    normalized.add(value);
  });
  return Array.from(normalized);
}

function getStoredRoles() {
  try {
    const raw = sessionStorage.getItem('enterprise_crm_roles');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return normalizeRoles(parsed);
    if (parsed && Array.isArray(parsed.roles)) return normalizeRoles(parsed.roles);
  } catch {
    return [];
  }
  return [];
}

function getStoredPermissions() {
  try {
    const raw = sessionStorage.getItem('enterprise_crm_permissions');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return normalizePermissions(parsed);
    if (parsed && Array.isArray(parsed.permissions)) return normalizePermissions(parsed.permissions);
  } catch {
    return [];
  }
  return [];
}

function normalizeFeatures(rawFeatures = []) {
  if (!Array.isArray(rawFeatures)) return [];
  const normalized = new Set();
  rawFeatures.forEach((feature) => {
    const value = String(feature || '').trim().toLowerCase();
    if (!value) return;
    normalized.add(value);
  });
  return Array.from(normalized);
}

export function getCurrentRoles() {
  if (!isAuthenticated()) return [];
  const tokenRoles = rolesFromTokenPayload(getUserFromToken() || {});
  const storedRoles = getStoredRoles();
  return mergeRoles(tokenRoles, storedRoles);
}

export function getCurrentPermissions() {
  if (!isAuthenticated()) return [];
  return getStoredPermissions();
}

export function hasAnyRole(requiredRoles = []) {
  const normalizedRequired = normalizeRoles(requiredRoles);
  if (normalizedRequired.length === 0) return true;
  const currentRoles = getCurrentRoles();
  return currentRoles.some((role) => normalizedRequired.includes(role));
}

export function hasAnyPermission(requiredPermissions = []) {
  const normalizedRequired = normalizePermissions(
    Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions],
  );
  if (normalizedRequired.length === 0) return true;
  const currentPermissions = getCurrentPermissions();
  return currentPermissions.some((permission) => normalizedRequired.includes(permission));
}

export function hasAnyFeature(requiredFeatures = []) {
  const normalizedRequired = normalizeFeatures(
    Array.isArray(requiredFeatures) ? requiredFeatures : [requiredFeatures],
  );
  if (normalizedRequired.length === 0) return true;
  const currentFeatures = readStoredLicenseFeatures();
  if (currentFeatures.length === 0) return false;
  return currentFeatures.some((feature) => normalizedRequired.includes(feature));
}

export function canWrite(requiredPermissions = null) {
  if (requiredPermissions) {
    return hasAnyPermission(requiredPermissions);
  }
  const currentRoute = parseHash().name;
  const routePermission = ROUTE_WRITE_PERMISSION_MAP[currentRoute];
  if (routePermission) {
    return hasAnyPermission([routePermission]);
  }
  return hasAnyRole(WRITE_ROLES);
}

export function canAccessRoute(routeName) {
  return getRouteAccessState(routeName).allowed;
}

export function getRouteAccessState(routeName) {
  const meta = getRouteMeta(routeName);
  if (!meta || meta.auth === false) {
    return { allowed: true, reason: null, feature: null, permissions: [], roles: [] };
  }
  if (!isAuthenticated()) {
    return { allowed: false, reason: 'auth', feature: null, permissions: [], roles: [] };
  }
  const requiredRoles = normalizeRoles(Array.isArray(meta.roles) ? meta.roles : []);
  const requiredPermissions = normalizePermissions(Array.isArray(meta.permissions) ? meta.permissions : []);
  const requiredFeatures = normalizeFeatures(
    Array.isArray(meta.features) ? meta.features : meta.feature ? [meta.feature] : [],
  );
  const licenseState = readStoredLicenseState();
  const enforceLicenseFeatures = shouldEnforceLicenseFeatures(licenseState);
  const hasRoles = requiredRoles.length === 0 || hasAnyRole(requiredRoles);
  const hasPermissions = requiredPermissions.length === 0 || hasAnyPermission(requiredPermissions);
  const hasFeatures = requiredFeatures.length === 0 || !enforceLicenseFeatures || hasAnyFeature(requiredFeatures);
  if (requiredFeatures.length > 0) {
    const licenseRestriction = getLicenseStateRestriction(licenseState);
    if (licenseRestriction) {
      return {
        allowed: false,
        reason: 'license',
        feature: requiredFeatures[0] || null,
        code: licenseRestriction.code,
        message: licenseRestriction.message,
        permissions: [],
        roles: [],
      };
    }
  }
  if (hasRoles && hasPermissions && hasFeatures) {
    return { allowed: true, reason: null, feature: null, code: null, message: '', permissions: [], roles: [] };
  }
  if (!hasFeatures) {
    return {
      allowed: false,
      reason: 'license',
      feature: requiredFeatures[0] || null,
      code: 'LICENSE_FEATURE_DISABLED',
      message: '',
      permissions: [],
      roles: [],
    };
  }
  if (!hasPermissions) {
    return {
      allowed: false,
      reason: 'permission',
      feature: null,
      code: null,
      message: '',
      permissions: requiredPermissions,
      roles: [],
    };
  }
  return {
    allowed: false,
    reason: 'role',
    feature: null,
    code: null,
    message: '',
    permissions: [],
    roles: requiredRoles,
  };
}
