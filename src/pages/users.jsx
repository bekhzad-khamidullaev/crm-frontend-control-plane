import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import CrudPage from '../components/CrudPage.jsx';
import { getUsers, getUser } from '../lib/api/client.js';
import { routeMeta } from '../router.js';
import { t } from '../lib/i18n/index.js';
import {
  createUser,
  detectUserWriteCapability,
  deleteUser,
  get2FAStatus,
  getDepartmentsAsGroups,
  getProfileByUser,
  getProfiles,
  getUserSessions,
  revokeAllSessions,
  update2FAStatus,
  updateUser,
  updateUserAccess,
} from '../lib/api/user.js';
import { formatValueForUi } from '../lib/utils/value-display.js';

const ROLE_OPTIONS = [
  { label: 'Admin', value: 'admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Sales', value: 'sales' },
];

function extractListResponse(payload) {
  if (Array.isArray(payload)) {
    return { results: payload, count: payload.length };
  }
  const results = Array.isArray(payload?.results) ? payload.results : [];
  return { results, count: Number(payload?.count ?? results.length) };
}

function collectPermissionSeeds() {
  const permissions = new Set();
  Object.values(routeMeta).forEach((meta = {}) => {
    if (Array.isArray(meta.permissions)) {
      meta.permissions.forEach((permission) => {
        const value = String(permission || '').trim();
        if (value) permissions.add(value);
      });
    }
  });
  return Array.from(permissions).sort();
}

