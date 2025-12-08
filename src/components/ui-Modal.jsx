import React from 'react';
import { Modal as AntModal } from 'antd';

/**
 * Modal wrapper around Ant Design Modal
 * Provides a promise-based API for confirmation dialogs
 */
export function Modal({ 
  title = 'Confirm', 
  body = '', 
  confirmText = 'OK', 
  cancelText = 'Cancel',
  type = 'confirm',
  okType = 'primary',
  ...rest
} = {}) {
  return new Promise((resolve) => {
    const modal = AntModal[type]({
      title,
      content: body,
      okText: confirmText,
      cancelText: cancelText,
      okType: okType,
      onOk: () => {
        resolve(true);
      },
      onCancel: () => {
        resolve(false);
      },
      ...rest
    });
  });
}

// Helper methods
Modal.confirm = (options) => Modal({ type: 'confirm', ...options });
Modal.info = (options) => Modal({ type: 'info', ...options });
Modal.success = (options) => Modal({ type: 'success', ...options });
Modal.error = (options) => Modal({ type: 'error', ...options });
Modal.warning = (options) => Modal({ type: 'warning', ...options });

export default Modal;
