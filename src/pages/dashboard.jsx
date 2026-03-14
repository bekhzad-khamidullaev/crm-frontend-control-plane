import {
  BarChartOutlined,
  DollarCircleOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Card,
  Col,
  List,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { getActivityFeed, getOverview, normalizeOverview } from '../lib/api/analytics.js';
import parseLicenseRestriction from '../lib/api/licenseError';
import resolveFeatureName from '../lib/api/licenseFeatureName';
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
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
  }
}

function Dashboard() {
  const [period, setPeriod] = useState(getPeriodFromHash);
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [error, setError] = useState(null);

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

  const cards = useMemo(() => {
    const data = overview || {};
    return [
      {
        key: 'leads',
        title: t('dashboardPage.cards.leads'),
        value: Number(data.total_leads || data.leads || 0),
        icon: <UserOutlined />,
      },
      {
        key: 'contacts',
        title: t('dashboardPage.cards.contacts'),
        value: Number(data.total_contacts || data.contacts || 0),
        icon: <TeamOutlined />,
      },
      {
        key: 'deals',
        title: t('dashboardPage.cards.deals'),
        value: Number(data.total_deals || data.deals || 0),
        icon: <BarChartOutlined />,
      },
      {
        key: 'revenue',
        title: t('dashboardPage.cards.revenue'),
        value: Number(data.total_revenue || data.revenue || 0),
        icon: <DollarCircleOutlined />,
        precision: 2,
      },
    ];
  }, [overview]);

  async function loadData() {
    setError(null);
    setLoadingOverview(true);
    setLoadingActivity(true);

    try {
      const [overviewRes, activityRes] = await Promise.all([
        getOverview(),
        getActivityFeed({ period }),
      ]);

      setOverview(normalizeOverview(overviewRes));
      setActivity(Array.isArray(activityRes) ? activityRes : []);
    } catch (e) {
      console.error('Dashboard load error:', e);
      const licenseError = parseLicenseRestriction(e);
      const statusCode = Number(
        e?.status ||
        e?.response?.status ||
        e?.details?.status ||
        0
      );
      if (licenseError || statusCode === 403) {
        const blockedFeature = resolveFeatureName(licenseError?.feature || 'analytics.core', t);
        setError({
          message: t('dashboardPage.errors.licenseFeatureDisabled'),
          description: t('dashboardPage.errors.licenseFeatureDisabledDescription', {
            feature: blockedFeature,
          }),
          type: 'warning',
        });
      } else {
        setError({
          message: t('dashboardPage.errors.loadData'),
          description: null,
          type: 'error',
        });
      }
      setOverview(null);
      setActivity([]);
    } finally {
      setLoadingOverview(false);
      setLoadingActivity(false);
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            <Space direction="vertical" size={0}>
              <Title level={3} style={{ margin: 0 }}>{t('dashboardPage.title')}</Title>
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

          {error ? (
            <Alert
              type={error.type || 'error'}
              showIcon
              message={error.message}
              description={error.description || undefined}
            />
          ) : null}
        </Space>
      </Card>

      <Spin spinning={loadingOverview}>
        <Row gutter={[16, 16]}>
          {cards.map((card) => (
            <Col xs={24} sm={12} lg={6} key={card.key}>
              <Card>
                <Statistic
                  title={card.title}
                  value={card.value}
                  precision={card.precision}
                  prefix={card.icon}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      <Card title={t('dashboardPage.lastActivity.title')}>
        <Spin spinning={loadingActivity}>
          <List
            dataSource={activity}
            locale={{ emptyText: t('dashboardPage.lastActivity.empty') }}
            renderItem={(item, index) => (
              <List.Item key={`${item?.id || 'row'}-${index}`}>
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text strong>{item?.title || item?.event || t('dashboardPage.lastActivity.fallbackEvent')}</Text>
                  <Text type="secondary">{item?.description || item?.message || t('dashboardPage.lastActivity.fallbackDescription')}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Spin>
      </Card>
    </Space>
  );
}

export default Dashboard;
