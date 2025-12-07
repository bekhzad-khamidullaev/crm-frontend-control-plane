// Simple token storage with in-memory default and optional localStorage persistence
let _token = null;
const KEY = 'crm_token';

export function setToken(token, { persist = false } = {}) {
  _token = token || null;
  if (persist) {
    try { localStorage.setItem(KEY, _token ?? ''); } catch (_) {}
  }
}

export function getToken() {
  if (_token) return _token;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) { _token = saved; }
  } catch (_) { /* ignore */ }
  return _token;
}

export function clearToken() {
  _token = null;
  try { localStorage.removeItem(KEY); } catch (_) {}
}

export function isAuthenticated() {
  return !!getToken();
}
