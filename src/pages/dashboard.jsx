import {
  BarChartOutlined,
  DollarCircleOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Card,
  Col,
  List,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { getActivityFeed, getOverview, normalizeOverview } from '../lib/api/analytics.js';

const { Title, Text } = Typography;

function Dashboard() {
  const [period, setPeriod] = useState('30d');
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadData();
  }, [period]);

  const cards = useMemo(() => {
    const data = overview || {};
    return [
      {
        key: 'leads',
        title: 'Лиды',
        value: Number(data.total_leads || data.leads || 0),
        icon: <UserOutlined />,
      },
      {
        key: 'contacts',
        title: 'Контакты',
        value: Number(data.total_contacts || data.contacts || 0),
        icon: <TeamOutlined />,
      },
      {
        key: 'deals',
        title: 'Сделки',
        value: Number(data.total_deals || data.deals || 0),
        icon: <BarChartOutlined />,
      },
      {
        key: 'revenue',
        title: 'Выручка',
        value: Number(data.total_revenue || data.revenue || 0),
        icon: <DollarCircleOutlined />,
        precision: 2,
      },
    ];
  }, [overview]);

  async function loadData() {
    setError('');
    setLoadingOverview(true);
    setLoadingActivity(true);

    try {
      const [overviewRes, activityRes] = await Promise.all([
        getOverview(),
        getActivityFeed({ period }),
      ]);

      setOverview(normalizeOverview(overviewRes));
      setActivity(Array.isArray(activityRes) ? activityRes : []);
    } catch (e) {
      console.error('Dashboard load error:', e);
      setError('Не удалось загрузить данные дашборда');
      setOverview(null);
      setActivity([]);
    } finally {
      setLoadingOverview(false);
      setLoadingActivity(false);
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            <Space direction="vertical" size={0}>
              <Title level={3} style={{ margin: 0 }}>Дашборд</Title>
              <Text type="secondary">Ключевые показатели CRM</Text>
            </Space>
            <Segmented
              value={period}
              options={[
                { label: '7 дней', value: '7d' },
                { label: '30 дней', value: '30d' },
                { label: '90 дней', value: '90d' },
              ]}
              onChange={(value) => setPeriod(String(value))}
            />
          </Space>

          {error ? <Alert type="error" showIcon message={error} /> : null}
        </Space>
      </Card>

      <Spin spinning={loadingOverview}>
        <Row gutter={[16, 16]}>
          {cards.map((card) => (
            <Col xs={24} sm={12} lg={6} key={card.key}>
              <Card>
                <Statistic
                  title={card.title}
                  value={card.value}
                  precision={card.precision}
                  prefix={card.icon}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      <Card title="Последняя активность">
        <Spin spinning={loadingActivity}>
          <List
            dataSource={activity}
            locale={{ emptyText: 'Нет активности за выбранный период' }}
            renderItem={(item, index) => (
              <List.Item key={`${item?.id || 'row'}-${index}`}>
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text strong>{item?.title || item?.event || 'Событие'}</Text>
                  <Text type="secondary">{item?.description || item?.message || 'Без описания'}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Spin>
      </Card>
    </Space>
  );
}

export default Dashboard;
