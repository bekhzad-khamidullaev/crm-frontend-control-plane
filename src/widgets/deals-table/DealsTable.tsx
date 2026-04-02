import { Deal } from '@/entities/deal';
import { dealKeys } from '@/entities/deal/api/keys';
import { useDeleteDeal, usePatchDeal } from '@/entities/deal/api/mutations';
// @ts-ignore
import EditableCell from '@/components/editable-cell';
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
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';

export const DealsTable: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const canManage = canWrite();

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

  const handleInlineSave = async (record: Deal, dataIndex: string, value: any) => {
    if (!canManage) return;
    let normalizedValue = value;
    if (dataIndex === 'closing_date' && value?.format) {
      normalizedValue = value.format('YYYY-MM-DD');
    }
    if (dataIndex === 'amount' && value !== null && value !== undefined && value !== '') {
      normalizedValue = String(value);
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

  const columns: ColumnsType<Deal> = [
    {
      title: 'Название',
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
      title: 'Сумма',
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
      title: 'Стадия',
      dataIndex: 'stage_name',
      key: 'stage_name',
      width: 170,
      render: (stageName: string, record: Deal) => (
        <Badge
          color={record.stage ? 'blue' : 'default'}
          text={stageName || '-'}
        />
      ),
    },
    {
      title: 'Вероятность',
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
      title: 'Компания',
      dataIndex: 'company_name',
      key: 'company_name',
      responsive: ['lg'],
      width: 190,
      render: (_name: string, record: any) => (
        <>
          {record.company_name ? (
            <Space style={{ minWidth: 0 }}>
              <BankOutlined style={{ color: '#888' }} />
              <span style={{ ...singleLineEllipsis, maxWidth: 150 }} title={record.company_name}>
                {record.company_name}
              </span>
            </Space>
          ) : (
            '-'
          )}
        </>
      ),
    },
    {
      title: 'Контакты',
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
      title: 'Ответственный',
      dataIndex: 'owner_name',
      key: 'owner_name',
      responsive: ['xl'],
      width: 170,
      render: (name: string) => (
        <Space style={{ minWidth: 0 }}>
          <UserOutlined />
          <span style={{ ...singleLineEllipsis, maxWidth: 130 }} title={name || '-'}>
            {name || '-'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Дата закрытия',
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
            return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('ru-RU');
          }}
        />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      fixed: 'right' as const,
      width: isMobile ? 148 : 170,
      render: (_: any, record: Deal) => (
        <Space>
          <Tooltip title="Просмотр">
            <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/deals/${record.id}`)} />
          </Tooltip>
          {canManage ? (
            <Tooltip title="Редактировать">
              <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/deals/${record.id}/edit`)} />
            </Tooltip>
          ) : (
            <Tooltip title="Недостаточно прав">
              <Button size="small" icon={<EditOutlined />} disabled />
            </Tooltip>
          )}
          {canManage ? (
            <Popconfirm
              title="Удалить сделку?"
              onConfirm={() => handleDelete(record.id)}
              okText="Да"
              cancelText="Нет"
            >
              <Button size="small" icon={<DeleteOutlined />} danger loading={deleteMutation.isPending} />
            </Popconfirm>
          ) : (
            <Tooltip title="Недостаточно прав">
              <Button size="small" icon={<DeleteOutlined />} danger disabled />
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
          message="Не удалось загрузить список сделок"
          action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
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
