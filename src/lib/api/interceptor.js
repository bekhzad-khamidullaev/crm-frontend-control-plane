/**
 * Global API Error Interceptor
 * 
 * Centralized error handling for all API requests.
 * Catches 401 errors and redirects to login page.
 */

import { clearToken } from './auth';

/**
 * Handle 401 Unauthorized errors globally
 * @param {Error} error - The error object
 */
export function handle401Error(error) {
  if (error?.status === 401) {
    console.warn('[API Interceptor] 401 Unauthorized - clearing tokens and redirecting to login');
    
    // Clear all auth tokens
    clearToken();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      // Check if we're not already on login page
      const currentHash = window.location.hash;
      if (!currentHash.includes('/login')) {
        console.log('[API Interceptor] Redirecting to login page');
        window.location.hash = '/login';
        
        // Force reload to ensure clean state
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }
    
    return true; // Error was handled
  }
  
  return false; // Error was not handled
}

/**
 * Wrap API calls with error handling
 * @param {Promise} apiCall - The API call promise
 * @returns {Promise} - The wrapped promise
 */
export async function withErrorHandling(apiCall) {
  try {
    return await apiCall;
  } catch (error) {
    // Try to handle 401 error
    const wasHandled = handle401Error(error);
    
    // If not handled, rethrow
    if (!wasHandled) {
      throw error;
    }
    
    // Return null to indicate error was handled but no data available
    return null;
  }
}

/**
 * Check if error is a 401 Unauthorized error
 * @param {Error} error - The error to check
 * @returns {boolean}
 */
export function is401Error(error) {
  return error?.status === 401 || error?.response?.status === 401;
}

/**
 * Setup global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandler() {
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      
      if (is401Error(error)) {
        console.warn('[Global Error Handler] Caught unhandled 401 error');
        handle401Error(error);
        event.preventDefault(); // Prevent default error logging
      }
    });
    
    console.log('[API Interceptor] Global error handler initialized');
  }
}

export default {
  handle401Error,
  withErrorHandling,
  is401Error,
  setupGlobalErrorHandler,
};
