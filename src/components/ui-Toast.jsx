/**
 * Toast notification utilities for Ant Design
 * Use App.useApp() hook to get message API in functional components
 */

import { App } from 'antd';

/**
 * Hook to get message API
 * Must be used inside App component wrapper
 */
export function useToast() {
  const { message } = App.useApp();
  
  return {
    success: (content) => message.success(content),
    error: (content) => message.error(content),
    info: (content) => message.info(content),
    warning: (content) => message.warning(content),
    loading: (content) => message.loading(content),
  };
}

/**
 * Legacy toast function for backward compatibility
 * @deprecated Use App.useApp() message API directly
 */
export function toast({ title, description, variant }) {
  console.warn('toast() is deprecated. Use App.useApp() message API instead');
  
  const msg = description || title || 'Notification';
  const type = variant === 'destructive' ? 'error' : 'info';
  
  // This won't work without App context
  if (typeof window !== 'undefined' && window.__antd_message__) {
    window.__antd_message__[type](msg);
  } else {
    console.log(`[Toast ${type}]:`, msg);
  }
}

export default useToast;
