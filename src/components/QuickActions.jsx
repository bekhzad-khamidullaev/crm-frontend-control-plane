import { Dropdown, Modal, Button, Tooltip } from 'antd';
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
import { useMessage } from '../lib/hooks/useMessage';

/**
 * QuickActions component - Dropdown menu for common row actions
 * @param {Object} props
 * @param {Object} props.record - Table row record
 * @param {Function} props.onView - View details callback
 * @param {Function} props.onEdit - Edit callback
 * @param {Function} props.onDelete - Delete callback
 * @param {Function} props.onDuplicate - Duplicate callback
 * @param {Function} props.onChangeStatus - Change status callback
 * @param {Function} props.onAssign - Assign owner callback
 * @param {Function} props.onAddNote - Add note callback
 * @param {Function} props.onCall - Make call callback
 * @param {Function} props.onSMS - Send SMS callback
 * @param {Function} props.onEmail - Send email callback
 * @param {Function} props.onConvert - Convert callback (e.g., lead to deal)
 * @param {Function} props.onArchive - Archive callback
 * @param {Array} props.customActions - Additional custom actions
 * @param {string} props.placement - Dropdown placement
 * @param {string} props.trigger - Dropdown trigger type
 * @param {React.ReactNode} props.icon - Custom trigger icon
 * @param {string} props.size - Button size
 * @param {string} props.type - Button type
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
  placement = 'bottomRight',
  trigger = ['click'],
  icon = <MoreOutlined />,
  size = 'small',
  type = 'text',
  ...props
}) {
  const message = useMessage();
  const handleDelete = () => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this item?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await onDelete(record);
          message.success('Deleted successfully');
        } catch (error) {
          message.error('Failed to delete');
        }
      },
    });
  };

  const handleDuplicate = async () => {
    try {
      await onDuplicate(record);
      message.success('Duplicated successfully');
    } catch (error) {
      message.error('Failed to duplicate');
    }
  };

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

  // Communication actions
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

  // Edit and management actions
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

  // Add custom actions
  if (customActions.length > 0) {
    if (items.length > 0) items.push({ type: 'divider' });
    customActions.forEach(action => {
      items.push(action);
    });
  }

  // Delete action
  if (onDelete) {
    if (items.length > 0) items.push({ type: 'divider' });
    items.push({
      key: 'delete',
      label: 'Удалить',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDelete,
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <Dropdown
      menu={{ items }}
      trigger={trigger}
      placement={placement}
      {...props}
    >
      <Button
        type={type}
        size={size}
        icon={icon}
        style={{ cursor: 'pointer' }}
      />
    </Dropdown>
  );
}
