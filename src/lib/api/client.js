import { getToken } from './auth.js';

// Allow runtime config injection (window.__APP_CONFIG__) in addition to Vite env
const runtimeConfig = typeof window !== 'undefined' ? window.__APP_CONFIG__ || {} : {};
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || runtimeConfig.apiBaseUrl || 'http://localhost:8000').replace(/\/$/, '');
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT || runtimeConfig.apiTimeout || 15000);

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
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) v.forEach((vi) => url.searchParams.append(k, vi));
      else url.searchParams.set(k, v);
    });
  }
  return url.toString();
}

async function request(method, path, { params, body, headers, retry = 1 } = {}) {
  const url = buildUrl(path, params);
  const token = getToken();
  const finalHeaders = new Headers({ 'Accept': 'application/json', ...headers });
  if (body && !(body instanceof FormData)) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  if (token) finalHeaders.set('Authorization', `Token ${token}`);

  const fetcher = fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    credentials: 'include', // support cookieAuth as well
  });

  try {
    const res = await withTimeout(fetcher, TIMEOUT);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json().catch(() => ({})) : await res.text();
    if (!res.ok) throw normalizeError(data, res);
    return data;
  } catch (err) {
    // Retry only GET for network errors (Error instances). Do not retry HTTP errors (object payloads)
    const isNetworkError = err instanceof Error;
    if (retry > 0 && method === 'GET' && isNetworkError) {
      return request(method, path, { params, body, headers, retry: retry - 1 });
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
  login: ({ username, password }) => api.post('/api/auth/token/', { body: { username, password } }),
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
};

export const callLogsApi = {
  list: (params) => api.get('/api/call-logs/', { params }),
  retrieve: (id) => api.get(`/api/call-logs/${id}/`),
  create: (payload) => api.post('/api/call-logs/', { body: payload }),
  update: (id, payload) => api.put(`/api/call-logs/${id}/`, { body: payload }),
  patch: (id, payload) => api.patch(`/api/call-logs/${id}/`, { body: payload }),
  remove: (id) => api.delete(`/api/call-logs/${id}/`),
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
