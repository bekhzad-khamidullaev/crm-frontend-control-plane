import { getToken, getRefreshToken, setToken, clearToken, isTokenExpired } from './auth.js';

// Allow runtime config injection (window.__APP_CONFIG__) in addition to Vite env
const runtimeConfig = typeof window !== 'undefined' ? window.__APP_CONFIG__ || {} : {};
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || runtimeConfig.apiBaseUrl || 'http://localhost:8000').replace(/\/$/, '');
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT || runtimeConfig.apiTimeout || 15000);
const IS_TEST = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('Request timeout')), ms);
    promise.then((res) => { clearTimeout(id); resolve(res); })
           .catch((err) => { clearTimeout(id); reject(err); });
  });
}

function normalizeError(error, response) {
  if (response) {
    const details = (error && typeof error === 'object') ? error : (typeof error === 'string' ? { detail: error } : null);
    return {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      message: `HTTP ${response.status}: ${response.statusText}`,
      details,
    };
  }
  return { status: 0, statusText: 'Network Error', url: null, message: error?.message || 'Network Error', details: null };
}

function buildUrl(path, params) {
  const normalizedPath = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const url = new URL(normalizedPath);
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([k, v]) => {
      // Skip undefined, null, and empty strings
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v)) v.forEach((vi) => url.searchParams.append(k, vi));
      else url.searchParams.set(k, v);
    });
  }
  return url.toString();
}

// Request queue for handling concurrent requests during token refresh
let isRefreshing = false;
let refreshQueue = [];

/**
 * Refresh the access token using refresh token
 */
async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    setToken(data.access, refresh);
    return data.access;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear tokens and redirect to login
    clearToken();
    if (typeof window !== 'undefined') {
      // Use hash navigation for consistency
      window.location.hash = '/login';
      // Reload to ensure clean state
      window.location.reload();
    }
    throw error;
  }
}

/**
 * Main request function with automatic token refresh
 */
async function request(method, path, { params, body, headers, retry = 1, _isRetry = false } = {}) {
  // Skip token refresh for auth endpoints
  const isAuthEndpoint = path.includes('/token/') || path.includes('/auth/');
  
  // Check if token is expired and refresh if needed
  if (!isAuthEndpoint && !_isRetry) {
    const token = getToken();
    if (token && isTokenExpired(token)) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject, method, path, params, body, headers, retry });
        });
      }

      // Start refresh process
      isRefreshing = true;
      try {
        await refreshAccessToken();
        
        // Process queued requests
        refreshQueue.forEach(({ resolve: qResolve, reject: qReject, method, path, params, body, headers, retry }) => {
          request(method, path, { params, body, headers, retry, _isRetry: true })
            .then(qResolve)
            .catch(qReject);
        });
        refreshQueue = [];
      } catch (error) {
        // Reject all queued requests
        refreshQueue.forEach(({ reject: qReject }) => qReject(error));
        refreshQueue = [];
        throw error;
      } finally {
        isRefreshing = false;
      }
    }
  }

  const url = buildUrl(path, params);
  const token = getToken();
  const finalHeaders = new Headers({ 'Accept': 'application/json', ...headers });
  
  if (body && !(body instanceof FormData)) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  
  if (token && !isAuthEndpoint) {
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  const fetcher = fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    credentials: 'include',
    mode: 'cors',
  });

  try {
    const res = await withTimeout(fetcher, TIMEOUT);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json().catch(() => ({})) : await res.text();
    
    // Handle 401 Unauthorized - try to refresh token
    if (res.status === 401 && !isAuthEndpoint && !_isRetry) {
      try {
        await refreshAccessToken();
        // Retry the original request with new token
        return request(method, path, { params, body, headers, retry, _isRetry: true });
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        console.error('Token refresh failed');
        clearToken();
        if (typeof window !== 'undefined' && !window.location.hash.includes('/login')) {
          window.location.hash = '/login';
          // Force reload to clear app state
          setTimeout(() => window.location.reload(), 100);
        }
        throw normalizeError(data, res);
      }
    }
    
    // Handle 401 on auth endpoints (login failed, etc.)
    if (res.status === 401 && isAuthEndpoint) {
      throw normalizeError(data, res);
    }
    
    // Handle 403 Forbidden - treat like 401 for authentication purposes
    if (res.status === 403 && !isAuthEndpoint) {
      console.warn('403 Forbidden error');
      clearToken();
      if (typeof window !== 'undefined' && !window.location.hash.includes('/login')) {
        window.location.hash = '/login';
        setTimeout(() => window.location.reload(), 100);
      }
      throw normalizeError(data, res);
    }
    
    if (!res.ok) {
      throw normalizeError(data, res);
    }
    return data;
  } catch (err) {
    // If error is 401 or 403, ensure we redirect to login (prevent infinite loop)
    if ((err?.status === 401 || err?.status === 403) && !isAuthEndpoint) {
      console.warn(`${err?.status} ${err?.status === 401 ? 'Unauthorized' : 'Forbidden'} error`);
      clearToken();
      if (typeof window !== 'undefined' && !window.location.hash.includes('/login')) {
        window.location.hash = '/login';
        setTimeout(() => window.location.reload(), 100);
      }
    }
    
    // Retry only GET for network errors (Error instances). Do not retry HTTP errors (object payloads)
    const isNetworkError = err instanceof Error;
    if (retry > 0 && method === 'GET' && isNetworkError) {
      return request(method, path, { params, body, headers, retry: retry - 1, _isRetry });
    }
    // Bubble up normalized errors
    if (!(err instanceof Error) && err?.status) {
      throw err;
    }
    throw err;
  }
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, opts) => request('POST', path, opts),
  put: (path, opts) => request('PUT', path, opts),
  patch: (path, opts) => request('PATCH', path, opts),
  delete: (path, opts) => request('DELETE', path, opts),
};

