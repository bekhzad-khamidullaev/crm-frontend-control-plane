import { message } from 'antd';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import resolveApiBase from './resolveApiBase';
import parseLicenseRestriction from '../../lib/api/licenseError';
import { emitLicenseRestriction } from '../../lib/api/licenseRestrictionBus';

const API_BASE_URL = resolveApiBase(import.meta.env.VITE_API_BASE_URL);
const AUTH_BYPASS_PREFIXES = ['/api/token/', '/api/auth/', '/api/public/'];

/**
 * Central Axios instance for all API calls
 * Configured with interceptors for:
 * - JWT token injection
 * - Token refresh on 401
 * - Global error handling
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - adds JWT token to all requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const skipAuth = config.headers?.['X-Skip-Auth'] === '1';
    (config as InternalAxiosRequestConfig & { _skipAuth?: boolean })._skipAuth = skipAuth;
    if (skipAuth && config.headers) {
      delete config.headers['X-Skip-Auth'];
      delete config.headers.Authorization;
      return config;
    }
    const token = sessionStorage.getItem('crm_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - handles errors globally
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _skipAuth?: boolean;
    };
    const requestUrl = String(originalRequest?.url || '');
    const isAuthBypassRequest =
      originalRequest?._skipAuth === true ||
      AUTH_BYPASS_PREFIXES.some((prefix) => requestUrl.includes(prefix));

    // 401 - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthBypassRequest) {
      originalRequest._retry = true;

      try {
        const refreshToken = sessionStorage.getItem('crm_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        sessionStorage.setItem('crm_access_token', data.access);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        sessionStorage.removeItem('crm_access_token');
        sessionStorage.removeItem('crm_refresh_token');
        window.location.href = '/#/login';
        return Promise.reject(refreshError);
      }
    }

    // 403 - Forbidden
    if (error.response?.status === 403) {
      const licenseError = parseLicenseRestriction(error);
      if (licenseError) {
        emitLicenseRestriction(licenseError);
      } else {
        message.error('У вас нет прав для выполнения этого действия');
      }
    }

    // 500+ - Server errors
    if (error.response?.status && error.response.status >= 500) {
      message.error('Ошибка сервера. Попробуйте позже');
    }

    // 400 - Validation errors (handled by forms)
    // No global message for 400 - these should be shown in form fields

    return Promise.reject(error);
  }
);

export default apiClient;
