import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, message, Modal, Card, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, MailOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { getCampaigns, deleteCampaign, updateCampaign } from '../../lib/api/marketing';
import { navigate } from '../../router';
import dayjs from 'dayjs';

const { Search } = Input;

export default function CampaignsList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [segmentFilter, setSegmentFilter] = useState(null);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchText, activeFilter, segmentFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
        is_active: activeFilter,
        segment: segmentFilter || undefined,
      };
      const res = await getCampaigns(params);
      setData(res.results || []);
      setPagination((prev) => ({ ...prev, total: res.count || 0 }));
    } catch (error) {
      message.error('Failed to fetch campaigns');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Campaign',
      content: 'Are you sure you want to delete this campaign?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteCampaign(id);
          message.success('Campaign deleted successfully');
          fetchData();
        } catch (error) {
          message.error('Failed to delete campaign');
        }
      },
    });
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await updateCampaign(id, { is_active: !currentActive });
      message.success(`Campaign ${!currentActive ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      message.error('Failed to update campaign');
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const calculateStats = (record) => {
    const sent = record.sent_count || 0;
    const opened = record.opened_count || 0;
    const clicked = record.clicked_count || 0;
    
    const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : 0;
    const clickRate = sent > 0 ? ((clicked / sent) * 100).toFixed(1) : 0;

    return { sent, opened, clicked, openRate, clickRate };
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: 'Segment',
      dataIndex: 'segment',
      key: 'segment',
      render: (segment) => segment?.name || '-',
    },
    {
      title: 'Template',
      dataIndex: 'template',
      key: 'template',
      render: (template) => template?.name || '-',
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => date ? dayjs(date).format('DD MMM YYYY') : '-',
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Stats',
      key: 'stats',
      width: 200,
      render: (_, record) => {
        const { sent, opened, clicked, openRate, clickRate } = calculateStats(record);
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>Sent: {sent}</div>
            <div>
              Open Rate: {openRate}%
              <Progress percent={parseFloat(openRate)} size="small" showInfo={false} />
            </div>
            <div>
              Click Rate: {clickRate}%
              <Progress percent={parseFloat(clickRate)} size="small" showInfo={false} />
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small" direction="vertical">
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/campaigns/${record.id}`)}
            >
              View
            </Button>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/campaigns/${record.id}/edit`)}
            />
          </Space>
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={record.is_active ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleToggleActive(record.id, record.is_active)}
            >
              {record.is_active ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Space>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <MailOutlined />
          <span>Marketing Campaigns</span>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/campaigns/new')}
        >
          New Campaign
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Search
            placeholder="Search campaigns..."
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
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Space>
    </Card>
  );
}
