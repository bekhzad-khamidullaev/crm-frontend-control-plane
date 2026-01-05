import {
  clearToken,
  getRefreshToken,
  getToken,
  isTokenExpired,
  isTokenTooLarge,
  MAX_HEADER_SAFE_LENGTH,
  setToken,
} from './auth.js';

// Runtime config (injected via window.__APP_CONFIG__ for deployments outside Vite)
const runtimeConfig = typeof window !== 'undefined' ? window.__APP_CONFIG__ || {} : {};
const rawBase =
  import.meta.env.VITE_API_BASE_URL ||
  runtimeConfig.apiBaseUrl ||
  runtimeConfig.BASE_URL ||
  '';
const sanitizedBase = (rawBase || '').replace(/\/$/, '');
const fallbackBase = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
const API_BASE_URL = sanitizedBase || fallbackBase;
const API_PREFIX = (import.meta.env.VITE_API_PREFIX || runtimeConfig.apiPrefix || '').replace(/\/$/, '');
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT || runtimeConfig.apiTimeout || 15000);
const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE || runtimeConfig.authMode || 'jwt').toLowerCase();
const SEND_COOKIES =
  (import.meta.env.VITE_API_SEND_COOKIES || runtimeConfig.apiSendCookies || '').toString() === 'true' ||
  AUTH_MODE === 'session';
const resolveCredentials = (mode = AUTH_MODE) => (SEND_COOKIES || mode === 'session' ? 'include' : 'omit');
const MAX_AUTH_HEADER_LENGTH = MAX_HEADER_SAFE_LENGTH;

const AUTH_ENDPOINTS = ['/api/token/', '/api/token/refresh/', '/api/token/verify/', '/api/auth/token/'];
const RETRYABLE_STATUS = [502, 503, 504];
const MAX_RETRY_DELAY = 4000;

// When backend/proxy is misconfigured it may cause redirect loops (ERR_TOO_MANY_REDIRECTS)
// which surface in browsers as a network failure (TypeError: Failed to fetch).
// For reference endpoints we can safely degrade by returning an empty page instead of blocking the UI.
const REFERENCE_ENDPOINT_REGEX =
  /^\/api\/(users|industries|client-types|lead-sources|countries|cities|departments|currencies|crm-tags|task-stages|project-stages|stages|product-categories|task-tags)\//;
const referenceWarned = new Set();
const EMPTY_PAGE = Object.freeze({ count: 0, next: null, previous: null, results: [] });

function isNetworkFailure(err) {
  // fetch failures in browsers are usually TypeError("Failed to fetch")
  if (err instanceof TypeError) return true;
  if (err instanceof ApiError && (err.status === 0 || !err.status)) return true;
  return false;
}

function warnReferenceOnce(path, err) {
  const key = path;
  if (referenceWarned.has(key)) return;
  referenceWarned.add(key);
  // Intentionally only console.warn here (no antd message in API layer).
  console.warn(`[API] Reference endpoint failed, falling back to empty list: ${path}`, err);
}

export class ApiError extends Error {
  constructor(message, { status = 0, statusText = '', url = '', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.details = details;
  }
}

const normalizedPrefix = sanitizePrefix(API_PREFIX);

function sanitizePrefix(prefix) {
  if (!prefix) return '';
  const trimmed = prefix.replace(/^\/|\/$/g, '');
  return trimmed ? `/${trimmed}` : '';
}

function normalizePath(path) {
  const ensured = path.startsWith('/') ? path : `/${path}`;
  if (!normalizedPrefix) return ensured;
  return ensured.startsWith(normalizedPrefix) ? ensured : `${normalizedPrefix}${ensured}`;
}

function buildUrl(path, params) {
  const normalizedPath = path.startsWith('http') ? path : `${API_BASE_URL}${normalizePath(path)}`;
  const url = new URL(normalizedPath);

  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}

function withTimeout(promise, ms, controller) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (controller) controller.abort();
      reject(new ApiError('Request timed out'));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function parseResponseBody(response, responseType = 'json', forError = false) {
  const contentType = response.headers.get('content-type') || '';
  if (response.status === 204) return {};

  if (forError) {
    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (_) {
        return {};
      }
    }

    const text = await response.text();
    return text || {};
  }

  if (responseType === 'blob') {
    return response.blob();
  }

  if (responseType === 'text') {
    return response.text();
  }

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (_) {
      return {};
    }
  }

  const text = await response.text();
  return text || {};
}

