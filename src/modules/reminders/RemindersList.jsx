import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, message, Modal, Card, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, BellOutlined, CheckOutlined } from '@ant-design/icons';
import { getReminders, deleteReminder, updateReminder } from '../../lib/api/reminders';
import { navigate } from '../../router';
import dayjs from 'dayjs';

const { Search } = Input;

export default function RemindersList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [contentTypeFilter, setContentTypeFilter] = useState(null);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchText, activeFilter, contentTypeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
        active: activeFilter,
        content_type: contentTypeFilter || undefined,
      };
      const res = await getReminders(params);
      const results = res.results || [];
      setData(results);
      setPagination((prev) => ({ ...prev, total: res.count || results.length }));
    } catch (error) {
      message.error('Failed to fetch reminders');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Reminder',
      content: 'Are you sure you want to delete this reminder?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteReminder(id);
          message.success('Reminder deleted successfully');
          fetchData();
        } catch (error) {
          message.error('Failed to delete reminder');
        }
      },
    });
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await updateReminder(id, { active: !currentActive });
      message.success(`Reminder ${!currentActive ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      message.error('Failed to update reminder');
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const getRelatedEntity = (record) => {
    if (record.lead) return `Lead: ${record.lead.title || record.lead.id}`;
    if (record.deal) return `Deal: ${record.deal.title || record.deal.id}`;
    if (record.contact) return `Contact: ${record.contact.name || record.contact.id}`;
    if (record.task) return `Task: ${record.task.title || record.task.id}`;
    return '-';
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title) => <strong>{title}</strong>,
    },
    {
      title: 'Remind At',
      dataIndex: 'remind_at',
      key: 'remind_at',
      render: (date) => {
        if (!date) return '-';
        const reminderDate = dayjs(date);
        const now = dayjs();
        const isPast = reminderDate.isBefore(now);
        return (
          <span style={{ color: isPast ? '#ff4d4f' : undefined }}>
            {reminderDate.format('DD MMM YYYY HH:mm')}
            {isPast && ' (Past)'}
          </span>
        );
      },
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Related Entity',
      key: 'related',
      render: (_, record) => getRelatedEntity(record),
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      render: (owner) => owner?.username || owner?.email || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/reminders/${record.id}`)}
          >
            View
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
            icon={<CheckOutlined />}
            onClick={() => handleToggleActive(record.id, record.active)}
          >
            {record.active ? 'Deactivate' : 'Activate'}
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
  ];

  return (
    <Card
      title={
        <Space>
          <BellOutlined />
          <span>Reminders</span>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/reminders/new')}
        >
          New Reminder
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Search
            placeholder="Search reminders..."
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={setSearchText}
          />
          <Select
            placeholder="Filter by Status"
            style={{ width: 150 }}
            allowClear
            onChange={setActiveFilter}
            value={activeFilter}
          >
            <Select.Option value={true}>Active</Select.Option>
            <Select.Option value={false}>Inactive</Select.Option>
          </Select>
          <Select
            placeholder="Filter by Type"
            style={{ width: 150 }}
            allowClear
            onChange={setContentTypeFilter}
            value={contentTypeFilter}
          >
            <Select.Option value="lead">Lead</Select.Option>
            <Select.Option value="deal">Deal</Select.Option>
            <Select.Option value="contact">Contact</Select.Option>
            <Select.Option value="task">Task</Select.Option>
          </Select>
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
