import { companyKeys } from '@/entities/company/api/keys';
import { useDeleteCompany, usePatchCompany } from '@/entities/company/api/mutations';
import type { Company } from '@/entities/company/model/types';
import { useClientTypes, useIndustries, useUsers } from '@/features/reference';
import { getClientTypeLabel } from '@/features/reference/lib/clientTypeLabel';
// @ts-ignore
import EditableCell from '@/components/editable-cell';
// @ts-ignore
import { CompaniesService } from '@/shared/api/generated/services/CompaniesService';
import { useServerTable } from '@/shared/hooks';
import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    GlobalOutlined,
    MailOutlined,
    PhoneOutlined,
    ShopOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Alert, Avatar, Button, Popconfirm, Space, Table, Tag, Tooltip, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';
import { CompaniesTableFilters } from './ui/CompaniesTableFilters';

// Import existing CallButton (temporarily using any to bypass TS checks during migration)
// @ts-ignore
import CallButton from '@/components/CallButton';
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';
// @ts-ignore
import { getLocale } from '@/lib/i18n';

export const CompaniesTable: React.FC = () => {
  const { token } = theme.useToken();
  const canManage = canWrite();
  // Use shared hook for server-side table logic
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    pagination,
    params,
    handleTableChange,
    applyFilters,
  } = useServerTable<Company>({
    queryKey: companyKeys.lists() as unknown as unknown[],
    queryFn: (params) => CompaniesService.companiesList(params as any),
  });

  const deleteMutation = useDeleteCompany();
  const patchMutation = usePatchCompany();
  const { data: clientTypesData } = useClientTypes();
  const { data: industriesData } = useIndustries();
  const { data: usersData } = useUsers();
  const locale = getLocale();

  const clientTypeMap = React.useMemo(() => {
    const map = new Map<number, string>();
    (clientTypesData?.results || []).forEach((item) => {
      map.set(item.id, getClientTypeLabel(item.name, locale));
    });
    return map;
  }, [clientTypesData, locale]);

  const industryMap = React.useMemo(() => {
    const map = new Map<number, string>();
    (industriesData?.results || []).forEach((item) => {
      map.set(item.id, item.name);
    });
    return map;
  }, [industriesData]);

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleFiltersApply = (filters: Record<string, unknown>) => {
    applyFilters(filters);
  };

  const normalizeForeignKeyValue = (raw: unknown): number | null => {
    if (raw === null || raw === undefined || raw === '') return null;
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
    const asNumber = Number(raw);
    return Number.isFinite(asNumber) ? asNumber : null;
  };

  const handleInlineSave = async (record: Company, dataIndex: string, value: any) => {
    if (!canManage) return;
    const normalizedValue =
      dataIndex === 'type' || dataIndex === 'owner'
        ? normalizeForeignKeyValue(value)
        : value;
    await patchMutation.mutateAsync({
      id: record.id,
      data: { [dataIndex]: normalizedValue } as any,
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

  const clientTypeOptions = React.useMemo(
    () =>
      (clientTypesData?.results || []).map((item) => ({
        value: item.id,
        label: getClientTypeLabel(item.name, locale) || 'Тип клиента',
      })),
    [clientTypesData, locale],
  );

  const userOptions = React.useMemo(
    () =>
      (usersData?.results || []).map((user) => ({
        value: user.id,
        label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || 'Пользователь',
      })),
    [usersData],
  );

  const columns: ColumnsType<Company> = [
    {
      title: 'Компания',
      key: 'company',
      sorter: true,
      render: (_, record) => (
        <Space style={{ minWidth: 0 }}>
          <Avatar icon={<ShopOutlined />} style={{ backgroundColor: '#52c41a' }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 500 }}>
              <EditableCell
                value={record.full_name}
                record={record}
                dataIndex="full_name"
                editable={canManage}
                onSave={handleInlineSave}
                style={{ ...singleLineEllipsis, maxWidth: 220 }}
              />
            </div>
            {Array.isArray(record.industry) && record.industry.length > 0 && (
              <div
                style={{ ...singleLineEllipsis, fontSize: 12, color: token.colorTextSecondary, maxWidth: 220 }}
                title={record.industry
                  .map((industryId) => industryMap.get(industryId))
                  .filter(Boolean)
                  .join(', ') || '-'}
              >
                {record.industry
                  .map((industryId) => industryMap.get(industryId))
                  .filter(Boolean)
                  .join(', ') || '-'}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Контакты',
      key: 'contacts',
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
              style={{ ...singleLineEllipsis, flex: 1, maxWidth: 220 }}
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
              style={{ ...singleLineEllipsis, flex: 1, maxWidth: 220 }}
            />
          </Space>
          <Space size="small" style={{ width: '100%' }}>
            <GlobalOutlined style={{ color: token.colorTextSecondary }} />
            <EditableCell
              value={record.website}
              record={record}
              dataIndex="website"
              editable={canManage}
              onSave={handleInlineSave}
              placeholder="https://"
              style={{ ...singleLineEllipsis, flex: 1, maxWidth: 220 }}
            />
          </Space>
        </Space>
      ),
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type, record) => (
        <EditableCell
          value={type}
          record={record}
          dataIndex="type"
          editable={canManage}
          type="select"
          options={clientTypeOptions}
          onSave={handleInlineSave}
          saveOnBlur={false}
          placeholder="Тип"
          renderView={(val: number | null | undefined) => {
            if (!val) return '-';
            const option = clientTypeOptions.find((item) => String(item.value) === String(val));
            return <Tag color="blue">{option?.label || clientTypeMap.get(val) || '-'}</Tag>;
          }}
          style={{ paddingInline: 0 }}
        />
      ),
    },
    {
      title: 'Ответственный',
      dataIndex: 'owner',
      key: 'owner',
      width: 180,
      render: (ownerId, record: any) => (
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
              <Space size={6}>
                <UserOutlined style={{ color: token.colorTextSecondary }} />
                <span style={{ ...singleLineEllipsis, maxWidth: 140 }} title={label}>
                  {label}
                </span>
              </Space>
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
      width: 150,
      sorter: true,
      render: (date) => (date ? new Date(date).toLocaleDateString('ru-RU') : '-'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 170,
      render: (_, record) => (
        <Space size="small">
          <CallButton
            phone={record.phone}
            name={record.full_name}
            entityType="company"
            entityId={record.id}
            size="small"
            type="primary"
          />
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            aria-label="Просмотреть компанию"
            onClick={() => navigate(`/companies/${record.id}`)}
          />
          {canManage ? (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                aria-label="Редактировать компанию"
                onClick={() => navigate(`/companies/${record.id}/edit`)}
              />
          ) : (
            <Tooltip title="Недостаточно прав">
              <Button type="link" size="small" icon={<EditOutlined />} aria-label="Редактировать компанию" disabled />
            </Tooltip>
          )}
          {canManage ? (
            <Popconfirm
              title="Удалить эту компанию?"
              description="Это действие нельзя отменить"
              onConfirm={() => handleDelete(record.id)}
              okText="Да"
              cancelText="Нет"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                aria-label="Удалить компанию"
                loading={deleteMutation.isPending}
              />
            </Popconfirm>
          ) : (
            <Tooltip title="Недостаточно прав">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} aria-label="Удалить компанию" disabled />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <CompaniesTableFilters
        filters={params}
        onFilterChange={handleFiltersApply}
        onRefresh={() => refetch()}
        loading={isLoading || isFetching}
      />
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Не удалось загрузить список компаний"
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
