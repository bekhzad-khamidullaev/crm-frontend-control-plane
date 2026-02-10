/**
 * Auth Guard - Middleware для проверки авторизации
 * 
 * Используется для защиты роутов от неавторизованного доступа
 */

import { isAuthenticated, isTokenExpired, getToken, clearToken, parseJWT } from './api/auth';
import { navigate } from '../router';

/**
 * Проверяет авторизацию пользователя
 * @param {object} route - Текущий роут
 * @param {boolean} requireAuth - Требуется ли авторизация для роута
 * @returns {boolean} true если доступ разрешен, false если нет
 */
function getRolesFromToken(token) {
  try {
    const payload = parseJWT(token);
    const roles = payload?.roles || payload?.role || payload?.permissions || payload?.scopes || [];
    if (Array.isArray(roles)) return roles.map(String);
    if (typeof roles === 'string') return roles.split(/[\s,]+/).filter(Boolean);
    return [];
  } catch {
    return [];
  }
}

function getStoredRoles() {
  try {
    const raw = sessionStorage.getItem('contora_roles') || localStorage.getItem('contora_roles');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
    if (parsed && Array.isArray(parsed.roles)) return parsed.roles.map(String);
    return [];
  } catch {
    return [];
  }
}

export function checkAuth(route, requireAuth = true, requiredRoles = []) {
  if (!requireAuth) {
    return true;
  }

  const authenticated = isAuthenticated();
  if (!authenticated) {
    if (route.name !== 'login') {
      navigate('/login');
    }
    return false;
  }

  const token = getToken();
  if (token && isTokenExpired(token)) {
    clearToken();
    navigate('/login');
    return false;
  }

  if (requiredRoles && requiredRoles.length) {
    let roles = getRolesFromToken(token);
    if (!roles || roles.length === 0) {
      roles = getStoredRoles();
    }
    if (!roles || roles.length === 0) {
      console.warn('[AuthGuard] No roles available from API/token; allowing access to avoid false 403');
      return true;
    }
    const ok = roles.some((r) => requiredRoles.includes(r));
    if (!ok) {
      navigate('/forbidden');
      return false;
    }
  }

  return true;
}

/**
 * Middleware для автоматической проверки авторизации при изменении роута
 * @param {object} route - Новый роут
 * @param {object} routeMeta - Метаданные роута
 * @returns {boolean} true если доступ разрешен
 */
export function authGuardMiddleware(route, routeMeta = {}) {
  const requireAuth = routeMeta.auth !== false;
  const requiredRoles = Array.isArray(routeMeta.roles) ? routeMeta.roles : [];
  
  // Если роут требует авторизацию, проверяем
  if (requireAuth) {
    return checkAuth(route, true, requiredRoles);
  }
  
  // Если пользователь авторизован и пытается попасть на login, редиректим на dashboard
  if (route.name === 'login' && isAuthenticated()) {
    console.log('[AuthGuard] Already authenticated, redirecting to dashboard');
    navigate('/dashboard');
    return false;
  }
  
  return true;
}

/**
 * Проверяет авторизацию и возвращает статус
 * @returns {object} { authenticated: boolean, tokenValid: boolean, user: object|null }
 */
export function getAuthStatus() {
  const authenticated = isAuthenticated();
  
  if (!authenticated) {
    return { authenticated: false, tokenValid: false, user: null };
  }
  
  const token = getToken();
  const tokenValid = token && !isTokenExpired(token);
  
  return {
    authenticated,
    tokenValid,
    user: authenticated ? { /* user data можно добавить из token */ } : null,
  };
}

/**
 * Hook-like функция для проверки авторизации в компонентах
 * @param {boolean} redirect - Нужно ли редиректить если не авторизован
 * @returns {boolean} true если авторизован
 */
export function useAuthGuard(redirect = true) {
  const authenticated = isAuthenticated();
  
  if (!authenticated && redirect) {
    console.warn('[AuthGuard] Component access denied, redirecting to login');
    navigate('/login');
    return false;
  }
  
  return authenticated;
}

export default {
  checkAuth,
  authGuardMiddleware,
  getAuthStatus,
  useAuthGuard,
};
