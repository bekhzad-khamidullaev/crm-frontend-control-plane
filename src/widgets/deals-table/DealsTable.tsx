import React from 'react';
import { Table, Space, Button, Popconfirm, Badge, Tooltip } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useServerTable } from '@/shared/hooks';
import { DealsService } from '@/shared/api/generated/services/DealsService';
import { dealKeys } from '@/entities/deal/api/keys';
import { useDeleteDeal } from '@/entities/deal/api/mutations';
import { Deal } from '@/entities/deal';
import { DealsTableFilters } from './ui/DealsTableFilters';
// @ts-ignore
import { navigate } from '@/router.js';

export const DealsTable: React.FC = () => {
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

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Deal) => (
        <a onClick={() => navigate(`/deals/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string, record: Deal) => (
        <span>
          {amount ? Number(amount).toLocaleString('ru-RU') : '0'}{' '}
          {(record as any).currency_name || ''}
        </span>
      ),
    },
    {
      title: 'Стадия',
      dataIndex: 'stage_name',
      key: 'stage_name',
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
      render: (val: number) => (val ? `${val}%` : '-'),
    },
    {
      title: 'Компания',
      dataIndex: 'company_name',
      key: 'company_name',
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
      render: (date: string) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('ru-RU');
      },
    },
    {
      title: 'Действия',
      key: 'actions',
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
        pagination={pagination}
        onChange={handleTableChange}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1200 }}
      />
    </div>
  );
};
