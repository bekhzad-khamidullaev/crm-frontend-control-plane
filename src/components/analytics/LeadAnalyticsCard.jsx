import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Space } from 'antd';
import {
  UserAddOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RiseOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import AnimatedChart from './AnimatedChart';
import DrillDownModal from './DrillDownModal';
import { deriveLeadStatus } from '../../lib/utils/leads';
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

/**
 * LeadAnalyticsCard - переиспользуемый компонент для аналитики лидов
 * @param {Array} leads - массив лидов для анализа
 * @param {boolean} showStatistics - показывать ли статистические карточки
 * @param {boolean} showStatusChart - показывать ли график статусов
 * @param {boolean} showSourceChart - показывать ли график источников
 * @param {boolean} showFunnelChart - показывать ли воронку конверсии
 * @param {string} size - размер карточек ('small', 'default')
 * @param {number} chartHeight - высота графиков в пикселях
 */
function LeadAnalyticsCard({ 
  leads = [], 
  showStatistics = true,
  showStatusChart = true,
  showSourceChart = true,
  showFunnelChart = true,
  size = 'small',
  chartHeight = 300,
  enableDrillDown = true,
  onLeadClick,
}) {
  const [drillDownVisible, setDrillDownVisible] = useState(false);
  const [drillDownData, setDrillDownData] = useState([]);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownSegment, setDrillDownSegment] = useState('');
  const statusOrder = ['new', 'converted', 'lost'];
  const statusLabels = {
    new: 'Новые',
    converted: 'Конвертированы',
    lost: 'Потеряны',
  };

  const statusCounts = leads.reduce((acc, lead) => {
    const status = deriveLeadStatus(lead);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const stats = {
    total: leads.length,
    new: statusCounts.new || 0,
    converted: statusCounts.converted || 0,
    lost: statusCounts.lost || 0,
  };

  const conversionRate = stats.total > 0
    ? ((stats.converted / stats.total) * 100).toFixed(1)
    : 0;

  const statusData = {
    labels: statusOrder.map((key) => statusLabels[key] || key),
    datasets: [
      {
        label: 'Количество лидов',
        data: statusOrder.map((key) => statusCounts[key] || 0),
        backgroundColor: [
          'rgba(24, 144, 255, 0.8)',
          'rgba(19, 194, 194, 0.8)',
          'rgba(255, 77, 79, 0.8)',
        ],
        borderColor: [
          'rgba(24, 144, 255, 1)',
          'rgba(19, 194, 194, 1)',
          'rgba(255, 77, 79, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Source distribution
  const sourceCount = leads.reduce((acc, lead) => {
    const rawSource = lead.lead_source_name || lead.lead_source || 'other';
    const sourceKey = String(rawSource);
    acc[sourceKey] = (acc[sourceKey] || 0) + 1;
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

  const resolveSourceLabel = (key) => {
    if (sourceLabels[key]) return sourceLabels[key];
    if (/^\\d+$/.test(key)) return `#${key}`;
    return key;
  };

  const sourceData = {
    labels: Object.keys(sourceCount).map((key) => resolveSourceLabel(key)),
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
    labels: statusOrder.map((key) => statusLabels[key] || key),
    datasets: [
      {
        label: 'Воронка конверсии',
        data: statusOrder.map((key) => statusCounts[key] || 0),
        backgroundColor: 'rgba(24, 144, 255, 0.6)',
        borderColor: 'rgba(24, 144, 255, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Обработка клика на сегмент графика для drill-down
  const handleChartClick = (chartType, dataIndex, label) => {
    if (!enableDrillDown) return;

    let filteredLeads = [];
    let title = '';
    let segment = '';

    switch (chartType) {
      case 'status':
        const status = statusOrder[dataIndex];
        filteredLeads = leads.filter((l) => deriveLeadStatus(l) === status);
        title = 'Лиды по статусу';
        segment = label;
        break;
      
      case 'source':
        const sourceKeys = Object.keys(sourceCount);
        const sourceKey = sourceKeys[dataIndex];
        filteredLeads = leads.filter((l) => String(l.lead_source_name || l.lead_source || 'other') === sourceKey);
        title = 'Лиды по источнику';
        segment = label;
        break;
      
      case 'funnel':
        const funnelStatus = statusOrder[dataIndex];
        filteredLeads = leads.filter((l) => deriveLeadStatus(l) === funnelStatus);
        title = 'Воронка конверсии';
        segment = label;
        break;
    }

    setDrillDownData(filteredLeads);
    setDrillDownTitle(title);
    setDrillDownSegment(segment);
    setDrillDownVisible(true);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    onClick: enableDrillDown ? (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const dataIndex = element.index;
        const label = event.chart.data.labels[dataIndex];
        handleChartClick('status', dataIndex, label);
      }
    } : undefined,
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

  const sourceChartOptions = {
    ...barOptions,
    onClick: enableDrillDown ? (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const dataIndex = element.index;
        const label = event.chart.data.labels[dataIndex];
        handleChartClick('source', dataIndex, label);
      }
    } : undefined,
  };

  const funnelChartOptions = {
    ...barOptions,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false,
      },
    },
    onClick: enableDrillDown ? (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const dataIndex = element.index;
        const label = event.chart.data.labels[dataIndex];
        handleChartClick('funnel', dataIndex, label);
      }
    } : undefined,
  };

  // Колонки для drill-down таблицы
  const drillDownColumns = [
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => email ? (
        <Space>
          <MailOutlined />
          {email}
        </Space>
      ) : '-',
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone ? (
        <Space>
          <PhoneOutlined />
          {phone}
        </Space>
      ) : '-',
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, record) => {
        const status = deriveLeadStatus(record);
        const statusColors = {
          new: 'blue',
          converted: 'cyan',
          lost: 'red',
        };
        const statusNames = {
          new: 'Новый',
          converted: 'Конвертирован',
          lost: 'Потерян',
        };
        return (
          <span style={{ color: statusColors[status] || 'default' }}>
            {statusNames[status] || status}
          </span>
        );
      },
    },
    {
      title: 'Источник',
      key: 'source',
      render: (_, record) => record.lead_source_name || record.lead_source || '-',
    },
    {
      title: 'Дата создания',
      key: 'created_at',
      render: (_, record) => {
        const date = record.creation_date || record.created_at;
        return date ? new Date(date).toLocaleDateString('ru-RU') : '-';
      },
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Statistics Cards */}
      {showStatistics && (
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card className="analytics-stat-card">
              <Statistic
                title="Всего лидов"
                value={stats.total}
                prefix={<UserAddOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="analytics-stat-card">
              <Statistic
                title="Конвертировано"
                value={stats.converted}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="analytics-stat-card">
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
            <Card className="analytics-stat-card">
              <Statistic
                title="Потеряно"
                value={stats.lost}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Charts */}
      <Row gutter={16}>
        {showStatusChart && (
          <Col xs={24} lg={showSourceChart ? 12 : 24}>
            <Card title="Распределение по статусам" size={size} className="chart-container">
              <AnimatedChart
                type="doughnut"
                data={statusData}
                options={chartOptions}
                height={chartHeight}
                animationType="smooth"
              />
            </Card>
          </Col>
        )}
        {showSourceChart && (
          <Col xs={24} lg={showStatusChart ? 12 : 24}>
            <Card title="Лиды по источникам" size={size} className="chart-container">
              <AnimatedChart
                type="bar"
                data={sourceData}
                options={sourceChartOptions}
                height={chartHeight}
                animationType="smooth"
              />
            </Card>
          </Col>
        )}
      </Row>

      {showFunnelChart && (
        <Row gutter={16}>
          <Col xs={24}>
            <Card title="Воронка конверсии" size={size} className="chart-container">
              <AnimatedChart
                type="bar"
                data={funnelData}
                options={funnelChartOptions}
                height={chartHeight}
                animationType="smooth"
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Drill-Down Modal */}
      <DrillDownModal
        visible={drillDownVisible}
        onClose={() => setDrillDownVisible(false)}
        title={drillDownTitle}
        data={drillDownData}
        columns={drillDownColumns}
        segmentLabel={drillDownSegment}
        onItemClick={(record) => {
          if (onLeadClick) {
            onLeadClick(record);
          }
          setDrillDownVisible(false);
        }}
      />
    </Space>
  );
}

export default LeadAnalyticsCard;
