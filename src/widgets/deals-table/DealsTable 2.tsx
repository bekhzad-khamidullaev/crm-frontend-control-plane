import { Deal } from '@/entities/deal';
import { dealKeys } from '@/entities/deal/api/keys';
import { useDeleteDeal, usePatchDeal } from '@/entities/deal/api/mutations';
// @ts-ignore
import EditableCell from '@/components/editable-cell';
import { useStages, useUsers } from '@/features/reference';
import { DealsService } from '@/shared/api/generated/services/DealsService';
import { useServerTable } from '@/shared/hooks';
import {
    BankOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Alert, Badge, Button, Grid, Popconfirm, Space, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';
import { DealsTableFilters } from './ui/DealsTableFilters';
// @ts-ignore
import { navigate } from '@/router.js';
// @ts-ignore
import { formatCurrency } from '@/lib/utils/format.js';
import { getCompanyDisplayName } from '@/lib/utils/company-display.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';
import { t } from '@/lib/i18n';
import { formatDateByLocale, getStageDisplayName, translateDealStageName } from './model/i18n';

export const DealsTable: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const canManage = canWrite();
  const { data: stagesData } = useStages();
  const { data: usersData } = useUsers();

  const { data, isLoading, isFetching, error, refetch, pagination, handleTableChange, params, applyFilters } =
    useServerTable<Deal>({
      queryKey: dealKeys.list({}) as unknown as unknown[],
      queryFn: DealsService.dealsList,
    });

  const deleteMutation = useDeleteDeal();
  const patchMutation = usePatchDeal();

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
    // Invalidation is handled in mutation hook
  };

  const normalizeForeignKeyValue = (raw: unknown): number | null => {
    if (raw === null || raw === undefined || raw === '') return null;
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
    const asNumber = Number(raw);
    return Number.isFinite(asNumber) ? asNumber : null;
  };

  const handleInlineSave = async (record: Deal, dataIndex: string, value: any) => {
    if (!canManage) return;
    let normalizedValue = value;
    if (dataIndex === 'closing_date' && value?.format) {
      normalizedValue = value.format('YYYY-MM-DD');
    }
    if (dataIndex === 'amount' && value !== null && value !== undefined && value !== '') {
      normalizedValue = String(value);
    }
    if (dataIndex === 'stage' || dataIndex === 'owner') {
      normalizedValue = normalizeForeignKeyValue(value);
    }
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

  const stageOptions = React.useMemo(
    () =>
      (stagesData?.results || []).map((stage) => ({
        value: stage.id,
        label: getStageDisplayName(stage) || t('dealsCommon.fields.stage'),
      })),
    [stagesData],
  );

  const userOptions = React.useMemo(
    () =>
      (usersData?.results || []).map((user) => ({
        value: user.id,
        label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || t('dealsCommon.defaults.user'),
      })),
    [usersData],
  );

  const columns: ColumnsType<Deal> = [
    {
      title: t('dealsTable.columns.name'),
      dataIndex: 'name',
      key: 'name',
      width: isMobile ? 220 : 260,
      render: (text: string, record: Deal) => (
        <EditableCell
          value={text}
          record={record}
          dataIndex="name"
          editable={canManage}
          onSave={handleInlineSave}
          style={{ ...singleLineEllipsis, maxWidth: isMobile ? 170 : 220 }}
        />
      ),
    },
    {
      title: t('dealsTable.columns.amount'),
      dataIndex: 'amount',
      key: 'amount',
      responsive: ['sm'],
      width: 160,
      render: (amount: string, record: Deal) => (
        <EditableCell
          value={amount}
          record={record}
          dataIndex="amount"
          editable={canManage}
          type="number"
          onSave={handleInlineSave}
          renderView={(val: string | number | null | undefined) =>
            (record as any).currency_code && val ? formatCurrency(val, (record as any).currency_code) : '-'
          }
        />
      ),
    },
    {
      title: t('dealsTable.columns.stage'),
      dataIndex: 'stage',
      key: 'stage',
      width: 170,
      render: (stageId: number | null | undefined, record: Deal) => (
        <EditableCell
          value={stageId}
          record={record}
          dataIndex="stage"
          editable={canManage}
          type="select"
          options={stageOptions}
          onSave={handleInlineSave}
          saveOnBlur={false}
          placeholder={t('dealsCommon.fields.stage')}
          renderView={(val: number | null | undefined) => {
            const option = stageOptions.find((item) => String(item.value) === String(val));
            const text = option?.label || translateDealStageName(record.stage_name) || t('dealsCommon.defaults.noStage');
            return <Badge color={val ? 'blue' : 'default'} text={text} />;
          }}
          style={{ paddingInline: 0 }}
        />
      ),
    },
    {
      title: t('dealsTable.columns.probability'),
      dataIndex: 'probability',
      key: 'probability',
      responsive: ['md'],
      width: 130,
      render: (val: number, record: Deal) => (
        <EditableCell
          value={val}
          record={record}
          dataIndex="probability"
          editable={canManage}
          type="number"
          onSave={handleInlineSave}
          renderView={(viewVal: number | string | null | undefined) => (viewVal || viewVal === 0 ? `${viewVal}%` : '-')}
        />
      ),
    },
    {
      title: t('dealsTable.columns.company'),
      dataIndex: 'company_name',
      key: 'company_name',
      responsive: ['lg'],
      width: 190,
      render: (_name: string, record: any) => (
        <>
          {getCompanyDisplayName(record) ? (
            <Space style={{ minWidth: 0 }}>
              <BankOutlined style={{ color: '#888' }} />
              <span style={{ ...singleLineEllipsis, maxWidth: 150 }} title={getCompanyDisplayName(record)}>
                {getCompanyDisplayName(record)}
              </span>
            </Space>
          ) : (
            '-'
          )}
        </>
      ),
    },
    {
      title: t('dealsTable.columns.contacts'),
      dataIndex: 'contact_name',
      key: 'contact_name',
      responsive: ['lg'],
      width: 190,
      render: (name: string, record: any) => (
        <Space direction="vertical" size={0} style={{ minWidth: 0 }}>
          <span style={{ ...singleLineEllipsis, maxWidth: 170 }} title={name || '-'}>
            {name || '-'}
          </span>
          {record.contact_phone && (
            <small style={{ color: '#888', ...singleLineEllipsis, maxWidth: 170 }} title={record.contact_phone}>
              {record.contact_phone}
            </small>
          )}
        </Space>
      ),
    },
    {
      title: t('dealsTable.columns.owner'),
      dataIndex: 'owner',
      key: 'owner',
      responsive: ['xl'],
      width: 170,
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
          placeholder={t('dealsCommon.fields.owner')}
          renderView={(val: number | null | undefined) => {
            const option = userOptions.find((item) => String(item.value) === String(val));
            const name = option?.label || record.owner_name || '-';
            return (
              <Space style={{ minWidth: 0 }}>
                <UserOutlined />
                <span style={{ ...singleLineEllipsis, maxWidth: 130 }} title={name}>
                  {name}
                </span>
              </Space>
            );
          }}
          style={{ paddingInline: 0 }}
        />
      ),
    },
    {
      title: t('dealsTable.columns.closingDate'),
      dataIndex: 'closing_date',
      key: 'closing_date',
      responsive: ['xl'],
      width: 130,
      render: (date: string, record: Deal) => (
        <EditableCell
          value={date}
          record={record}
          dataIndex="closing_date"
          editable={canManage}
          type="date"
          onSave={handleInlineSave}
          renderView={(viewDate: string | null | undefined) => {
            if (!viewDate) return '-';
            const d = new Date(viewDate);
            return Number.isNaN(d.getTime()) ? '-' : formatDateByLocale(d);
          }}
        />
      ),
    },
    {
      title: t('dealsTable.columns.actions'),
      key: 'actions',
      fixed: 'right' as const,
      width: isMobile ? 148 : 170,
      render: (_: any, record: Deal) => (
        <Space>
          <Tooltip title={t('dealsTable.actions.view')}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              aria-label={t('dealsTable.actions.viewAria')}
              onClick={() => navigate(`/deals/${record.id}`)}
            />
          </Tooltip>
          {canManage ? (
            <Tooltip title={t('dealsTable.actions.edit')}>
              <Button
                size="small"
                icon={<EditOutlined />}
                aria-label={t('dealsTable.actions.editAria')}
                onClick={() => navigate(`/deals/${record.id}/edit`)}
              />
            </Tooltip>
          ) : (
            <Tooltip title={t('dealsTable.actions.noPermissions')}>
              <Button size="small" icon={<EditOutlined />} aria-label={t('dealsTable.actions.editAria')} disabled />
            </Tooltip>
          )}
          {canManage ? (
            <Popconfirm
              title={t('dealsTable.actions.deleteConfirm')}
              onConfirm={() => handleDelete(record.id)}
              okText={t('common.yes')}
              cancelText={t('common.no')}
            >
              <Button
                size="small"
                icon={<DeleteOutlined />}
                aria-label={t('dealsTable.actions.deleteAria')}
                danger
                loading={deleteMutation.isPending}
              />
            </Popconfirm>
          ) : (
            <Tooltip title={t('dealsTable.actions.noPermissions')}>
              <Button size="small" icon={<DeleteOutlined />} aria-label={t('dealsTable.actions.deleteAria')} danger disabled />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <DealsTableFilters
        filters={params}
        onChange={(nextFilters) => applyFilters(nextFilters as Record<string, unknown>)}
        onRefresh={() => refetch()}
        loading={isLoading || isFetching}
      />
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('dealsTable.messages.loadError')}
          action={<Button size="small" onClick={() => refetch()}>{t('actions.retry')}</Button>}
        />
      )}
      <Table
        dataSource={data}
        loading={isLoading || isFetching}
        size="small"
        pagination={pagination}
        onChange={handleTableChange}
        rowKey="id"
        columns={columns}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};
