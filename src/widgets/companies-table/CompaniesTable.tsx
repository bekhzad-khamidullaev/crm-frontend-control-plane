import { companyKeys } from '@/entities/company/api/keys';
import { useDeleteCompany } from '@/entities/company/api/mutations';
import type { Company } from '@/entities/company/model/types';
// @ts-ignore
import { CompaniesService } from '@/shared/api/generated/services/CompaniesService';
import { useServerTable } from '@/shared/hooks';
import { StatusTag } from '@/shared/ui';
import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    GlobalOutlined,
    MailOutlined,
    PhoneOutlined,
    ShopOutlined
} from '@ant-design/icons';
import { Avatar, Button, Popconfirm, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';
import { CompaniesTableFilters } from './ui/CompaniesTableFilters';

// Import existing CallButton (temporarily using any to bypass TS checks during migration)
// @ts-ignore
import CallButton from '@/components/CallButton';
import { navigate } from '@/router.js';

export const CompaniesTable: React.FC = () => {
  // Use shared hook for server-side table logic
  const {
    data,
    isLoading,
    pagination,
    handleTableChange,
    handleFilterChange,
  } = useServerTable<Company>({
    queryKey: companyKeys.lists() as unknown as unknown[],
    queryFn: (params) => CompaniesService.companiesList(params as any),
  });

  const deleteMutation = useDeleteCompany();

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleFiltersApply = (filters: Record<string, unknown>) => {
    // Process filters from the filter component
    Object.entries(filters).forEach(([key, value]) => {
      handleFilterChange(key, value);
    });
  };

  const columns: ColumnsType<Company> = [
    {
      title: 'Компания',
      key: 'company',
      sorter: true,
      render: (_, record) => (
        <Space>
          <Avatar icon={<ShopOutlined />} style={{ backgroundColor: '#52c41a' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.full_name}</div>
            {Array.isArray(record.industry) && record.industry.length > 0 && (
              <div style={{ fontSize: 12, color: '#999' }}>
                 ID: {record.industry.join(', ')} {/* Ideally map IDs to names if not available in record */}
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
        <Space direction="vertical" size="small">
          {record.email && (
            <Space size="small">
              <MailOutlined style={{ color: '#999' }} />
              <a href={`mailto:${record.email}`}>{record.email}</a>
            </Space>
          )}
          {record.phone && (
            <Space size="small">
              <PhoneOutlined style={{ color: '#999' }} />
              <a href={`tel:${record.phone}`}>{record.phone}</a>
            </Space>
          )}
          {record.website && (
            <Space size="small">
              <GlobalOutlined style={{ color: '#999' }} />
              <a href={record.website} target="_blank" rel="noopener noreferrer">
                Сайт
              </a>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type) => type ? <StatusTag status="info" text={`Тип #${type}`} /> : '-',
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
      width: 250,
      render: (_, record) => (
        <Space size="small" wrap>
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
            icon={<EyeOutlined />}
            onClick={() => navigate(`/companies/${record.id}`)}
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/companies/${record.id}/edit`)}
          />
          <Popconfirm
            title="Удалить эту компанию?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <CompaniesTableFilters
        onFilterChange={handleFiltersApply}
        loading={isLoading}
      />

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={isLoading}
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
      />
    </div>
  );
};
