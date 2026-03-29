import type { Deal, DealListParams } from '@/entities/deal';
import { dealKeys } from '@/entities/deal/api/keys';
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

export const DealsRejectionsView: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

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
      const reason = getRejectedReason(deal);
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

  const columns: ColumnsType<Deal> = [
    {
      title: 'Сделка',
      dataIndex: 'name',
      key: 'name',
      width: isMobile ? 220 : 280,
      render: (name: string, record: Deal) => (
        <a onClick={() => navigate(`/deals/${record.id}`)}>{name}</a>
      ),
    },
    {
      title: 'Этап / статус',
      key: 'stage',
      width: 190,
      render: (_: unknown, record: Deal) => {
        const status = String((record as any).status || '').trim();
        return (
          <Space direction="vertical" size={2}>
            <Badge color="error" text={record.stage_name || '-'} />
            {status ? <span style={{ fontSize: 12, opacity: 0.75 }}>{status}</span> : null}
          </Space>
        );
      },
    },
    {
      title: 'Причина',
      key: 'reason',
      width: 180,
      render: (_: unknown, record: Deal) => getRejectedReason(record),
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      width: 160,
      render: (amount: string, record: Deal) => {
        const currencyCode = (record as any).currency_code || (record as any).currency_name;
        return currencyCode ? formatCurrency(amount, currencyCode) : '-';
      },
    },
    {
      title: 'Ответственный',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 170,
      responsive: ['lg'],
      render: (name: string) => name || '-',
    },
    {
      title: 'Дата закрытия',
      dataIndex: 'closing_date',
      key: 'closing_date',
      width: 150,
      render: (value: string) => {
        if (!value) return '-';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ru-RU');
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 140,
      fixed: 'right' as const,
      render: (_: unknown, record: Deal) => (
        <Space>
          <Tooltip title="Открыть">
            <Button icon={<EyeOutlined />} onClick={() => navigate(`/deals/${record.id}`)} />
          </Tooltip>
          <Tooltip title={readOnly ? 'Недостаточно прав' : 'Редактировать'}>
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
        <Statistic title="Отказов (в выборке)" value={rejectedDeals.length} prefix={<StopOutlined />} />
        <Statistic title="Сумма отказов" value={totalRejectedAmount} precision={2} />
        <Statistic title="Топ причина" value={topReason} />
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
          message="Не удалось загрузить список сделок"
          action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
        />
      ) : null}

      {isTruncated ? (
        <Alert
          type="info"
          showIcon
          message={`Показаны первые ${(Array.isArray(data) ? data.length : 0)} из ${total} сделок. Для полного анализа отказов уточните фильтры.`}
        />
      ) : null}

      {!isLoading && !rejectedDeals.length ? (
        <Empty
          description="В текущей выборке отказов не найдено"
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
