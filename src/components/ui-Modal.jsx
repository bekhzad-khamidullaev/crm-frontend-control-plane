import { Modal as AntModal } from 'antd';
import { 
  ExclamationCircleOutlined, 
  InfoCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined 
} from '@ant-design/icons';

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
  ...rest
} = {}) {
  return new Promise((resolve) => {
    const content = typeof body === 'string' ? body : body;
    
    const config = {
      title,
      content,
      okText: confirmText,
      cancelText,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
      ...rest,
    };

    // Используем соответствующий метод в зависимости от типа
    if (type === 'confirm') {
      AntModal.confirm(config);
    } else if (type === 'info') {
      AntModal.info({
        ...config,
        icon: <InfoCircleOutlined />,
        okText: confirmText,
        onOk: () => resolve(true),
        cancelButtonProps: { style: { display: 'none' } },
      });
    } else if (type === 'success') {
      AntModal.success({
        ...config,
        icon: <CheckCircleOutlined />,
        okText: confirmText,
        onOk: () => resolve(true),
        cancelButtonProps: { style: { display: 'none' } },
      });
    } else if (type === 'error') {
      AntModal.error({
        ...config,
        icon: <CloseCircleOutlined />,
        okText: confirmText,
        onOk: () => resolve(true),
        cancelButtonProps: { style: { display: 'none' } },
      });
    } else if (type === 'warning') {
      AntModal.warning({
        ...config,
        icon: <ExclamationCircleOutlined />,
        okText: confirmText,
        onOk: () => resolve(true),
        cancelButtonProps: { style: { display: 'none' } },
      });
    }
  });
}

// Helper methods
Modal.confirm = (options) => Modal({ type: 'confirm', ...options });
Modal.info = (options) => Modal({ type: 'info', ...options });
Modal.success = (options) => Modal({ type: 'success', ...options });
Modal.error = (options) => Modal({ type: 'error', ...options });
Modal.warning = (options) => Modal({ type: 'warning', ...options });

export default Modal;
