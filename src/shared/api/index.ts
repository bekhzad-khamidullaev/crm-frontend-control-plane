/**
 * Configure the generated OpenAPI client to use our custom axios instance
 * This ensures all requests go through our interceptors
 */

import apiClient from './axios';
import { OpenAPI } from './generated/core/OpenAPI';
import { resolveConfiguredApiBase } from './resolveApiBase';

// Configure the OpenAPI client to use our axios instance
OpenAPI.BASE = resolveConfiguredApiBase(import.meta.env.VITE_API_BASE_URL);

// Configure token resolver
OpenAPI.TOKEN = async () => {
  const token = sessionStorage.getItem('crm_access_token') || sessionStorage.getItem('access_token');
  return token || '';
};

// Export configured axios instance
export { apiClient };

// Export query client and utilities
    export { createQueryKeys, queryClient } from './query-client';
    export type { QueryKeyFactory } from './query-client';

// Re-export all generated services and models
export * from './generated';
