import { useEffect, useMemo, useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, message, Modal, Card, DatePicker } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { getMemos, deleteMemo, markMemoReviewed, markMemoPostponed } from '../../lib/api/memos';
import { navigate } from '../../router';
import dayjs from 'dayjs';
import EntitySelect from '../../components/EntitySelect.jsx';
import { getUsers, getUser } from '../../lib/api';

const { Search } = Input;
const { RangePicker } = DatePicker;

const stageLabels = {
  pen: { text: 'В ожидании', color: 'blue' },
  pos: { text: 'Отложено', color: 'orange' },
  rev: { text: 'Рассмотрено', color: 'green' },
};

export default function MemosList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [draftFilter, setDraftFilter] = useState(null);
  const [stageFilter, setStageFilter] = useState(null);
  const [recipientFilter, setRecipientFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchText, draftFilter, stageFilter, recipientFilter, dateRange]);

  const fetchData = async () => {
    setLoading(true);
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
            return parsed.isAfter(dateRange[0].startOf('day')) && parsed.isBefore(dateRange[1].endOf('day'));
          })
        : results;

      setData(filtered);
      setPagination((prev) => ({ ...prev, total: res.count || filtered.length }));
    } catch (error) {
      message.error('Не удалось загрузить мемо');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Удалить мемо?',
      content: 'Действие нельзя отменить.',
      okText: 'Удалить',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteMemo(id);
          message.success('Мемо удалено');
          fetchData();
        } catch (error) {
          message.error('Не удалось удалить мемо');
        }
      },
    });
  };

  const handleMarkReviewed = async (id) => {
    try {
      await markMemoReviewed(id);
      message.success('Мемо отмечено как рассмотренное');
      fetchData();
    } catch (error) {
      message.error('Не удалось обновить мемо');
    }
  };

  const handleMarkPostponed = async (id) => {
    try {
      await markMemoPostponed(id);
      message.success('Мемо отложено');
      fetchData();
    } catch (error) {
      message.error('Не удалось обновить мемо');
    }
  };

  const columns = useMemo(() => ([
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, record) => {
        const stage = stageLabels[record.stage] || { text: record.stage || '—', color: 'default' };
        return (
          <Space>
            <Tag color={stage.color}>{stage.text}</Tag>
            {record.draft && <Tag color="gold">Черновик</Tag>}
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
          record.deal_name && { label: 'Сделка', value: record.deal_name },
          record.project_name && { label: 'Проект', value: record.project_name },
          record.task_name && { label: 'Задача', value: record.task_name },
        ].filter(Boolean);
        if (items.length === 0) return '-';
        return (
          <Space direction="vertical" size="small">
            {items.map((item) => (
              <span key={item.label}>{item.label}: {item.value}</span>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Дата обзора',
      dataIndex: 'review_date',
      key: 'review_date',
      render: (value) => value ? dayjs(value).format('DD.MM.YYYY') : '-',
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
      fixed: 'right',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/memos/${record.id}`)}
          >
            Открыть
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/memos/${record.id}/edit`)}
          />
          <Button
            type="link"
            size="small"
            icon={<ClockCircleOutlined />}
            onClick={() => handleMarkPostponed(record.id)}
          >
            Отложить
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleMarkReviewed(record.id)}
          >
            Рассмотрено
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ]), []);

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span>Мемо</span>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/memos/new')}
        >
          Новое мемо
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Search
            placeholder="Поиск по названию или тексту"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 320 }}
            onSearch={setSearchText}
          />
          <Select
            placeholder="Черновики"
            style={{ width: 160 }}
            allowClear
            onChange={setDraftFilter}
            value={draftFilter}
          >
            <Select.Option value={true}>Черновики</Select.Option>
            <Select.Option value={false}>Опубликованные</Select.Option>
          </Select>
          <Select
            placeholder="Стадия"
            style={{ width: 180 }}
            allowClear
            onChange={setStageFilter}
            value={stageFilter}
          >
            <Select.Option value="pen">В ожидании</Select.Option>
            <Select.Option value="pos">Отложено</Select.Option>
            <Select.Option value="rev">Рассмотрено</Select.Option>
          </Select>
          <EntitySelect
            placeholder="Получатель"
            value={recipientFilter}
            onChange={setRecipientFilter}
            fetchList={getUsers}
            fetchById={getUser}
            allowClear
            style={{ width: 220 }}
          />
          <RangePicker
            style={{ width: 260 }}
            value={dateRange}
            onChange={setDateRange}
            format="DD.MM.YYYY"
            placeholder={['Дата от', 'Дата до']}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={pagination}
          onChange={(newPagination) => setPagination(newPagination)}
          scroll={{ x: 1200 }}
        />
      </Space>
    </Card>
  );
}
