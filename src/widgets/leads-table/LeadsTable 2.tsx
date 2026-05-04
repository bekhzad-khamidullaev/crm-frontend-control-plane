import { leadKeys } from '@/entities/lead/api/keys';
import { useDeleteLead, usePatchLead } from '@/entities/lead/api/mutations';
import type { LeadListParams } from '@/entities/lead/api/queries';
import type { Lead } from '@/entities/lead/model/types';
import { deriveLeadStatus } from '@/entities/lead/model/utils';
// @ts-ignore
import EditableCell from '@/components/editable-cell';
import { useLeadSources, useTags, useUsers } from '@/features/reference';
// @ts-ignore
import { LeadsService } from '@/shared/api/generated/services/LeadsService';
import { useServerTable } from '@/shared/hooks';
import {
    BankOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    MailOutlined,
    PhoneOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Alert, Avatar, Badge, Button, Grid, Popconfirm, Space, Table, Tag, Tooltip, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';
import { LeadsTableFilters } from './ui/LeadsTableFilters';

// @ts-ignore
import CallButton from '@/components/CallButton';
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';
import { getCompanyDisplayName } from '@/lib/utils/company-display.js';
import { getLocale, t } from '@/lib/i18n';
import { getLeadSourceLabel } from '@/features/reference/lib/leadSourceLabel';

export const LeadsTable: React.FC = () => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const canManage = canWrite();
  const locale = getLocale();
  const { data: tagsData } = useTags();
  const { data: leadSourcesData } = useLeadSources();
  const { data: usersData } = useUsers();

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    pagination,
    handleTableChange,
    applyFilters,
    params: filters,
  } = useServerTable<Lead>({
    queryKey: leadKeys.lists() as unknown as unknown[],
    queryFn: (params) => LeadsService.leadsList(params as any),
  });

  // Cast filters to LeadListParams to match prop type
  const listFilters = (filters || {}) as LeadListParams;

  const deleteMutation = useDeleteLead();
  const patchMutation = usePatchLead();

  const normalizeForeignKeyValue = (
    raw: unknown,
    options: Array<{ value: string | number; label: string }> = [],
  ): number | null => {
    if (raw === null || raw === undefined || raw === '') return null;
    if (typeof raw === 'object' && raw !== null) {
      const nested =
        (raw as { value?: unknown; id?: unknown; key?: unknown; label?: unknown }).value ??
        (raw as { id?: unknown; key?: unknown; label?: unknown }).id ??
        (raw as { key?: unknown; label?: unknown }).key ??
        (raw as { label?: unknown }).label;
      return normalizeForeignKeyValue(nested, options);
    }
    if (typeof raw === 'string') {
      const byLabel = options.find((option) => option.label === raw);
      if (byLabel) {
        return normalizeForeignKeyValue(byLabel.value, options);
      }
    }
    if (typeof raw === 'number') {
      return Number.isFinite(raw) ? raw : null;
    }
    const asNumber = Number(raw);
    return Number.isFinite(asNumber) ? asNumber : null;
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInlineSave = async (record: Lead, dataIndex: string, value: any) => {
    if (!canManage) return;
    const patchPayload: Record<string, unknown> = { [dataIndex]: value };
    if (dataIndex === 'lead_source' || dataIndex === 'owner') {
      const fkOptions = dataIndex === 'lead_source' ? leadSourceOptions : userOptions;
      patchPayload[dataIndex] = normalizeForeignKeyValue(value, fkOptions);
    }
    if (dataIndex === 'status') {
      patchPayload.disqualified = value === 'lost';
      if (value === 'new') {
        patchPayload.was_in_touch = null;
      }
    }
    await patchMutation.mutateAsync({
      id: record.id,
      data: patchPayload as any,
    });
    await refetch();
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    new: { color: 'blue', text: 'Новый' },
    contacted: { color: 'gold', text: 'Связались' },
    qualified: { color: 'purple', text: 'Квалифицирован' },
    converted: { color: 'green', text: 'Конвертирован' },
    lost: { color: 'red', text: 'Потерян' },
  };

  const tagsMap = React.useMemo(() => {
    const map = new Map<number, string>();
    (tagsData?.results || []).forEach((tag) => {
      map.set(tag.id, tag.name || '-');
    });
    return map;
  }, [tagsData]);

  const leadSourceOptions = React.useMemo(
    () =>
      (leadSourcesData?.results || []).map((source) => ({
        value: source.id,
        label: getLeadSourceLabel(source.name || t('leadsTable.sourceFallback', 'Источник'), locale),
      })),
    [leadSourcesData, locale],
  );

  const userOptions = React.useMemo(
    () =>
      (usersData?.results || []).map((user) => ({
        value: user.id,
        label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || 'Пользователь',
      })),
    [usersData],
  );

  const statusOptions = React.useMemo(
    () =>
      Object.entries(statusMap).map(([value, meta]) => ({
        value,
        label: meta.text,
      })),
    [],
  );

  const renderInlineBadge = (text: string, bg: string, border: string, color: string) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 30,
        padding: '4px 12px',
        borderRadius: 10,
        background: bg,
        border: `1px solid ${border}`,
        color,
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  );

  const singleLineEllipsis: React.CSSProperties = {
    display: 'block',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const columns: ColumnsType<Lead> = [
    {
      title: 'Лид',
      key: 'lead',
      sorter: true,
      fixed: 'left',
      width: isMobile ? 220 : 250,
      render: (_, record) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{ ...singleLineEllipsis, fontWeight: 500, maxWidth: isMobile ? 130 : 170 }}
              title={record.full_name}
            >
              {record.full_name}
            </div>
            {getCompanyDisplayName(record as any) && (
              <div
                style={{
                  fontSize: 12,
                  color: token.colorTextSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  minWidth: 0,
                }}
              >
                <BankOutlined />
                <EditableCell
                  value={getCompanyDisplayName(record as any)}
                  record={record}
                  dataIndex="company_name"
                  editable={canManage}
                  onSave={handleInlineSave}
                  style={{ ...singleLineEllipsis, maxWidth: isMobile ? 120 : 160 }}
                />
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Контакты',
      key: 'contacts',
      responsive: ['md'],
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <Space size={4} style={{ width: '100%' }}>
            <MailOutlined style={{ color: token.colorTextSecondary }} />
            <EditableCell
              value={record.email}
              record={record}
              dataIndex="email"
              editable={canManage}
              onSave={handleInlineSave}
              placeholder="email@example.com"
              style={{ ...singleLineEllipsis, flex: 1, maxWidth: 170 }}
            />
          </Space>
          <Space size={4} style={{ width: '100%' }}>
            <PhoneOutlined style={{ color: token.colorTextSecondary }} />
            <EditableCell
              value={record.phone}
              record={record}
              dataIndex="phone"
              editable={canManage}
              onSave={handleInlineSave}
              placeholder="+998 ..."
              style={{ ...singleLineEllipsis, flex: 1, maxWidth: 170 }}
            />
          </Space>
        </Space>
      ),
    },
    {
      title: 'Статус',
      key: 'status',
      width: 150,
      render: (_, record) => {
        const s = deriveLeadStatus(record);
        const label = statusMap[s].text;
        return (
          <EditableCell
            value={s}
            record={record}
            dataIndex="status"
            editable={canManage}
            type="select"
            options={statusOptions}
            onSave={handleInlineSave}
            saveOnBlur={false}
            renderView={(val: string) => <Badge color={statusMap[val]?.color || 'default'} text={statusMap[val]?.text || label} />}
            style={{ paddingInline: 0 }}
          />
        );
      },
    },
    {
      title: t('leadsTable.sourceColumn', 'Источник'),
      dataIndex: 'lead_source',
      key: 'lead_source',
      width: 170,
      responsive: ['lg'],
      render: (sourceId: number | null | undefined, record) => (
        <EditableCell
          value={sourceId}
          record={record}
          dataIndex="lead_source"
          editable={canManage}
          type="select"
          options={leadSourceOptions}
          onSave={handleInlineSave}
          saveOnBlur={false}
          placeholder={t('leadsTable.sourcePlaceholder', 'Источник')}
          renderView={(val: number | null | undefined) => {
            const option = leadSourceOptions.find((item) => String(item.value) === String(val));
            const text = option?.label || t('leadsTable.noSource', 'Без источника');
            return renderInlineBadge(text, token.colorFillAlter, token.colorBorderSecondary, token.colorTextSecondary);
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
      responsive: ['xl'],
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
            const text = option?.label || record.owner_name || 'Не назначен';
            return renderInlineBadge(
              text,
              token.colorPrimaryBg,
              token.colorPrimaryBorder,
              token.colorPrimaryText
            );
          }}
          style={{ paddingInline: 0 }}
        />
      ),
    },
    {
      title: 'SLA контакта',
      key: 'first_contact_sla',
      width: 150,
      responsive: ['md'],
      render: (_, record) => {
        const entity = record as any;
        const createdAtRaw = entity?.creation_date || entity?.create_date || entity?.created_at;
        const firstTouchRaw = entity?.was_in_touch || entity?.first_contact_at;
        const createdAt = createdAtRaw ? new Date(createdAtRaw) : null;
        const firstTouch = firstTouchRaw ? new Date(firstTouchRaw) : null;

        if (firstTouch && !Number.isNaN(firstTouch.getTime())) {
          return <Tag color="success">Контакт выполнен</Tag>;
        }
        if (!createdAt || Number.isNaN(createdAt.getTime())) {
          return <Tag>Нет данных</Tag>;
        }

        const hoursFromCreate = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursFromCreate >= 24) {
          return <Tag color="error">Просрочен</Tag>;
        }
        if (hoursFromCreate >= 18) {
          return <Tag color="warning">SLA риск</Tag>;
        }
        return <Tag color="processing">В срок</Tag>;
      },
    },
    {
      title: 'Теги',
      key: 'tags',
      responsive: ['lg'],
      width: 150,
      render: (_, record) => (
        <Space wrap>
          {(record.tags || []).map((tagId) => (
            <Badge key={tagId} count={tagsMap.get(tagId) || '-'} style={{ backgroundColor: token.colorSuccess }} />
          ))}
        </Space>
      ),
    },
    {
      title: 'Создан',
      dataIndex: 'creation_date',
      key: 'creation_date',
      responsive: ['lg'],
      width: 120,
      sorter: true,
      render: (date) => (date ? new Date(date).toLocaleDateString('ru-RU') : '-'),
    },
    {
      title: 'Действия',
      key: 'actions',
      fixed: 'right',
      width: isMobile ? 148 : 170,
      render: (_, record) => (
        <Space size="small">
          <CallButton
            phone={record.phone}
            name={record.full_name}
            entityType="lead"
            entityId={record.id}
            size="small"
            type="primary"
          />
          <Tooltip title="Просмотр">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                aria-label="Просмотреть лид"
                onClick={() => navigate(`/leads/${record.id}`)}
              />
          </Tooltip>
          {canManage ? (
            <Tooltip title="Редактировать">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                aria-label="Редактировать лид"
                onClick={() => navigate(`/leads/${record.id}/edit`)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Недостаточно прав">
              <Button type="link" size="small" icon={<EditOutlined />} aria-label="Редактировать лид" disabled />
            </Tooltip>
          )}
          {canManage ? (
            <Popconfirm
              title="Удалить лид?"
              onConfirm={() => handleDelete(record.id)}
              okText="Да"
              cancelText="Нет"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                aria-label="Удалить лид"
                loading={deleteMutation.isPending}
              />
            </Popconfirm>
          ) : (
            <Tooltip title="Недостаточно прав">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} aria-label="Удалить лид" disabled />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <LeadsTableFilters
        filters={listFilters}
        onChange={(newFilters) => applyFilters(newFilters as Record<string, unknown>)}
        onRefresh={() => refetch()}
        loading={isLoading || isFetching}
      />
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Не удалось загрузить список лидов"
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
