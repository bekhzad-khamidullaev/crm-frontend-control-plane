/**
 * VoIPConnectionsList Component
 * Display and manage VoIP connections in a table format
 */

import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Popconfirm, App, Card } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { 
  getVoIPConnections, 
  deleteVoIPConnection,
  patchVoIPConnection
} from '../lib/api/telephony';

export default function VoIPConnectionsList({ onEdit, onRefresh }) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    loadConnections();
  }, [pagination.current]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const response = await getVoIPConnections({ 
        page: pagination.current,
        page_size: pagination.pageSize 
      });
      setConnections(response.results || []);
      setPagination(prev => ({
        ...prev,
        total: response.count || 0,
      }));
    } catch (error) {
      console.error('Error loading VoIP connections:', error);
      message.error('Ошибка загрузки подключений');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteVoIPConnection(id);
      message.success('Подключение удалено');
      loadConnections();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting connection:', error);
      message.error('Ошибка удаления подключения');
    }
  };

  const handleToggleActive = async (record) => {
    try {
      await patchVoIPConnection(record.id, { active: !record.active });
      message.success(record.active ? 'Подключение деактивировано' : 'Подключение активировано');
      loadConnections();
      onRefresh?.();
    } catch (error) {
      console.error('Error toggling connection:', error);
      message.error('Ошибка изменения статуса');
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Провайдер',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider) => {
        const colors = {
          'OnlinePBX': 'blue',
          'Zadarma': 'green',
        };
        return <Tag color={colors[provider] || 'default'}>{provider}</Tag>;
      },
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const config = {
          pbx: { color: 'green', label: 'PBX' },
          sip: { color: 'orange', label: 'SIP' },
          voip: { color: 'purple', label: 'VoIP' },
        };
        const { color, label } = config[type] || { color: 'default', label: type };
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Номер',
      dataIndex: 'number',
      key: 'number',
    },
    {
      title: 'Caller ID',
      dataIndex: 'callerid',
      key: 'callerid',
    },
    {
      title: 'Владелец',
      dataIndex: 'owner_name',
      key: 'owner_name',
      render: (name) => name || <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: 'Статус',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag 
          icon={active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={active ? 'success' : 'default'}
        >
          {active ? 'Активно' : 'Неактивно'}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit?.(record)}
          >
            Изменить
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleActive(record)}
          >
            {record.active ? 'Деактивировать' : 'Активировать'}
          </Button>
          <Popconfirm
            title="Удалить подключение?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="link" 
              size="small" 
              danger 
              icon={<DeleteOutlined />}
            >
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="VoIP Подключения"
      extra={
        <Button 
          icon={<ReloadOutlined />} 
          onClick={loadConnections}
          loading={loading}
        >
          Обновить
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={connections}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        locale={{
          emptyText: 'Нет подключений. Добавьте первое подключение.',
        }}
      />
    </Card>
  );
}
