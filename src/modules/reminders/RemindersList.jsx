import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  message,
  Modal,
  Card,
  DatePicker,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  BellOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { getReminders, deleteReminder, updateReminder } from '../../lib/api/reminders';
import { navigate } from '../../router';
import dayjs from 'dayjs';
import EntitySelect from '../../components/EntitySelect.jsx';
import { getUsers, getUser } from '../../lib/api';

const { Search } = Input;
const { RangePicker } = DatePicker;

export default function RemindersList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [ownerFilter, setOwnerFilter] = useState(null);
  const [contentTypeFilter, setContentTypeFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchText, activeFilter, ownerFilter, contentTypeFilter, dateRange]);

  const fetchData = async () => {
    setLoading(true);
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
            return date.isAfter(dateRange[0].startOf('day')) && date.isBefore(dateRange[1].endOf('day'));
          })
        : results;

      setData(filteredByDate);
      setPagination((prev) => ({ ...prev, total: res.count || filteredByDate.length }));
    } catch (error) {
      message.error('Не удалось загрузить напоминания');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Удалить напоминание?',
      content: 'Действие нельзя отменить.',
      okText: 'Удалить',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteReminder(id);
          message.success('Напоминание удалено');
          fetchData();
        } catch (error) {
          message.error('Не удалось удалить напоминание');
        }
      },
    });
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await updateReminder(id, { active: !currentActive });
      message.success(!currentActive ? 'Напоминание активировано' : 'Напоминание деактивировано');
      fetchData();
    } catch (error) {
      message.error('Не удалось обновить напоминание');
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const columns = useMemo(() => ([
    {
      title: 'Тема',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject) => <strong>{subject}</strong>,
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
          <span style={{ color: isPast ? '#ff4d4f' : undefined }}>
            {reminderDate.format('DD MMM YYYY HH:mm')}
            {isPast && ' (Просрочено)'}
          </span>
        );
      },
      sorter: true,
    },
    {
      title: 'Статус',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? 'Активно' : 'Неактивно'}
        </Tag>
      ),
    },
    {
      title: 'Content Type',
      dataIndex: 'content_type',
      key: 'content_type',
      width: 120,
      render: (value) => value ?? '-',
    },
    {
      title: 'Object ID',
      dataIndex: 'object_id',
      key: 'object_id',
      width: 120,
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
      fixed: 'right',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/reminders/${record.id}`)}
          >
            Открыть
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/reminders/${record.id}/edit`)}
          />
          <Button
            type="link"
            size="small"
            icon={record.active ? <CloseOutlined /> : <CheckOutlined />}
            onClick={() => handleToggleActive(record.id, record.active)}
          >
            {record.active ? 'Откл.' : 'Вкл.'}
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
          <BellOutlined />
          <span>Напоминания</span>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/reminders/new')}
        >
          Новое напоминание
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Search
            placeholder="Поиск по теме или описанию"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 320 }}
            onSearch={setSearchText}
          />
          <Select
            placeholder="Активность"
            style={{ width: 160 }}
            allowClear
            onChange={setActiveFilter}
            value={activeFilter}
          >
            <Select.Option value={true}>Активные</Select.Option>
            <Select.Option value={false}>Неактивные</Select.Option>
          </Select>
          <EntitySelect
            placeholder="Владелец"
            value={ownerFilter}
            onChange={setOwnerFilter}
            fetchList={getUsers}
            fetchById={getUser}
            style={{ width: 220 }}
            allowClear
          />
          <InputNumber
            placeholder="Content type ID"
            style={{ width: 160 }}
            min={1}
            value={contentTypeFilter}
            onChange={setContentTypeFilter}
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
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Space>
    </Card>
  );
}
