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
  Descriptions,
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

const riskToneStyles = {
  danger: {
    borderColor: '#fecaca',
    background: '#fef2f2',
  },
  warning: {
    borderColor: '#fde68a',
    background: '#fffbeb',
  },
  neutral: {
    borderColor: '#e5e7eb',
    background: '#ffffff',
  },
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

function prettifyKey(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractPredictionCount(metricObject) {
  if (metricObject === null || metricObject === undefined) return Number.NaN;
  if (typeof metricObject === 'number') return Number(metricObject);
  if (typeof metricObject !== 'object' || Array.isArray(metricObject)) return Number(metricObject);

  const countCandidate =
    metricObject.count ??
    metricObject.total ??
    metricObject.value ??
    metricObject.items ??
    metricObject.records;

  if (typeof countCandidate === 'object') return Number.NaN;

  const numeric = Number(countCandidate);
  return Number.isNaN(numeric) ? Number.NaN : numeric;
}

function formatPredictionStatusLabel(status, count, rawValue) {
  if (typeof status === 'string' && status.trim()) {
    return prettifyKey(status.trim());
  }

  if (typeof rawValue === 'string' && rawValue.trim()) {
    return prettifyKey(rawValue.trim());
  }

  if (!Number.isNaN(count)) {
    if (count === 0) return 'Пусто';
    if (count === 1) return '1 запись';
    return `${count} записей`;
  }

  if (rawValue === null || rawValue === undefined) {
    return 'Нет данных';
  }

  return 'Технический статус';
}

function normalizePredictionStatus(statusPayload) {
  if (!statusPayload || typeof statusPayload !== 'object') return [];

  const rows = [];

  Object.entries(statusPayload).forEach(([groupKey, groupValue]) => {
    if (!groupValue || typeof groupValue !== 'object' || Array.isArray(groupValue)) {
      rows.push({
        key: `${groupKey}-value`,
        groupKey,
        groupLabel: prettifyKey(groupKey),
        metricKey: groupKey,
        metricLabel: prettifyKey(groupKey),
        count: extractPredictionCount(groupValue),
        status: typeof groupValue === 'string' ? groupValue : null,
        rawValue: groupValue,
      });
      return;
    }

    Object.entries(groupValue).forEach(([metricKey, metricValue]) => {
      const metricObject =
        metricValue && typeof metricValue === 'object' && !Array.isArray(metricValue)
          ? metricValue
          : { value: metricValue };
      const count = extractPredictionCount(metricObject);
      const status = metricObject.status || metricObject.state || null;
      rows.push({
        key: `${groupKey}-${metricKey}`,
        groupKey,
        groupLabel: prettifyKey(groupKey),
        metricKey,
        metricLabel: prettifyKey(metricKey),
        count,
        status: formatPredictionStatusLabel(status, count, metricValue),
        rawValue: metricValue,
      });
    });
  });

  return rows;
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
  const predictionStatusRows = useMemo(
    () =>
      normalizePredictionStatus(predictionStatus).filter((row) =>
        !Number.isNaN(row.count) || row.status || row.rawValue !== null
      ),
    [predictionStatus]
  );
  const predictionStatusChartData = useMemo(() => {
    const rowsWithCount = predictionStatusRows.filter((row) => !Number.isNaN(row.count));
    if (!rowsWithCount.length) return null;

    return {
      labels: rowsWithCount.map((row) => `${row.groupLabel}: ${row.metricLabel}`),
      datasets: [
        {
          label: 'Количество',
          data: rowsWithCount.map((row) => row.count),
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primaryBorder,
          borderWidth: 2,
        },
      ],
    };
  }, [predictionStatusRows]);
  const authStatsSections = useMemo(() => normalizeAuthStats(authStats), [authStats]);

  const overdueTasks = Number(analytics?.tasks_by_status?.overdue || 0);
  const pendingTasks = Number(analytics?.tasks_by_status?.pending || 0);
  const conversionRate = Number(overview?.conversion_rate || 0);
  const revenueGrowth = Number(overview?.revenue_growth || 0);
  const executiveSummary = [
    overdueTasks > 0 ? `Просрочено задач: ${overdueTasks}` : null,
    conversionRate ? `Конверсия: ${conversionRate}%` : null,
    revenueGrowth ? `Рост выручки: ${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}%` : null,
  ].filter(Boolean).join(' • ');

  const focusCards = [
    {
      key: 'pipeline',
      title: 'Сделки в работе',
      value: overview?.total_deals || 0,
      description: 'Общий объём коммерческой работы в системе.',
    },
    {
      key: 'pending',
      title: 'Задачи в ожидании',
      value: pendingTasks,
      description: 'Показывает текущую нагрузку на команду.',
    },
    {
      key: 'predictions',
      title: 'Активные прогнозы',
      value: predictionStatusRows.length,
      description: 'Сколько прогнозных сигналов уже доступно для анализа.',
    },
  ];

  const riskCards = [
    {
      key: 'overdue',
      title: 'Просроченные задачи',
      value: overdueTasks,
      description: 'Требуют реакции в первую очередь.',
      tone: overdueTasks > 0 ? 'danger' : 'neutral',
    },
    {
      key: 'conversion',
      title: 'Конверсия',
      value: `${conversionRate}%`,
      description: 'Если метрика ниже ожиданий, проверьте follow-up и качество входящего потока.',
      tone: conversionRate > 0 && conversionRate < 15 ? 'warning' : 'neutral',
    },
    {
      key: 'growth',
      title: 'Рост выручки',
      value: `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}%`,
      description: 'Сигнал о текущем темпе продаж за период.',
      tone: revenueGrowth < 0 ? 'danger' : 'neutral',
    },
  ];

  const tabs = [
    {
      key: 'overview',
      label: 'Решения',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <AnalyticsSection
            title="Исполнительное резюме"
            description={executiveSummary || 'Сводка ключевых метрик и рисков за выбранный период.'}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Row gutter={[16, 16]}>
                  {focusCards.map((card) => (
                    <Col xs={24} md={8} key={card.key}>
                      <DecisionCard {...card} />
                    </Col>
                  ))}
                </Row>
              </Col>
              <Col xs={24} lg={8}>
                <AnalyticsCard title="Риски" loading={loadingAnalytics || loadingOverview} error={analyticsError || overviewError}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {riskCards.map((risk) => (
                      <RiskRow key={risk.key} {...risk} />
                    ))}
                  </Space>
                </AnalyticsCard>
              </Col>
            </Row>
          </AnalyticsSection>

          <AnalyticsSection
            title="Ключевые показатели"
            description="Быстрый снимок по объёму базы, сделкам и выручке."
          >
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
          </AnalyticsSection>

          <AnalyticsSection
            title="Тренды"
            description="Динамика выручки и движения по воронке для оценки темпа."
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <AnalyticsCard title="Динамика выручки" loading={loadingAnalytics} error={analyticsError}>
                  {revenueChartData ? (
                    <AnimatedChart type="line" data={revenueChartData} height={280} />
                  ) : (
                    <Empty description="Нет данных по выручке" />
                  )}
                </AnalyticsCard>
              </Col>
              <Col xs={24} lg={12}>
                <AnalyticsCard title="Лиды и сделки" loading={loadingAnalytics} error={analyticsError}>
                  {leadsDealsChartData ? (
                    <AnimatedChart type="bar" data={leadsDealsChartData} height={280} />
                  ) : (
                    <Empty description="Нет данных по лидам и сделкам" />
                  )}
                </AnalyticsCard>
              </Col>
            </Row>
          </AnalyticsSection>

          <AnalyticsSection
            title="Операционный контроль"
            description="Что происходит с воронкой и задачами команды прямо сейчас."
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <AnalyticsCard title="Воронка продаж" loading={loadingFunnel} error={funnelError}>
                  {funnelChartData ? (
                    <AnimatedChart type="bar" data={funnelChartData} height={280} />
                  ) : (
                    <Empty description="Нет данных по воронке" />
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
          </AnalyticsSection>
        </Space>
      ),
    },
    {
      key: 'activity',
      label: 'Команда',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <AnalyticsSection
            title="Активность команды"
            description="Последние действия пользователей и системный auth-снимок."
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
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
                    <Empty description="Нет активности за период" />
                  )}
                </AnalyticsCard>
              </Col>
              <Col xs={24} lg={8}>
                <AnalyticsCard title="Auth snapshot" loading={loadingAuthStats} error={authError}>
                  {authStats ? (
                    <AuthStatsSnapshot sections={authStatsSections} />
                  ) : (
                    <Empty description="Нет auth-данных" />
                  )}
                </AnalyticsCard>
              </Col>
            </Row>
          </AnalyticsSection>
        </Space>
      ),
    },
    {
      key: 'predictions',
      label: 'Прогнозы и действия',
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

          <AnalyticsSection
            title="Прогнозы по ключевым метрикам"
            description="Оценка будущей выручки, лидов и клиентской базы."
          >
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
                    <Empty description="Нет прогноза по выручке" />
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
                    <Empty description="Нет прогноза по лидам" />
                  )}
                </AnalyticsCard>
              </Col>
            </Row>
          </AnalyticsSection>

          <AnalyticsSection
            title="Состояние прогнозных моделей"
            description="Текущее состояние моделей и доступных сигналов."
          >
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
                    <Empty description="Нет прогноза по клиентам" />
                  )}
                </AnalyticsCard>
              </Col>
              <Col xs={24} lg={12}>
                <AnalyticsCard title="Статус прогнозов" loading={loadingPredictions} error={predictionError}>
                  {predictionStatusRows.length ? (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {predictionStatusChartData ? (
                        <AnimatedChart type="bar" data={predictionStatusChartData} height={220} />
                      ) : null}

                      <Table
                        size="small"
                        pagination={false}
                        dataSource={predictionStatusRows}
                        columns={[
                          {
                            title: 'Группа',
                            dataIndex: 'groupLabel',
                            key: 'groupLabel',
                            render: (value) => <Text strong>{value}</Text>,
                          },
                          {
                            title: 'Метрика',
                            dataIndex: 'metricLabel',
                            key: 'metricLabel',
                          },
                          {
                            title: 'Количество',
                            dataIndex: 'count',
                            key: 'count',
                            render: (value) =>
                              Number.isNaN(value) ? <Text type="secondary">-</Text> : <Text>{value}</Text>,
                          },
                          {
                            title: 'Статус',
                            dataIndex: 'status',
                            key: 'status',
                            render: (value) => <Text type="secondary">{value || 'Нет данных'}</Text>,
                          },
                        ]}
                        rowKey="key"
                      />
                    </Space>
                  ) : (
                    <Empty description="Нет статуса прогнозов" />
                  )}
                </AnalyticsCard>
              </Col>
            </Row>
          </AnalyticsSection>

          <AnalyticsSection
            title="Рекомендованные действия"
            description="Следующие действия, которые модель считает приоритетными."
          >
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
                    <Empty description="Нет рекомендаций по клиентам" />
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
                    <Empty description="Нет рекомендаций по сделкам" />
                  )}
                </AnalyticsCard>
              </Col>
            </Row>
          </AnalyticsSection>
        </Space>
      ),
    },
    {
      key: 'system',
      label: 'Система',
      children: (
        <AnalyticsSection
          title="Системные метрики"
          description="Служебные auth-показатели и технический срез по системе."
        >
          <AnalyticsCard title="Auth Stats" loading={loadingAuthStats} error={authError}>
            {authStats ? (
              <AuthStatsDetails sections={authStatsSections} />
            ) : (
              <Empty description="Нет системных данных" />
            )}
          </AnalyticsCard>
        </AnalyticsSection>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>Аналитика</Title>
          <Text type="secondary">Экран для принятия решений по продажам, активности команды и прогнозам.</Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            Обновить
          </Button>
        </Space>
      </Space>

      <Tabs
        items={tabs}
        activeKey={period === '7d' || period === '30d' || period === '90d' ? undefined : undefined}
      />
    </Space>
  );
}

