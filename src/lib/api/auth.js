// JWT Token storage and authentication utilities

let _accessToken = null;
let _refreshToken = null;
const ACCESS_KEY = 'crm_access_token';
const REFRESH_KEY = 'crm_refresh_token';

/**
 * Set authentication token
 * @param {string} token - Authentication token (can be Token or JWT)
 * @param {object} options - Options (for backward compatibility)
 * @param {boolean} options.persist - Whether to save to localStorage
 */
export function setToken(token, refreshToken = null, { persist = true } = {}) {
  // Support both Token Auth and JWT
  _accessToken = token || null;
  _refreshToken = refreshToken || null;
  
  if (persist) {
    try {
      if (_accessToken) {
        localStorage.setItem(ACCESS_KEY, _accessToken);
      } else {
        localStorage.removeItem(ACCESS_KEY);
      }
      
      if (_refreshToken) {
        localStorage.setItem(REFRESH_KEY, _refreshToken);
      } else {
        localStorage.removeItem(REFRESH_KEY);
      }
    } catch (_) { /* ignore */ }
  }
}

/**
 * Get current access token
 * @returns {string|null} JWT access token
 */
export function getToken() {
  if (_accessToken) return _accessToken;
  
  try {
    const saved = localStorage.getItem(ACCESS_KEY);
    if (saved) {
      _accessToken = saved;
      return _accessToken;
    }
  } catch (_) { /* ignore */ }
  
  return null;
}

/**
 * Get refresh token
 * @returns {string|null} JWT refresh token
 */
export function getRefreshToken() {
  if (_refreshToken) return _refreshToken;
  
  try {
    const saved = localStorage.getItem(REFRESH_KEY);
    if (saved) {
      _refreshToken = saved;
      return _refreshToken;
    }
  } catch (_) { /* ignore */ }
  
  return null;
}

/**
 * Clear all tokens (logout)
 */
export function clearToken() {
  _accessToken = null;
  _refreshToken = null;
  
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem('authToken'); // legacy
  } catch (_) { /* ignore */ }
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
  
  return {
    id: payload.user_id,
    username: payload.username,
    email: payload.email,
    exp: payload.exp,
    iat: payload.iat,
  };
}
