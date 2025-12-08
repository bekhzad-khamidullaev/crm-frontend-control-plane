import React, { useEffect, useRef, useState } from 'react';
import { 
  Row, Col, Card, Statistic, Table, Tag, Typography, Space, Select, Button, Tooltip,
  Timeline, Avatar, List, Divider 
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  FundProjectionScreenOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import Chart from 'chart.js/auto';
import AnalyticsCard from '../components/analytics/AnalyticsCard.jsx';
import PredictionChart from '../components/analytics/PredictionChart.jsx';
import AnalyticsStatusBanner from '../components/analytics/AnalyticsStatusBanner.jsx';
import { getOverview, getDashboardAnalytics, getFunnelData, getActivityFeed } from '../lib/api/analytics.js';
import { t } from '../lib/i18n';

const { Title, Text } = Typography;
const { Option } = Select;

function Dashboard() {
  const [period, setPeriod] = useState('30d');
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [activity, setActivity] = useState([]);
  // Loading states
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingFunnel, setLoadingFunnel] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  // Errors
  const [overviewError, setOverviewError] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [funnelError, setFunnelError] = useState(null);
  const [activityError, setActivityError] = useState(null);

  const chartRefs = {
    leadSource: useRef(null),
    leadStatus: useRef(null),
    revenue: useRef(null),
    funnelChart: useRef(null),
    monthlyGrowth: useRef(null),
  };
  const chartInstances = useRef({});

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    setOverviewError(null); setAnalyticsError(null); setFunnelError(null); setActivityError(null);
    setLoadingOverview(true); setLoadingAnalytics(true); setLoadingFunnel(true); setLoadingActivity(true);
    await Promise.allSettled([
      (async () => {
        try { const res = await getOverview(); setOverview(res); }
        catch (e) { setOverviewError(e); }
        finally { setLoadingOverview(false); }
      })(),
      (async () => {
        try { const res = await getDashboardAnalytics({ period }); setAnalytics(res); }
        catch (e) { setAnalyticsError(e); }
        finally { setLoadingAnalytics(false); }
      })(),
      (async () => {
        try { const res = await getFunnelData({ period }); setFunnel(res || []); }
        catch (e) { setFunnelError(e); }
        finally { setLoadingFunnel(false); }
      })(),
      (async () => {
        try { const res = await getActivityFeed({ period }); setActivity(res || []); }
        catch (e) { setActivityError(e); }
        finally { setLoadingActivity(false); }
      })(),
    ]);
  };

  // Build charts after data loads
  useEffect(() => {
    if (loadingAnalytics || !analytics) return;

    // Destroy old charts
    Object.keys(chartInstances.current).forEach((key) => {
      if (chartInstances.current[key]) {
        chartInstances.current[key].destroy();
      }
    });

    buildCharts();

    return () => {
      Object.keys(chartInstances.current).forEach((key) => {
        if (chartInstances.current[key]) {
          chartInstances.current[key].destroy();
        }
      });
    };
  }, [loadingAnalytics, analytics]);

  const buildCharts = () => {
    // Monthly Growth Chart (Revenue)
    if (chartRefs.revenue.current && analytics?.monthly_growth) {
      const ctx = chartRefs.revenue.current.getContext('2d');
      chartInstances.current.revenue = new Chart(ctx, {
        type: 'line',
        data: {
          labels: analytics.monthly_growth.labels,
          datasets: [
            {
              label: 'Выручка',
              data: analytics.monthly_growth.revenue,
              borderColor: 'rgb(22, 119, 255)',
              backgroundColor: 'rgba(22, 119, 255, 0.1)',
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => {
                  return new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    minimumFractionDigits: 0,
                  }).format(context.parsed.y);
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: (value) => {
                  return new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    minimumFractionDigits: 0,
                    notation: 'compact',
                  }).format(value);
                },
              },
            },
          },
        },
      });
    }

    // Monthly Growth Chart (Leads & Deals)
    if (chartRefs.monthlyGrowth.current && analytics?.monthly_growth) {
      const ctx = chartRefs.monthlyGrowth.current.getContext('2d');
      chartInstances.current.monthlyGrowth = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: analytics.monthly_growth.labels,
          datasets: [
            {
              label: 'Лиды',
              data: analytics.monthly_growth.leads,
              backgroundColor: 'rgba(82, 196, 26, 0.6)',
              borderColor: 'rgb(82, 196, 26)',
              borderWidth: 1,
            },
            {
              label: 'Сделки',
              data: analytics.monthly_growth.deals,
              backgroundColor: 'rgba(22, 119, 255, 0.6)',
              borderColor: 'rgb(22, 119, 255)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
          },
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    }

    // Lead Sources Chart
    if (chartRefs.leadSource.current && analytics) {
      const leadSources = [
        { label: 'Реклама', value: 120 },
        { label: 'Рекомендации', value: 85 },
        { label: 'Email/Холодные', value: 62 },
        { label: 'Вебинар', value: 30 },
      ];

      const ctx = chartRefs.leadSource.current.getContext('2d');
      chartInstances.current.leadSource = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: leadSources.map((s) => s.label),
          datasets: [
            {
              data: leadSources.map((s) => s.value),
              backgroundColor: [
                'rgba(22, 119, 255, 0.8)',
                'rgba(82, 196, 26, 0.8)',
                'rgba(250, 140, 22, 0.8)',
                'rgba(114, 46, 209, 0.8)',
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
          },
        },
      });
    }

    // Lead Status Chart
    if (chartRefs.leadStatus.current && analytics) {
      const leadStatus = [
        { label: 'Новые', value: 68 },
        { label: 'В работе', value: 92 },
        { label: 'Дисквалифицированы', value: 23 },
        { label: 'Конвертированы', value: 62 },
      ];

      const ctx = chartRefs.leadStatus.current.getContext('2d');
      chartInstances.current.leadStatus = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: leadStatus.map((s) => s.label),
          datasets: [
            {
              label: 'Количество',
              data: leadStatus.map((s) => s.value),
              backgroundColor: [
                'rgba(24, 144, 255, 0.6)',
                'rgba(250, 173, 20, 0.6)',
                'rgba(255, 77, 79, 0.6)',
                'rgba(82, 196, 26, 0.6)',
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    }

    // Funnel Chart
    if (chartRefs.funnelChart.current && funnel.length > 0) {
      const ctx = chartRefs.funnelChart.current.getContext('2d');
      chartInstances.current.funnelChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: funnel.map((f) => f.label),
          datasets: [
            {
              label: 'Сумма',
              data: funnel.map((f) => f.value),
              backgroundColor: 'rgba(22, 119, 255, 0.6)',
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const item = funnel[context.dataIndex];
                  return [
                    `Сумма: ${new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      minimumFractionDigits: 0,
                    }).format(context.parsed.x)}`,
                    `Сделок: ${item.deals}`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: (value) => {
                  return new Intl.NumberFormat('ru-RU', {
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(value);
                },
              },
            },
          },
        },
      });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'lead_created':
        return <UserOutlined style={{ color: '#1677ff' }} />;
      case 'deal_won':
        return <TrophyOutlined style={{ color: '#52c41a' }} />;
      case 'contact_updated':
        return <TeamOutlined style={{ color: '#fa8c16' }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    return `${diffDays} дн назад`;
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space align="center" size={12}>
            <Title level={2} style={{ margin: 0 }}>
              <LineChartOutlined /> Аналитика и дашборд
            </Title>
            {analyticsError && (
              <Tooltip title={t('dashboard.analytics.partialTooltip')}>
                <Tag icon={<WarningOutlined />} color="warning" style={{ fontSize: 12, padding: '2px 8px' }}>
                  Частично доступен
                </Tag>
              </Tooltip>
            )}
          </Space>
        </Col>
        <Col>
          <Space>
            <Text>Период:</Text>
            <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
              <Option value="7d">7 дней</Option>
              <Option value="30d">30 дней</Option>
              <Option value="90d">90 дней</Option>
            </Select>
            <Button onClick={loadDashboardData}>Обновить</Button>
          </Space>
        </Col>
      </Row>

      {/* Analytics-only banner */}
      {analyticsError && (
        <AnalyticsStatusBanner
          message="Аналитика временно недоступна (ошибка сервера)"
          details={analyticsError?.message}
          onRetry={loadDashboardData}
        />
      )}

      {/* Key Metrics (independent) */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Всего лидов"
                  value={overview?.total_leads || 0}
                  prefix={<UserOutlined />}
                  suffix={
                    overview?.leads_growth > 0 ? (
                      <Tag color="success" icon={<ArrowUpOutlined />}>
                        +{overview.leads_growth}%
                      </Tag>
                    ) : null
                  }
                  loading={loadingOverview}
                />
              </Card>
            </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Всего контактов"
              value={overview?.total_contacts || 0}
              prefix={<TeamOutlined />}
              loading={loadingOverview}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Всего сделок"
              value={overview?.total_deals || 0}
              prefix={<TrophyOutlined />}
              suffix={
                overview?.deals_growth > 0 ? (
                  <Tag color="success" icon={<ArrowUpOutlined />}>
                    +{overview.deals_growth}%
                  </Tag>
                ) : null
              }
              loading={loadingOverview}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Выручка"
              value={overview?.total_revenue || 0}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(value)}
              suffix={
                overview?.revenue_growth > 0 ? (
                  <Tag color="success" icon={<ArrowUpOutlined />}>
                    +{overview.revenue_growth}%
                  </Tag>
                ) : null
              }
              loading={loadingOverview}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 (hidden when analytics error) */}
      {!analyticsError && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <AnalyticsCard title="Динамика выручки" loading={loadingAnalytics} error={undefined}>
              <div style={{ height: 300 }}>
                <canvas ref={chartRefs.revenue}></canvas>
              </div>
            </AnalyticsCard>
          </Col>
          <Col xs={24} lg={12}>
            <AnalyticsCard title="Рост лидов и сделок" loading={loadingAnalytics} error={undefined}>
              <div style={{ height: 300 }}>
                <canvas ref={chartRefs.monthlyGrowth}></canvas>
              </div>
            </AnalyticsCard>
          </Col>
        </Row>
      )}

      {/* Prediction Chart (hidden when analytics error) */}
      {!analyticsError && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <AnalyticsCard 
              title={
                <Space>
                  <FundProjectionScreenOutlined />
                  <span>{t('dashboard.analytics.predictionTitle')}</span>
                </Space>
              }
              loading={loadingAnalytics} 
              error={undefined}
            >
              {analytics?.prediction && (
                <PredictionChart
                  labels={analytics.prediction.labels}
                  predictedData={analytics.prediction.predicted_revenue}
                  confidenceLower={analytics.prediction.confidence_lower}
                  confidenceUpper={analytics.prediction.confidence_upper}
                  title="Прогнозируемая выручка на следующие 6 месяцев"
                  height={350}
                />
              )}
            </AnalyticsCard>
          </Col>
        </Row>
      )}

      {/* Charts Row 2 (hidden when analytics error) */}
      {!analyticsError && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={12} lg={8}>
            <AnalyticsCard title="Источники лидов" loading={loadingAnalytics} error={undefined}>
              <div style={{ height: 300 }}>
                <canvas ref={chartRefs.leadSource}></canvas>
              </div>
            </AnalyticsCard>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <AnalyticsCard title="Статус лидов" loading={loadingAnalytics} error={undefined}>
              <div style={{ height: 300 }}>
                <canvas ref={chartRefs.leadStatus}></canvas>
              </div>
            </AnalyticsCard>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <AnalyticsCard title="Воронка продаж" loading={loadingFunnel} error={funnelError}>
              <div style={{ height: 300 }}>
                <canvas ref={chartRefs.funnelChart}></canvas>
              </div>
            </AnalyticsCard>
          </Col>
        </Row>
      )}

      {/* Activity Feed & Tasks */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <AnalyticsCard title="Последняя активность" loading={loadingActivity} error={activityError}>
            <List
              itemLayout="horizontal"
              dataSource={activity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={getActivityIcon(item.type)} />}
                    title={item.title}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">{item.description}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.user} • {formatTimeAgo(item.timestamp)}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </AnalyticsCard>
        </Col>
        <Col xs={24} lg={12}>
          <AnalyticsCard title="Статистика задач" loading={loadingAnalytics} error={analyticsError}>
            {!analyticsError && analytics?.tasks_by_status && (
              <div style={{ padding: '20px 0' }}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="В ожидании"
                      value={analytics.tasks_by_status.pending}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="В работе"
                      value={analytics.tasks_by_status.in_progress}
                      valueStyle={{ color: '#1677ff' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Завершено"
                      value={analytics.tasks_by_status.completed}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Просрочено"
                      value={analytics.tasks_by_status.overdue}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                </Row>
                <Divider />
                <div style={{ textAlign: 'center' }}>
                  <Text strong style={{ fontSize: 16 }}>
                    Конверсия: {overview?.conversion_rate ?? 0}%
                  </Text>
                </div>
              </div>
            )}
          </AnalyticsCard>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
