import { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Space, Tag, message, Modal, Spin, Row, Col, Statistic, Progress } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined, MailOutlined, PlayCircleOutlined, PauseCircleOutlined, EyeOutlined, LinkOutlined } from '@ant-design/icons';
import { getCampaign, deleteCampaign, updateCampaign } from '../../lib/api/marketing';
import { navigate } from '../../router';
import dayjs from 'dayjs';

export default function CampaignDetail({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCampaign(id);
      setData(res);
    } catch (error) {
      message.error('Failed to fetch campaign details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Campaign',
      content: 'Are you sure you want to delete this campaign?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteCampaign(id);
          message.success('Campaign deleted successfully');
          navigate('/campaigns');
        } catch (error) {
          message.error('Failed to delete campaign');
        }
      },
    });
  };

  const handleToggleActive = async () => {
    try {
      await updateCampaign(id, { is_active: !data.is_active });
      message.success(`Campaign ${!data.is_active ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      message.error('Failed to update campaign');
    }
  };

  const calculateStats = () => {
    const sent = data.sent_count || 0;
    const opened = data.opened_count || 0;
    const clicked = data.clicked_count || 0;
    
    const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : 0;
    const clickRate = sent > 0 ? ((clicked / sent) * 100).toFixed(1) : 0;

    return { sent, opened, clicked, openRate, clickRate };
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          Campaign not found
        </div>
      </Card>
    );
  }

  const stats = calculateStats();

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <MailOutlined />
            <span>Campaign Details</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/campaigns')}
            >
              Back
            </Button>
            <Button
              type={data.is_active ? 'default' : 'primary'}
              icon={data.is_active ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={handleToggleActive}
            >
              {data.is_active ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/campaigns/${id}/edit`)}
            >
              Edit
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Name" span={2}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {data.name}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Status">
            <Tag color={data.is_active ? 'green' : 'default'}>
              {data.is_active ? 'ACTIVE' : 'INACTIVE'}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Type">
            {data.campaign_type || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Segment">
            {data.segment?.name || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Template">
            {data.template?.name || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Start Date">
            {data.start_date ? dayjs(data.start_date).format('DD MMM YYYY') : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="End Date">
            {data.end_date ? dayjs(data.end_date).format('DD MMM YYYY') : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Description" span={2}>
            {data.description || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Created At">
            {data.created_at ? dayjs(data.created_at).format('DD MMM YYYY HH:mm') : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Updated At">
            {data.updated_at ? dayjs(data.updated_at).format('DD MMM YYYY HH:mm') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Campaign Statistics">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Sent"
              value={stats.sent}
              prefix={<MailOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Opened"
              value={stats.opened}
              prefix={<EyeOutlined />}
              suffix={`(${stats.openRate}%)`}
            />
            <Progress percent={parseFloat(stats.openRate)} showInfo={false} />
          </Col>
          <Col span={6}>
            <Statistic
              title="Clicked"
              value={stats.clicked}
              prefix={<LinkOutlined />}
              suffix={`(${stats.clickRate}%)`}
            />
            <Progress percent={parseFloat(stats.clickRate)} showInfo={false} />
          </Col>
          <Col span={6}>
            <Statistic
              title="Conversion Rate"
              value={stats.clickRate}
              suffix="%"
            />
          </Col>
        </Row>
      </Card>
    </Space>
  );
}
