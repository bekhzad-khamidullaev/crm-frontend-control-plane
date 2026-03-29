import React, { useEffect, useMemo, useState } from 'react';
import {
  App,
  Tabs,
  Button,
  Segmented,
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
import {
  getOverview,
  getDashboardAnalytics,
  getFunnelData,
  getActivityFeed,
} from '../lib/api/analytics.js';
import predictions from '../lib/api/predictions.js';
import { AnalyticsCard, AnimatedChart, PredictionChart } from '../components/analytics';
import { formatCurrency, formatNumber } from '../lib/utils/format.js';
import { useTheme } from '../lib/hooks/useTheme.js';
import { t } from '../lib/i18n';

const { Text, Title } = Typography;
const PERIOD_VALUES = ['7d', '30d', '90d'];
const DEFAULT_PERIOD = '30d';
const TAB_VALUES = ['overview', 'activity', 'predictions', 'system'];
const DEFAULT_TAB = 'overview';

function readHashState() {
  if (typeof window === 'undefined') {
    return { path: '/analytics', params: new URLSearchParams() };
  }

  const raw = (window.location.hash || '').replace(/^#/, '');
  const [rawPath = '/analytics', rawQuery = ''] = raw.split('?');
  return {
    path: rawPath || '/analytics',
    params: new URLSearchParams(rawQuery),
  };
}

function getPeriodFromHash() {
  const value = readHashState().params.get('period');
  return PERIOD_VALUES.includes(value) ? value : DEFAULT_PERIOD;
}

function getTabFromHash() {
  const value = readHashState().params.get('tab');
  return TAB_VALUES.includes(value) ? value : DEFAULT_TAB;
}

function replaceHashQuery(updates) {
  if (typeof window === 'undefined') return;
  const { path, params } = readHashState();

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      params.delete(key);
      return;
    }
    params.set(key, String(value));
  });

  const query = params.toString();
  const nextHash = `#${path}${query ? `?${query}` : ''}`;

  if (window.location.hash !== nextHash) {
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}${nextHash}`
    );
  }
}

const chartColors = {
  primary: 'rgba(24, 144, 255, 0.7)',
  primaryBorder: 'rgba(24, 144, 255, 1)',
  success: 'rgba(82, 196, 26, 0.7)',
  successBorder: 'rgba(82, 196, 26, 1)',
};
const trStatic = (key, fallback, vars = {}) => {
  const localized = t(key, vars);
  return localized === key ? fallback : localized;
};

function getRiskToneStyles(isDark) {
  if (isDark) {
    return {
      danger: {
        borderColor: '#7f1d1d',
        background: 'rgba(127, 29, 29, 0.28)',
      },
      warning: {
        borderColor: '#78350f',
        background: 'rgba(120, 53, 15, 0.28)',
      },
      neutral: {
        borderColor: '#2d3343',
        background: '#161b22',
      },
    };
  }

  return {
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
}

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
        trStatic('analyticsPage.common.series', 'Series {{index}}', { index: index + 1 })
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
    if (count === 0) return trStatic('analyticsPage.predictions.empty', 'Empty');
    if (count === 1) return trStatic('analyticsPage.predictions.oneRecord', '1 record');
    return trStatic('analyticsPage.predictions.nRecords', '{{count}} records', { count });
  }

  if (rawValue === null || rawValue === undefined) {
    return trStatic('analyticsPage.common.noData', 'No data');
  }

  return trStatic('analyticsPage.predictions.technicalStatus', 'Technical status');
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
    <Tag
      color={isPositive ? 'success' : 'error'}
      icon={isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
    >
      {Math.abs(numeric)}%
    </Tag>
  );
}

function resolveAnalyticsCurrencyCode(...payloads) {
  for (const payload of payloads) {
    const candidate = [
      payload?.currency_code,
      payload?.revenue_currency_code,
      payload?.revenue_currency,
      payload?.state_currency,
      payload?.currency,
    ].find((value) => typeof value === 'string' && value.trim());

    if (candidate) {
      return candidate.trim().toUpperCase();
    }
  }

  return null;
}

export default function AnalyticsPage() {
  const { message } = App.useApp();
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [period, setPeriod] = useState(getPeriodFromHash);
  const [activeTab, setActiveTab] = useState(getTabFromHash);
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
  };

  const handleRunPredictions = async () => {
    setLoadingPredictions(true);
    try {
      await predictions.predictAll();
      message.success(tr('analyticsPage.messages.predictionsStarted', 'Predictions started'));
      await loadPredictions();
    } catch (error) {
      message.error(
        tr('analyticsPage.messages.predictionsStartError', 'Failed to start predictions')
      );
    } finally {
      setLoadingPredictions(false);
    }
  };

  useEffect(() => {
    loadCore();
  }, [period]);

  useEffect(() => {
    replaceHashQuery({ period, tab: activeTab });
  }, [period, activeTab]);

  useEffect(() => {
    const onHashChange = () => {
      const nextPeriod = getPeriodFromHash();
      const nextTab = getTabFromHash();

      setPeriod((current) => (current === nextPeriod ? current : nextPeriod));
      setActiveTab((current) => (current === nextTab ? current : nextTab));
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    loadPredictions();
    loadAuthStats();
  }, []);

  const analyticsCurrencyCode = useMemo(
    () => resolveAnalyticsCurrencyCode(overview, analytics, revenueForecast),
    [overview, analytics, revenueForecast]
  );
  const revenueMetricsUseSingleCurrency = Boolean(analyticsCurrencyCode);
  const revenueMetricTitle = revenueMetricsUseSingleCurrency
    ? tr('analyticsPage.metrics.revenueWithCurrency', 'Revenue ({{currency}})', {
        currency: analyticsCurrencyCode,
      })
    : tr('analyticsPage.metrics.revenueRaw', 'Revenue sum');
  const revenueMetricHint = revenueMetricsUseSingleCurrency
    ? tr(
        'analyticsPage.summary.revenueCurrencyHint',
        'Revenue metrics are shown in {{currency}}.',
        {
          currency: analyticsCurrencyCode,
        }
      )
    : tr(
        'analyticsPage.summary.revenueMixedCurrencies',
        'Revenue metrics aggregate raw deal amounts and can mix currencies.'
      );
  const formatRevenueValue = (value) =>
    revenueMetricsUseSingleCurrency
      ? formatCurrency(value, analyticsCurrencyCode)
      : formatNumber(value);
  const revenueChartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const rawValue =
              context.parsed?.y ?? context.parsed?.x ?? context.parsed ?? context.raw ?? 0;
            return `${context.dataset.label}: ${formatRevenueValue(rawValue)}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatRevenueValue(value),
        },
      },
    },
  };

  const monthlyGrowth = analytics?.monthly_growth;
  const revenueChartData = useMemo(() => {
    if (!monthlyGrowth?.labels) return null;
    return {
      labels: monthlyGrowth.labels,
      datasets: [
        {
          label: revenueMetricTitle,
          data: monthlyGrowth.revenue || [],
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primaryBorder,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [monthlyGrowth, revenueMetricTitle]);

  const leadsDealsChartData = useMemo(() => {
    if (!monthlyGrowth?.labels) return null;
    return {
      labels: monthlyGrowth.labels,
      datasets: [
        {
          label: tr('analyticsPage.charts.leads', 'Leads'),
          data: monthlyGrowth.leads || [],
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primaryBorder,
          borderWidth: 2,
        },
        {
          label: tr('analyticsPage.charts.deals', 'Deals'),
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
    const labels = items.map(
      (item, index) =>
        item?.label ||
        item?.stage ||
        item?.name ||
        tr('analyticsPage.charts.stage', 'Stage {{index}}', { index: index + 1 })
    );
    const values = items.map((item) => Number(item?.value ?? item?.count ?? 0));
    if (!labels.length) return null;
    return {
      labels,
      datasets: [
        {
          label: tr('analyticsPage.charts.salesFunnel', 'Sales funnel'),
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
    () =>
      buildPredictionPayload(
        revenueForecast,
        tr('analyticsPage.predictions.revenueForecast', 'Revenue forecast')
      ),
    [revenueForecast]
  );
  const leadsPrediction = useMemo(
    () =>
      buildPredictionPayload(
        leadsForecast,
        tr('analyticsPage.predictions.leadsForecast', 'Leads forecast')
      ),
    [leadsForecast]
  );
  const clientsPrediction = useMemo(
    () =>
      buildPredictionPayload(
        clientsForecast,
        tr('analyticsPage.predictions.clientsForecast', 'Clients forecast')
      ),
    [clientsForecast]
  );

  const nextActionsClientsColumns = useMemo(
    () => buildTableColumns(nextActionsClients),
    [nextActionsClients]
  );
  const nextActionsDealsColumns = useMemo(
    () => buildTableColumns(nextActionsDeals),
    [nextActionsDeals]
  );
  const predictionStatusRows = useMemo(
    () =>
      normalizePredictionStatus(predictionStatus).filter(
        (row) => !Number.isNaN(row.count) || row.status || row.rawValue !== null
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
          label: tr('analyticsPage.common.count', 'Count'),
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
    overdueTasks > 0
      ? tr('analyticsPage.summary.overdueTasks', 'Overdue tasks: {{count}}', {
          count: overdueTasks,
        })
      : null,
    conversionRate
      ? tr('analyticsPage.summary.conversion', 'Conversion: {{value}}%', { value: conversionRate })
      : null,
    revenueGrowth
      ? tr('analyticsPage.summary.revenueGrowth', 'Revenue growth: {{value}}%', {
          value: `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}`,
        })
      : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const focusCards = [
    {
      key: 'pipeline',
      title: tr('analyticsPage.focus.pipelineTitle', 'Deals in progress'),
      value: overview?.total_deals || 0,
      description: tr(
        'analyticsPage.focus.pipelineDescription',
        'Total commercial workload in the system.'
      ),
    },
    {
      key: 'pending',
      title: tr('analyticsPage.focus.pendingTitle', 'Pending tasks'),
      value: pendingTasks,
      description: tr('analyticsPage.focus.pendingDescription', 'Shows current team workload.'),
    },
    {
      key: 'predictions',
      title: tr('analyticsPage.focus.predictionsTitle', 'Active predictions'),
      value: predictionStatusRows.length,
      description: tr(
        'analyticsPage.focus.predictionsDescription',
        'How many predictive signals are already available for analysis.'
      ),
    },
  ];

  const riskCards = [
    {
      key: 'overdue',
      title: tr('analyticsPage.risks.overdueTitle', 'Overdue tasks'),
      value: overdueTasks,
      description: tr(
        'analyticsPage.risks.overdueDescription',
        'Require immediate attention first.'
      ),
      tone: overdueTasks > 0 ? 'danger' : 'neutral',
    },
    {
      key: 'conversion',
      title: tr('analyticsPage.risks.conversionTitle', 'Conversion'),
      value: `${conversionRate}%`,
      description: tr(
        'analyticsPage.risks.conversionDescription',
        'If metric is below target, check follow-up and incoming lead quality.'
      ),
      tone: conversionRate > 0 && conversionRate < 15 ? 'warning' : 'neutral',
    },
    {
      key: 'growth',
      title: tr('analyticsPage.risks.growthTitle', 'Revenue growth'),
      value: `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}%`,
      description: tr(
        'analyticsPage.risks.growthDescription',
        'Signal of current sales pace for selected period.'
      ),
      tone: revenueGrowth < 0 ? 'danger' : 'neutral',
    },
  ];

  const tabs = [
    {
      key: 'overview',
      label: tr('analyticsPage.tabs.decisions', 'Decisions'),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <AnalyticsSection
            title={tr('analyticsPage.sections.executiveSummary', 'Executive summary')}
            description={
              executiveSummary ||
              tr(
                'analyticsPage.sections.executiveSummaryDescription',
                'Summary of key metrics and risks for selected period.'
              )
            }
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
                <AnalyticsCard
                  title={tr('analyticsPage.sections.risks', 'Risks')}
                  loading={loadingAnalytics || loadingOverview}
                  error={analyticsError || overviewError}
                  onRetry={loadCore}
                  widgetActions
                  widgetPeriod={period}
                  widgetKey="overview-risks"
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {riskCards.map((risk) => (
                      <RiskRow key={risk.key} {...risk} isDark={isDark} />
                    ))}
                  </Space>
                </AnalyticsCard>
              </Col>
            </Row>
          </AnalyticsSection>

          <AnalyticsSection
            title={tr('analyticsPage.sections.keyMetrics', 'Key metrics')}
            description={tr(
              'analyticsPage.sections.keyMetricsDescription',
              'Quick snapshot of base size, deals and revenue.'
            )}
          >
            <AnalyticsCard
              title={tr('analyticsPage.sections.keyMetrics', 'Key metrics')}
              loading={loadingOverview}
              error={overviewError}
              onRetry={loadCore}
              widgetActions
              widgetPeriod={period}
              widgetKey="overview-key-metrics"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title={tr('analyticsPage.metrics.totalLeads', 'Total leads')}
                    value={overview?.total_leads || 0}
                    suffix={renderGrowthTag(overview?.leads_growth)}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title={tr('analyticsPage.metrics.totalContacts', 'Total contacts')}
                    value={overview?.total_contacts || 0}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title={tr('analyticsPage.metrics.totalDeals', 'Total deals')}
                    value={overview?.total_deals || 0}
                    suffix={renderGrowthTag(overview?.deals_growth)}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title={revenueMetricTitle}
                    value={overview?.total_revenue || 0}
                    formatter={(value) => formatRevenueValue(value)}
                    suffix={renderGrowthTag(overview?.revenue_growth)}
                  />
                </Col>
              </Row>
              <Text type="secondary">{revenueMetricHint}</Text>
              {overview?.conversion_rate !== undefined && (
                <Text type="secondary">
                  {tr('analyticsPage.summary.conversion', 'Conversion: {{value}}%', {
                    value: overview.conversion_rate,
                  })}
                </Text>
              )}
            </AnalyticsCard>
          </AnalyticsSection>

          <AnalyticsSection
            title={tr('analyticsPage.sections.trends', 'Trends')}
            description={tr(
              'analyticsPage.sections.trendsDescription',
              'Revenue dynamics and funnel movement for pace evaluation.'
            )}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <AnalyticsCard
                  title={tr('analyticsPage.charts.revenueDynamics', 'Revenue dynamics')}
                  loading={loadingAnalytics}
                  error={analyticsError}
                  onRetry={loadCore}
                  widgetActions
                  widgetPeriod={period}
                  widgetKey="trends-revenue-dynamics"
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Text type="secondary">{revenueMetricHint}</Text>
                    {revenueChartData ? (
                      <AnimatedChart
                        type="line"
                        data={revenueChartData}
                        options={revenueChartOptions}
                        height={280}
                      />
                    ) : (
                      <Empty
                        description={tr('analyticsPage.empty.noRevenueData', 'No revenue data')}
                      />
                    )}
                  </Space>
                </AnalyticsCard>
              </Col>
              <Col xs={24} lg={12}>
                <AnalyticsCard
                  title={tr('analyticsPage.charts.leadsAndDeals', 'Leads and deals')}
                  loading={loadingAnalytics}
                  error={analyticsError}
                  onRetry={loadCore}
                  widgetActions
                  widgetPeriod={period}
                  widgetKey="trends-leads-deals"
                >
                  {leadsDealsChartData ? (
                    <AnimatedChart type="bar" data={leadsDealsChartData} height={280} />
                  ) : (
                    <Empty
                      description={tr(
                        'analyticsPage.empty.noLeadsDealsData',
                        'No leads and deals data'
                      )}
                    />
                  )}
                </AnalyticsCard>
              </Col>
            </Row>
          </AnalyticsSection>

          <AnalyticsSection
            title={tr('analyticsPage.sections.operations', 'Operational control')}
            description={tr(
              'analyticsPage.sections.operationsDescription',
              'What is happening with funnel and team tasks right now.'
            )}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <AnalyticsCard
                  title={tr('analyticsPage.charts.salesFunnel', 'Sales funnel')}
                  loading={loadingFunnel}
                  error={funnelError}
                  onRetry={loadCore}
                  widgetActions
                  widgetPeriod={period}
                  widgetKey="operations-sales-funnel"
                >
                  {funnelChartData ? (
                    <AnimatedChart type="bar" data={funnelChartData} height={280} />
                  ) : (
                    <Empty description={tr('analyticsPage.empty.noFunnelData', 'No funnel data')} />
                  )}
                </AnalyticsCard>
              </Col>
              <Col xs={24} lg={12}>
                <AnalyticsCard
                  title={tr('analyticsPage.sections.taskStatuses', 'Task statuses')}
                  loading={loadingAnalytics}
                  error={analyticsError}
                  onRetry={loadCore}
                  widgetActions
                  widgetPeriod={period}
                  widgetKey="operations-task-statuses"
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title={tr('analyticsPage.tasks.pending', 'Pending')}
                        value={analytics?.tasks_by_status?.pending || 0}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={tr('analyticsPage.tasks.inProgress', 'In progress')}
                        value={analytics?.tasks_by_status?.in_progress || 0}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={tr('analyticsPage.tasks.completed', 'Completed')}
                        value={analytics?.tasks_by_status?.completed || 0}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={tr('analyticsPage.tasks.overdue', 'Overdue')}
                        value={analytics?.tasks_by_status?.overdue || 0}
                      />
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
      label: tr('analyticsPage.tabs.team', 'Team'),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <AnalyticsSection
            title={tr('analyticsPage.sections.teamActivity', 'Team activity')}
            description={tr(
              'analyticsPage.sections.teamActivityDescription',
              'Latest user actions and system auth snapshot.'
            )}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <AnalyticsCard
                  title={tr('analyticsPage.sections.activityFeed', 'Activity feed')}
                  loading={loadingActivity}
                  error={activityError}
                  onRetry={loadCore}
                  widgetActions
                  widgetPeriod={period}
                  widgetKey="activity-feed"
                >
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
                          tr('analyticsPage.activity.event', 'Event');
                        const description =
                          item?.description || item?.details || item?.summary || '';
                        const timestamp =
                          item?.timestamp || item?.created_at || item?.date || item?.created || '';
                        const avatarLabel = (item?.user_name ||
                          item?.owner_name ||
                          'U')[0]?.toUpperCase();

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
                    <Empty
                      description={tr(
                        'analyticsPage.empty.noActivity',
                        'No activity for selected period'
                      )}
                    />
                  )}
                </AnalyticsCard>
              </Col>
              <Col xs={24} lg={8}>
                <AnalyticsCard
                  title={tr('analyticsPage.sections.authSnapshot', 'Auth snapshot')}
                  loading={loadingAuthStats}
                  error={authError}
                  onRetry={loadAuthStats}
                  widgetActions
                  widgetPeriod={period}
                  widgetKey="activity-auth-snapshot"
                >
                  {authStats ? (
                    <AuthStatsSnapshot sections={authStatsSections} />
                  ) : (
                    <Empty description={tr('analyticsPage.empty.noAuthData', 'No auth data')} />
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
      label: tr('analyticsPage.tabs.predictionsActions', 'Predictions and actions'),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={handleRunPredictions}
              loading={loadingPredictions}
            >
              {tr('analyticsPage.actions.runPredictions', 'Run predictions')}
            </Button>
            {predictionStatus && (
              <Text type="secondary">
                {tr('analyticsPage.predictions.status', 'Status')}:{' '}
                {predictionStatus?.status ||
                  tr('analyticsPage.predictions.inProgress', 'in progress')}
              </Text>
            )}
          </Space>

          <AnalyticsSection
            title={tr('analyticsPage.sections.predictionsByMetrics', 'Predictions by key metrics')}
            description={tr(
              'analyticsPage.sections.predictionsByMetricsDescription',
              'Estimate of future revenue, leads and client base.'
            )}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <AnalyticsCard
                  title={tr('analyticsPage.predictions.revenueForecast', 'Revenue forecast')}
                  loading={loadingPredictions}
                  error={predictionError}
                  onRetry={loadPredictions}
                  widgetActions
                  widgetPeriod={period}
                  widgetKey="predictions-revenue-forecast"
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Text type="secondary">{revenueMetricHint}</Text>
                    {revenuePrediction ? (
                      revenuePrediction.type === 'interval' ? (
                        <PredictionChart
                          title={revenuePrediction.title}
                          labels={revenuePrediction.labels}
                          predictedData={revenuePrediction.predictedData}
                          confidenceLower={revenuePrediction.confidenceLower}
                          confidenceUpper={revenuePrediction.confidenceUpper}
                          currencyCode={analyticsCurrencyCode}
                          formatAsCurrency={revenueMetricsUseSingleCurrency}
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
                          options={revenueChartOptions}
                          height={280}
                        />
                      )
                    ) : (
                      <Empty
                        description={tr(
                          'analyticsPage.empty.noRevenueForecast',
                          'No revenue forecast'
                        )}
                      />
                    )}
                  </Space>
                </AnalyticsCard>
              </Col>
              <Col xs={24} lg={12}>
                <AnalyticsCard
                  title={tr('analyticsPage.predictions.leadsForecast', 'Leads forecast')}
                  loading={loadingPredictions}
                  error={predictionError}
                  onRetry={loadPredictions}
                  widgetActions
                  widgetPeriod={period}
                  widgetKey="predictions-leads-forecast"
                >
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
                    <Empty
                      description={tr('analyticsPage.empty.noLeadsForecast', 'No leads forecast')}
                    />
                  )}
                </AnalyticsCard>
              </Col>
            </Row>
          </AnalyticsSection>

          <AnalyticsSection
            title={tr('analyticsPage.sections.predictionModelsState', 'Prediction models state')}
            description={tr(
              'analyticsPage.sections.predictionModelsStateDescription',
              'Current model state and available signals.'
            )}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <AnalyticsCard
                  title={tr('analyticsPage.predictions.clientsForecast', 'Clients forecast')}
                  loading={loadingPredictions}
                  error={predictionError}
                  onRetry={loadPredictions}
                  widgetActions
                  widgetPeriod={period}
                  widgetKey="predictions-clients-forecast"
                >
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
                    <Empty
                      description={tr(
                        'analyticsPage.empty.noClientsForecast',
                        'No clients forecast'
                      )}
                    />
                  )}
                </AnalyticsCard>
              </Col>
              <Col xs={24} lg={12}>
                <AnalyticsCard
                  title={tr('analyticsPage.sections.predictionStatus', 'Prediction status')}
                  loading={loadingPredictions}
                  error={predictionError}
                  onRetry={loadPredictions}
                  widgetActions
                  widgetPeriod={period}
                  widgetKey="predictions-status"
                >
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
                            title: tr('analyticsPage.table.group', 'Group'),
                            dataIndex: 'groupLabel',
                            key: 'groupLabel',
                            render: (value) => <Text strong>{value}</Text>,
                          },
                          {
                            title: tr('analyticsPage.table.metric', 'Metric'),
                            dataIndex: 'metricLabel',
                            key: 'metricLabel',
                          },
                          {
                            title: tr('analyticsPage.common.count', 'Count'),
                            dataIndex: 'count',
                            key: 'count',
                            render: (value) =>
                              Number.isNaN(value) ? (
                                <Text type="secondary">-</Text>
                              ) : (
                                <Text>{value}</Text>
                              ),
                          },
                          {
                            title: tr('analyticsPage.table.status', 'Status'),
                            dataIndex: 'status',
                            key: 'status',
                            render: (value) => (
                              <Text type="secondary">
                                {value || tr('analyticsPage.common.noData', 'No data')}
                              </Text>
                            ),
                          },
                        ]}
                        rowKey="key"
                      />
                    </Space>
                  ) : (
                    <Empty
                      description={tr(
                        'analyticsPage.empty.noPredictionStatus',
                        'No prediction status'
                      )}
                    />
                  )}
                </AnalyticsCard>
              </Col>
            </Row>
          </AnalyticsSection>

          <AnalyticsSection
            title={tr('analyticsPage.sections.recommendedActions', 'Recommended actions')}
            description={tr(
              'analyticsPage.sections.recommendedActionsDescription',
              'Next actions considered high priority by model.'
            )}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <AnalyticsCard
                  title={tr(
                    'analyticsPage.sections.recommendedActionsClients',
                    'Recommended actions (clients)'
                  )}
                  loading={loadingPredictions}
                  error={predictionError}
                  onRetry={loadPredictions}
                  widgetActions
                  widgetPeriod={period}
                  widgetKey="predictions-actions-clients"
                >
                  {nextActionsClients.length ? (
                    <Table
                      dataSource={nextActionsClients}
                      columns={nextActionsClientsColumns}
                      rowKey={(record, index) => record.id || record.pk || `client-${index}`}
                      pagination={{ pageSize: 5 }}
                    />
                  ) : (
                    <Empty
                      description={tr(
                        'analyticsPage.empty.noClientRecommendations',
                        'No client recommendations'
                      )}
                    />
                  )}
                </AnalyticsCard>
              </Col>
              <Col xs={24} lg={12}>
                <AnalyticsCard
                  title={tr(
                    'analyticsPage.sections.recommendedActionsDeals',
                    'Recommended actions (deals)'
                  )}
                  loading={loadingPredictions}
                  error={predictionError}
                  onRetry={loadPredictions}
                  widgetActions
                  widgetPeriod={period}
                  widgetKey="predictions-actions-deals"
                >
                  {nextActionsDeals.length ? (
                    <Table
                      dataSource={nextActionsDeals}
                      columns={nextActionsDealsColumns}
                      rowKey={(record, index) => record.id || record.pk || `deal-${index}`}
                      pagination={{ pageSize: 5 }}
                    />
                  ) : (
                    <Empty
                      description={tr(
                        'analyticsPage.empty.noDealRecommendations',
                        'No deal recommendations'
                      )}
                    />
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
      label: tr('analyticsPage.tabs.system', 'System'),
      children: (
        <AnalyticsSection
          title={tr('analyticsPage.sections.systemMetrics', 'System metrics')}
          description={tr(
            'analyticsPage.sections.systemMetricsDescription',
            'Service auth indicators and technical system snapshot.'
          )}
        >
          <AnalyticsCard
            title={tr('analyticsPage.sections.authStats', 'Auth stats')}
            loading={loadingAuthStats}
            error={authError}
            onRetry={loadAuthStats}
            widgetActions
            widgetPeriod={period}
            widgetKey="system-auth-stats"
          >
            {authStats ? (
              <AuthStatsDetails sections={authStatsSections} />
            ) : (
              <Empty description={tr('analyticsPage.empty.noSystemData', 'No system data')} />
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
          <Title level={2} style={{ marginBottom: 4 }}>
            {tr('analyticsPage.title', 'Analytics')}
          </Title>
          <Text type="secondary">
            {tr(
              'analyticsPage.subtitle',
              'Decision-making screen for sales, team activity and predictions.'
            )}
          </Text>
        </div>
        <Space wrap>
          <Segmented
            value={period}
            options={[
              { label: tr('dashboardPage.periods.d7', '7 days'), value: '7d' },
              { label: tr('dashboardPage.periods.d30', '30 days'), value: '30d' },
              { label: tr('dashboardPage.periods.d90', '90 days'), value: '90d' },
            ]}
            onChange={(value) => setPeriod(String(value))}
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            {tr('actions.refresh', 'Refresh')}
          </Button>
        </Space>
      </Space>

      <Tabs items={tabs} activeKey={activeTab} onChange={setActiveTab} />
    </Space>
  );
}

function AnalyticsSection({ title, description, children }) {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Title level={4} style={{ marginBottom: 4 }}>
          {title}
        </Title>
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
        <Text strong style={{ fontSize: 28, lineHeight: 1.1 }}>
          {value ?? 0}
        </Text>
        <Text type="secondary">{description}</Text>
      </Space>
    </AnalyticsCard>
  );
}

function RiskRow({ title, value, description, tone, isDark = false }) {
  const toneStyles = getRiskToneStyles(isDark);
  const toneStyle = toneStyles[tone] || toneStyles.neutral;
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
        <Text strong style={{ fontSize: 20 }}>
          {value}
        </Text>
      </Space>
    </div>
  );
}

function normalizeAuthStats(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const summary = payload.summary && typeof payload.summary === 'object' ? payload.summary : {};
  const userAdoption =
    payload.user_adoption && typeof payload.user_adoption === 'object' ? payload.user_adoption : {};

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
        <Descriptions.Item label={trStatic('analyticsPage.auth.period', 'Period')}>
          {sections.periodDays
            ? trStatic('analyticsPage.auth.days', '{{count}} days', { count: sections.periodDays })
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={trStatic('analyticsPage.auth.jwtAdoption', 'JWT adoption')}>
          {sections.userAdoption.jwt_adoption_rate ?? 0}%
        </Descriptions.Item>
        <Descriptions.Item label={trStatic('analyticsPage.auth.successRate', 'Success rate')}>
          {sections.summary.success_rate ?? 0}%
        </Descriptions.Item>
        <Descriptions.Item label={trStatic('analyticsPage.auth.requests', 'Requests')}>
          {sections.summary.total_requests ?? 0}
        </Descriptions.Item>
      </Descriptions>

      {sections.topUsers.length ? (
        <div>
          <Text strong>{trStatic('analyticsPage.auth.topUsers', 'Top users')}</Text>
          <List
            size="small"
            dataSource={sections.topUsers.slice(0, 5)}
            renderItem={(item) => (
              <List.Item>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>
                    {item.username || trStatic('analyticsPage.common.unknown', 'Unknown')}
                  </Text>
                  <Text type="secondary">
                    {item.auth_type}: {item.count}
                  </Text>
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
          <Statistic
            title={trStatic('analyticsPage.auth.period', 'Period')}
            value={sections.periodDays ?? 0}
            suffix={trStatic('analyticsPage.auth.daysShort', 'days')}
          />
        </Col>
        <Col xs={24} md={8}>
          <Statistic
            title={trStatic('analyticsPage.auth.successRate', 'Success rate')}
            value={sections.summary.success_rate ?? 0}
            suffix="%"
          />
        </Col>
        <Col xs={24} md={8}>
          <Statistic
            title={trStatic('analyticsPage.auth.jwtAdoption', 'JWT adoption')}
            value={sections.userAdoption.jwt_adoption_rate ?? 0}
            suffix="%"
          />
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
        title={trStatic('analyticsPage.auth.topEndpoints', 'Top endpoints')}
        rows={sections.topEndpoints}
        fallback={trStatic('analyticsPage.empty.noEndpointsData', 'No endpoints data')}
      />
      <AuthStatsTable
        title={trStatic('analyticsPage.auth.topUsers', 'Top users')}
        rows={sections.topUsers}
        fallback={trStatic('analyticsPage.empty.noUsersData', 'No users data')}
      />
      <AuthStatsTable
        title={trStatic('analyticsPage.auth.dailyBreakdown', 'Daily breakdown')}
        rows={sections.dailyBreakdown}
        fallback={trStatic('analyticsPage.empty.noDailyData', 'No daily data')}
      />
      <AuthStatsTable
        title={trStatic('analyticsPage.auth.failedAttempts', 'Failed attempts')}
        rows={sections.failedAttempts}
        fallback={trStatic('analyticsPage.empty.noFailedAttempts', 'No failed attempts')}
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
          rowKey={(record, index) =>
            record.id || record.username || record.endpoint || record.date || `${title}-${index}`
          }
        />
      ) : (
        <Empty description={fallback} />
      )}
    </div>
  );
}
