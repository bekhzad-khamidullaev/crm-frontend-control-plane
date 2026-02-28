/**
 * BulkActions Component
 * Universal bulk actions component for tables with selection
 * Rewritten to use Ant Design only
 */

import React from 'react';
import { Button, Badge, Dropdown, Modal, Space, App } from 'antd';
import {
  EditOutlined,
  DownloadOutlined,
  MailOutlined,
  MessageOutlined,
  TagsOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useTheme } from '../lib/hooks/useTheme';

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
  const { theme } = useTheme();
  const { message, modal } = App.useApp();
  const count = selectedRowKeys.length;

  if (count === 0) {
    return null;
  }

  const handleDelete = async () => {
    modal.confirm({
      title: `Удалить ${count} ${entityName}?`,
      content: 'Это действие нельзя отменить',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await onDelete(selectedRowKeys);
          message.success(`Удалено ${count} ${entityName}`);
          onClearSelection();
        } catch (error) {
          message.error('Ошибка удаления');
        }
      },
    });
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
      icon: <DownloadOutlined />,
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
      icon: <TagsOutlined />,
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
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: 600,
        width: 'calc(100% - 24px)',
        padding: '12px 16px',
        background: theme === 'dark' ? '#161b22' : '#fff',
        borderRadius: 8,
        boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.35)' : '0 4px 12px rgba(0,0,0,0.15)',
        border: `1px solid ${theme === 'dark' ? '#2d3343' : '#d9d9d9'}`,
      }}
    >
      <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
        <Space>
          <Badge count={count} style={{ backgroundColor: '#1890ff' }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: theme === 'dark' ? '#f1f5f9' : 'inherit' }}>
            Выбрано: {count} {entityName}
          </span>
        </Space>

        <Space wrap>
          <Button size="small" onClick={onClearSelection}>
            Отменить
          </Button>

          {onDelete && (
            <Button size="small" danger icon={<DeleteOutlined />} onClick={handleDelete}>
              Удалить
            </Button>
          )}

          {menuItems.length > 0 && (
            <Dropdown menu={{ items: menuItems }} placement="topRight">
              <Button size="small" icon={<MoreOutlined />}>
                Действия
              </Button>
            </Dropdown>
          )}
        </Space>
      </Space>
    </div>
  );
}
