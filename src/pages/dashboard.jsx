import React, { useEffect, useRef, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import Chart from 'chart.js/auto';

const { Title } = Typography;

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalContacts: 0,
    totalDeals: 0,
    revenue: 0,
  });
  const chartRefs = {
    leadSource: useRef(null),
    pipeline: useRef(null),
    revenue: useRef(null),
  };
  const chartInstances = useRef({});

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

  const leadSources = [
    { label: 'Реклама', value: 120 },
    { label: 'Рекомендации', value: 85 },
    { label: 'Email/Холодные', value: 62 },
    { label: 'Вебинар', value: 30 },
  ];

  const pipeline = [
    { stage: 'Новый', amount: 420000, deals: 28 },
    { stage: 'Квалификация', amount: 530000, deals: 22 },
    { stage: 'Переговоры', amount: 610000, deals: 17 },
    { stage: 'Подписание', amount: 760000, deals: 11 },
    { stage: 'Успешно', amount: 920000, deals: 9 },
  ];

  const revenueTrend = [
    { month: 'Янв', value: 120000 },
    { month: 'Фев', value: 150000 },
    { month: 'Мар', value: 175000 },
    { month: 'Апр', value: 210000 },
    { month: 'Май', value: 240000 },
    { month: 'Июн', value: 260000 },
  ];

  const palette = ['#1677ff', '#52c41a', '#fa8c16', '#13c2c2', '#722ed1', '#eb2f96'];

  const buildChart = (key, configBuilder) => {
    if (!chartRefs[key]?.current) return;
    if (chartInstances.current[key]) {
      chartInstances.current[key].destroy();
    }
    chartInstances.current[key] = new Chart(chartRefs[key].current, configBuilder());
  };

  useEffect(() => {
    if (loading) return undefined;

    buildChart('leadSource', () => ({
      type: 'doughnut',
      data: {
        labels: leadSources.map((item) => item.label),
        datasets: [
          {
            data: leadSources.map((item) => item.value),
            backgroundColor: palette,
            borderWidth: 0,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}` },
          },
        },
      },
    }));

    buildChart('pipeline', () => ({
      type: 'bar',
      data: {
        labels: pipeline.map((p) => p.stage),
        datasets: [
          {
            label: 'Сумма, ₽',
            data: pipeline.map((p) => p.amount),
            backgroundColor: '#1677ff',
            borderRadius: 8,
          },
          {
            label: 'Количество сделок',
            data: pipeline.map((p) => p.deals),
            backgroundColor: '#faad14',
            borderRadius: 8,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        interaction: { mode: 'index' },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString('ru-RU')}`,
            },
          },
        },
        scales: {
          x: { stacked: false },
          y: {
            beginAtZero: true,
            ticks: { callback: (val) => Number(val).toLocaleString('ru-RU') },
          },
        },
      },
    }));

    buildChart('revenue', () => ({
      type: 'line',
      data: {
        labels: revenueTrend.map((r) => r.month),
        datasets: [
          {
            label: 'Выручка, ₽',
            data: revenueTrend.map((r) => r.value),
            borderColor: '#52c41a',
            backgroundColor: 'rgba(82,196,26,0.15)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#52c41a',
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.raw.toLocaleString('ru-RU')} ₽`,
            },
          },
        },
        scales: {
          y: {
            ticks: { callback: (val) => `${Number(val).toLocaleString('ru-RU')} ₽` },
            beginAtZero: true,
          },
        },
      },
    }));

    return () => {
      Object.values(chartInstances.current).forEach((inst) => inst?.destroy());
    };
  }, [loading]);

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

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12} lg={8}>
          <Card title="Источники лидов">
            <div style={{ height: 260 }}>
              <canvas ref={chartRefs.leadSource} />
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card title="Воронка (сумма и сделки)">
            <div style={{ height: 260 }}>
              <canvas ref={chartRefs.pipeline} />
            </div>
          </Card>
        </Col>
        <Col xs={24} md={24} lg={8}>
          <Card title="Динамика выручки">
            <div style={{ height: 260 }}>
              <canvas ref={chartRefs.revenue} />
            </div>
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
