import React, { useEffect, useMemo, useState } from 'react';
import {
  App,
  Tabs,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  List,
  Avatar,
  Table,
  Empty,
  Tag,
} from 'antd';
import {
  ReloadOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
} from '@ant-design/icons';
import 'chart.js/auto';
import { api } from '../lib/api/client.js';
import { getOverview, getDashboardAnalytics, getFunnelData, getActivityFeed } from '../lib/api/analytics.js';
import predictions from '../lib/api/predictions.js';
import { AnalyticsCard, AnimatedChart, PredictionChart } from '../components/analytics';
import { formatCurrency } from '../lib/utils/format.js';

const { Text, Title } = Typography;

const chartColors = {
  primary: 'rgba(24, 144, 255, 0.7)',
  primaryBorder: 'rgba(24, 144, 255, 1)',
  success: 'rgba(82, 196, 26, 0.7)',
  successBorder: 'rgba(82, 196, 26, 1)',
};

function normalizeSeries(data) {
  if (!data) return { labels: [], values: [] };

  if (Array.isArray(data)) {
    const labels = data.map(
      (item, index) =>
        item?.label ||
        item?.date ||
        item?.period ||
        item?.name ||
        item?.stage ||
        item?.month ||
        `Серия ${index + 1}`
    );
    const values = data.map((item) =>
      Number(item?.value ?? item?.count ?? item?.total ?? item?.amount ?? item?.y ?? 0)
    );
    return { labels, values };
  }

  if (Array.isArray(data?.labels)) {
    const values =
      data.values ||
      data.data ||
      data.series ||
      data.predicted ||
      data.forecast ||
      data.revenue ||
      data.counts ||
      [];
    return { labels: data.labels, values };
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data);
    return {
      labels: entries.map(([key]) => key),
      values: entries.map(([, value]) => Number(value) || 0),
    };
  }

  return { labels: [], values: [] };
}

function buildPredictionPayload(data, fallbackTitle) {
  if (!data) return null;

  if (Array.isArray(data.labels)) {
    const predicted =
      data.predicted_revenue || data.predicted || data.values || data.data || data.forecast || [];
    if (Array.isArray(predicted) && predicted.length) {
      return {
        type: 'interval',
        title: fallbackTitle,
        labels: data.labels,
        predictedData: predicted,
        confidenceLower: data.confidence_lower || [],
        confidenceUpper: data.confidence_upper || [],
      };
    }
  }

  const series = normalizeSeries(data);
  if (!series.labels.length) return null;

  return {
    type: 'series',
    title: fallbackTitle,
    labels: series.labels,
    values: series.values,
  };
}

function buildTableColumns(rows) {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]).slice(0, 6);
  return keys.map((key) => ({
    title: key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    dataIndex: key,
    key,
    render: (value) => {
      if (value === null || value === undefined || value === '') return '-';
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    },
  }));
}

function formatScalarValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function renderGrowthTag(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  const numeric = Number(value);
  if (numeric === 0) return null;
  const isPositive = numeric > 0;
  return (
    <Tag color={isPositive ? 'success' : 'error'} icon={isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}>
      {Math.abs(numeric)}%
    </Tag>
  );
}

