/**
 * Auth Guard - Middleware для проверки авторизации
 * 
 * Используется для защиты роутов от неавторизованного доступа
 */

import { isAuthenticated, isTokenExpired, getToken, clearToken } from './api/auth';
import { navigate } from '../router';

/**
 * Проверяет авторизацию пользователя
 * @param {object} route - Текущий роут
 * @param {boolean} requireAuth - Требуется ли авторизация для роута
 * @returns {boolean} true если доступ разрешен, false если нет
 */
export function checkAuth(route, requireAuth = true) {
  // Публичные роуты (login, etc.) не требуют проверки
  if (!requireAuth) {
    return true;
  }

  const authenticated = isAuthenticated();
  
  if (!authenticated) {
    console.warn(`[AuthGuard] Unauthorized access attempt to ${route.name}`);
    navigate('/login');
    return false;
  }

  // Проверяем, не истек ли токен
  const token = getToken();
  if (token && isTokenExpired(token)) {
    console.warn('[AuthGuard] Token expired, redirecting to login');
    clearToken();
    navigate('/login');
    return false;
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
  
  // Если роут требует авторизацию, проверяем
  if (requireAuth) {
    return checkAuth(route, true);
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