function isAuthEndpoint(path) {
  return AUTH_ENDPOINTS.some((endpoint) => path.includes(endpoint));
}

function formatAuthHeader(token, mode = AUTH_MODE) {
  if (!token) return null;
  if (isTokenTooLarge(token)) {
    throw new ApiError(
      `Access token is ${token.length} bytes — larger than typical Authorization header limits (~4KB). Enable cookie auth (VITE_AUTH_MODE=session or VITE_API_SEND_COOKIES=true) or request smaller tokens.`,
      { status: 431 }
    );
  }
  if (mode === 'token') return token.startsWith('Token ') ? token : `Token ${token}`;
  if (mode === 'jwt') return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  return null;
}

function shouldRetry(err, retry, method) {
  if (retry <= 0) return false;
  if (method !== 'GET') return false;
  if (err instanceof ApiError) {
    return err.status === 0 || RETRYABLE_STATUS.includes(err.status);
  }
  return true;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeError(response, payload, url) {
  const status = response?.status ?? 0;
  const statusText = response?.statusText ?? '';
  const message = status
    ? status === 431
      ? 'HTTP 431 Request Header Fields Too Large (Authorization likely exceeds ~4KB — switch to cookie auth or issue smaller JWTs)'
      : `HTTP ${status}${statusText ? ` ${statusText}` : ''}`
    : `Cannot reach API at ${API_BASE_URL}`;

  return new ApiError(message, {
    status,
    statusText,
    url,
    details: payload || null,
  });
}

let refreshPromise = null;

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new ApiError('No refresh token available', { status: 401 });
  }

  try {
    const url = buildUrl('/api/token/refresh/');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
      mode: 'cors',
      credentials: resolveCredentials(),
    });

    const payload = await parseResponseBody(response);
    if (!response.ok) {
      clearToken();
      // If refresh fails with 401, try re-login
      if (response.status === 401 || response.status === 500) {
        throw new ApiError('Session expired. Please login again', { status: 401 });
      }
      throw normalizeError(response, payload, url);
    }

    if (!payload?.access) {
      clearToken();
      throw new ApiError('Invalid refresh response', { status: 400 });
    }

    setToken(payload.access, payload.refresh || refreshToken);
    return payload.access;
  } catch (error) {
    clearToken();
    throw error;
  }
}

async function ensureFreshAccessToken(authMode = AUTH_MODE) {
  if (authMode !== 'jwt') {
    return getToken();
  }

  const access = getToken();
  
  // If no token or token expired, return it anyway and let the request handle 401
  // The API will return 401, which triggers clearToken() and forces re-login
  if (!access) {
    return null;
  }

  // Return token regardless of expiration - let the server validate it
  // If expired, we'll get 401 and will need to re-login
  return access;
}

async function attachAuth(headers, authMode) {
  if (authMode === 'session') return;
  const token = await ensureFreshAccessToken(authMode);
  const headerValue = formatAuthHeader(token, authMode);
  if (headerValue) headers.set('Authorization', headerValue);
}

