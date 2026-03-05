import { getUserFromToken, isAuthenticated } from './api/auth.js';
import { mergeRoles, normalizeRoles, rolesFromTokenPayload } from './roles.js';
import { getRouteMeta } from '../router.js';

const WRITE_ROLES = ['admin', 'manager'];

function getStoredRoles() {
  try {
    const raw = sessionStorage.getItem('enterprise_crm_roles') || localStorage.getItem('enterprise_crm_roles');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return normalizeRoles(parsed);
    if (parsed && Array.isArray(parsed.roles)) return normalizeRoles(parsed.roles);
  } catch {
    return [];
  }
  return [];
}

export function getCurrentRoles() {
  if (!isAuthenticated()) return [];
  const tokenRoles = rolesFromTokenPayload(getUserFromToken() || {});
  const storedRoles = getStoredRoles();
  return mergeRoles(tokenRoles, storedRoles);
}

export function hasAnyRole(requiredRoles = []) {
  const normalizedRequired = normalizeRoles(requiredRoles);
  if (normalizedRequired.length === 0) return true;
  const currentRoles = getCurrentRoles();
  return currentRoles.some((role) => normalizedRequired.includes(role));
}

export function canWrite() {
  return hasAnyRole(WRITE_ROLES);
}

export function canAccessRoute(routeName) {
  const meta = getRouteMeta(routeName);
  if (!meta || meta.auth === false) return true;
  if (!isAuthenticated()) return false;
  const required = normalizeRoles(Array.isArray(meta.roles) ? meta.roles : []);
  if (required.length === 0) return true;
  return hasAnyRole(required);
}
