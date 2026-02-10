import React from 'react';
import { Table, Space, Button, Popconfirm, Avatar } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined
} from '@ant-design/icons';
import { useServerTable } from '@/shared/hooks';
import { ContactsService } from '@/shared/api/generated/services/ContactsService';
import { contactKeys } from '@/entities/contact/api/keys';
import { useDeleteContact } from '@/entities/contact/api/mutations';
import { ContactsTableFilters } from './ui/ContactsTableFilters';
import type { Contact } from '@/entities/contact/model/types';
import type { ColumnsType } from 'antd/es/table';

// @ts-ignore
import CallButton from '@/components/CallButton'; // Legacy
import { navigate } from '@/router.js';

export const ContactsTable: React.FC = () => {
  const {
    data,
    isLoading,
    pagination,
    handleTableChange,
    handleFilterChange,
  } = useServerTable<Contact>({
    queryKey: contactKeys.lists() as unknown as unknown[],
    queryFn: (params) => ContactsService.contactsList(params as any),
  });

  const deleteMutation = useDeleteContact();

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      // Error handled
    }
  };

  const handleFiltersApply = (filters: Record<string, unknown>) => {
    Object.entries(filters).forEach(([key, value]) => {
      handleFilterChange(key, value);
    });
  };

  const columns: ColumnsType<Contact> = [
    {
      title: 'Контакт',
      key: 'contact',
      sorter: true,
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.full_name}</div>
            {record.title && (
              <div style={{ fontSize: 12, color: '#999' }}>
                {record.title}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Связь',
      key: 'communication',
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
        </Space>
      ),
    },
    {
      title: 'Компания',
      dataIndex: 'company',
      key: 'company',
      render: (companyId: number) => companyId ? (
        // Ideally fetch company name or store in Redux/Cache. For now linking by ID.
        // Or could fetch company name if API included it.
        // The API model has `company` as number.
        <Button type="link" size="small" icon={<BankOutlined />} onClick={() => navigate(`/companies/${companyId}`)}>
           #{companyId}
        </Button>
      ) : '-',
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
      width: 200,
      render: (_, record) => (
        <Space size="small" wrap>
          <CallButton
            phone={record.phone}
            name={record.full_name}
            entityType="contact"
            entityId={record.id}
            size="small"
            type="primary"
          />
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/contacts/${record.id}`)}
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/contacts/${record.id}/edit`)}
          />
          <Popconfirm
            title="Удалить контакт?"
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
      <ContactsTableFilters
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