async function request(method, path, options = {}) {
  const { params, body, headers = {}, retry = 1, skipAuth = false, authMode = AUTH_MODE, signal } = options;
  const url = buildUrl(path, params);
  const controller = new AbortController();
  const credentialsMode = resolveCredentials(authMode);

  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const finalHeaders = new Headers({ Accept: 'application/json', ...headers });
  const isFormData = body instanceof FormData;
  if (body && !isFormData) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  const authAllowed = !skipAuth && !isAuthEndpoint(path);
  if (authAllowed) {
    try {
      await attachAuth(finalHeaders, authMode);
    } catch (authError) {
      throw authError instanceof ApiError
        ? authError
        : new ApiError(authError.message || 'Authentication failed', { url });
    }
  }

  const fetchPromise = fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    mode: 'cors',
    credentials: credentialsMode,
    signal: controller.signal,
  });

  try {
    const response = await withTimeout(fetchPromise, API_TIMEOUT, controller);
    const payload = await parseResponseBody(response, options.responseType, !response.ok);

    // On 401, always clear tokens and require re-login
    // (automatic refresh can cause issues if backend doesn't support it properly)
    if (response.status === 401 && authAllowed) {
      clearToken();
      throw normalizeError(response, payload, url);
    }

    if (response.status === 403 && authAllowed) {
      throw normalizeError(response, payload, url);
    }

    if (!response.ok) {
      if (response.status === 431 && authAllowed) {
        clearToken();
        throw new ApiError(
          'Authorization header is too large for the server (HTTP 431). Re-login with cookie auth or ask backend to issue shorter JWTs.',
          { status: 431, url, details: payload }
        );
      }
      throw normalizeError(response, payload, url);
    }

    return payload;
  } catch (err) {
    // Centralized graceful fallback for reference endpoints when backend causes redirect loops
    // (ERR_TOO_MANY_REDIRECTS -> fetch throws TypeError: Failed to fetch).
    if (method === 'GET' && REFERENCE_ENDPOINT_REGEX.test(path) && isNetworkFailure(err)) {
      warnReferenceOnce(path, err);
      return EMPTY_PAGE;
    }

    const apiError = err instanceof ApiError ? err : new ApiError(err.message || 'Network error', { url });
    if (shouldRetry(apiError, retry, method)) {
      const attempt = (options._attempt || 0) + 1;
      const backoff = Math.min(300 * 2 ** attempt, MAX_RETRY_DELAY);
      await delay(backoff);
      return request(method, path, { ...options, retry: retry - 1, _attempt: attempt });
    }

    throw apiError;
  }
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
  prefix: normalizedPrefix,
  timeout: API_TIMEOUT,
  authMode: AUTH_MODE,
  sendCookies: SEND_COOKIES,
};

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, opts) => request('POST', path, opts),
  put: (path, opts) => request('PUT', path, opts),
  patch: (path, opts) => request('PATCH', path, opts),
  delete: (path, opts) => request('DELETE', path, opts),
};

export const get = api.get;
export const post = api.post;
export const put = api.put;
export const patch = api.patch;
export const del = api.delete;

function crudResource(basePath) {
  const base = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return {
    list: (params, opts = {}) => api.get(base, { ...opts, params }),
    retrieve: (id, opts = {}) => api.get(`${base}${id}/`, { ...opts }),
    create: (payload, opts = {}) => api.post(base, { ...opts, body: payload }),
    update: (id, payload, opts = {}) => api.put(`${base}${id}/`, { ...opts, body: payload }),
    patch: (id, payload, opts = {}) => api.patch(`${base}${id}/`, { ...opts, body: payload }),
    remove: (id, opts = {}) => api.delete(`${base}${id}/`, { ...opts }),
  };
}

function readonlyResource(basePath) {
  const base = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return {
    list: (params) => api.get(base, { params }),
    retrieve: (id) => api.get(`${base}${id}/`),
  };
}

// Authentication (JWT + Token) — per Contora API.yaml
async function loginWithFallback(credentials) {
  // Use only the correct endpoint: /api/token/
  return await api.post('/api/token/', { body: credentials, skipAuth: true });
}

export const authApi = {
  login: ({ username, password }) => loginWithFallback({ username, password }),
  refresh: ({ refresh }) => api.post('/api/token/refresh/', { body: { refresh }, skipAuth: true }),
  verify: ({ token }) => api.post('/api/token/verify/', { body: { token }, skipAuth: true }),
  authToken: ({ username, password }) => api.post('/api/auth/token/', { body: { username, password }, skipAuth: true }),
  authStats: () => api.get('/api/auth-stats/'),
};

// Core entities
export const leadsApi = {
  ...crudResource('/api/leads/'),
  assign: (id, payload) => api.post(`/api/leads/${id}/assign/`, { body: payload }),
  convert: (id, payload = {}) => api.post(`/api/leads/${id}/convert/`, { body: payload }),
  disqualify: (id, payload = {}) => api.post(`/api/leads/${id}/disqualify/`, { body: payload }),
  bulkTag: (payload) => api.post('/api/leads/bulk_tag/', { body: payload }),
};

export const contactsApi = { ...crudResource('/api/contacts/') };
export const companiesApi = { ...crudResource('/api/companies/') };
export const dealsApi = { ...crudResource('/api/deals/') };
export const tasksApi = { ...crudResource('/api/tasks/') };

export const projectsApi = {
  ...crudResource('/api/projects/'),
  assign: (id, payload) => api.post(`/api/projects/${id}/assign/`, { body: payload }),
  complete: (id) => api.post(`/api/projects/${id}/complete/`),
  reopen: (id) => api.post(`/api/projects/${id}/reopen/`),
  bulkTag: (payload) => api.post('/api/projects/bulk_tag/', { body: payload }),
  export: (params) => api.get('/api/projects/export/', { params }),
};

