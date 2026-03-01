import { leadKeys } from '@/entities/lead/api/keys';
import { useDeleteLead } from '@/entities/lead/api/mutations';
import type { LeadListParams } from '@/entities/lead/api/queries';
import type { Lead } from '@/entities/lead/model/types';
import { deriveLeadStatus } from '@/entities/lead/model/utils';
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
import { Avatar, Badge, Button, Grid, Popconfirm, Space, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';
import { LeadsTableFilters } from './ui/LeadsTableFilters';

// @ts-ignore
import CallButton from '@/components/CallButton';
import { navigate } from '@/router.js';
// @ts-ignore
import { canWrite } from '@/lib/rbac.js';

export const LeadsTable: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const canManage = canWrite();

  const {
    data,
    isLoading,
    pagination,
    handleTableChange,
    handleFilterChange,
    params: filters,
  } = useServerTable<Lead>({
    queryKey: leadKeys.lists() as unknown as unknown[],
    queryFn: (params) => LeadsService.leadsList(params as any),
  });

  // Cast filters to LeadListParams to match prop type
  const listFilters = (filters || {}) as LeadListParams;

  const deleteMutation = useDeleteLead();

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error(error);
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    new: { color: 'blue', text: 'Новый' },
    converted: { color: 'green', text: 'Конвертирован' },
    lost: { color: 'red', text: 'Потерян' },
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
          <div>
            <div style={{ fontWeight: 500 }}>{record.full_name}</div>
            {record.company_name && (
              <div
                style={{
                  fontSize: 12,
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <BankOutlined /> {record.company_name}
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
        <Space direction="vertical" size={0}>
          {record.email && (
            <Space size={4}>
              <MailOutlined style={{ color: '#999' }} />
              <a href={`mailto:${record.email}`}>{record.email}</a>
            </Space>
          )}
          {record.phone && (
            <Space size={4}>
              <PhoneOutlined style={{ color: '#999' }} />
              <a href={`tel:${record.phone}`}>{record.phone}</a>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: 'Статус',
      key: 'status',
      width: 150,
      render: (_, record) => {
        const s = deriveLeadStatus(record);
        return <Badge color={statusMap[s].color} text={statusMap[s].text} />;
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
            <Badge key={tagId} count={tagId} style={{ backgroundColor: '#52c41a' }} />
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
      width: isMobile ? 152 : 180,
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
              icon={<EyeOutlined />}
              onClick={() => navigate(`/leads/${record.id}`)}
            />
          </Tooltip>
          {canManage && (
            <Tooltip title="Редактировать">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => navigate(`/leads/${record.id}/edit`)}
              />
            </Tooltip>
          )}
          {canManage && (
            <Popconfirm
              title="Удалить лид?"
              onConfirm={() => handleDelete(record.id)}
              okText="Да"
              cancelText="Нет"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                loading={deleteMutation.isPending}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <LeadsTableFilters
        filters={listFilters}
        onChange={(newFilters) => {
          // Mapping filters manually since useServerTable might handle it differently
          Object.entries(newFilters).forEach(([k, v]) => handleFilterChange(k, v));
        }}
      />
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={isLoading}
        size={isMobile ? 'small' : 'middle'}
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: isMobile ? 760 : 1200 }}
      />
    </div>
  );
};
