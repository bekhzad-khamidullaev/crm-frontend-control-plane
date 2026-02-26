import React from 'react';
import { Button, Dropdown, Modal, App } from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckOutlined,
  PhoneOutlined,
  MessageOutlined,
  MailOutlined,
  EyeOutlined,
  SwapOutlined,
  LockOutlined,
} from '@ant-design/icons';

/**
 * QuickActions component - Dropdown menu for common row actions using Ant Design 5.x
 * 
 * @param {Object} record - The data record associated with this action menu
 * @param {Function} onView - Callback for view action
 * @param {Function} onEdit - Callback for edit action
 * @param {Function} onDelete - Callback for delete action
 * @param {Function} onDuplicate - Callback for duplicate action
 * @param {Function} onChangeStatus - Callback for change status action
 * @param {Function} onAssign - Callback for assign action
 * @param {Function} onAddNote - Callback for add note action
 * @param {Function} onCall - Callback for call action
 * @param {Function} onSMS - Callback for SMS action
 * @param {Function} onEmail - Callback for email action
 * @param {Function} onConvert - Callback for convert action
 * @param {Function} onArchive - Callback for archive action
 * @param {Array} customActions - Array of custom action objects
 * @param {ReactNode} icon - Custom icon for the trigger button
 * @param {String} size - Button size (small, middle, large)
 * @param {String} type - Button type (default, primary, dashed, link, text)
 */
export default function QuickActions({
  record,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onChangeStatus,
  onAssign,
  onAddNote,
  onCall,
  onSMS,
  onEmail,
  onConvert,
  onArchive,
  customActions = [],
  icon = <MoreOutlined />,
  size = 'small',
  type = 'text',
  ...props
}) {
  const { message, modal } = App.useApp();
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);

  const handleDelete = async () => {
    try {
      await onDelete(record);
      message.success('Удалено успешно');
      setDeleteModalOpen(false);
    } catch (error) {
      message.error('Не удалось удалить');
    }
  };

  const handleDuplicate = async () => {
    try {
      await onDuplicate(record);
      message.success('Дублировано успешно');
    } catch (error) {
      message.error('Не удалось дублировать');
    }
  };

  const showDeleteConfirm = () => {
    setDeleteModalOpen(true);
  };

  // Build menu items array
  const items = [];

  // View action
  if (onView) {
    items.push({
      key: 'view',
      label: 'Просмотр',
      icon: <EyeOutlined />,
      onClick: () => onView(record),
    });
  }

  // Communication actions section
  const communicationActions = [];
  if (onCall) {
    communicationActions.push({
      key: 'call',
      label: 'Позвонить',
      icon: <PhoneOutlined />,
      onClick: () => onCall(record),
    });
  }
  if (onSMS) {
    communicationActions.push({
      key: 'sms',
      label: 'Отправить SMS',
      icon: <MessageOutlined />,
      onClick: () => onSMS(record),
    });
  }
  if (onEmail) {
    communicationActions.push({
      key: 'email',
      label: 'Отправить Email',
      icon: <MailOutlined />,
      onClick: () => onEmail(record),
    });
  }

  if (communicationActions.length > 0) {
    if (items.length > 0) items.push({ type: 'divider' });
    items.push(...communicationActions);
  }

  // Management actions section
  const managementActions = [];
  if (onEdit) {
    managementActions.push({
      key: 'edit',
      label: 'Редактировать',
      icon: <EditOutlined />,
      onClick: () => onEdit(record),
    });
  }

  if (onDuplicate) {
    managementActions.push({
      key: 'duplicate',
      label: 'Дублировать',
      icon: <CopyOutlined />,
      onClick: handleDuplicate,
    });
  }

  if (onChangeStatus) {
    managementActions.push({
      key: 'status',
      label: 'Изменить статус',
      icon: <CheckOutlined />,
      onClick: () => onChangeStatus(record),
    });
  }

  if (onAssign) {
    managementActions.push({
      key: 'assign',
      label: 'Назначить ответственного',
      icon: <UserOutlined />,
      onClick: () => onAssign(record),
    });
  }

  if (onConvert) {
    managementActions.push({
      key: 'convert',
      label: 'Конвертировать',
      icon: <SwapOutlined />,
      onClick: () => onConvert(record),
    });
  }

  if (onArchive) {
    managementActions.push({
      key: 'archive',
      label: 'Архивировать',
      icon: <LockOutlined />,
      onClick: () => onArchive(record),
    });
  }

  if (onAddNote) {
    managementActions.push({
      key: 'note',
      label: 'Добавить заметку',
      icon: <FileTextOutlined />,
      onClick: () => onAddNote(record),
    });
  }

  if (managementActions.length > 0) {
    if (items.length > 0) items.push({ type: 'divider' });
    items.push(...managementActions);
  }

  // Custom actions
  if (customActions.length > 0) {
    if (items.length > 0) items.push({ type: 'divider' });
    items.push(...customActions);
  }

  // Delete action (always last and separated)
  if (onDelete) {
    if (items.length > 0) items.push({ type: 'divider' });
    items.push({
      key: 'delete',
      label: 'Удалить',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: showDeleteConfirm,
    });
  }

  // Don't render if no actions available
  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <Dropdown
        menu={{ items }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Button 
          type={type} 
          size={size} 
          icon={icon}
          {...props}
        />
      </Dropdown>

      <Modal
        title="Подтверждение удаления"
        open={deleteModalOpen}
        onOk={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
      >
        <p>Вы уверены, что хотите удалить этот элемент?</p>
      </Modal>
    </>
  );
}
