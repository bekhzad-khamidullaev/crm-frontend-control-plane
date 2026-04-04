import dayjs from 'dayjs';
import { CheckOutlined, EditOutlined, EyeOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, DatePicker, Modal, Select, Space, Table, Tag, Typography } from 'antd';

import EntitySelect from '../../components/EntitySelect.jsx';
import { getUser, getUsers } from '../../lib/api';
import {
  deleteReminder,
  getReminderContentTypes,
  getReminders,
  updateReminder
} from '../../lib/api/reminders';
import { canWrite } from '../../lib/rbac.js';
import { navigate } from '../../router';
import { EntityListToolbar } from '../../shared/ui/EntityListToolbar';
import { PageHeader } from '../../shared/ui/PageHeader';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export default function RemindersList() {
  const { message } = App.useApp();
  const canManage = canWrite('common.change_reminder');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [ownerFilter, setOwnerFilter] = useState(null);
  const [contentTypeFilter, setContentTypeFilter] = useState(null);
  const [contentTypeOptions, setContentTypeOptions] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, searchText, activeFilter, ownerFilter, contentTypeFilter, dateRange]);

  useEffect(() => {
    loadContentTypes();
  }, []);

  const loadContentTypes = async () => {
    try {
      const response = await getReminderContentTypes();
      const results = Array.isArray(response?.results) ? response.results : [];
      setContentTypeOptions(results.map((item) => ({ value: item.id, label: item.label || item.model || 'Type' })));
    } catch (fetchError) {
      setContentTypeOptions([]);
      console.error('Failed to load reminder content types', fetchError);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
        active: typeof activeFilter === 'boolean' ? activeFilter : undefined,
        owner: ownerFilter || undefined,
        content_type: contentTypeFilter || undefined,
        ordering: '-reminder_date',
      };
      const res = await getReminders(params);
      const results = res.results || [];

      const filteredByDate = dateRange && dateRange.length === 2
        ? results.filter((item) => {
            if (!item.reminder_date) return false;
            const date = dayjs(item.reminder_date);
            return date.isAfter(dayjs(dateRange[0]).startOf('day')) && date.isBefore(dayjs(dateRange[1]).endOf('day'));
          })
        : results;

      setData(filteredByDate);
      setPagination((prev) => ({ ...prev, total: res.count || filteredByDate.length }));
    } catch (fetchError) {
      setError(fetchError?.message || 'Не удалось загрузить напоминания');
      message.error('Не удалось загрузить напоминания');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReminder(id);
      message.success('Напоминание удалено');
      fetchData();
    } catch {
      message.error('Не удалось удалить напоминание');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await updateReminder(id, { active: !currentActive });
      message.success(!currentActive ? 'Напоминание активировано' : 'Напоминание деактивировано');
      fetchData();
    } catch {
      message.error('Не удалось обновить напоминание');
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  };

  const handleResetFilters = () => {
    setSearchText('');
    setActiveFilter(null);
    setOwnerFilter(null);
    setContentTypeFilter(null);
    setDateRange(null);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const columns = useMemo(
    () => [
      {
        title: 'Тема',
        dataIndex: 'subject',
        key: 'subject',
        render: (subject) => <Text strong>{subject}</Text>,
      },
      {
        title: 'Дата напоминания',
        dataIndex: 'reminder_date',
        key: 'reminder_date',
        render: (date) => {
          if (!date) return '-';
          const reminderDate = dayjs(date);
          const isPast = reminderDate.isBefore(dayjs());
          return (
            <Text type={isPast ? 'danger' : undefined}>
              {reminderDate.format('DD.MM.YYYY HH:mm')}
              {isPast ? ' (Просрочено)' : ''}
            </Text>
          );
        },
      },
      {
        title: 'Статус',
        dataIndex: 'active',
        key: 'active',
        render: (active) => <Tag color={active ? 'green' : 'default'}>{active ? 'Активно' : 'Неактивно'}</Tag>,
      },
      {
        title: 'Тип объекта',
        dataIndex: 'content_type',
        key: 'content_type',
        render: (value) => value ?? '-',
      },
      {
        title: 'Связанный объект',
        dataIndex: 'object_id',
        key: 'object_id',
        render: (value) => value ?? '-',
      },
      {
        title: 'Владелец',
        dataIndex: 'owner_name',
        key: 'owner_name',
        render: (ownerName) => ownerName || '-',
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 320,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EyeOutlined size={14} />} onClick={() => navigate(`/reminders/${record.id}`)}>
              Открыть
            </Button>
            {canManage ? (
              <>
                <Button size="small" icon={<EditOutlined size={14} />} onClick={() => navigate(`/reminders/${record.id}/edit`)}>
                  Ред.
                </Button>
                <Button size="small" icon={record.active ? <CloseOutlined size={14} /> : <CheckOutlined size={14} />} onClick={() => handleToggleActive(record.id, record.active)}>
                  {record.active ? 'Откл.' : 'Вкл.'}
                </Button>
                <Button size="small" danger icon={<DeleteOutlined size={14} />} onClick={() => setConfirmDelete(record)}>
                  Удалить
                </Button>
              </>
            ) : null}
          </Space>
        ),
      },
    ],
    [canManage],
  );

  const activeFilters = [];
  if (searchText) {
    activeFilters.push({
      key: 'search',
      label: 'Поиск',
      value: searchText,
      onClear: () => setSearchText(''),
    });
  }
  if (typeof activeFilter === 'boolean') {
    activeFilters.push({
      key: 'active',
      label: 'Активность',
      value: activeFilter ? 'Активные' : 'Неактивные',
      onClear: () => setActiveFilter(null),
    });
  }
  if (ownerFilter) {
    activeFilters.push({
      key: 'owner',
      label: 'Владелец',
      value: ownerFilter,
      onClear: () => setOwnerFilter(null),
    });
  }
  if (contentTypeFilter) {
    activeFilters.push({
      key: 'contentType',
      label: 'Тип объекта',
      value: contentTypeOptions.find((opt) => opt.value === contentTypeFilter)?.label || contentTypeFilter,
      onClear: () => setContentTypeFilter(null),
    });
  }
  if (dateRange && dateRange.length === 2) {
    activeFilters.push({
      key: 'date',
      label: 'Период',
      value: `${dayjs(dateRange[0]).format('DD.MM.YYYY')} - ${dayjs(dateRange[1]).format('DD.MM.YYYY')}`,
      onClear: () => setDateRange(null),
    });
  }

  return (
    <>
      <PageHeader
        title="Напоминания"
        subtitle="Список напоминаний"
        extra={
          canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/reminders/new')}>
              Новое напоминание
            </Button>
          ) : null
        }
      />
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>

          <EntityListToolbar
            searchValue={searchText}
            searchPlaceholder="Поиск по теме или описанию"
            onSearchChange={setSearchText}
            filters={(
              <Space wrap>
                <Select
                  allowClear
                  placeholder="Активность"
                  style={{ minWidth: 150 }}
                  value={activeFilter}
                  options={[
                    { value: true, label: 'Активные' },
                    { value: false, label: 'Неактивные' },
                  ]}
                  onChange={(v) => setActiveFilter(v ?? null)}
                />
                <EntitySelect
                  placeholder="Владелец"
                  value={ownerFilter}
                  onChange={setOwnerFilter}
                  fetchList={getUsers}
                  fetchById={getUser}
                  allowClear
                />
                <Select
                  allowClear
                  placeholder="Тип объекта"
                  value={contentTypeFilter}
                  options={contentTypeOptions}
                  onChange={(val) => setContentTypeFilter(val ?? null)}
                  style={{ minWidth: 180 }}
                />
                <RangePicker
                  format="DD.MM.YYYY"
                  value={dateRange}
                  onChange={(vals) => setDateRange(vals || null)}
                />
              </Space>
            )}
            onRefresh={fetchData}
            onReset={handleResetFilters}
            loading={loading}
            resultSummary={`Всего: ${pagination.total}`}
            activeFilters={activeFilters}
          />

          {error ? <Text type="danger">{error}</Text> : null}

          <Table
            rowKey="id"
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `Всего: ${total}` }}
            onChange={handleTableChange}
            locale={{ emptyText: 'Нет напоминаний' }}
          />
        </Space>
      </Card>

      <Modal
        title="Удалить напоминание?"
        open={!!confirmDelete && canManage}
        onCancel={() => setConfirmDelete(null)}
        onOk={() => confirmDelete && handleDelete(confirmDelete.id)}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
      >
        Действие нельзя отменить.
      </Modal>
    </>
  );
}