function AnalyticsSection({ title, description, children }) {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Title level={4} style={{ marginBottom: 4 }}>{title}</Title>
        {description ? <Text type="secondary">{description}</Text> : null}
      </div>
      {children}
    </Space>
  );
}

function DecisionCard({ title, value, description }) {
  return (
    <AnalyticsCard title={title} loading={false} error={null}>
      <Space direction="vertical" size="small">
        <Text strong style={{ fontSize: 28, lineHeight: 1.1 }}>{value ?? 0}</Text>
        <Text type="secondary">{description}</Text>
      </Space>
    </AnalyticsCard>
  );
}

function RiskRow({ title, value, description, tone }) {
  const toneStyle = riskToneStyles[tone] || riskToneStyles.neutral;
  return (
    <div
      style={{
        border: '1px solid',
        borderRadius: 12,
        padding: 12,
        ...toneStyle,
      }}
    >
      <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text strong>{title}</Text>
          <div>
            <Text type="secondary">{description}</Text>
          </div>
        </div>
        <Text strong style={{ fontSize: 20 }}>{value}</Text>
      </Space>
    </div>
  );
}

function normalizeAuthStats(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const summary = payload.summary && typeof payload.summary === 'object' ? payload.summary : {};
  const userAdoption = payload.user_adoption && typeof payload.user_adoption === 'object' ? payload.user_adoption : {};

  return {
    periodDays: payload.period_days ?? null,
    summary,
    userAdoption,
    topEndpoints: Array.isArray(payload.top_endpoints) ? payload.top_endpoints : [],
    topUsers: Array.isArray(payload.top_users) ? payload.top_users : [],
    dailyBreakdown: Array.isArray(payload.daily_breakdown) ? payload.daily_breakdown : [],
    failedAttempts: Array.isArray(payload.failed_attempts) ? payload.failed_attempts : [],
  };
}

