/**
 * Custom hook for Ant Design message API
 * Provides a convenient wrapper around App.useApp() for message notifications
 * This hook ensures proper theme context consumption
 */

import { App } from 'antd';

/**
 * Hook to access message API with theme context
 * @returns {Object} Message API object with success, error, warning, info, loading methods
 */
export function useMessage() {
  const { message } = App.useApp();
  return message;
}

/**
 * Hook to access all Ant Design static methods (message, modal, notification)
 * @returns {Object} Object containing message, modal, and notification APIs
 */
export function useAntApp() {
  return App.useApp();
}

export default useMessage;
