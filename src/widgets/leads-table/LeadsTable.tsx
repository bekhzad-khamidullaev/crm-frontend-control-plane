import { leadKeys } from '@/entities/lead/api/keys';
import { useDeleteLead, usePatchLead } from '@/entities/lead/api/mutations';
import type { LeadListParams } from '@/entities/lead/api/queries';
import type { Lead } from '@/entities/lead/model/types';
import { deriveLeadStatus } from '@/entities/lead/model/utils';
// @ts-ignore
import EditableCell from '@/components/ui-EditableCell';
import { useTags } from '@/features/reference';
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
import { Alert, Avatar, Badge, Button, Grid, Popconfirm, Space, Table, Tag, Tooltip } from 'antd';
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
  const { data: tagsData } = useTags();

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    pagination,
    handleTableChange,
    applyFilters,
    params: filters,
  } = useServerTable<Lead>({
    queryKey: leadKeys.lists() as unknown as unknown[],
    queryFn: (params) => LeadsService.leadsList(params as any),
  });

  // Cast filters to LeadListParams to match prop type
  const listFilters = (filters || {}) as LeadListParams;

  const deleteMutation = useDeleteLead();
  const patchMutation = usePatchLead();

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInlineSave = async (record: Lead, dataIndex: string, value: any) => {
    if (!canManage) return;
    await patchMutation.mutateAsync({
      id: record.id,
      data: { [dataIndex]: value } as any,
    });
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    new: { color: 'blue', text: 'Новый' },
    contacted: { color: 'gold', text: 'Связались' },
    qualified: { color: 'purple', text: 'Квалифицирован' },
    converted: { color: 'green', text: 'Конвертирован' },
    lost: { color: 'red', text: 'Потерян' },
  };

  const tagsMap = React.useMemo(() => {
    const map = new Map<number, string>();
    (tagsData?.results || []).forEach((tag) => {
      map.set(tag.id, tag.name || '-');
    });
    return map;
  }, [tagsData]);

  const singleLineEllipsis: React.CSSProperties = {
    display: 'block',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{ ...singleLineEllipsis, fontWeight: 500, maxWidth: isMobile ? 130 : 170 }}
              title={record.full_name}
            >
              {record.full_name}
            </div>
            {record.company_name && (
              <div
                style={{
                  fontSize: 12,
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  minWidth: 0,
                }}
              >
                <BankOutlined />
                <EditableCell
                  value={record.company_name}
                  record={record}
                  dataIndex="company_name"
                  editable={canManage}
                  onSave={handleInlineSave}
                  style={{ ...singleLineEllipsis, maxWidth: isMobile ? 120 : 160 }}
                />
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
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <Space size={4} style={{ width: '100%' }}>
            <MailOutlined style={{ color: '#999' }} />
            <EditableCell
              value={record.email}
              record={record}
              dataIndex="email"
              editable={canManage}
              onSave={handleInlineSave}
              placeholder="email@example.com"
              style={{ ...singleLineEllipsis, flex: 1, maxWidth: 170 }}
            />
          </Space>
          <Space size={4} style={{ width: '100%' }}>
            <PhoneOutlined style={{ color: '#999' }} />
            <EditableCell
              value={record.phone}
              record={record}
              dataIndex="phone"
              editable={canManage}
              onSave={handleInlineSave}
              placeholder="+998 ..."
              style={{ ...singleLineEllipsis, flex: 1, maxWidth: 170 }}
            />
          </Space>
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
      title: 'SLA контакта',
      key: 'first_contact_sla',
      width: 150,
      responsive: ['md'],
      render: (_, record) => {
        const entity = record as any;
        const createdAtRaw = entity?.creation_date || entity?.create_date || entity?.created_at;
        const firstTouchRaw = entity?.was_in_touch || entity?.first_contact_at;
        const createdAt = createdAtRaw ? new Date(createdAtRaw) : null;
        const firstTouch = firstTouchRaw ? new Date(firstTouchRaw) : null;

        if (firstTouch && !Number.isNaN(firstTouch.getTime())) {
          return <Tag color="success">Контакт выполнен</Tag>;
        }
        if (!createdAt || Number.isNaN(createdAt.getTime())) {
          return <Tag>Нет данных</Tag>;
        }

        const hoursFromCreate = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursFromCreate >= 24) {
          return <Tag color="error">Просрочен</Tag>;
        }
        if (hoursFromCreate >= 18) {
          return <Tag color="warning">SLA риск</Tag>;
        }
        return <Tag color="processing">В срок</Tag>;
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
            <Badge key={tagId} count={tagsMap.get(tagId) || '-'} style={{ backgroundColor: '#52c41a' }} />
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
      width: isMobile ? 148 : 170,
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
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/leads/${record.id}`)}
            />
          </Tooltip>
          {canManage ? (
            <Tooltip title="Редактировать">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/leads/${record.id}/edit`)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Недостаточно прав">
              <Button type="link" size="small" icon={<EditOutlined />} disabled />
            </Tooltip>
          )}
          {canManage ? (
            <Popconfirm
              title="Удалить лид?"
              onConfirm={() => handleDelete(record.id)}
              okText="Да"
              cancelText="Нет"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deleteMutation.isPending}
              />
            </Popconfirm>
          ) : (
            <Tooltip title="Недостаточно прав">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <LeadsTableFilters
        filters={listFilters}
        onChange={(newFilters) => applyFilters(newFilters as Record<string, unknown>)}
        onRefresh={() => refetch()}
        loading={isLoading || isFetching}
      />
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Не удалось загрузить список лидов"
          action={<Button size="small" onClick={() => refetch()}>Повторить</Button>}
        />
      )}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={isLoading || isFetching}
        size="small"
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};
