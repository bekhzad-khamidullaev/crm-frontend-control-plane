import type { Deal, DealListParams } from '@/entities/deal';
import { dealKeys } from '@/entities/deal/api/keys';
import { usePatchDeal } from '@/entities/deal/api/mutations';
// @ts-ignore
import EditableCell from '@/components/editable-cell';
import { useStages, useUsers } from '@/features/reference';
import { DealsService } from '@/shared/api/generated/services/DealsService';
import { useServerTable } from '@/shared/hooks';
import { EditOutlined, EyeOutlined, StopOutlined } from '@ant-design/icons';
import { Alert, Badge, Button, Empty, Grid, Space, Statistic, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo } from 'react';
import { DealsTableFilters } from '@/widgets/deals-table/ui/DealsTableFilters';
// @ts-ignore
import { navigate } from '@/router.js';
// @ts-ignore
import { formatCurrency } from '@/lib/utils/format.js';
import { getRejectedReason, isDealRejected, toNumberSafe } from './model/rejectionHelpers';
import { t } from '@/lib/i18n';
import { formatDateByLocale, getStageDisplayName, translateDealStageName } from '@/widgets/deals-table/model/i18n';

export const DealsRejectionsView: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const patchDeal = usePatchDeal();
  const { data: stagesData } = useStages();
  const { data: usersData } = useUsers();

  const {
    data,
    total,
    error,
    isLoading,
    isFetching,
    refetch,
    pagination,
    params,
    applyFilters,
    handleTableChange,
  } = useServerTable<Deal>({
    queryKey: dealKeys.lists() as unknown as unknown[],
    queryFn: (queryParams) => DealsService.dealsList(queryParams as any),
    initialPageSize: 200,
  });

  const rejectedDeals = useMemo(() => {
    const source = Array.isArray(data) ? data : [];
    return source.filter(isDealRejected);
  }, [data]);

  const totalRejectedAmount = useMemo(
    () => rejectedDeals.reduce((acc, deal) => acc + toNumberSafe(deal.amount), 0),
    [rejectedDeals],
  );

  const topReason = useMemo(() => {
    if (!rejectedDeals.length) return '-';
    const buckets = new Map<string, number>();
    rejectedDeals.forEach((deal) => {
      const reason = getRejectedReason(deal, t);
      buckets.set(reason, (buckets.get(reason) || 0) + 1);
    });
    let winner = '-';
    let maxCount = 0;
    buckets.forEach((count, reason) => {
      if (count > maxCount) {
        maxCount = count;
        winner = reason;
      }
    });
    return winner;
  }, [rejectedDeals]);

  const isTruncated = total > (Array.isArray(data) ? data.length : 0);

  const stageOptions = useMemo(
    () =>
      (stagesData?.results || []).map((stage) => ({
        value: stage.id,
        label: getStageDisplayName(stage) || t('dealsCommon.fields.stage'),
      })),
    [stagesData],
  );

  const userOptions = useMemo(
    () =>
      (usersData?.results || []).map((user) => ({
        value: user.id,
        label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || t('dealsCommon.defaults.user'),
      })),
    [usersData],
  );

  const normalizeForeignKeyValue = (raw: unknown): number | null => {
    if (raw === null || raw === undefined || raw === '') return null;
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
    const asNumber = Number(raw);
    return Number.isFinite(asNumber) ? asNumber : null;
  };

  const handleInlineSave = async (record: Deal, dataIndex: string, value: any) => {
    if (readOnly) return;
    const normalizedValue =
      dataIndex === 'stage' || dataIndex === 'owner' ? normalizeForeignKeyValue(value) : value;
    await patchDeal.mutateAsync({
      id: record.id,
      data: { [dataIndex]: normalizedValue } as any,
    });
    await refetch();
  };

  const columns: ColumnsType<Deal> = [
    {
      title: t('dealsRejections.columns.deal'),
      dataIndex: 'name',
      key: 'name',
      width: isMobile ? 220 : 280,
      render: (name: string, record: Deal) => (
        <a onClick={() => navigate(`/deals/${record.id}`)}>{name}</a>
      ),
    },
    {
      title: t('dealsRejections.columns.stageStatus'),
      key: 'stage',
      width: 190,
      render: (_: unknown, record: Deal) => {
        const status = String((record as any).status || '').trim();
        return (
          <Space direction="vertical" size={2}>
            <EditableCell
              value={record.stage}
              record={record}
              dataIndex="stage"
              editable={!readOnly}
              type="select"
              options={stageOptions}
              onSave={handleInlineSave}
              saveOnBlur={false}
              renderView={(val: number | null | undefined) => {
                const option = stageOptions.find((item) => String(item.value) === String(val));
                return <Badge color="error" text={option?.label || translateDealStageName(record.stage_name) || '-'} />;
              }}
              style={{ paddingInline: 0 }}
            />
            {status ? <span style={{ fontSize: 12, opacity: 0.75 }}>{translateDealStageName(status)}</span> : null}
          </Space>
        );
      },
    },
    {
      title: t('dealsRejections.columns.reason'),
      key: 'reason',
      width: 180,
      render: (_: unknown, record: Deal) => getRejectedReason(record, t),
    },
    {
      title: t('dealsRejections.columns.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 160,
      render: (amount: string, record: Deal) => {
        const currencyCode = (record as any).currency_code || (record as any).currency_name;
        return currencyCode ? formatCurrency(amount, currencyCode) : '-';
      },
    },
    {
      title: t('dealsRejections.columns.owner'),
      dataIndex: 'owner',
      key: 'owner',
      width: 170,
      responsive: ['lg'],
      render: (ownerId: number | null | undefined, record: any) => (
        <EditableCell
          value={ownerId}
          record={record}
          dataIndex="owner"
          editable={!readOnly}
          type="select"
          options={userOptions}
          onSave={handleInlineSave}
          saveOnBlur={false}
          renderView={(val: number | null | undefined) => {
            const option = userOptions.find((item) => String(item.value) === String(val));
            return option?.label || record.owner_name || '-';
          }}
          style={{ paddingInline: 0 }}
        />
      ),
    },
    {
      title: t('dealsRejections.columns.closingDate'),
      dataIndex: 'closing_date',
      key: 'closing_date',
      width: 150,
      render: (value: string) => {
        if (!value) return '-';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : formatDateByLocale(date);
      },
    },
    {
      title: t('dealsRejections.columns.actions'),
      key: 'actions',
      width: 140,
      fixed: 'right' as const,
      render: (_: unknown, record: Deal) => (
        <Space>
          <Tooltip title={t('dealsRejections.actions.open')}>
            <Button icon={<EyeOutlined />} onClick={() => navigate(`/deals/${record.id}`)} />
          </Tooltip>
          <Tooltip title={readOnly ? t('dealsRejections.actions.noPermissions') : t('dealsRejections.actions.edit')}>
            <Button
              icon={<EditOutlined />}
              disabled={readOnly}
              onClick={() => navigate(`/deals/${record.id}/edit`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space size={16} wrap>
        <Statistic title={t('dealsRejections.stats.rejectionsInSample')} value={rejectedDeals.length} prefix={<StopOutlined />} />
        <Statistic title={t('dealsRejections.stats.rejectionsAmount')} value={totalRejectedAmount} precision={2} />
        <Statistic title={t('dealsRejections.stats.topReason')} value={topReason} />
      </Space>

      <DealsTableFilters
        filters={params as DealListParams}
        onChange={(nextFilters) => applyFilters(nextFilters as Record<string, unknown>)}
        onRefresh={() => refetch()}
        loading={isLoading || isFetching}
      />

      {error ? (
        <Alert
          type="error"
          showIcon
          message={t('dealsRejections.messages.loadError')}
          action={<Button size="small" onClick={() => refetch()}>{t('actions.retry')}</Button>}
        />
      ) : null}

      {isTruncated ? (
        <Alert
          type="info"
          showIcon
          message={t('dealsRejections.messages.truncated', {
            loaded: Array.isArray(data) ? data.length : 0,
            total,
          })}
        />
      ) : null}

      {!isLoading && !rejectedDeals.length ? (
        <Empty
          description={t('dealsRejections.messages.empty')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table
          rowKey="id"
          dataSource={rejectedDeals}
          columns={columns}
          loading={isLoading || isFetching}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: isMobile ? 980 : 1240 }}
        />
      )}
    </Space>
  );
};

export default DealsRejectionsView;
