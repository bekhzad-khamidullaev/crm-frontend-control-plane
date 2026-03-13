// JWT Token storage and authentication utilities

let _accessToken = null;
let _refreshToken = null;
const ACCESS_KEY = 'crm_access_token';
const REFRESH_KEY = 'crm_refresh_token';
const MAX_TOKEN_LENGTH = 16384; // warn but keep to avoid auth failures with long JWTs
export const MAX_HEADER_SAFE_LENGTH = 4000;

function normalizeToken(token) {
  if (!token) return null;
  const normalized = token.trim();
  if (normalized.length > MAX_TOKEN_LENGTH) {
    console.warn('Access/refresh token is large; headers may exceed limits. Consider enabling cookie auth or increasing server header limits.');
  }
  if (normalized.length > MAX_HEADER_SAFE_LENGTH) {
    console.warn(
      `Token length (${normalized.length} bytes) is likely too large for Authorization headers (~4KB). Prefer cookie auth (VITE_AUTH_MODE=session) or request smaller JWTs.`
    );
  }
  return normalized;
}

export function isTokenTooLarge(token) {
  return !!token && token.length > MAX_HEADER_SAFE_LENGTH;
}

/**
 * Set authentication token
 * @param {string} token - Authentication token (can be Token or JWT)
 * @param {object} options - Options (for backward compatibility)
 * @param {boolean} options.persist - Whether to save to sessionStorage
 */
export function setToken(token, refreshToken = null, { persist = true } = {}) {
  // Support both Token Auth and JWT
  _accessToken = normalizeToken(token);
  _refreshToken = normalizeToken(refreshToken);
  
  if (persist) {
    try {
      if (_accessToken) {
        sessionStorage.setItem(ACCESS_KEY, _accessToken);
      } else {
        sessionStorage.removeItem(ACCESS_KEY);
      }
      
      if (_refreshToken) {
        sessionStorage.setItem(REFRESH_KEY, _refreshToken);
      } else {
        sessionStorage.removeItem(REFRESH_KEY);
      }
    } catch { /* ignore */ }
  }
}

/**
 * Get current access token
 * @returns {string|null} JWT access token
 */
export function getToken() {
  if (_accessToken) return _accessToken;
  
  try {
    const saved = sessionStorage.getItem(ACCESS_KEY);
    if (saved) { 
      _accessToken = normalizeToken(saved);
      return _accessToken;
    }
    // Migrate old persistent tokens to session storage and erase long-lived copy.
    const legacy = localStorage.getItem(ACCESS_KEY);
    if (legacy) {
      _accessToken = normalizeToken(legacy);
      sessionStorage.setItem(ACCESS_KEY, _accessToken);
      localStorage.removeItem(ACCESS_KEY);
      return _accessToken;
    }
  } catch { /* ignore */ }
  
  return null;
}

/**
 * Get refresh token
 * @returns {string|null} JWT refresh token
 */
export function getRefreshToken() {
  if (_refreshToken) return _refreshToken;
  
  try {
    const saved = sessionStorage.getItem(REFRESH_KEY);
    if (saved) { 
      _refreshToken = normalizeToken(saved);
      return _refreshToken;
    }
    const legacy = localStorage.getItem(REFRESH_KEY);
    if (legacy) {
      _refreshToken = normalizeToken(legacy);
      sessionStorage.setItem(REFRESH_KEY, _refreshToken);
      localStorage.removeItem(REFRESH_KEY);
      return _refreshToken;
    }
  } catch { /* ignore */ }
  
  return null;
}

/**
 * Clear all tokens (logout)
 */
export function clearToken() {
  _accessToken = null;
  _refreshToken = null;
  
  try {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem('authToken'); // legacy
  } catch { /* ignore */ }
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Parse JWT token to get payload
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload
 */
export function parseJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean}
 */
export function isTokenExpired(token) {
  if (!token) return true;
  
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return true;
  
  // exp is in seconds, Date.now() is in milliseconds
  return Date.now() >= payload.exp * 1000;
}

/**
 * Get user info from token
 * @returns {object|null} User info from JWT payload
 */
export function getUserFromToken() {
  const token = getToken();
  if (!token) return null;
  
  const payload = parseJWT(token);
  if (!payload) return null;
  
  const username =
    payload.username ||
    payload.preferred_username ||
    payload.user ||
    payload.login ||
    null;

  return {
    id: payload.user_id ?? payload.id ?? null,
    user_id: payload.user_id ?? payload.id ?? null,
    username,
    email: payload.email ?? null,
    first_name: payload.first_name ?? null,
    last_name: payload.last_name ?? null,
    full_name: payload.full_name ?? null,
    is_staff: Boolean(payload.is_staff),
    is_superuser: Boolean(payload.is_superuser),
    exp: payload.exp,
    iat: payload.iat,
  };
}
