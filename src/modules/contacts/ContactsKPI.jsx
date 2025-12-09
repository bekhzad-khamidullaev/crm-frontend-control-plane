import React from 'react';
import { Card, Row, Col, Statistic, Space } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  GlobalOutlined,
  PhoneOutlined,
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

function ContactsKPI({ contacts = [] }) {
  // Calculate statistics
  const stats = {
    total: contacts.length,
    client: contacts.filter(c => c.type === 'client').length,
    partner: contacts.filter(c => c.type === 'partner').length,
    supplier: contacts.filter(c => c.type === 'supplier').length,
    employee: contacts.filter(c => c.type === 'employee').length,
  };

  // Count contacts by company
  const companyCounts = contacts.reduce((acc, contact) => {
    if (contact.company) {
      acc[contact.company] = (acc[contact.company] || 0) + 1;
    }
    return acc;
  }, {});

  // Get top 10 companies
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Type distribution data
  const typeData = {
    labels: ['Клиенты', 'Партнеры', 'Поставщики', 'Сотрудники'],
    datasets: [
      {
        label: 'Количество контактов',
        data: [stats.client, stats.partner, stats.supplier, stats.employee],
        backgroundColor: [
          'rgba(24, 144, 255, 0.8)',
          'rgba(82, 196, 26, 0.8)',
          'rgba(250, 173, 20, 0.8)',
          'rgba(135, 208, 104, 0.8)',
        ],
        borderColor: [
          'rgba(24, 144, 255, 1)',
          'rgba(82, 196, 26, 1)',
          'rgba(250, 173, 20, 1)',
          'rgba(135, 208, 104, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Top companies data
  const companiesData = {
    labels: topCompanies.map(([company]) => company),
    datasets: [
      {
        label: 'Количество контактов',
        data: topCompanies.map(([, count]) => count),
        backgroundColor: 'rgba(24, 144, 255, 0.6)',
        borderColor: 'rgba(24, 144, 255, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Count contacts by country
  const countryCounts = contacts.reduce((acc, contact) => {
    const country = contact.country || 'Не указано';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  // Country distribution data
  const countryData = {
    labels: Object.keys(countryCounts),
    datasets: [
      {
        label: 'Контакты по странам',
        data: Object.values(countryCounts),
        backgroundColor: [
          'rgba(24, 144, 255, 0.6)',
          'rgba(82, 196, 26, 0.6)',
          'rgba(250, 173, 20, 0.6)',
          'rgba(19, 194, 194, 0.6)',
          'rgba(135, 208, 104, 0.6)',
          'rgba(255, 77, 79, 0.6)',
        ],
        borderColor: [
          'rgba(24, 144, 255, 1)',
          'rgba(82, 196, 26, 1)',
          'rgba(250, 173, 20, 1)',
          'rgba(19, 194, 194, 1)',
          'rgba(135, 208, 104, 1)',
          'rgba(255, 77, 79, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Contacts with phones
  const withPhone = contacts.filter(c => c.phone).length;
  const withEmail = contacts.filter(c => c.email).length;
  const completeness = stats.total > 0 
    ? (((withPhone + withEmail) / (stats.total * 2)) * 100).toFixed(1)
    : 0;

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
    indexAxis: 'y',
    scales: {
      x: {
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
              title="Всего контактов"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Клиенты"
              value={stats.client}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="С телефонами"
              value={withPhone}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Полнота данных"
              value={completeness}
              suffix="%"
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={16}>
        <Col xs={24} lg={8}>
          <Card title="Распределение по типам" size="small">
            <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut data={typeData} options={chartOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Распределение по странам" size="small">
            <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut data={countryData} options={chartOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Топ 10 компаний" size="small">
            <div style={{ height: 300 }}>
              {topCompanies.length > 0 ? (
                <Bar data={companiesData} options={barOptions} />
              ) : (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#999'
                }}>
                  Нет данных о компаниях
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export default ContactsKPI;
