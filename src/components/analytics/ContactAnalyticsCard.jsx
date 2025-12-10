import React from 'react';
import { Card, Row, Col, Statistic, Space } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  StarOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import AnimatedChart from './AnimatedChart';

/**
 * ContactAnalyticsCard - компонент аналитики контактов
 * @param {Array} contacts - массив контактов
 * @param {boolean} showStatistics - показывать статистику
 * @param {boolean} showTypeChart - показывать график по типам
 * @param {boolean} showSourceChart - показывать график по источникам
 * @param {boolean} showActivityChart - показывать график активности
 * @param {string} size - размер карточек
 * @param {number} chartHeight - высота графиков
 */
function ContactAnalyticsCard({
  contacts = [],
  showStatistics = true,
  showTypeChart = true,
  showSourceChart = true,
  showActivityChart = true,
  size = 'small',
  chartHeight = 300,
}) {
  // Расчет статистики
  const stats = {
    total: contacts.length,
    companies: new Set(contacts.filter(c => c.company).map(c => c.company)).size,
    vip: contacts.filter(c => c.is_vip || c.type === 'vip').length,
    withPhone: contacts.filter(c => c.phone).length,
  };

  // Данные по типам контактов
  const typeCount = contacts.reduce((acc, contact) => {
    const type = contact.type || 'individual';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeLabels = {
    individual: 'Физические лица',
    corporate: 'Корпоративные',
    vip: 'VIP',
    partner: 'Партнеры',
    supplier: 'Поставщики',
  };

  const typeData = {
    labels: Object.keys(typeCount).map(key => typeLabels[key] || key),
    datasets: [
      {
        label: 'Контакты по типам',
        data: Object.values(typeCount),
        backgroundColor: [
          'rgba(24, 144, 255, 0.8)',
          'rgba(82, 196, 26, 0.8)',
          'rgba(250, 173, 20, 0.8)',
          'rgba(114, 46, 209, 0.8)',
          'rgba(19, 194, 194, 0.8)',
        ],
        borderColor: [
          'rgba(24, 144, 255, 1)',
          'rgba(82, 196, 26, 1)',
          'rgba(250, 173, 20, 1)',
          'rgba(114, 46, 209, 1)',
          'rgba(19, 194, 194, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Данные по источникам контактов
  const sourceCount = contacts.reduce((acc, contact) => {
    const source = contact.source || 'direct';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const sourceLabels = {
    website: 'Веб-сайт',
    referral: 'Рекомендации',
    social: 'Соцсети',
    event: 'Мероприятия',
    direct: 'Прямой контакт',
    advertisement: 'Реклама',
    other: 'Другое',
  };

  const sourceData = {
    labels: Object.keys(sourceCount).map(key => sourceLabels[key] || key),
    datasets: [
      {
        label: 'Контакты по источникам',
        data: Object.values(sourceCount),
        backgroundColor: [
          'rgba(24, 144, 255, 0.6)',
          'rgba(82, 196, 26, 0.6)',
          'rgba(250, 173, 20, 0.6)',
          'rgba(135, 208, 104, 0.6)',
          'rgba(255, 77, 79, 0.6)',
          'rgba(189, 189, 189, 0.6)',
          'rgba(114, 46, 209, 0.6)',
        ],
        borderColor: [
          'rgba(24, 144, 255, 1)',
          'rgba(82, 196, 26, 1)',
          'rgba(250, 173, 20, 1)',
          'rgba(135, 208, 104, 1)',
          'rgba(255, 77, 79, 1)',
          'rgba(189, 189, 189, 1)',
          'rgba(114, 46, 209, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // График активности по месяцам
  const activityByMonth = contacts.reduce((acc, contact) => {
    if (contact.created_at) {
      const month = new Date(contact.created_at).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
    }
    return acc;
  }, {});

  const activityData = {
    labels: Object.keys(activityByMonth).slice(-6), // последние 6 месяцев
    datasets: [
      {
        label: 'Новые контакты',
        data: Object.values(activityByMonth).slice(-6),
        backgroundColor: 'rgba(24, 144, 255, 0.6)',
        borderColor: 'rgba(24, 144, 255, 1)',
        borderWidth: 2,
        fill: true,
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
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Статистика */}
      {showStatistics && (
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card className="analytics-stat-card">
              <Statistic
                title="Всего контактов"
                value={stats.total}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="analytics-stat-card">
              <Statistic
                title="Компании"
                value={stats.companies}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="analytics-stat-card">
              <Statistic
                title="VIP контакты"
                value={stats.vip}
                prefix={<StarOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="analytics-stat-card">
              <Statistic
                title="С телефоном"
                value={stats.withPhone}
                prefix={<PhoneOutlined />}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Графики */}
      <Row gutter={16}>
        {showTypeChart && (
          <Col xs={24} lg={showSourceChart ? 12 : 24}>
            <Card title="Распределение по типам" size={size} className="chart-container">
              <AnimatedChart
                type="doughnut"
                data={typeData}
                options={chartOptions}
                height={chartHeight}
                animationType="smooth"
              />
            </Card>
          </Col>
        )}
        {showSourceChart && (
          <Col xs={24} lg={showTypeChart ? 12 : 24}>
            <Card title="Контакты по источникам" size={size} className="chart-container">
              <AnimatedChart
                type="bar"
                data={sourceData}
                options={barOptions}
                height={chartHeight}
                animationType="smooth"
              />
            </Card>
          </Col>
        )}
      </Row>

      {showActivityChart && (
        <Row gutter={16}>
          <Col xs={24}>
            <Card title="Активность по месяцам" size={size} className="chart-container">
              <AnimatedChart
                type="line"
                data={activityData}
                options={{
                  ...barOptions,
                  elements: {
                    line: {
                      tension: 0.4,
                    },
                  },
                }}
                height={chartHeight}
                animationType="smooth"
              />
            </Card>
          </Col>
        </Row>
      )}
    </Space>
  );
}

export default ContactAnalyticsCard;
