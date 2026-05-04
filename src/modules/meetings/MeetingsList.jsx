import { CalendarOutlined, DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { BusinessEntityListShell } from '../../components/business/BusinessEntityListShell';
import { deleteMeeting, getMeetings } from '../../lib/api/meetings.js';
import { canWrite, hasAnyFeature } from '../../lib/rbac.js';
import { navigate } from '../../router.js';
import { EntityListToolbar } from '../../shared/ui/EntityListToolbar';
import { BusinessFeatureGateNotice } from '../../components/business/BusinessFeatureGateNotice';

const { Text } = Typography;

const statusMeta = {
  scheduled: { color: 'processing', label: 'Запланирована' },
  completed: { color: 'success', label: 'Завершена' },
  cancelled: { color: 'error', label: 'Отменена' },
};

const formatMeta = {
  offline: 'Оффлайн',
  online: 'Онлайн',
  call: 'Звонок',
};

export default function MeetingsList() {
  const { message } = App.useApp();
  const canReadFeature = hasAnyFeature('tasks.reminders');
  const canManage = canWrite('crm.change_meeting');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const loadRows = async (page = 1, searchValue = search, pageSize = pagination.pageSize) => {
    if (!canReadFeature) return;
    setLoading(true);
    try {
      const response = await getMeetings({
        page,
        page_size: pageSize,
        search: searchValue || undefined,
        ordering: '-start_at',
      });
      setRows(response?.results || []);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: response?.count || 0 }));
    } catch {
      message.error('Не удалось загрузить встречи');
      setRows([]);
      setPagination((prev) => ({ ...prev, current: 1, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadFeature) loadRows(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReadFeature]);

  const handleDelete = async (id) => {
    try {
      await deleteMeeting(id);
      message.success('Встреча удалена');
      loadRows(pagination.current);
    } catch {
      message.error('Не удалось удалить встречу');
    }
  };

  if (!canReadFeature) {
    return (
      <BusinessEntityListShell title="Встречи" subtitle="Полноценный CRUD по встречам и follow-up">
        <BusinessFeatureGateNotice
          featureCode="tasks.reminders"
          description="Для доступа к встречам включите модуль Reminders в лицензии."
        />
      </BusinessEntityListShell>
    );
  }

  return (
    <BusinessEntityListShell
      title="Встречи"
      subtitle="Полноценный CRUD по встречам и follow-up"
      extra={
        canManage ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/meetings/new')}>
            Создать встречу
          </Button>
        ) : null
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <EntityListToolbar
            searchValue={search}
            searchPlaceholder="Поиск по теме, описанию, локации"
            onSearchChange={(value) => {
              setSearch(value);
              loadRows(1, value);
            }}
            onRefresh={() => loadRows(pagination.current, search)}
            onReset={() => {
              setSearch('');
              loadRows(1, '');
            }}
            loading={loading}
            resultSummary={`Всего: ${pagination.total}`}
            activeFilters={
              search
                ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => { setSearch(''); loadRows(1, ''); } }]
                : []
            }
          />

          <Table
            rowKey="id"
            loading={loading}
            dataSource={rows}
            pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `Всего: ${total}` }}
            onChange={(nextPagination) => loadRows(nextPagination.current, search, nextPagination.pageSize)}
            columns={[
              {
                title: 'Встреча',
                key: 'subject',
                render: (_, record) => (
                  <Space direction="vertical" size={0}>
                    <Text strong>
                      <CalendarOutlined /> {record.subject || '-'}
                    </Text>
                    <Text type="secondary">{record.start_at ? dayjs(record.start_at).format('DD.MM.YYYY HH:mm') : '-'}</Text>
                  </Space>
                ),
              },
              { title: 'Компания', dataIndex: 'company_name', key: 'company_name', render: (value) => value || '-' },
              { title: 'Контакт', dataIndex: 'contact_name', key: 'contact_name', render: (value) => value || '-' },
              {
                title: 'Формат',
                dataIndex: 'format',
                key: 'format',
                render: (value) => formatMeta[String(value || '').toLowerCase()] || value || '-',
              },
              {
                title: 'Статус',
                dataIndex: 'status',
                key: 'status',
                render: (value) => {
                  const meta = statusMeta[String(value || '').toLowerCase()] || { color: 'default', label: value || '-' };
                  return <Tag color={meta.color}>{meta.label}</Tag>;
                },
              },
              {
                title: 'Действия',
                key: 'actions',
                width: 280,
                render: (_, record) => (
                  <Space>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/meetings/${record.id}`)}>
                      Просмотр
                    </Button>
                    {canManage ? (
                      <>
                        <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/meetings/${record.id}/edit`)}>
                          Редактировать
                        </Button>
                        <Popconfirm
                          title="Удалить встречу?"
                          description="Действие нельзя отменить"
                          onConfirm={() => handleDelete(record.id)}
                          okText="Удалить"
                          cancelText="Отмена"
                          okButtonProps={{ danger: true }}
                        >
                          <Button size="small" danger icon={<DeleteOutlined />}>
                            Удалить
                          </Button>
                        </Popconfirm>
                      </>
                    ) : null}
                  </Space>
                ),
              },
            ]}
          />
      </Space>
    </BusinessEntityListShell>
  );
}
