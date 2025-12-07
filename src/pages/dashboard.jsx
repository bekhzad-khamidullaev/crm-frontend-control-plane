import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, Typography } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalContacts: 0,
    totalDeals: 0,
    revenue: 0,
  });

  useEffect(() => {
    // Mock data loading
    setTimeout(() => {
      setStats({
        totalLeads: 245,
        totalContacts: 1834,
        totalDeals: 89,
        revenue: 1250000,
      });
      setLoading(false);
    }, 500);
  }, []);

  const recentLeads = [
    {
      key: '1',
      name: 'Иван Иванов',
      company: 'ООО "Технологии"',
      status: 'new',
      value: 150000,
    },
    {
      key: '2',
      name: 'Мария Петрова',
      company: 'АО "Инновации"',
      status: 'contacted',
      value: 250000,
    },
    {
      key: '3',
      name: 'Алексей Сидоров',
      company: 'ИП Сидоров',
      status: 'qualified',
      value: 75000,
    },
  ];

  const columns = [
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Компания',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          new: { color: 'blue', text: 'Новый' },
          contacted: { color: 'orange', text: 'Связались' },
          qualified: { color: 'green', text: 'Квалифицирован' },
        };
        const config = statusConfig[status] || statusConfig.new;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Сумма',
      dataIndex: 'value',
      key: 'value',
      render: (value) => `${value.toLocaleString('ru-RU')} ₽`,
    },
  ];

  return (
    <div>
      <Title level={2}>Dashboard</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Лиды"
              value={stats.totalLeads}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={<ArrowUpOutlined style={{ fontSize: 12 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Контакты"
              value={stats.totalContacts}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Сделки"
              value={stats.totalDeals}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Выручка"
              value={stats.revenue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#eb2f96' }}
              suffix="₽"
            />
          </Card>
        </Col>
      </Row>

      <Card title="Последние лиды" loading={loading}>
        <Table
          columns={columns}
          dataSource={recentLeads}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
}

export default Dashboard;