function normalizeStringList(items) {
  if (!Array.isArray(items)) return [];
  return Array.from(
    new Set(
      items
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  );
}

function isUnsupportedWrite(error) {
  return [404, 405, 501].includes(Number(error?.status || 0));
}

function getErrorText(error, fallback = 'Operation failed') {
  if (typeof error?.details === 'string' && error.details.trim()) return error.details;
  if (typeof error?.details?.detail === 'string' && error.details.detail.trim()) return error.details.detail;
  if (Array.isArray(error?.details?.non_field_errors) && error.details.non_field_errors[0]) {
    return String(error.details.non_field_errors[0]);
  }
  if (typeof error?.message === 'string' && error.message.trim()) return error.message;
  return fallback;
}

function applyServerErrorsToForm(form, error) {
  const details = error?.details;
  if (!details || typeof details !== 'object' || Array.isArray(details)) return;

  const fields = Object.entries(details)
    .filter(([name]) => name && name !== 'detail' && name !== 'non_field_errors')
    .map(([name, value]) => ({
      name,
      errors: Array.isArray(value) ? value.map((item) => String(item)) : [String(value)],
    }));

  if (fields.length > 0) {
    form.setFields(fields);
  }
}

function deriveRoles(user = {}) {
  const explicit = normalizeStringList(user.roles);
  if (explicit.length > 0) return explicit;

  const derived = [];
  if (user.is_superuser) derived.push('admin');
  if (user.is_staff) derived.push('manager');
  return normalizeStringList(derived);
}

function UsersManagementTab() {
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [groupOptions, setGroupOptions] = useState([]);
  const [permissionsPool, setPermissionsPool] = useState(collectPermissionSeeds);
  const [writeCapability, setWriteCapability] = useState('unknown');

  const permissionOptions = useMemo(
    () => permissionsPool.map((permission) => ({ label: permission, value: permission })),
    [permissionsPool]
  );

  const mergePermissions = (items = []) => {
    const fromUsers = [];
    items.forEach((item) => {
      if (Array.isArray(item?.permissions)) {
        item.permissions.forEach((permission) => fromUsers.push(permission));
      }
    });

    const merged = normalizeStringList([...permissionsPool, ...fromUsers]);
    if (merged.length !== permissionsPool.length) {
      setPermissionsPool(merged);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers({
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchValue || undefined,
      });
      const { results, count } = extractListResponse(response);
      setUsers(results);
      setPagination((prev) => ({ ...prev, total: count }));
      mergePermissions(results);
    } catch (error) {
      message.error(getErrorText(error, 'Не удалось загрузить пользователей'));
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await getDepartmentsAsGroups({ page_size: 500 });
      const { results } = extractListResponse(response);
      const options = results
        .map((item) => {
          const rawName = typeof item === 'string' ? item : item?.name;
          const value = String(rawName || '').trim();
          if (!value) return null;
          return { label: value, value };
        })
        .filter(Boolean);
      setGroupOptions(options);
    } catch {
      setGroupOptions([]);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, searchValue]);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    let cancelled = false;
    detectUserWriteCapability()
      .then((capability) => {
        if (cancelled) return;
        setWriteCapability(capability);
      })
      .catch(() => {
        if (cancelled) return;
        setWriteCapability('unknown');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openCreate = () => {
    setEditingUserId(null);
    form.resetFields();
    form.setFieldsValue({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      is_staff: false,
      is_superuser: false,
      roles: [],
      groups: [],
      permissions: [],
    });
    setModalOpen(true);
  };

  const openEdit = async (record) => {
    try {
      const full = await getUser(record.id);
      mergePermissions([full]);
      setEditingUserId(record.id);
      form.resetFields();
      form.setFieldsValue({
        username: full?.username || '',
        email: full?.email || '',
        first_name: full?.first_name || '',
        last_name: full?.last_name || '',
        is_staff: Boolean(full?.is_staff),
        is_superuser: Boolean(full?.is_superuser),
        roles: deriveRoles(full),
        groups: normalizeStringList(full?.groups),
        permissions: normalizeStringList(full?.permissions),
      });
      setModalOpen(true);
    } catch (error) {
      message.error(getErrorText(error, 'Не удалось загрузить пользователя'));
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUserId(null);
    form.resetFields();
  };

  const handleDelete = async (record) => {
    try {
      await deleteUser(record.id);
      setWriteCapability('writable');
      message.success('Пользователь удалён');
      loadUsers();
    } catch (error) {
      if (isUnsupportedWrite(error)) {
        setWriteCapability('readonly');
      }
      message.error(getErrorText(error, 'Не удалось удалить пользователя'));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const roles = normalizeStringList(values.roles);
      const groups = normalizeStringList(values.groups);
      const permissions = normalizeStringList(values.permissions);
      const isSuperuser = Boolean(values.is_superuser) || roles.includes('admin');
      const isStaff = Boolean(values.is_staff) || isSuperuser || roles.includes('manager');

      const userPayload = {
        username: values.username,
        email: values.email,
        first_name: values.first_name || '',
        last_name: values.last_name || '',
        is_staff: isStaff,
        is_superuser: isSuperuser,
      };

      let userId = editingUserId;
      if (editingUserId) {
        await updateUser(editingUserId, userPayload, { partial: true });
      } else {
        const created = await createUser({ ...userPayload, password: values.password });
        userId = created?.id ?? created?.user?.id ?? null;
      }

      setWriteCapability('writable');

      if (userId) {
        try {
          await updateUserAccess(userId, {
            roles,
            groups,
            permissions,
            is_staff: isStaff,
            is_superuser: isSuperuser,
          });
        } catch (accessError) {
          message.warning(getErrorText(accessError, 'Пользователь сохранён, но права обновить не удалось'));
        }
      }

      message.success(editingUserId ? 'Пользователь обновлён' : 'Пользователь создан');
      closeModal();
      loadUsers();
    } catch (error) {
      if (error?.errorFields) return;
      if (isUnsupportedWrite(error)) {
        setWriteCapability('readonly');
      }
      applyServerErrorsToForm(form, error);
      message.error(getErrorText(error, editingUserId ? 'Не удалось обновить пользователя' : 'Не удалось создать пользователя'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (value) => value || '-',
    },
    {
      title: t('usersPage.columns.fullName', 'Full name'),
      key: 'full_name',
      render: (_, record) => {
        const fullName = [record.first_name, record.last_name].filter(Boolean).join(' ').trim();
        return fullName || '-';
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (value) => value || '-',
    },
    {
      title: t('usersPage.columns.roles', 'Roles'),
      key: 'roles',
      render: (_, record) => {
        const roles = deriveRoles(record);
        if (!roles.length) return '-';
        return (
          <Space size={[4, 4]} wrap>
            {roles.map((role) => (
              <Tag key={`${record.id}-${role}`}>{role}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: t('usersPage.columns.permissions', 'Permissions'),
      key: 'permissions',
      width: 130,
      render: (_, record) => {
        const permissions = normalizeStringList(record.permissions);
        return permissions.length ? <Tag color="blue">{permissions.length}</Tag> : '-';
      },
    },
    {
      title: t('usersPage.columns.actions', 'Actions'),
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            aria-label={t('usersPage.actions.edit', 'Редактировать пользователя')}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title={t('usersPage.messages.confirmDelete', 'Удалить пользователя?')}
            description={t('usersPage.messages.confirmDeleteDescription', 'Это действие нельзя отменить.')}
            okText={t('usersPage.common.delete', 'Удалить')}
            cancelText={t('usersPage.common.cancel', 'Отмена')}
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label={t('usersPage.actions.delete', 'Удалить пользователя')}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={t('usersPage.tabs.users', 'Users')}
      extra={
        <Space>
          <Input.Search
            allowClear
            placeholder={t('usersPage.search.placeholder', 'Поиск по username/email')}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={(value) => {
              setPagination((prev) => ({ ...prev, current: 1 }));
              setSearchValue(value.trim());
            }}
            style={{ width: 280 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => loadUsers()}>
            {t('usersPage.common.refresh', 'Обновить')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('usersPage.common.create', 'Создать')}
          </Button>
        </Space>
      }
    >
      {writeCapability === 'readonly' && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t(
            'usersPage.messages.writeUnavailable',
            'Backend не поддерживает запись пользователей через API (доступен только режим просмотра).'
          )}
        />
      )}

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={users}
        scroll={{ x: 980 }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (current, pageSize) => {
            setPagination((prev) => ({
              ...prev,
              current,
              pageSize,
            }));
          },
        }}
      />

      <Modal
        title={editingUserId ? t('usersPage.modal.editTitle', 'Редактировать пользователя') : t('usersPage.modal.createTitle', 'Создать пользователя')}
        open={modalOpen}
        onOk={handleSubmit}
        confirmLoading={saving}
        onCancel={closeModal}
        okText={editingUserId ? t('usersPage.common.save', 'Сохранить') : t('usersPage.common.create', 'Создать')}
        cancelText={t('usersPage.common.cancel', 'Отмена')}
        width={760}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: t('usersPage.validation.usernameRequired', 'Укажите username') }]}
              >
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: t('usersPage.validation.emailRequired', 'Укажите email') },
                  { type: 'email', message: t('usersPage.validation.emailInvalid', 'Некорректный email') },
                ]}
              >
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('usersPage.columns.firstName', 'First name')} name="first_name">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('usersPage.columns.lastName', 'Last name')} name="last_name">
                <Input />
              </Form.Item>
            </Col>
            {!editingUserId && (
              <Col xs={24}>
                <Form.Item
                  label={t('usersPage.fields.password', 'Password')}
                  name="password"
                  rules={[
                    { required: true, message: t('usersPage.validation.passwordRequired', 'Укажите пароль') },
                    { min: 8, message: t('usersPage.validation.passwordMin', 'Пароль должен быть не менее 8 символов') },
                  ]}
                >
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} md={12}>
              <Form.Item label={t('usersPage.fields.isStaff', 'Staff')} name="is_staff" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('usersPage.fields.isSuperuser', 'Superuser')} name="is_superuser" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Card size="small" title={t('usersPage.fields.accessControl', 'Права доступа')}>
            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item label={t('usersPage.fields.roles', 'Roles')} name="roles">
                  <Select mode="multiple" allowClear options={ROLE_OPTIONS} placeholder={t('usersPage.fields.rolesPlaceholder', 'Выберите роли')} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label={t('usersPage.fields.groups', 'Groups')} name="groups">
                  <Select
                    mode="multiple"
                    allowClear
                    options={groupOptions}
                    placeholder={t('usersPage.fields.groupsPlaceholder', 'Выберите группы')}
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label={t('usersPage.fields.permissions', 'Permissions')} name="permissions">
                  <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    options={permissionOptions}
                    placeholder={t('usersPage.fields.permissionsPlaceholder', 'Выберите permissions')}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </Modal>
    </Card>
  );
}

function SecurityTab() {
  const [sessions, setSessions] = useState([]);
  const [twoFA, setTwoFA] = useState(null);
  const [savingTwoFA, setSavingTwoFA] = useState(false);
  const [twoFAForm] = Form.useForm();
  const twoFaEntries = useMemo(() => {
    if (!twoFA || typeof twoFA !== 'object') return [];
    return Object.entries(twoFA);
  }, [twoFA]);

  const load = async () => {
    try {
      const [sessionsRes, twoFaRes] = await Promise.all([getUserSessions(), get2FAStatus()]);
      setSessions(sessionsRes?.results || sessionsRes || []);
      setTwoFA(twoFaRes);
    } catch (error) {
      message.error(t('usersPage.messages.securityLoadError'));
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!twoFA || typeof twoFA !== 'object') return;
    twoFAForm.setFieldsValue({
      enabled: Boolean(twoFA.enabled),
      method: twoFA.method || 'email',
    });
  }, [twoFA, twoFAForm]);

  const handleRevoke = async () => {
    try {
      await revokeAllSessions();
      message.success(t('usersPage.messages.sessionsRevoked'));
      load();
    } catch (error) {
      message.error(t('usersPage.messages.revokeError'));
    }
  };

  const handleSaveTwoFA = async () => {
    try {
      const values = await twoFAForm.validateFields();
      setSavingTwoFA(true);
      await update2FAStatus({
        enabled: Boolean(values.enabled),
        method: values.method || 'email',
      });
      message.success(t('usersPage.messages.twoFaSaved', 'Настройки 2FA обновлены'));
      await load();
    } catch (error) {
      if (!error?.errorFields) {
        message.error(getErrorText(error, t('usersPage.messages.twoFaSaveError', 'Не удалось обновить 2FA')));
      }
    } finally {
      setSavingTwoFA(false);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card
        title={t('usersPage.security.twoFaTitle')}
        extra={(
          <Space>
            <Button onClick={load}>{t('usersPage.common.refresh')}</Button>
            <Button type="primary" loading={savingTwoFA} onClick={handleSaveTwoFA}>
              {t('usersPage.common.save', 'Сохранить')}
            </Button>
          </Space>
        )}
      >
        <Form form={twoFAForm} layout="vertical" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label={t('usersPage.security.twoFaEnabled', 'Включить 2FA')}
                name="enabled"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('usersPage.security.twoFaMethod', 'Метод')} name="method">
                <Select
                  options={[
                    { value: 'email', label: 'Email' },
                    { value: 'sms', label: 'SMS' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        {!twoFaEntries.length ? (
          <Empty description={t('usersPage.security.twoFaEmpty')} />
        ) : (
          <Row gutter={[16, 16]}>
            {twoFaEntries.map(([key, value]) => (
              <Col xs={24} md={8} key={key}>
                <Card size="small">
                  {(() => {
                    const title = key.replace(/_/g, ' ');
                    const formatted = formatValueForUi(value, { key });
                    if (formatted.kind === 'number') {
                      return <Statistic title={title} value={formatted.number} />;
                    }
                    if (typeof value === 'boolean') {
                      const isYes = value === true;
                      return (
                        <>
                          <div style={{ marginBottom: 8, color: '#71717a' }}>{title}</div>
                          <Tag color={isYes ? 'green' : 'default'}>{isYes ? t('usersPage.common.yes') : t('usersPage.common.no')}</Tag>
                        </>
                      );
                    }
                    return (
                      <Descriptions size="small" column={1}>
                        <Descriptions.Item label={title}>
                          {formatted.kind === 'complex' ? JSON.stringify(formatted.value) : formatted.text}
                        </Descriptions.Item>
                      </Descriptions>
                    );
                  })()}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
      <Card title={t('usersPage.security.sessionsTitle')} extra={<Button danger onClick={handleRevoke}>{t('usersPage.security.revokeAll')}</Button>}>
        <Table
          dataSource={sessions}
          rowKey={(record) => record.id || record.session_key || `${record.ip_address || 'ip'}-${record.created_at || record.user_agent || 'session'}`}
          columns={[
            { title: 'IP', dataIndex: 'ip_address', key: 'ip_address' },
            { title: 'User Agent', dataIndex: 'user_agent', key: 'user_agent' },
            { title: t('usersPage.security.createdAt'), dataIndex: 'created_at', key: 'created_at' },
            {
              title: t('usersPage.security.active'),
              dataIndex: 'is_active',
              key: 'is_active',
              render: (value) => (value ? t('usersPage.common.yes') : t('usersPage.common.no')),
            },
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </Space>
  );
}

export default function UsersPage() {
  const tabs = [
    {
      key: 'users',
      label: t('usersPage.tabs.users'),
      children: <UsersManagementTab />,
    },
    {
      key: 'profiles',
      label: t('usersPage.tabs.profiles'),
      children: (
        <CrudPage
          title={t('usersPage.tabs.profiles')}
          api={{ list: getProfiles, retrieve: getProfileByUser }}
          columns={[
            { title: 'User', dataIndex: 'username', key: 'username' },
            { title: 'Email', dataIndex: 'email', key: 'email' },
            { title: t('usersPage.columns.fullName'), dataIndex: 'full_name', key: 'full_name' },
            { title: 'PBX', dataIndex: 'pbx_number', key: 'pbx_number' },
            { title: 'Timezone', dataIndex: 'utc_timezone', key: 'utc_timezone' },
          ]}
          fields={[]}
          readOnly
        />
      ),
    },
    {
      key: 'security',
      label: t('usersPage.tabs.security'),
      children: <SecurityTab />,
    },
  ];

  return <Tabs items={tabs} />;
}
