import { message } from 'antd';

/**
 * Toast notification wrapper around Ant Design message
 * Provides a simple API for showing notifications
 */
export function showToast({ message: msg, type = 'info', timeout = 4000 } = {}) {
  const duration = timeout / 1000; // Convert to seconds
  
  switch (type) {
    case 'success':
      message.success(msg, duration);
      break;
    case 'error':
      message.error(msg, duration);
      break;
    case 'warning':
      message.warning(msg, duration);
      break;
    case 'info':
    default:
      message.info(msg, duration);
      break;
  }
  
  // Return a function to close the message
  return () => {
    message.destroy();
  };
}

export const Toast = {
  info: (msg, timeout) => showToast({ message: msg, type: 'info', timeout }),
  success: (msg, timeout) => showToast({ message: msg, type: 'success', timeout }),
  error: (msg, timeout) => showToast({ message: msg, type: 'error', timeout }),
  warning: (msg, timeout) => showToast({ message: msg, type: 'warning', timeout }),
};

export default Toast;