function AuthStatsSnapshot({ sections }) {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Descriptions size="small" column={1}>
        <Descriptions.Item label="Период">
          {sections.periodDays ? `${sections.periodDays} дней` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="JWT adoption">
          {sections.userAdoption.jwt_adoption_rate ?? 0}%
        </Descriptions.Item>
        <Descriptions.Item label="Success rate">
          {sections.summary.success_rate ?? 0}%
        </Descriptions.Item>
        <Descriptions.Item label="Запросы">
          {sections.summary.total_requests ?? 0}
        </Descriptions.Item>
      </Descriptions>

      {sections.topUsers.length ? (
        <div>
          <Text strong>Топ пользователи</Text>
          <List
            size="small"
            dataSource={sections.topUsers.slice(0, 5)}
            renderItem={(item) => (
              <List.Item>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{item.username || 'Unknown'}</Text>
                  <Text type="secondary">{item.auth_type}: {item.count}</Text>
                </Space>
              </List.Item>
            )}
          />
        </div>
      ) : null}
    </Space>
  );
}

function AuthStatsDetails({ sections }) {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Statistic title="Период" value={sections.periodDays ?? 0} suffix="дней" />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Success rate" value={sections.summary.success_rate ?? 0} suffix="%" />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="JWT adoption" value={sections.userAdoption.jwt_adoption_rate ?? 0} suffix="%" />
        </Col>
      </Row>

      <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
        {Object.entries(sections.summary).map(([key, value]) => (
          <Descriptions.Item key={key} label={prettifyKey(key)}>
            {formatScalarValue(value)}
          </Descriptions.Item>
        ))}
        {Object.entries(sections.userAdoption).map(([key, value]) => (
          <Descriptions.Item key={key} label={prettifyKey(key)}>
            {formatScalarValue(value)}
          </Descriptions.Item>
        ))}
      </Descriptions>

      <AuthStatsTable
        title="Top endpoints"
        rows={sections.topEndpoints}
        fallback="Нет данных по endpoints"
      />
      <AuthStatsTable
        title="Top users"
        rows={sections.topUsers}
        fallback="Нет данных по пользователям"
      />
      <AuthStatsTable
        title="Daily breakdown"
        rows={sections.dailyBreakdown}
        fallback="Нет посуточной статистики"
      />
      <AuthStatsTable
        title="Failed attempts"
        rows={sections.failedAttempts}
        fallback="Нет failed attempts"
      />
    </Space>
  );
}

function AuthStatsTable({ title, rows, fallback }) {
  return (
    <div>
      <Title level={5}>{title}</Title>
      {rows.length ? (
        <Table
          size="small"
          pagination={{ pageSize: 5 }}
          dataSource={rows}
          columns={buildTableColumns(rows)}
          rowKey={(record, index) => record.id || record.username || record.endpoint || record.date || `${title}-${index}`}
        />
      ) : (
        <Empty description={fallback} />
      )}
    </div>
  );
}