// Users & profiles
export const usersApi = {
  ...readonlyResource('/api/users/'),
  me: () => api.get('/api/users/me/'),
};

export const profilesApi = {
  retrieve: (userId) => api.get(`/api/profiles/${userId}/`),
  retrieveByUser: (user) => api.get(`/api/profiles/${user}/`),
  me: () => api.get('/api/profiles/me/'),
  uploadAvatar: (formData) => api.post('/api/profiles/me/avatar/', { body: formData }),
  deleteAvatar: () => api.delete('/api/profiles/me/avatar/'),
};

// Dashboard & analytics
export const dashboardApi = {
  activity: () => api.get('/api/dashboard/activity/'),
  analytics: (params) => api.get('/api/dashboard/analytics/', { params }),
  funnel: (params) => api.get('/api/dashboard/funnel/', { params }),
};

// Reference data
export const stagesApi = { ...readonlyResource('/api/stages/') };
export const crmTagsApi = { ...readonlyResource('/api/crm-tags/') };
export const taskTagsApi = { ...readonlyResource('/api/task-tags/') };
export const projectStagesApi = { ...readonlyResource('/api/project-stages/') };
export const taskStagesApi = { ...readonlyResource('/api/task-stages/') };

// Memos
export const memosApi = {
  ...crudResource('/api/memos/'),
  markReviewed: (id) => api.post(`/api/memos/${id}/mark_reviewed/`),
  markPostponed: (id) => api.post(`/api/memos/${id}/mark_postponed/`),
};

// Chat
export const chatApi = {
  ...crudResource('/api/chat-messages/'),
  replies: (id, params) => api.get(`/api/chat-messages/${id}/replies/`, { params }),
  thread: (id, params) => api.get(`/api/chat-messages/${id}/thread/`, { params }),
};

// Call logs (VoIP + legacy)
export const callLogsApi = {
  list: (params) => api.get('/api/voip/call-logs/', { params }),
  retrieve: (logId) => api.get(`/api/voip/call-logs/${logId}/`),
  addNote: (logId, payload) => api.post(`/api/voip/call-logs/${logId}/add-note/`, { body: payload }),
  listLegacy: (params) => api.get('/api/call-logs/', { params }),
  retrieveLegacy: (id) => api.get(`/api/call-logs/${id}/`),
};

// Convenience aliases for components
export const getLeads = (params) => leadsApi.list(params);
export const getLead = (id) => leadsApi.retrieve(id);
export const createLead = (payload) => leadsApi.create(payload);
export const updateLead = (id, payload) => leadsApi.update(id, payload);
export const deleteLead = (id) => leadsApi.remove(id);

export const getContacts = (params) => contactsApi.list(params);
export const getContact = (id) => contactsApi.retrieve(id);
export const createContact = (payload) => contactsApi.create(payload);
export const updateContact = (id, payload) => contactsApi.update(id, payload);
export const patchContact = (id, payload) => contactsApi.patch(id, payload);
export const deleteContact = (id) => contactsApi.remove(id);

export const getCompanies = (params) => companiesApi.list(params);
export const getCompany = (id) => companiesApi.retrieve(id);
export const createCompany = (payload) => companiesApi.create(payload);
export const updateCompany = (id, payload) => companiesApi.update(id, payload);
export const deleteCompany = (id) => companiesApi.remove(id);

export const getDeals = (params) => dealsApi.list(params);
export const getDeal = (id) => dealsApi.retrieve(id);
export const createDeal = (payload) => dealsApi.create(payload);
export const updateDeal = (id, payload) => dealsApi.update(id, payload);
export const deleteDeal = (id) => dealsApi.remove(id);

export const getTasks = (params) => tasksApi.list(params);
export const getTask = (id) => tasksApi.retrieve(id);
export const createTask = (payload) => tasksApi.create(payload);
export const updateTask = (id, payload) => tasksApi.update(id, payload);
export const deleteTask = (id) => tasksApi.remove(id);

export const getProjects = (params) => projectsApi.list(params);
export const getProject = (id) => projectsApi.retrieve(id);
export const createProject = (payload) => projectsApi.create(payload);
export const updateProject = (id, payload) => projectsApi.update(id, payload);
export const deleteProject = (id) => projectsApi.remove(id);

export const getUsers = (params) => usersApi.list(params);
export const getUser = (id) => usersApi.retrieve(id);
