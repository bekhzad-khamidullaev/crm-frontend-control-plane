/**
 * Toast notification utilities for Ant Design
 * Use App.useApp() hook to get message API in functional components
 */

import { App } from 'antd';

const MESSAGE_TYPES = new Set(['success', 'error', 'info', 'warning', 'loading']);

function normalizeType(type = 'info', variant) {
  if (variant === 'destructive') return 'error';
  if (MESSAGE_TYPES.has(type)) return type;
  return 'info';
}

function resolveMessageApi() {
  if (typeof window === 'undefined') return null;
  const api = window.__antd_message__;
  if (!api) return null;
  return api;
}

function emit(type, content) {
  const msg = content ?? '';
  const api = resolveMessageApi();
  if (api && typeof api[type] === 'function') {
    api[type](msg);
    return;
  }
  // Fallback for non-React contexts.
  console.log(`[Toast ${type}]`, msg);
}

/**
 * Hook to get message API
 * Must be used inside App component wrapper
 */
export function useToast() {
  const { message } = App.useApp();
  if (typeof window !== 'undefined') {
    window.__antd_message__ = message;
  }
  
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
  const msg = description || title || 'Notification';
  const type = normalizeType('info', variant);
  emit(type, msg);
}

/**
 * Backward-compatible API:
 * showToast('Saved', 'success')
 * showToast({ message: 'Saved', type: 'success' })
 */
export function showToast(input, type = 'info') {
  if (input && typeof input === 'object') {
    const nextType = normalizeType(input.type || type, input.variant);
    const msg = input.message || input.description || input.title || 'Notification';
    emit(nextType, msg);
    return;
  }
  emit(normalizeType(type), input || 'Notification');
}

export const Toast = {
  info: (msg) => showToast(msg, 'info'),
  success: (msg) => showToast(msg, 'success'),
  error: (msg) => showToast(msg, 'error'),
  warning: (msg) => showToast(msg, 'warning'),
  loading: (msg) => showToast(msg, 'loading'),
};

export default useToast;
