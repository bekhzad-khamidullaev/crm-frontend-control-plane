/**
 * Toast notification wrapper - just re-export message API from Ant Design
 * Use App.useApp() hook to get message API in components
 */

export { App } from 'antd';

/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use App.useApp() message API directly
 */
export function showToast({ message: msg, type = 'info' } = {}) {
  console.warn('showToast is deprecated. Use App.useApp() message API instead');
  
  // This won't work without context, just a placeholder
  if (typeof window !== 'undefined' && window.__antd_message__) {
    window.__antd_message__[type === 'error' ? 'error' : type](msg);
  } else {
    console.log(`[Toast ${type}]:`, msg);
    title: type === 'success' ? 'Success' : type === 'warning' ? 'Warning' : type === 'error' ? 'Error' : 'Info',
    description: message,
    variant: isDestructive ? 'destructive' : 'default',
  });
}

export const Toast = {
  info: (msg) => showToast({ message: msg, type: 'info' }),
  success: (msg) => showToast({ message: msg, type: 'success' }),
  error: (msg) => showToast({ message: msg, type: 'error' }),
  warning: (msg) => showToast({ message: msg, type: 'warning' }),
};

export default Toast;