// Leads endpoints (derived from Django-CRM API.yaml)
export const leadsApi = {
  list: (params) => api.get('/api/leads/', { params }),
  retrieve: (id) => api.get(`/api/leads/${id}/`),
  create: (payload) => api.post('/api/leads/', { body: payload }),
  update: (id, payload) => api.put(`/api/leads/${id}/`, { body: payload }),
  patch: (id, payload) => api.patch(`/api/leads/${id}/`, { body: payload }),
  remove: (id) => api.delete(`/api/leads/${id}/`),
  assign: (id, payload) => api.post(`/api/leads/${id}/assign/`, { body: payload }),
  convert: (id, payload = {}) => api.post(`/api/leads/${id}/convert/`, { body: payload }),
  disqualify: (id, payload = {}) => api.post(`/api/leads/${id}/disqualify/`, { body: payload }),
  bulkTag: (payload) => api.post('/api/leads/bulk_tag/', { body: payload }),
};

export const authApi = {
  login: ({ username, password }) => api.post('/api/token/', { body: { username, password } }),
  refresh: ({ refresh }) => api.post('/api/token/refresh/', { body: { refresh } }),
  verify: ({ token }) => api.post('/api/token/verify/', { body: { token } }),
};

export const usersApi = {
  list: (params) => api.get('/api/users/', { params }),
  retrieve: (id) => api.get(`/api/users/${id}/`),
  me: () => api.get('/api/users/me/'),
};

export const contactsApi = {
  list: (params) => api.get('/api/contacts/', { params }),
  retrieve: (id) => api.get(`/api/contacts/${id}/`),
  create: (payload) => api.post('/api/contacts/', { body: payload }),
  update: (id, payload) => api.put(`/api/contacts/${id}/`, { body: payload }),
  patch: (id, payload) => api.patch(`/api/contacts/${id}/`, { body: payload }),
  remove: (id) => api.delete(`/api/contacts/${id}/`),
};

export const companiesApi = {
  list: (params) => api.get('/api/companies/', { params }),
  retrieve: (id) => api.get(`/api/companies/${id}/`),
  create: (payload) => api.post('/api/companies/', { body: payload }),
  update: (id, payload) => api.put(`/api/companies/${id}/`, { body: payload }),
  patch: (id, payload) => api.patch(`/api/companies/${id}/`, { body: payload }),
  remove: (id) => api.delete(`/api/companies/${id}/`),
};

export const dealsApi = {
  list: (params) => api.get('/api/deals/', { params }),
  retrieve: (id) => api.get(`/api/deals/${id}/`),
  create: (payload) => api.post('/api/deals/', { body: payload }),
  update: (id, payload) => api.put(`/api/deals/${id}/`, { body: payload }),
  patch: (id, payload) => api.patch(`/api/deals/${id}/`, { body: payload }),
  remove: (id) => api.delete(`/api/deals/${id}/`),
};

export const tasksApi = {
  list: (params) => api.get('/api/tasks/', { params }),
  retrieve: (id) => api.get(`/api/tasks/${id}/`),
  create: (payload) => api.post('/api/tasks/', { body: payload }),
  update: (id, payload) => api.put(`/api/tasks/${id}/`, { body: payload }),
  patch: (id, payload) => api.patch(`/api/tasks/${id}/`, { body: payload }),
  remove: (id) => api.delete(`/api/tasks/${id}/`),
};

