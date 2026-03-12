import { App } from 'antd';

function getType(variant) {
  return variant === 'destructive' ? 'error' : 'info';
}

export function toast({ title, description, variant } = {}) {
  const api = globalThis?.__antd_message__;
  if (!api) return;
  const text = description || title || 'Notification';
  const type = getType(variant);
  api[type](text);
}

export function useToast() {
  const { message } = App.useApp();
  if (typeof window !== 'undefined') {
    window.__antd_message__ = message;
  }

  return {
    toast: ({ title, description, variant } = {}) => {
      const text = description || title || 'Notification';
      const type = getType(variant);
      message[type](text);
    },
    dismiss: () => {},
    toasts: [],
  };
}
