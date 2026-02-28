import { Deal } from '@/entities/deal';
import { dealKeys } from '@/entities/deal/api/keys';
import { useDeleteDeal } from '@/entities/deal/api/mutations';
import { DealsService } from '@/shared/api/generated/services/DealsService';
import { useServerTable } from '@/shared/hooks';
import {
    BankOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Badge, Button, Grid, Popconfirm, Space, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';
import { DealsTableFilters } from './ui/DealsTableFilters';
// @ts-ignore
import { navigate } from '@/router.js';
// @ts-ignore
import { formatCurrency } from '@/lib/utils/format.js';

export const DealsTable: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const { data, isLoading, pagination, handleTableChange, params, handleFilterChange } =
    useServerTable<Deal>({
      queryKey: dealKeys.list({}) as unknown as unknown[],
      queryFn: DealsService.dealsList,
    });

  const deleteMutation = useDeleteDeal();

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
    // Invalidation is handled in mutation hook
  };

  const columns: ColumnsType<Deal> = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      width: isMobile ? 220 : 260,
      render: (text: string, record: Deal) => (
        <a onClick={() => navigate(`/deals/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      responsive: ['sm'],
      width: 160,
      render: (amount: string, record: Deal) => (
        <span>{formatCurrency(amount, (record as any).currency_name || 'RUB')}</span>
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
          text={stageName || (record.stage ? `Этап #${record.stage}` : '-')}
        />
      ),
    },
    {
      title: 'Вероятность',
      dataIndex: 'probability',
      key: 'probability',
      responsive: ['md'],
      width: 130,
      render: (val: number) => (val ? `${val}%` : '-'),
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
            <Space>
              <BankOutlined style={{ color: '#888' }} />
              {record.company_name}
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
        <Space direction="vertical" size={0}>
          <span>{name || '-'}</span>
          {record.contact_phone && <small style={{ color: '#888' }}>{record.contact_phone}</small>}
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
        <Space>
          <UserOutlined />
          {name || '-'}
        </Space>
      ),
    },
    {
      title: 'Дата закрытия',
      dataIndex: 'closing_date',
      key: 'closing_date',
      responsive: ['xl'],
      width: 130,
      render: (date: string) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('ru-RU');
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      fixed: 'right' as const,
      width: isMobile ? 152 : 180,
      render: (_: any, record: Deal) => (
        <Space>
          <Tooltip title="Просмотр">
            <Button icon={<EyeOutlined />} onClick={() => navigate(`/deals/${record.id}`)} />
          </Tooltip>
          <Tooltip title="Редактировать">
            <Button icon={<EditOutlined />} onClick={() => navigate(`/deals/${record.id}/edit`)} />
          </Tooltip>
          <Popconfirm
            title="Удалить сделку?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button icon={<DeleteOutlined />} danger loading={deleteMutation.isPending} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <DealsTableFilters filters={params} onFilterChange={handleFilterChange} />
      <Table
        dataSource={data}
        loading={isLoading}
        size={isMobile ? 'small' : 'middle'}
        pagination={pagination}
        onChange={handleTableChange}
        rowKey="id"
        columns={columns}
        scroll={{ x: isMobile ? 760 : 1200 }}
      />
    </div>
  );
};
