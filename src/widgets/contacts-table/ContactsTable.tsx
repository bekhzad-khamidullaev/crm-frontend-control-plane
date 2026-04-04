import { useServerTable } from '@/shared/hooks';
import {
    BankOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    MailOutlined,
    PhoneOutlined,
    UserOutlined
} from '@ant-design/icons';
import { Alert, Avatar, Button, Grid, Popconfirm, Space, Table, Tooltip, theme } from 'antd';
import React, { useMemo } from 'react';
// @ts-ignore
import EditableCell from '@/components/editable-cell';
// @ts-ignore
import { contactKeys } from '@/entities/contact/api/keys';
import { useDeleteContact, usePatchContact } from '@/entities/contact/api/mutations';
import type { Contact } from '@/entities/contact/model/types';
import { useCompanies } from '@/entities/company/api/queries';
import { useUsers } from '@/features/reference';
import { getCompanyDisplayName } from '@/lib/utils/company-display.js';
import { ContactsService } from '@/shared/api/generated/services/ContactsService';
import type { ColumnsType } from 'antd/es/table';
import { ContactsTableFilters } from './ui/ContactsTableFilters';

// @ts-ignore
import CallButton from '@/components/CallButton'; // Legacy
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';

export const ContactsTable: React.FC = () => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const canManage = canWrite();
  const { data: companiesResponse } = useCompanies({ page: 1, pageSize: 1000 });
  const { data: usersData } = useUsers();
  const companyNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const company of companiesResponse?.results ?? []) {
      map[company.id] = getCompanyDisplayName(company) || '-';
    }
    return map;
  }, [companiesResponse?.results]);

  const companyOptions = useMemo(
    () =>
      (companiesResponse?.results || []).map((company) => ({
        value: company.id,
        label: getCompanyDisplayName(company) || 'Компания',
      })),
    [companiesResponse?.results],
  );

  const userOptions = useMemo(
    () =>
      (usersData?.results || []).map((user) => ({
        value: user.id,
        label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || 'Пользователь',
      })),
    [usersData?.results],
  );

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    pagination,
    params,
    handleTableChange,
    handleFilterChange,
  } = useServerTable<Contact>({
    queryKey: contactKeys.lists() as unknown as unknown[],
    queryFn: (params) => ContactsService.contactsList(params as any),
  });

  const deleteMutation = useDeleteContact();
  const patchMutation = usePatchContact();

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      // Error handled
    }
  };

  const handleFiltersApply = (filters: Record<string, unknown>) => {
    Object.entries(filters).forEach(([key, value]) => {
      handleFilterChange(key, value);
    });
  };

  const normalizeForeignKeyValue = (raw: unknown): number | null => {
    if (raw === null || raw === undefined || raw === '') return null;
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
    const asNumber = Number(raw);
    return Number.isFinite(asNumber) ? asNumber : null;
  };

  const handleInlineSave = async (record: Contact, dataIndex: string, value: any) => {
    if (!canManage) return;
    if (dataIndex === 'company' && (value === null || value === undefined || value === '')) {
      return;
    }
    const normalizedValue =
      dataIndex === 'company' || dataIndex === 'owner'
        ? normalizeForeignKeyValue(value)
        : value;
    const payload = {
      // Backend ContactSerializer currently validates first_name/last_name for PATCH as required.
      first_name: record.first_name || '',
      last_name: record.last_name || '',
      [dataIndex]: normalizedValue,
    };
    await patchMutation.mutateAsync({
      id: record.id,
      data: payload as any,
    });
    await refetch();
  };

  const singleLineEllipsis: React.CSSProperties = {
    display: 'block',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const columns: ColumnsType<Contact> = [
    {
      title: 'Контакт',
      key: 'contact',
      sorter: true,
      width: isMobile ? 220 : 280,
      render: (_, record) => (
        <Space style={{ minWidth: 0 }}>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{ ...singleLineEllipsis, fontWeight: 500, maxWidth: isMobile ? 140 : 220 }}
              title={record.full_name}
            >
              {record.full_name}
            </div>
            <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
              <EditableCell
                value={record.title}
                record={record}
                dataIndex="title"
                editable={canManage}
                onSave={handleInlineSave}
                placeholder="Должность"
                style={{ ...singleLineEllipsis, maxWidth: isMobile ? 130 : 200 }}
              />
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Связь',
      key: 'communication',
      responsive: ['md'],
      width: 240,
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space size="small" style={{ width: '100%' }}>
            <MailOutlined style={{ color: token.colorTextSecondary }} />
            <EditableCell
              value={record.email}
              record={record}
              dataIndex="email"
              editable={canManage}
              onSave={handleInlineSave}
              placeholder="email@example.com"
              style={{ ...singleLineEllipsis, flex: 1, maxWidth: 190 }}
            />
          </Space>
          <Space size="small" style={{ width: '100%' }}>
            <PhoneOutlined style={{ color: token.colorTextSecondary }} />
            <EditableCell
              value={record.phone}
              record={record}
              dataIndex="phone"
              editable={canManage}
              onSave={handleInlineSave}
              placeholder="+998 ..."
              style={{ ...singleLineEllipsis, flex: 1, maxWidth: 190 }}
            />
          </Space>
        </Space>
      ),
    },
    {
      title: 'Компания',
      dataIndex: 'company',
      key: 'company',
      responsive: ['sm'],
      width: 160,
      render: (companyId: number | null | undefined, record: Contact) => (
        <EditableCell
          value={companyId}
          record={record}
          dataIndex="company"
          editable={canManage}
          type="select"
          options={companyOptions}
          onSave={handleInlineSave}
          saveOnBlur={false}
          placeholder="Компания"
          inputProps={{ allowClear: false }}
          renderView={(val: number | null | undefined) => {
            if (!val) return '-';
            const fallbackFromRecord = getCompanyDisplayName(record as any);
            const label = companyNameById[val] || fallbackFromRecord || 'Компания';
            return (
              <Button
                type="link"
                size="small"
                icon={<BankOutlined />}
                onClick={() => navigate(`/companies/${val}`)}
                style={{ maxWidth: 150, paddingInline: 0 }}
                title={label}
              >
                <span style={{ ...singleLineEllipsis, maxWidth: 120 }}>{label}</span>
              </Button>
            );
          }}
          style={{ paddingInline: 0 }}
        />
      ),
    },
    {
      title: 'Ответственный',
      dataIndex: 'owner',
      key: 'owner',
      responsive: ['xl'],
      width: 180,
      render: (ownerId: number | null | undefined, record: any) => (
        <EditableCell
          value={ownerId}
          record={record}
          dataIndex="owner"
          editable={canManage}
          type="select"
          options={userOptions}
          onSave={handleInlineSave}
          saveOnBlur={false}
          placeholder="Ответственный"
          renderView={(val: number | null | undefined) => {
            const option = userOptions.find((item) => String(item.value) === String(val));
            const label = option?.label || record.owner_name || 'Не назначен';
            return (
              <span style={{ ...singleLineEllipsis, maxWidth: 150 }} title={label}>
                {label}
              </span>
            );
          }}
          style={{ paddingInline: 0 }}
        />
      ),
    },
    {
      title: 'Дата создания',
      dataIndex: 'creation_date',
      key: 'creation_date',
      responsive: ['lg'],
      width: 150,
      sorter: true,
      render: (date) => (date ? new Date(date).toLocaleDateString('ru-RU') : '-'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: isMobile ? 148 : 170,
      render: (_, record) => (
        <Space size="small">
          <CallButton
            phone={record.phone}
            name={record.full_name}
            entityType="contact"
            entityId={record.id}
            size="small"
            type="primary"
          />
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            aria-label="Просмотреть контакт"
            onClick={() => navigate(`/contacts/${record.id}`)}
          />
          {canManage ? (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                aria-label="Редактировать контакт"
                onClick={() => navigate(`/contacts/${record.id}/edit`)}
              />
          ) : (
            <Tooltip title="Недостаточно прав">
              <Button type="link" size="small" icon={<EditOutlined />} aria-label="Редактировать контакт" disabled />
            </Tooltip>
          )}
          {canManage ? (
            <Popconfirm
              title="Удалить контакт?"
              onConfirm={() => handleDelete(record.id)}
              okText="Да"
              cancelText="Нет"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                aria-label="Удалить контакт"
                loading={deleteMutation.isPending}
              />
            </Popconfirm>
          ) : (
            <Tooltip title="Недостаточно прав">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} aria-label="Удалить контакт" disabled />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <ContactsTableFilters
        filters={params}
        onFilterChange={handleFiltersApply}
        loading={isLoading}
      />
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Не удалось загрузить список контактов"
          action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
        />
      )}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={isLoading || isFetching}
        size="small"
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};
