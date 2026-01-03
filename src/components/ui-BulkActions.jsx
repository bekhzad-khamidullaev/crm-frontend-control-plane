/**
 * BulkActions Component
 * Universal bulk actions component for tables with selection
 */

import React from 'react';
import { Space, Button, Dropdown, Badge, Popconfirm, App } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  MailOutlined,
  MessageOutlined,
  MoreOutlined,
  TagOutlined,
} from '@ant-design/icons';

export default function BulkActions({
  selectedRowKeys = [],
  onClearSelection,
  onDelete,
  onStatusChange,
  onExport,
  onSendEmail,
  onSendSMS,
  onBulkTag,
  customActions = [],
  entityName = 'записей',
}) {
  const { message } = App.useApp();
  const count = selectedRowKeys.length;

  if (count === 0) {
    return null;
  }

  const handleDelete = async () => {
    try {
      await onDelete(selectedRowKeys);
      message.success(`Удалено ${count} ${entityName}`);
      onClearSelection();
    } catch (error) {
      message.error('Ошибка удаления');
    }
  };

  const menuItems = [
    onStatusChange && {
      key: 'status',
      icon: <EditOutlined />,
      label: 'Изменить статус',
      onClick: () => onStatusChange(selectedRowKeys),
    },
    onExport && {
      key: 'export',
      icon: <ExportOutlined />,
      label: 'Экспортировать',
      onClick: () => onExport(selectedRowKeys),
    },
    onSendEmail && {
      key: 'email',
      icon: <MailOutlined />,
      label: 'Отправить Email',
      onClick: () => onSendEmail(selectedRowKeys),
    },
    onSendSMS && {
      key: 'sms',
      icon: <MessageOutlined />,
      label: 'Отправить SMS',
      onClick: () => onSendSMS(selectedRowKeys),
    },
    onBulkTag && {
      key: 'tags',
      icon: <TagOutlined />,
      label: 'Добавить теги',
      onClick: () => onBulkTag(selectedRowKeys),
    },
    ...customActions.map((action) => ({
      key: action.key,
      icon: action.icon,
      label: action.label,
      onClick: () => action.onClick(selectedRowKeys),
    })),
  ].filter(Boolean);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: '#fff',
        padding: '12px 24px',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid #d9d9d9',
      }}
    >
      <Space size="middle">
        <Badge count={count} showZero={false}>
          <span style={{ fontWeight: 500 }}>
            Выбрано: {count} {entityName}
          </span>
        </Badge>

        <Button size="small" onClick={onClearSelection}>
          Отменить
        </Button>

        {onDelete && (
          <Popconfirm
            title={`Удалить ${count} ${entityName}?`}
            description="Это действие нельзя отменить"
            onConfirm={handleDelete}
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              Удалить
            </Button>
          </Popconfirm>
        )}

        {menuItems.length > 0 && (
          <Dropdown
            menu={{ items: menuItems }}
            placement="topRight"
            trigger={['click']}
          >
            <Button icon={<MoreOutlined />} size="small">
              Действия
            </Button>
          </Dropdown>
        )}
      </Space>
    </div>
  );
}
