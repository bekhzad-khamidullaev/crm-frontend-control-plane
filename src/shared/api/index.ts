/**
 * Configure the generated OpenAPI client to use our custom axios instance
 * This ensures all requests go through our interceptors
 */

import { OpenAPI } from './generated/core/OpenAPI';
import apiClient from './axios';

// Configure the OpenAPI client to use our axios instance
OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.crm.windevs.uz';

// Configure token resolver
OpenAPI.TOKEN = async () => {
  const token = localStorage.getItem('access_token');
  return token || '';
};

// Export configured axios instance
export { apiClient };

// Export query client and utilities
export { queryClient, createQueryKeys } from './query-client';
export type { QueryKeyFactory } from './query-client';

// Re-export all generated services and models
export * from './generated';