export default function AnalyticsPage() {
  const { message } = App.useApp();
  const [period, setPeriod] = useState('30d');
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [activity, setActivity] = useState([]);
  const [authStats, setAuthStats] = useState(null);
  const [predictionStatus, setPredictionStatus] = useState(null);
  const [revenueForecast, setRevenueForecast] = useState(null);
  const [leadsForecast, setLeadsForecast] = useState(null);
  const [clientsForecast, setClientsForecast] = useState(null);
  const [nextActionsClients, setNextActionsClients] = useState([]);
  const [nextActionsDeals, setNextActionsDeals] = useState([]);

  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingFunnel, setLoadingFunnel] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [loadingAuthStats, setLoadingAuthStats] = useState(false);

  const [overviewError, setOverviewError] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [funnelError, setFunnelError] = useState(null);
  const [activityError, setActivityError] = useState(null);
  const [predictionError, setPredictionError] = useState(null);
  const [authError, setAuthError] = useState(null);

  const loadCore = async () => {
    setOverviewError(null);
    setAnalyticsError(null);
    setFunnelError(null);
    setActivityError(null);
    setLoadingOverview(true);
    setLoadingAnalytics(true);
    setLoadingFunnel(true);
    setLoadingActivity(true);

    await Promise.allSettled([
      (async () => {
        try {
          setOverview(await getOverview());
        } catch (error) {
          setOverviewError(error);
        } finally {
          setLoadingOverview(false);
        }
      })(),
      (async () => {
        try {
          setAnalytics(await getDashboardAnalytics({ period }));
        } catch (error) {
          setAnalyticsError(error);
        } finally {
          setLoadingAnalytics(false);
        }
      })(),
      (async () => {
        try {
          const data = await getFunnelData({ period });
          setFunnel(Array.isArray(data) ? data : data?.results || []);
        } catch (error) {
          setFunnelError(error);
        } finally {
          setLoadingFunnel(false);
        }
      })(),
      (async () => {
        try {
          const data = await getActivityFeed({ period });
          setActivity(Array.isArray(data) ? data : data?.results || []);
        } catch (error) {
          setActivityError(error);
        } finally {
          setLoadingActivity(false);
        }
      })(),
    ]);
  };

  const loadPredictions = async () => {
    setPredictionError(null);
    setLoadingPredictions(true);
    await Promise.allSettled([
      (async () => {
        try {
          setPredictionStatus(await predictions.status());
        } catch (error) {
          setPredictionError(error);
        }
      })(),
      (async () => {
        try {
          setRevenueForecast(await predictions.revenue.forecast());
        } catch (error) {
          setPredictionError(error);
        }
      })(),
      (async () => {
        try {
          setLeadsForecast(await predictions.leads.forecast());
        } catch (error) {
          setPredictionError(error);
        }
      })(),
      (async () => {
        try {
          setClientsForecast(await predictions.clients.forecast());
        } catch (error) {
          setPredictionError(error);
        }
      })(),
      (async () => {
        try {
          const data = await predictions.nextActions.clients();
          setNextActionsClients(Array.isArray(data) ? data : data?.results || []);
        } catch (error) {
          setPredictionError(error);
        }
      })(),
      (async () => {
        try {
          const data = await predictions.nextActions.deals();
          setNextActionsDeals(Array.isArray(data) ? data : data?.results || []);
        } catch (error) {
          setPredictionError(error);
        }
      })(),
    ]);
    setLoadingPredictions(false);
  };

  const loadAuthStats = async () => {
    setAuthError(null);
    setLoadingAuthStats(true);
    try {
      setAuthStats(await api.get('/api/auth-stats/'));
    } catch (error) {
      setAuthError(error);
    } finally {
      setLoadingAuthStats(false);
    }
  };

  const handleRefresh = () => {
    loadCore();
    loadPredictions();
    loadAuthStats();
    message.success('Данные обновлены');
  };

  const handleRunPredictions = async () => {
    setLoadingPredictions(true);
    try {
      await predictions.predictAll();
      message.success('Прогнозы запущены');
      await loadPredictions();
    } catch (error) {
      message.error('Не удалось запустить прогнозы');
    } finally {
      setLoadingPredictions(false);
    }
  };

  useEffect(() => {
    loadCore();
  }, [period]);

  useEffect(() => {
    loadPredictions();
    loadAuthStats();
  }, []);

  const monthlyGrowth = analytics?.monthly_growth;
  const revenueChartData = useMemo(() => {
    if (!monthlyGrowth?.labels) return null;
    return {
      labels: monthlyGrowth.labels,
      datasets: [
        {
          label: 'Выручка',
          data: monthlyGrowth.revenue || [],
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primaryBorder,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [monthlyGrowth]);

  const leadsDealsChartData = useMemo(() => {
    if (!monthlyGrowth?.labels) return null;
    return {
      labels: monthlyGrowth.labels,
      datasets: [
        {
          label: 'Лиды',
          data: monthlyGrowth.leads || [],
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primaryBorder,
          borderWidth: 2,
        },
        {
          label: 'Сделки',
          data: monthlyGrowth.deals || [],
          backgroundColor: chartColors.success,
          borderColor: chartColors.successBorder,
          borderWidth: 2,
        },
      ],
    };
  }, [monthlyGrowth]);

  const funnelChartData = useMemo(() => {
    const items = Array.isArray(funnel) ? funnel : [];
    const labels = items.map((item, index) => item?.label || item?.stage || item?.name || `Этап ${index + 1}`);
    const values = items.map((item) => Number(item?.value ?? item?.count ?? 0));
    if (!labels.length) return null;
    return {
      labels,
      datasets: [
        {
          label: 'Воронка продаж',
          data: values,
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primaryBorder,
          borderWidth: 2,
        },
      ],
    };
  }, [funnel]);

  const activityItems = useMemo(() => {
    const list = Array.isArray(activity) ? activity : [];
    return list.slice(0, 20);
  }, [activity]);

  const revenuePrediction = useMemo(
    () => buildPredictionPayload(revenueForecast, 'Прогноз выручки'),
    [revenueForecast]
  );
  const leadsPrediction = useMemo(
    () => buildPredictionPayload(leadsForecast, 'Прогноз лидов'),
    [leadsForecast]
  );
  const clientsPrediction = useMemo(
    () => buildPredictionPayload(clientsForecast, 'Прогноз клиентов'),
    [clientsForecast]
  );

  const nextActionsClientsColumns = useMemo(() => buildTableColumns(nextActionsClients), [nextActionsClients]);
  const nextActionsDealsColumns = useMemo(() => buildTableColumns(nextActionsDeals), [nextActionsDeals]);

  const tabs = [
    {
      key: 'overview',
      label: 'Обзор',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <AnalyticsCard title="Ключевые показатели" loading={loadingOverview} error={overviewError}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="Всего лидов"
                  value={overview?.total_leads || 0}
                  suffix={renderGrowthTag(overview?.leads_growth)}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic title="Всего контактов" value={overview?.total_contacts || 0} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="Всего сделок"
                  value={overview?.total_deals || 0}
                  suffix={renderGrowthTag(overview?.deals_growth)}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="Выручка"
                  value={overview?.total_revenue || 0}
                  formatter={(value) => formatCurrency(value)}
                  suffix={renderGrowthTag(overview?.revenue_growth)}
                />
              </Col>
            </Row>
            {overview?.conversion_rate !== undefined && (
              <Text type="secondary">Конверсия: {overview.conversion_rate}%</Text>
            )}
          </AnalyticsCard>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <AnalyticsCard title="Динамика выручки" loading={loadingAnalytics} error={analyticsError}>
                {revenueChartData ? (
                  <AnimatedChart type="line" data={revenueChartData} height={280} />
                ) : (
                  <Empty description="Нет данных" />
                )}
              </AnalyticsCard>
            </Col>
            <Col xs={24} lg={12}>
              <AnalyticsCard title="Лиды и сделки" loading={loadingAnalytics} error={analyticsError}>
                {leadsDealsChartData ? (
                  <AnimatedChart type="bar" data={leadsDealsChartData} height={280} />
                ) : (
                  <Empty description="Нет данных" />
                )}
              </AnalyticsCard>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <AnalyticsCard title="Воронка продаж" loading={loadingFunnel} error={funnelError}>
                {funnelChartData ? (
                  <AnimatedChart type="bar" data={funnelChartData} height={280} />
                ) : (
                  <Empty description="Нет данных" />
                )}
              </AnalyticsCard>
            </Col>
            <Col xs={24} lg={12}>
              <AnalyticsCard title="Статусы задач" loading={loadingAnalytics} error={analyticsError}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic title="Ожидают" value={analytics?.tasks_by_status?.pending || 0} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="В работе" value={analytics?.tasks_by_status?.in_progress || 0} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Завершены" value={analytics?.tasks_by_status?.completed || 0} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Просрочены" value={analytics?.tasks_by_status?.overdue || 0} />
                  </Col>
                </Row>
              </AnalyticsCard>
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: 'activity',
      label: 'Активность',
      children: (
        <AnalyticsCard title="Лента активности" loading={loadingActivity} error={activityError}>
          {activityItems.length ? (
            <List
              itemLayout="horizontal"
              dataSource={activityItems}
              renderItem={(item) => {
                const title =
                  item?.title ||
                  item?.action ||
                  item?.event ||
                  item?.message ||
                  'Событие';
                const description = item?.description || item?.details || item?.summary || '';
                const timestamp =
                  item?.timestamp || item?.created_at || item?.date || item?.created || '';
                const avatarLabel = (item?.user_name || item?.owner_name || 'U')[0]?.toUpperCase();

                return (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar>{avatarLabel || <UserOutlined />}</Avatar>}
                      title={
                        <Space>
                          <Text strong>{title}</Text>
                          {timestamp && <Text type="secondary">{timestamp}</Text>}
                        </Space>
                      }
                      description={description}
                    />
                  </List.Item>
                );
              }}
            />
          ) : (
            <Empty description="Нет данных" />
          )}
        </AnalyticsCard>
      ),
    },
    {
      key: 'predictions',
      label: 'Прогнозы',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={handleRunPredictions}
              loading={loadingPredictions}
            >
              Запустить прогнозы
            </Button>
            {predictionStatus && (
              <Text type="secondary">Статус: {predictionStatus?.status || 'в работе'}</Text>
            )}
          </Space>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <AnalyticsCard title="Прогноз выручки" loading={loadingPredictions} error={predictionError}>
                {revenuePrediction ? (
                  revenuePrediction.type === 'interval' ? (
                    <PredictionChart
                      title={revenuePrediction.title}
                      labels={revenuePrediction.labels}
                      predictedData={revenuePrediction.predictedData}
                      confidenceLower={revenuePrediction.confidenceLower}
                      confidenceUpper={revenuePrediction.confidenceUpper}
                      height={280}
                    />
                  ) : (
                    <AnimatedChart
                      type="line"
                      data={{
                        labels: revenuePrediction.labels,
                        datasets: [
                          {
                            label: revenuePrediction.title,
                            data: revenuePrediction.values,
                            borderColor: chartColors.primaryBorder,
                            backgroundColor: chartColors.primary,
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                          },
                        ],
                      }}
                      height={280}
                    />
                  )
                ) : (
                  <Empty description="Нет данных" />
                )}
              </AnalyticsCard>
            </Col>
            <Col xs={24} lg={12}>
              <AnalyticsCard title="Прогноз лидов" loading={loadingPredictions} error={predictionError}>
                {leadsPrediction ? (
                  leadsPrediction.type === 'interval' ? (
                    <PredictionChart
                      title={leadsPrediction.title}
                      labels={leadsPrediction.labels}
                      predictedData={leadsPrediction.predictedData}
                      confidenceLower={leadsPrediction.confidenceLower}
                      confidenceUpper={leadsPrediction.confidenceUpper}
                      height={280}
                    />
                  ) : (
                    <AnimatedChart
                      type="line"
                      data={{
                        labels: leadsPrediction.labels,
                        datasets: [
                          {
                            label: leadsPrediction.title,
                            data: leadsPrediction.values,
                            borderColor: chartColors.successBorder,
                            backgroundColor: chartColors.success,
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                          },
                        ],
                      }}
                      height={280}
                    />
                  )
                ) : (
                  <Empty description="Нет данных" />
                )}
              </AnalyticsCard>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <AnalyticsCard title="Прогноз клиентов" loading={loadingPredictions} error={predictionError}>
                {clientsPrediction ? (
                  clientsPrediction.type === 'interval' ? (
                    <PredictionChart
                      title={clientsPrediction.title}
                      labels={clientsPrediction.labels}
                      predictedData={clientsPrediction.predictedData}
                      confidenceLower={clientsPrediction.confidenceLower}
                      confidenceUpper={clientsPrediction.confidenceUpper}
                      height={280}
                    />
                  ) : (
                    <AnimatedChart
                      type="line"
                      data={{
                        labels: clientsPrediction.labels,
                        datasets: [
                          {
                            label: clientsPrediction.title,
                            data: clientsPrediction.values,
                            borderColor: chartColors.primaryBorder,
                            backgroundColor: chartColors.primary,
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                          },
                        ],
                      }}
                      height={280}
                    />
                  )
                ) : (
                  <Empty description="Нет данных" />
                )}
              </AnalyticsCard>
            </Col>
            <Col xs={24} lg={12}>
              <AnalyticsCard title="Статус прогнозов" loading={loadingPredictions} error={predictionError}>
                {predictionStatus ? (
                  <List
                    size="small"
                    dataSource={Object.entries(predictionStatus)}
                    renderItem={([key, value]) => (
                      <List.Item>
                        <Text strong>{key}</Text>
                        <Text>{formatScalarValue(value)}</Text>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="Нет данных" />
                )}
              </AnalyticsCard>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <AnalyticsCard title="Рекомендованные действия (клиенты)" loading={loadingPredictions} error={predictionError}>
                {nextActionsClients.length ? (
                  <Table
                    dataSource={nextActionsClients}
                    columns={nextActionsClientsColumns}
                    rowKey={(record, index) => record.id || record.pk || `client-${index}`}
                    pagination={{ pageSize: 5 }}
                  />
                ) : (
                  <Empty description="Нет данных" />
                )}
              </AnalyticsCard>
            </Col>
            <Col xs={24} lg={12}>
              <AnalyticsCard title="Рекомендованные действия (сделки)" loading={loadingPredictions} error={predictionError}>
                {nextActionsDeals.length ? (
                  <Table
                    dataSource={nextActionsDeals}
                    columns={nextActionsDealsColumns}
                    rowKey={(record, index) => record.id || record.pk || `deal-${index}`}
                    pagination={{ pageSize: 5 }}
                  />
                ) : (
                  <Empty description="Нет данных" />
                )}
              </AnalyticsCard>
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: 'auth-stats',
      label: 'Auth Stats',
      children: (
        <AnalyticsCard title="Auth Stats" loading={loadingAuthStats} error={authError}>
          {authStats ? (
            <List
              size="small"
              dataSource={Object.entries(authStats)}
              renderItem={([key, value]) => (
                <List.Item>
                  <Text strong>{key}</Text>
                  <Text>{formatScalarValue(value)}</Text>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Нет данных" />
          )}
        </AnalyticsCard>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Title level={3} style={{ margin: 0 }}>
          Аналитика
        </Title>
        <Space>
          <Text>Период:</Text>
          <Button
            type={period === '7d' ? 'primary' : 'default'}
            size="small"
            onClick={() => setPeriod('7d')}
          >
            7 дней
          </Button>
          <Button
            type={period === '30d' ? 'primary' : 'default'}
            size="small"
            onClick={() => setPeriod('30d')}
          >
            30 дней
          </Button>
          <Button
            type={period === '90d' ? 'primary' : 'default'}
            size="small"
            onClick={() => setPeriod('90d')}
          >
            90 дней
          </Button>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
          Обновить
        </Button>
      </Space>

      <Tabs items={tabs} />
    </div>
  );
}
