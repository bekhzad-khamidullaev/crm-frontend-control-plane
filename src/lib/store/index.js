// Simple enterprise-grade store (lightweight)
// Features: modules, subscribe/notify, persisted slices, selectors

const listeners = new Set();
const persistedKeys = new Set(['auth']);

const initialState = {
  auth: {
    user: null,
    token: null,
    roles: [],
  },
  ui: {
    locale: (localStorage.getItem('locale') || 'en'),
    theme: 'light',
    density: 'comfortable',
  },
  cache: {
    // entity caches by id
  }
};

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('app_state') || '{}');
    return { ...initialState, ...saved };
  } catch {
    return { ...initialState };
  }
}

function persist() {
  const snapshot = {};
  for (const k of persistedKeys) snapshot[k] = state[k];
  try { localStorage.setItem('app_state', JSON.stringify(snapshot)); } catch {}
}

export function getState() {
  return state;
}

export function select(selector) {
  return selector(state);
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify() {
  for (const l of listeners) l(state);
}

export function setLocale(locale) {
  state = { ...state, ui: { ...state.ui, locale } };
  localStorage.setItem('locale', locale);
  notify();
}

export function setAuth({ user, token, roles = [] }) {
  state = { ...state, auth: { user, token, roles } };
  persist();
  notify();
}

export function clearAuth() {
  state = { ...state, auth: { user: null, token: null, roles: [] } };
  persist();
  notify();
}

export function cacheEntities(entity, items) {
  state = {
    ...state,
    cache: {
      ...state.cache,
      [entity]: items.reduce((acc, it) => { acc[it.id] = it; return acc; }, {})
    }
  };
  notify();
}

// Guards
export function hasRole(role) {
  return state.auth.roles?.includes(role);
}

export default {
  getState, select, subscribe,
  setLocale, setAuth, clearAuth,
  cacheEntities, hasRole,
};
