import { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Space, Progress, Empty, Spin, Statistic, Row, Col } from 'antd';
import { EyeOutlined, LinkOutlined } from '@ant-design/icons';
import { getCampaigns } from '../lib/api/marketing';
import { navigate } from '../router';
import dayjs from 'dayjs';
import ChannelBrandIcon from './channel/ChannelBrandIcon.jsx';

export default function CampaignsWidget() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCampaigns({ is_active: true, page_size: 5 });
      setData(res.results || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (record) => {
    const sent = record.sent_count || 0;
    const opened = record.opened_count || 0;
    const clicked = record.clicked_count || 0;
    
    const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : 0;
    const clickRate = sent > 0 ? ((clicked / sent) * 100).toFixed(1) : 0;

    return { sent, opened, clicked, openRate, clickRate };
  };

  return (
    <Card
      title={
        <Space>
          <ChannelBrandIcon channel="crm-email" size={16} />
          <span>Active Campaigns</span>
        </Space>
      }
      extra={
        <Button type="link" onClick={() => navigate('/campaigns')}>
          View All
        </Button>
      }
      styles={{ body: { padding: 0 } }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin />
        </div>
      ) : data.length === 0 ? (
        <Empty
          description="No active campaigns"
          style={{ padding: '40px' }}
        />
      ) : (
        <List
          dataSource={data}
          renderItem={(item) => {
            const { sent, opened, clicked, openRate, clickRate } = calculateStats(item);
            return (
              <List.Item
                style={{ padding: '16px 24px' }}
              >
                <div style={{ width: '100%' }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <strong>{item.name}</strong>
                        <Tag color="green">Active</Tag>
                      </Space>
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/campaigns/${item.id}`)}
                      >
                        View
                      </Button>
                    </Space>
                    
                    <Row gutter={16}>
                      <Col span={8}>
                        <Statistic
                          title="Sent"
                          value={sent}
                          valueStyle={{ fontSize: '14px' }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="Open Rate"
                          value={openRate}
                          suffix="%"
                          valueStyle={{ fontSize: '14px' }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="Click Rate"
                          value={clickRate}
                          suffix="%"
                          valueStyle={{ fontSize: '14px' }}
                        />
                      </Col>
                    </Row>

                    <div>
                      <div style={{ marginBottom: '4px' }}>
                        <small>Open Rate: {openRate}%</small>
                      </div>
                      <Progress percent={parseFloat(openRate)} size="small" showInfo={false} />
                    </div>

                    <div>
                      <div style={{ marginBottom: '4px' }}>
                        <small>Click Rate: {clickRate}%</small>
                      </div>
                      <Progress percent={parseFloat(clickRate)} size="small" showInfo={false} strokeColor="#52c41a" />
                    </div>
                  </Space>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
}
