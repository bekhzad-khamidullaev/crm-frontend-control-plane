import { useEffect, useMemo, useState } from 'react';
import { Check, Clock, Edit, Eye, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';

import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, DatePicker, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';

import EntitySelect from '../../components/EntitySelect.jsx';
import { getUser, getUsers } from '../../lib/api';
import { deleteMemo, getMemos, markMemoPostponed, markMemoReviewed } from '../../lib/api/memos';
import { canWrite } from '../../lib/rbac.js';
import { navigate } from '../../router';

const { RangePicker } = DatePicker;
const { Search } = Input;
const { Text, Title } = Typography;

const stageLabels = {
  pen: { text: 'В ожидании', color: 'blue' },
  pos: { text: 'Отложено', color: 'gold' },
  rev: { text: 'Рассмотрено', color: 'green' },
};

export default function MemosList() {
  const { message } = App.useApp();
  const canManage = canWrite('tasks.change_memo');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [draftFilter, setDraftFilter] = useState(null);
  const [stageFilter, setStageFilter] = useState(null);
  const [recipientFilter, setRecipientFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, searchText, draftFilter, stageFilter, recipientFilter, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
        draft: typeof draftFilter === 'boolean' ? draftFilter : undefined,
        stage: stageFilter || undefined,
        to: recipientFilter || undefined,
        ordering: '-update_date',
      };
      const res = await getMemos(params);
      const results = res.results || [];
      const filtered = dateRange && dateRange.length === 2
        ? results.filter((item) => {
            const date = item.update_date || item.creation_date;
            if (!date) return false;
            const parsed = dayjs(date);
            return parsed.isAfter(dayjs(dateRange[0]).startOf('day')) && parsed.isBefore(dayjs(dateRange[1]).endOf('day'));
          })
        : results;

      setData(filtered);
      setPagination((prev) => ({ ...prev, total: res.count || filtered.length }));
    } catch (fetchError) {
      setError(fetchError?.message || 'Не удалось загрузить список мемо');
      message.error('Не удалось загрузить мемо');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMemo(id);
      message.success('Мемо удалено');
      fetchData();
    } catch {
      message.error('Не удалось удалить мемо');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleMarkReviewed = async (id) => {
    try {
      await markMemoReviewed(id);
      message.success('Мемо отмечено как рассмотренное');
      fetchData();
    } catch {
      message.error('Не удалось обновить мемо');
    }
  };

  const handleMarkPostponed = async (id) => {
    try {
      await markMemoPostponed(id);
      message.success('Мемо отложено');
      fetchData();
    } catch {
      message.error('Не удалось обновить мемо');
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Название',
        dataIndex: 'name',
        key: 'name',
        render: (name) => <Text strong>{name}</Text>,
      },
      {
        title: 'Статус',
        key: 'status',
        render: (_, record) => {
          const stage = stageLabels[record.stage] || { text: '-', color: 'default' };
          return (
            <Space>
              <Tag color={stage.color}>{stage.text}</Tag>
              {record.draft ? <Tag>Черновик</Tag> : null}
            </Space>
          );
        },
      },
      {
        title: 'Получатель',
        dataIndex: 'to_name',
        key: 'to_name',
        render: (toName) => toName || '-',
      },
      {
        title: 'Связь',
        key: 'related',
        render: (_, record) => {
          const items = [
            record.deal_name && `Сделка: ${record.deal_name}`,
            record.project_name && `Проект: ${record.project_name}`,
            record.task_name && `Задача: ${record.task_name}`,
          ].filter(Boolean);
          return items.length ? items.join(' | ') : '-';
        },
      },
      {
        title: 'Дата обзора',
        dataIndex: 'review_date',
        key: 'review_date',
        render: (value) => (value ? dayjs(value).format('DD.MM.YYYY') : '-'),
      },
      {
        title: 'Обновлено',
        dataIndex: 'update_date',
        key: 'update_date',
        render: (date, record) => {
          const value = date || record.creation_date;
          return value ? dayjs(value).format('DD.MM.YYYY HH:mm') : '-';
        },
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 360,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<Eye size={14} />} onClick={() => navigate(`/memos/${record.id}`)}>Открыть</Button>
            {canManage ? (
              <>
                <Button size="small" icon={<Edit size={14} />} onClick={() => navigate(`/memos/${record.id}/edit`)}>Ред.</Button>
                <Button size="small" icon={<Clock size={14} />} onClick={() => handleMarkPostponed(record.id)}>Отложить</Button>
                <Button size="small" icon={<Check size={14} />} onClick={() => handleMarkReviewed(record.id)}>Рассмотрено</Button>
                <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => setConfirmDelete(record)}>Удалить</Button>
              </>
            ) : null}
          </Space>
        ),
      },
    ],
    [canManage],
  );

  return (
    <>
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <div>
              <Title level={3} style={{ margin: 0 }}>Мемо</Title>
              <Text type="secondary">Список внутренних мемо</Text>
            </div>
            {canManage ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/memos/new')}>Новое мемо</Button>
            ) : null}
          </Space>

          <Space wrap>
            <Search
              placeholder="Поиск по названию или тексту"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
              style={{ minWidth: 280 }}
            />
            <Select
              allowClear
              placeholder="Черновики"
              style={{ minWidth: 150 }}
              value={draftFilter}
              options={[
                { value: true, label: 'Черновик' },
                { value: false, label: 'Опубликованные' },
              ]}
              onChange={(v) => setDraftFilter(v ?? null)}
            />
            <Select
              allowClear
              placeholder="Стадия"
              style={{ minWidth: 160 }}
              value={stageFilter}
              options={Object.entries(stageLabels).map(([value, meta]) => ({ value, label: meta.text }))}
              onChange={(v) => setStageFilter(v ?? null)}
            />
            <EntitySelect
              placeholder="Получатель"
              value={recipientFilter}
              onChange={setRecipientFilter}
              fetchList={getUsers}
              fetchById={getUser}
              allowClear
            />
            <RangePicker
              format="DD.MM.YYYY"
              value={dateRange}
              onChange={(vals) => setDateRange(vals || null)}
            />
            <Button onClick={fetchData} loading={loading}>Обновить</Button>
          </Space>

          {error ? <Text type="danger">{error}</Text> : null}

          <Table
            rowKey="id"
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `Всего: ${total}` }}
            onChange={(pg) => setPagination((prev) => ({ ...prev, current: pg.current, pageSize: pg.pageSize }))}
            locale={{ emptyText: 'Нет мемо' }}
          />
        </Space>
      </Card>

      <Modal
        title="Удалить мемо?"
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
