import React, { useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Space } from 'antd';
import {
  UserAddOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function LeadsKPI({ leads = [] }) {
  // Calculate statistics
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };

  const conversionRate = stats.total > 0 
    ? ((stats.converted / stats.total) * 100).toFixed(1)
    : 0;

  // Status distribution data
  const statusData = {
    labels: ['Новые', 'Связались', 'Квалифицированы', 'Конвертированы', 'Потеряны'],
    datasets: [
      {
        label: 'Количество лидов',
        data: [stats.new, stats.contacted, stats.qualified, stats.converted, stats.lost],
        backgroundColor: [
          'rgba(24, 144, 255, 0.8)',
          'rgba(250, 173, 20, 0.8)',
          'rgba(82, 196, 26, 0.8)',
          'rgba(19, 194, 194, 0.8)',
          'rgba(255, 77, 79, 0.8)',
        ],
        borderColor: [
          'rgba(24, 144, 255, 1)',
          'rgba(250, 173, 20, 1)',
          'rgba(82, 196, 26, 1)',
          'rgba(19, 194, 194, 1)',
          'rgba(255, 77, 79, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Source distribution
  const sourceCount = leads.reduce((acc, lead) => {
    const source = lead.source || 'other';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const sourceLabels = {
    website: 'Веб-сайт',
    referral: 'Реферал',
    email: 'Email',
    phone: 'Телефон',
    social: 'Соцсети',
    advertisement: 'Реклама',
    other: 'Другое',
  };

  const sourceData = {
    labels: Object.keys(sourceCount).map(key => sourceLabels[key] || key),
    datasets: [
      {
        label: 'Лиды по источникам',
        data: Object.values(sourceCount),
        backgroundColor: [
          'rgba(24, 144, 255, 0.6)',
          'rgba(82, 196, 26, 0.6)',
          'rgba(250, 173, 20, 0.6)',
          'rgba(19, 194, 194, 0.6)',
          'rgba(135, 208, 104, 0.6)',
          'rgba(255, 77, 79, 0.6)',
          'rgba(189, 189, 189, 0.6)',
        ],
        borderColor: [
          'rgba(24, 144, 255, 1)',
          'rgba(82, 196, 26, 1)',
          'rgba(250, 173, 20, 1)',
          'rgba(19, 194, 194, 1)',
          'rgba(135, 208, 104, 1)',
          'rgba(255, 77, 79, 1)',
          'rgba(189, 189, 189, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Funnel data - conversion through stages
  const funnelData = {
    labels: ['Новые', 'Связались', 'Квалифицированы', 'Конвертированы'],
    datasets: [
      {
        label: 'Воронка конверсии',
        data: [stats.new, stats.contacted, stats.qualified, stats.converted],
        backgroundColor: 'rgba(24, 144, 255, 0.6)',
        borderColor: 'rgba(24, 144, 255, 1)',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: 24 }}>
      {/* Statistics Cards */}
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Всего лидов"
              value={stats.total}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Конвертировано"
              value={stats.converted}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Коэффициент конверсии"
              value={conversionRate}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Потеряно"
              value={stats.lost}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Распределение по статусам" size="small">
            <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut data={statusData} options={chartOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Лиды по источникам" size="small">
            <div style={{ height: 300 }}>
              <Bar data={sourceData} options={barOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24}>
          <Card title="Воронка конверсии" size="small">
            <div style={{ height: 300 }}>
              <Bar 
                data={funnelData} 
                options={{
                  ...barOptions,
                  indexAxis: 'y',
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }} 
              />
            </div>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export default LeadsKPI;
