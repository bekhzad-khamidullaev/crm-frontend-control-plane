import { Dropdown, message, Modal } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, CopyOutlined, UserOutlined, FileTextOutlined, CheckOutlined } from '@ant-design/icons';

/**
 * QuickActions component - Dropdown menu for common row actions
 * @param {Object} props
 * @param {Object} props.record - Table row record
 * @param {Function} props.onEdit - Edit callback
 * @param {Function} props.onDelete - Delete callback
 * @param {Function} props.onDuplicate - Duplicate callback
 * @param {Function} props.onChangeStatus - Change status callback
 * @param {Function} props.onAssign - Assign owner callback
 * @param {Function} props.onAddNote - Add note callback
 * @param {Array} props.customActions - Additional custom actions
 */
export default function QuickActions({
  record,
  onEdit,
  onDelete,
  onDuplicate,
  onChangeStatus,
  onAssign,
  onAddNote,
  customActions = [],
  ...props
}) {
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

  if (onEdit) {
    items.push({
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => onEdit(record),
    });
  }

  if (onDuplicate) {
    items.push({
      key: 'duplicate',
      label: 'Duplicate',
      icon: <CopyOutlined />,
      onClick: handleDuplicate,
    });
  }

  if (onChangeStatus) {
    items.push({
      key: 'status',
      label: 'Change Status',
      icon: <CheckOutlined />,
      onClick: () => onChangeStatus(record),
    });
  }

  if (onAssign) {
    items.push({
      key: 'assign',
      label: 'Assign Owner',
      icon: <UserOutlined />,
      onClick: () => onAssign(record),
    });
  }

  if (onAddNote) {
    items.push({
      key: 'note',
      label: 'Add Note',
      icon: <FileTextOutlined />,
      onClick: () => onAddNote(record),
    });
  }

  // Add custom actions
  customActions.forEach(action => {
    items.push(action);
  });

  // Add separator before delete
  if (onDelete && items.length > 0) {
    items.push({ type: 'divider' });
  }

  if (onDelete) {
    items.push({
      key: 'delete',
      label: 'Delete',
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
      trigger={['click']}
      placement="bottomRight"
      {...props}
    >
      <MoreOutlined style={{ cursor: 'pointer', fontSize: '16px' }} />
    </Dropdown>
  );
}
