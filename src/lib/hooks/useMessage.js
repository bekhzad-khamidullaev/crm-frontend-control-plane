/**
 * Custom hook for Ant Design message API
 * Provides a convenient wrapper around App.useApp() for message notifications
 * This hook ensures proper theme context consumption
 */

import { toast } from '../../components/ui/use-toast.js';

const messageApi = {
  info: (msg) => toast({ title: 'Info', description: msg }),
  success: (msg) => toast({ title: 'Success', description: msg }),
  warning: (msg) => toast({ title: 'Warning', description: msg }),
  error: (msg) => toast({ title: 'Error', description: msg, variant: 'destructive' }),
  loading: (msg) => toast({ title: 'Loading', description: msg }),
};

/**
 * Hook to access toast API with shadcn/ui
 * @returns {Object} Message API object with success, error, warning, info, loading methods
 */
export function useMessage() {
  return messageApi;
}

export default useMessage;
