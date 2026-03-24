import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';

import {
  createInternalNumber,
  deleteInternalNumber,
  getInternalNumbers,
  syncInternalNumbers,
  updateInternalNumber,
  validateInternalNumber,
} from '../../lib/api/telephony.js';
import { getUsers } from '../../lib/api/user.js';

const STATUS_COLORS = {
  ok: 'success',
  inactive: 'default',
  inactive_user: 'warning',
  conflict: 'error',
  missing_in_pbx: 'error',
  unassigned: 'processing',
};

function normalizeList(response) {
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.results) ? response.results : [];
}

export default function InternalNumbersAdminTable({ canManage = false, onSuccess }) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const loadRows = async () => {
    setLoading(true);
    try {
      const response = await getInternalNumbers({ page_size: 200, search: search || undefined });
      setRows(normalizeList(response));
    } catch (error) {
      console.error('Failed to load internal numbers:', error);
      message.error('Не удалось загрузить внутренние номера');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await getUsers({ page_size: 200 });
      setUsers(normalizeList(response));
    } catch (error) {
      console.error('Failed to load users:', error);
      message.error('Не удалось загрузить список пользователей');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    if (!statusFilter) return rows;
    return rows.filter((row) => String(row?.status || '').toLowerCase() === statusFilter);
  }, [rows, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ active: true });
    setDrawerOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      user: record?.user || undefined,
      number: record?.number || '',
      display_name: record?.display_name || '',
      active: record?.active !== false,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const validation = await validateInternalNumber(values);
      if (!validation?.valid) {
        const firstError = validation?.errors?.[0]?.message || 'Проверьте корректность данных.';
        message.error(firstError);
        return;
      }

      if (editing?.id) {
        await updateInternalNumber(editing.id, values);
        message.success('Внутренний номер обновлён');
      } else {
        await createInternalNumber(values);
        message.success('Внутренний номер создан');
      }

      closeDrawer();
      await loadRows();
      onSuccess?.();
    } catch (error) {
      if (error?.errorFields) return;
      console.error('Failed to save internal number:', error);
      message.error('Не удалось сохранить внутренний номер');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInternalNumber(id);
      message.success('Внутренний номер удалён');
      await loadRows();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to delete internal number:', error);
      message.error('Не удалось удалить внутренний номер');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await syncInternalNumbers({});
      message.success(response?.message || 'Синхронизация внутренних номеров выполнена');
      await loadRows();
    } catch (error) {
      console.error('Failed to sync internal numbers:', error);
      message.error('Не удалось выполнить синхронизацию внутренних номеров');
    } finally {
      setSyncing(false);
    }
  };

  const columns = [
    {
      title: 'Пользователь',
      key: 'user_name',
      render: (_, record) => record.user_name || '-',
    },
    {
      title: 'Внутренний номер',
      dataIndex: 'number',
      key: 'number',
      width: 160,
    },
    {
      title: 'Display Name',
      dataIndex: 'display_name',
      key: 'display_name',
    },
    {
      title: 'SIP URI',
      dataIndex: 'sip_uri',
      key: 'sip_uri',
      width: 260,
      render: (value) => value || '-',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value, record) => {
        const status = value || (record?.active ? 'ok' : 'inactive');
        return <Tag color={STATUS_COLORS[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Активен',
      dataIndex: 'active',
      key: 'active',
      width: 120,
      render: (value) => <Tag color={value ? 'success' : 'default'}>{value ? 'Да' : 'Нет'}</Tag>,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 180,
      render: (_, record) =>
        canManage ? (
          <Space size={4}>
            <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
              Изменить
            </Button>
            <Popconfirm title="Удалить внутренний номер?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />}>
                Удалить
              </Button>
            </Popconfirm>
          </Space>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <Card
      title="Внутренние номера пользователей"
      style={{ marginBottom: 24 }}
      extra={
        <Space>
          <Input.Search
            placeholder="Поиск по номеру или пользователю"
            allowClear
            onSearch={(value) => {
              setSearch(value || '');
              setTimeout(loadRows, 0);
            }}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            placeholder="Фильтр по статусу"
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value || '')}
            style={{ width: 200 }}
            options={[
              { value: 'ok', label: 'ok' },
              { value: 'inactive', label: 'inactive' },
              { value: 'inactive_user', label: 'inactive_user' },
              { value: 'conflict', label: 'conflict' },
              { value: 'missing_in_pbx', label: 'missing_in_pbx' },
              { value: 'unassigned', label: 'unassigned' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={loadRows}>
            Обновить
          </Button>
          {canManage ? (
            <Button onClick={handleSync} loading={syncing}>
              Синхронизировать из PBX
            </Button>
          ) : null}
          {canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Добавить назначение
            </Button>
          ) : null}
        </Space>
      }
    >
      <Alert
        showIcon
        type="warning"
        style={{ marginBottom: 16 }}
        message="Правила конфликтов"
        description="Один активный внутренний номер не может быть назначен двум пользователям, а у пользователя не должно быть двух активных номеров."
      />

      <Table rowKey="id" columns={columns} dataSource={filteredRows} loading={loading} pagination={{ pageSize: 10 }} />

      <Drawer
        title={editing?.id ? 'Редактировать назначение' : 'Новое назначение'}
        open={drawerOpen}
        onClose={closeDrawer}
        width={460}
        extra={
          <Space>
            <Button onClick={closeDrawer}>Отмена</Button>
            <Button type="primary" onClick={handleSave} loading={saving}>
              Сохранить
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="user" label="Пользователь CRM" rules={[{ required: true, message: 'Выберите пользователя' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Выберите пользователя"
              loading={usersLoading}
              options={users.map((item) => ({
                value: item.id,
                label: item.full_name || item.username || `#${item.id}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="number"
            label="Внутренний номер"
            rules={[
              { required: true, message: 'Укажите внутренний номер' },
              { pattern: /^\d{3,6}$/, message: 'Допустимы 3-6 цифр' },
            ]}
          >
            <Input placeholder="Например: 205" />
          </Form.Item>

          <Form.Item name="display_name" label="Display Name">
            <Input placeholder="Например: Sales Agent 205" />
          </Form.Item>

          <Form.Item name="active" label="Активен" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  );
}
