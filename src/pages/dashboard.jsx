import {
  BarChartOutlined,
  DollarCircleOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  List,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Typography,
  theme,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { getActivityFeed, getOverview, normalizeOverview } from '../lib/api/analytics.js';
import { formatCurrency, formatNumber } from '../lib/utils/format.js';
import { t } from '../lib/i18n/index.js';

const { Title, Text } = Typography;
const PERIOD_VALUES = ['7d', '30d', '90d'];
const DEFAULT_PERIOD = '30d';

function readHashState() {
  if (typeof window === 'undefined') {
    return { path: '/dashboard', params: new URLSearchParams() };
  }

  const raw = (window.location.hash || '').replace(/^#/, '');
  const [rawPath = '/dashboard', rawQuery = ''] = raw.split('?');
  return {
    path: rawPath || '/dashboard',
    params: new URLSearchParams(rawQuery),
  };
}

function getPeriodFromHash() {
  const value = readHashState().params.get('period');
  return PERIOD_VALUES.includes(value) ? value : DEFAULT_PERIOD;
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

function resolveOverviewCurrencyCode(payload) {
  const candidate = [
    payload?.currency_code,
    payload?.revenue_currency_code,
    payload?.revenue_currency,
    payload?.state_currency,
    payload?.currency,
  ].find((value) => typeof value === 'string' && value.trim());

  return candidate ? candidate.trim().toUpperCase() : null;
}

function Dashboard() {
  const { token } = theme.useToken();
  const [period, setPeriod] = useState(getPeriodFromHash);
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [overviewError, setOverviewError] = useState(null);
  const [activityError, setActivityError] = useState(null);

  useEffect(() => {
    void loadData();
  }, [period]);

  useEffect(() => {
    replaceHashQuery({ period });
  }, [period]);

  useEffect(() => {
    const onHashChange = () => {
      const nextPeriod = getPeriodFromHash();
      setPeriod((current) => (current === nextPeriod ? current : nextPeriod));
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const overviewCurrencyCode = useMemo(() => resolveOverviewCurrencyCode(overview), [overview]);
  const revenueMetricsUseSingleCurrency = Boolean(overviewCurrencyCode);
  const revenueHelper = revenueMetricsUseSingleCurrency
    ? t('dashboardPage.cards.revenueCurrencyHint', { currency: overviewCurrencyCode }) ===
      'dashboardPage.cards.revenueCurrencyHint'
      ? `Revenue shown in ${overviewCurrencyCode}.`
      : t('dashboardPage.cards.revenueCurrencyHint', { currency: overviewCurrencyCode })
    : t('dashboardPage.cards.revenueMixedCurrencies') ===
        'dashboardPage.cards.revenueMixedCurrencies'
      ? 'Revenue aggregates raw deal amounts and can mix currencies.'
      : t('dashboardPage.cards.revenueMixedCurrencies');
  const formatRevenueValue = (value) =>
    revenueMetricsUseSingleCurrency
      ? formatCurrency(value, overviewCurrencyCode)
      : formatNumber(value);
  const statsUnavailable = Boolean(overviewError && !loadingOverview && !overview);

  const cards = useMemo(() => {
    const data = overview || {};
    return [
      {
        key: 'leads',
        title: t('dashboardPage.cards.leads'),
        value: statsUnavailable ? '—' : Number(data.total_leads || data.leads || 0),
        icon: <UserOutlined />,
      },
      {
        key: 'contacts',
        title: t('dashboardPage.cards.contacts'),
        value: statsUnavailable ? '—' : Number(data.total_contacts || data.contacts || 0),
        icon: <TeamOutlined />,
      },
      {
        key: 'deals',
        title: t('dashboardPage.cards.deals'),
        value: statsUnavailable ? '—' : Number(data.total_deals || data.deals || 0),
        icon: <BarChartOutlined />,
      },
      {
        key: 'revenue',
        title:
          revenueMetricsUseSingleCurrency && overviewCurrencyCode
            ? `${t('dashboardPage.cards.revenue')} (${overviewCurrencyCode})`
            : t('dashboardPage.cards.revenue'),
        value: statsUnavailable ? '—' : Number(data.total_revenue || data.revenue || 0),
        icon: <DollarCircleOutlined />,
        precision: 2,
        formatter: formatRevenueValue,
        helper: revenueHelper,
      },
    ];
  }, [
    formatRevenueValue,
    overview,
    overviewCurrencyCode,
    revenueHelper,
    revenueMetricsUseSingleCurrency,
    statsUnavailable,
  ]);

  async function loadOverviewData() {
    setOverviewError(null);
    setLoadingOverview(true);

    try {
      const overviewRes = await getOverview();
      setOverview(normalizeOverview(overviewRes));
    } catch (e) {
      const statusCode = Number(e?.status || e?.response?.status || e?.details?.status || 0);
      const accessRestricted = statusCode === 403;
      setOverview(null);
      setOverviewError({
        message:
          accessRestricted &&
          t('dashboardPage.errors.metricsUnavailable') !== 'dashboardPage.errors.metricsUnavailable'
            ? t('dashboardPage.errors.metricsUnavailable')
            : accessRestricted
              ? 'Сводные метрики недоступны'
              : t('dashboardPage.errors.loadData'),
        description:
          accessRestricted &&
          t('dashboardPage.errors.metricsUnavailableDescription') !==
            'dashboardPage.errors.metricsUnavailableDescription'
            ? t('dashboardPage.errors.metricsUnavailableDescription')
            : accessRestricted
              ? 'Текущая лицензия или права доступа ограничивают сводную аналитику дашборда.'
              : null,
        type: accessRestricted ? 'info' : 'error',
        silent: accessRestricted,
      });
    } finally {
      setLoadingOverview(false);
    }
  }

  async function loadActivityData() {
    setActivityError(null);
    setLoadingActivity(true);

    try {
      const activityRes = await getActivityFeed({ period });
      setActivity(Array.isArray(activityRes) ? activityRes : activityRes?.results || []);
    } catch (e) {
      setActivity([]);
      setActivityError({
        message:
          t('dashboardPage.lastActivity.loadError') === 'dashboardPage.lastActivity.loadError'
            ? 'Не удалось загрузить активность'
            : t('dashboardPage.lastActivity.loadError'),
      });
    } finally {
      setLoadingActivity(false);
    }
  }

  async function loadData() {
    await Promise.allSettled([loadOverviewData(), loadActivityData()]);
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card
        style={{
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgElevated,
          boxShadow: token.boxShadowTertiary,
        }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            <Space direction="vertical" size={0}>
              <Title level={3} style={{ margin: 0 }}>
                {t('dashboardPage.title')}
              </Title>
              <Text type="secondary">{t('dashboardPage.subtitle')}</Text>
            </Space>
            <Segmented
              value={period}
              options={[
                { label: t('dashboardPage.periods.d7'), value: '7d' },
                { label: t('dashboardPage.periods.d30'), value: '30d' },
                { label: t('dashboardPage.periods.d90'), value: '90d' },
              ]}
              onChange={(value) => setPeriod(String(value))}
            />
          </Space>

          {overviewError && !loadingOverview && !overview ? (
            <Alert
              type={overviewError.type || 'error'}
              showIcon
              message={overviewError.message}
              description={overviewError.description || undefined}
              action={
                <Button size="small" onClick={() => void loadOverviewData()}>
                  {t('actions.retry') === 'actions.retry' ? 'Повторить' : t('actions.retry')}
                </Button>
              }
            />
          ) : null}
        </Space>
      </Card>

      <Spin spinning={loadingOverview}>
        <Row gutter={[16, 16]}>
          {cards.map((card) => (
            <Col xs={24} sm={12} lg={6} key={card.key}>
              <Card
                style={{
                  borderRadius: token.borderRadiusLG,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorBgContainer,
                  boxShadow: token.boxShadowTertiary,
                }}
              >
                <Statistic
                  title={card.title}
                  value={card.value}
                  precision={card.precision}
                  prefix={card.icon}
                  formatter={card.formatter}
                />
                {card.helper ? <Text type="secondary">{card.helper}</Text> : null}
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      <Card
        title={t('dashboardPage.lastActivity.title')}
        style={{
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgElevated,
          boxShadow: token.boxShadowTertiary,
        }}
      >
        <Spin spinning={loadingActivity}>
          {activityError ? (
            <Alert
              type="warning"
              showIcon
              message={activityError.message}
              action={
                <Button size="small" onClick={() => void loadActivityData()}>
                  {t('actions.retry') === 'actions.retry' ? 'Повторить' : t('actions.retry')}
                </Button>
              }
            />
          ) : (
            <List
              dataSource={activity}
              locale={{ emptyText: t('dashboardPage.lastActivity.empty') }}
              renderItem={(item, index) => (
                <List.Item key={`${item?.id || 'row'}-${index}`}>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Text strong>
                      {item?.title || item?.event || t('dashboardPage.lastActivity.fallbackEvent')}
                    </Text>
                    <Text type="secondary">
                      {item?.description ||
                        item?.message ||
                        t('dashboardPage.lastActivity.fallbackDescription')}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Card>
    </Space>
  );
}

export default Dashboard;