export const projectsApi = {
  list: (params) => api.get('/api/projects/', { params }),
  retrieve: (id) => api.get(`/api/projects/${id}/`),
  create: (payload) => api.post('/api/projects/', { body: payload }),
  update: (id, payload) => api.put(`/api/projects/${id}/`, { body: payload }),
  patch: (id, payload) => api.patch(`/api/projects/${id}/`, { body: payload }),
  remove: (id) => api.delete(`/api/projects/${id}/`),
  assign: (id, payload) => api.post(`/api/projects/${id}/assign/`, { body: payload }),
  complete: (id) => api.post(`/api/projects/${id}/complete/`),
  reopen: (id) => api.post(`/api/projects/${id}/reopen/`),
  bulkTag: (payload) => api.post('/api/projects/bulk_tag/', { body: payload }),
  export: (params) => api.get('/api/projects/export/', { params }),
};

export const memosApi = {
  list: (params) => api.get('/api/memos/', { params }),
  retrieve: (id) => api.get(`/api/memos/${id}/`),
  create: (payload) => api.post('/api/memos/', { body: payload }),
  update: (id, payload) => api.put(`/api/memos/${id}/`, { body: payload }),
  patch: (id, payload) => api.patch(`/api/memos/${id}/`, { body: payload }),
  remove: (id) => api.delete(`/api/memos/${id}/`),
  markReviewed: (id) => api.post(`/api/memos/${id}/mark_reviewed/`),
  markPostponed: (id) => api.post(`/api/memos/${id}/mark_postponed/`),
};

export const chatApi = {
  list: (params) => api.get('/api/chat-messages/', { params }),
  retrieve: (id) => api.get(`/api/chat-messages/${id}/`),
  create: (payload) => api.post('/api/chat-messages/', { body: payload }),
  update: (id, payload) => api.put(`/api/chat-messages/${id}/`, { body: payload }),
  patch: (id, payload) => api.patch(`/api/chat-messages/${id}/`, { body: payload }),
  remove: (id) => api.delete(`/api/chat-messages/${id}/`),
  replies: (id, params) => api.get(`/api/chat-messages/${id}/replies/`, { params }),
  thread: (id, params) => api.get(`/api/chat-messages/${id}/thread/`, { params }),
  // Note: Following endpoints don't exist in Django-CRM API.yaml
  // byObject, statistics, unreadCount - removed
};

export const callLogsApi = {
  list: (params) => api.get('/api/voip/call-logs/', { params }),
  retrieve: (logId) => api.get(`/api/voip/call-logs/${logId}/`),
  addNote: (logId, payload) => api.post(`/api/voip/call-logs/${logId}/add-note/`, { body: payload }),
  // Note: POST, PUT, PATCH, DELETE not supported in API.yaml for call logs
  // Call logs are read-only and created by VoIP system
};

export const dashboardApi = {
  activity: () => api.get('/api/dashboard/activity/'),
  analytics: () => api.get('/api/dashboard/analytics/'),
  funnel: () => api.get('/api/dashboard/funnel/'),
};

export const stagesApi = {
  list: (params) => api.get('/api/stages/', { params }),
  retrieve: (id) => api.get(`/api/stages/${id}/`),
};

export const crmTagsApi = {
  list: (params) => api.get('/api/crm-tags/', { params }),
  retrieve: (id) => api.get(`/api/crm-tags/${id}/`),
};

export const taskTagsApi = {
  list: (params) => api.get('/api/task-tags/', { params }),
  retrieve: (id) => api.get(`/api/task-tags/${id}/`),
};

export const projectStagesApi = {
  list: (params) => api.get('/api/project-stages/', { params }),
  retrieve: (id) => api.get(`/api/project-stages/${id}/`),
};

export const taskStagesApi = {
  list: (params) => api.get('/api/task-stages/', { params }),
  retrieve: (id) => api.get(`/api/task-stages/${id}/`),
};

// Convenience functions for React components
export const getLeads = (params) => leadsApi.list(params);
export const getLead = (id) => leadsApi.retrieve(id);
export const createLead = (payload) => leadsApi.create(payload);
export const updateLead = (id, payload) => leadsApi.update(id, payload);
export const deleteLead = (id) => leadsApi.remove(id);

export const getContacts = (params) => contactsApi.list(params);
export const getContact = (id) => contactsApi.retrieve(id);
export const createContact = (payload) => contactsApi.create(payload);
export const updateContact = (id, payload) => contactsApi.update(id, payload);
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
