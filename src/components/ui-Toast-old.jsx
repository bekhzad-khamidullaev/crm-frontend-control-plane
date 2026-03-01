/**
 * @deprecated Use ./ui-Toast.jsx
 * Legacy compatibility re-exports.
 */

import { App } from 'antd';
import useToast, { showToast, Toast, toast } from './ui-Toast.jsx';

export { App, showToast, Toast, toast, useToast };
export default useToast;
