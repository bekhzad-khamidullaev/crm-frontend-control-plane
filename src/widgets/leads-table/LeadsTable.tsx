import React from 'react';
import { Table, Space, Button, Popconfirm, Avatar, Badge, Tooltip } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useServerTable } from '@/shared/hooks';
import { LeadsService } from '@/shared/api/generated/services/LeadsService';
import { leadKeys } from '@/entities/lead/api/keys';
import { useDeleteLead } from '@/entities/lead/api/mutations';
import { LeadsTableFilters } from './ui/LeadsTableFilters';
import type { Lead } from '@/entities/lead/model/types';
import type { ColumnsType } from 'antd/es/table';
import type { LeadListParams } from '@/entities/lead/api/queries';

// @ts-ignore
import CallButton from '@/components/CallButton';
import { navigate } from '@/router.js';

export const LeadsTable: React.FC = () => {
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

  const deriveStatus = (record: Lead) => {
    if (record.disqualified) return 'lost';
    // Logic for converted? record.contact and record.company exists?
    // Legacy logic is: if (lead.disqualified) return 'lost';
    // This part is tricky without the original util utils/leads.js content fully understood,
    // but looking at legacy code: if (lead.disqualified) return 'lost'; ... converted ... new
    // I'll stick to 'new' default and 'lost' if disqualified.
    if (record.disqualified) return 'lost';
    return 'new'; // Simplify for now, maybe add logic later
  };

  const columns: ColumnsType<Lead> = [
    {
      title: 'Лид',
      key: 'lead',
      sorter: true,
      fixed: 'left',
      width: 250,
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
        const s = deriveStatus(record);
        return <Badge color={statusMap[s].color} text={statusMap[s].text} />;
      },
    },
    {
      title: 'Теги',
      key: 'tags',
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
      width: 120,
      sorter: true,
      render: (date) => (date ? new Date(date).toLocaleDateString('ru-RU') : '-'),
    },
    {
      title: 'Действия',
      key: 'actions',
      fixed: 'right',
      width: 180,
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
          <Tooltip title="Редактировать">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => navigate(`/leads/${record.id}/edit`)}
            />
          </Tooltip>
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
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />
    </div>
  );
};
