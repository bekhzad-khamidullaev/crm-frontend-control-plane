/**
 * Custom hook for Ant Design message API
 * Provides a convenient wrapper around App.useApp() for message notifications
 * This hook ensures proper theme context consumption
 */

import { message } from 'antd';

const messageApi = {
  info: (msg) => message.info(msg),
  success: (msg) => message.success(msg),
  warning: (msg) => message.warning(msg),
  error: (msg) => message.error(msg),
  loading: (msg) => message.loading(msg),
};

/**
 * Hook to access toast API with Ant Design
 * @returns {Object} Message API object with success, error, warning, info, loading methods
 */
export function useMessage() {
  return messageApi;
}

export default useMessage;
