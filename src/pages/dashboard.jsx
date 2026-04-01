import {
  BarChartOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  EyeInvisibleOutlined,
  FireOutlined,
  MessageOutlined,
  PlusCircleOutlined,
  PushpinFilled,
  PushpinOutlined,
  ProjectOutlined,
  RobotOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  List,
  Modal,
  Row,
  Select,
  Segmented,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  theme,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { getActivityFeed, getOverview, normalizeOverview } from '../lib/api/analytics.js';
import { trackCrmEvent } from '../lib/analytics/events.js';
import { getDeals } from '../lib/api/deals.js';
import { getLeads } from '../lib/api/leads.js';
import { getTasks } from '../lib/api/tasks.js';
import { formatCurrency, formatNumber } from '../lib/utils/format.js';
import { t } from '../lib/i18n/index.js';
import { navigate } from '../router.js';

const { Title, Text } = Typography;
const PERIOD_VALUES = ['7d', '30d', '90d'];
const DEFAULT_PERIOD = '30d';
const HASH_FILTER_ALL = 'all';
const DASHBOARD_COMPOSER_STORAGE_KEY = 'dashboard:composer';

function readDashboardComposer() {
  if (typeof window === 'undefined') {
    return { hidden: [], pinned: [] };
  }

  try {
    const raw = localStorage.getItem(DASHBOARD_COMPOSER_STORAGE_KEY);
    if (!raw) return { hidden: [], pinned: [] };

    const parsed = JSON.parse(raw);
    const hidden = Array.isArray(parsed?.hidden) ? parsed.hidden.filter(Boolean).map(String) : [];
    const pinned = Array.isArray(parsed?.pinned) ? parsed.pinned.filter(Boolean).map(String) : [];
    return { hidden: [...new Set(hidden)], pinned: [...new Set(pinned)] };
  } catch {
    return { hidden: [], pinned: [] };
  }
}

function persistDashboardComposer(value) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DASHBOARD_COMPOSER_STORAGE_KEY, JSON.stringify(value));
}

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

function getHashFilterValue(params, key) {
  const value = String(params.get(key) || '').trim();
  return value || HASH_FILTER_ALL;
}

function getDashboardFiltersFromHash() {
  const { params } = readHashState();
  return {
    manager: getHashFilterValue(params, 'manager'),
    pipeline: getHashFilterValue(params, 'pipeline'),
    source: getHashFilterValue(params, 'source'),
  };
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

function parseFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractActivityField(item, keys, fallback = '—') {
  for (const key of keys) {
    const value = item?.[key];
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return fallback;
}

function resolveOverviewMetric(payload, keys) {
  let hasInvalidValue = false;

  for (const key of keys) {
    const rawValue = payload?.[key];
    if (rawValue === null || rawValue === undefined || rawValue === '') continue;

    const parsed = parseFiniteNumber(rawValue);
    if (parsed !== null) {
      return { value: parsed, isInvalid: false };
    }
    hasInvalidValue = true;
  }

  return hasInvalidValue ? { value: null, isInvalid: true } : { value: 0, isInvalid: false };
}

function extractCorrelationId(error) {
  return (
    error?.details?.correlation_id
    || error?.details?.details?.correlation_id
    || error?.details?.correlationId
    || error?.details?.details?.correlationId
    || null
  );
}

function extractErrorCode(error) {
  return (
    error?.details?.code
    || error?.details?.details?.code
    || error?.details?.error
    || null
  );
}

function toArrayPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function parseDateValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameLocalDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function isClosedTask(task) {
  const status = String(task?.status || '').toLowerCase();
  return ['done', 'closed', 'completed', 'cancelled', 'canceled'].includes(status);
}

function isClosedDeal(deal) {
  const status = String(deal?.status || '').toLowerCase();
  return ['won', 'lost', 'closed', 'cancelled', 'canceled', 'rejected'].includes(status);
}

function Dashboard() {
  const { token } = theme.useToken();
  const [period, setPeriod] = useState(getPeriodFromHash);
  const [managerFilter, setManagerFilter] = useState(() => getDashboardFiltersFromHash().manager);
  const [pipelineFilter, setPipelineFilter] = useState(() => getDashboardFiltersFromHash().pipeline);
  const [sourceFilter, setSourceFilter] = useState(() => getDashboardFiltersFromHash().source);
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [overviewError, setOverviewError] = useState(null);
  const [activityError, setActivityError] = useState(null);
  const [inbox, setInbox] = useState({
    overdueTasks: [],
    todayTasks: [],
    criticalDeals: [],
    newLeads: [],
  });
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [inboxError, setInboxError] = useState(null);
  const [drilldownCard, setDrilldownCard] = useState(null);
  const [settingsCard, setSettingsCard] = useState(null);
  const [composerState, setComposerState] = useState(readDashboardComposer);

  useEffect(() => {
    void loadData();
  }, [period]);

  useEffect(() => {
    replaceHashQuery({
      period,
      manager: managerFilter === HASH_FILTER_ALL ? null : managerFilter,
      pipeline: pipelineFilter === HASH_FILTER_ALL ? null : pipelineFilter,
      source: sourceFilter === HASH_FILTER_ALL ? null : sourceFilter,
    });
  }, [period, managerFilter, pipelineFilter, sourceFilter]);

  useEffect(() => {
    persistDashboardComposer(composerState);
  }, [composerState]);

  useEffect(() => {
    const onHashChange = () => {
      const nextPeriod = getPeriodFromHash();
      const nextFilters = getDashboardFiltersFromHash();
      setPeriod((current) => (current === nextPeriod ? current : nextPeriod));
      setManagerFilter((current) => (current === nextFilters.manager ? current : nextFilters.manager));
      setPipelineFilter((current) => (current === nextFilters.pipeline ? current : nextFilters.pipeline));
      setSourceFilter((current) => (current === nextFilters.source ? current : nextFilters.source));
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    void trackCrmEvent('dashboard_opened', {
      source: 'dashboard',
      period,
    });
    // intentionally send only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const managerOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        activity.map((item) =>
          extractActivityField(item, ['manager_name', 'manager', 'owner_name', 'owner', 'user', 'author'])
        )
      )
    ).filter((value) => value && value !== '—');
    return [{ label: 'Все менеджеры', value: HASH_FILTER_ALL }, ...values.map((value) => ({ label: value, value }))];
  }, [activity]);

  const pipelineOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        activity.map((item) =>
          extractActivityField(item, ['pipeline_name', 'pipeline', 'stage_name', 'stage'])
        )
      )
    ).filter((value) => value && value !== '—');
    return [{ label: 'Все воронки', value: HASH_FILTER_ALL }, ...values.map((value) => ({ label: value, value }))];
  }, [activity]);

  const sourceOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        activity.map((item) =>
          extractActivityField(item, ['source_name', 'source', 'channel', 'lead_source'])
        )
      )
    ).filter((value) => value && value !== '—');
    return [{ label: 'Все источники', value: HASH_FILTER_ALL }, ...values.map((value) => ({ label: value, value }))];
  }, [activity]);

  const filteredActivity = useMemo(() => {
    return activity.filter((item) => {
      const managerValue = extractActivityField(item, ['manager_name', 'manager', 'owner_name', 'owner', 'user', 'author']);
      const pipelineValue = extractActivityField(item, ['pipeline_name', 'pipeline', 'stage_name', 'stage']);
      const sourceValue = extractActivityField(item, ['source_name', 'source', 'channel', 'lead_source']);

      if (managerFilter !== HASH_FILTER_ALL && managerValue !== managerFilter) return false;
      if (pipelineFilter !== HASH_FILTER_ALL && pipelineValue !== pipelineFilter) return false;
      if (sourceFilter !== HASH_FILTER_ALL && sourceValue !== sourceFilter) return false;
      return true;
    });
  }, [activity, managerFilter, pipelineFilter, sourceFilter]);

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
  const invalidMetricHelper =
    t('dashboardPage.errors.invalidMetricValue') === 'dashboardPage.errors.invalidMetricValue'
      ? 'Значение недоступно из-за некорректных данных источника.'
      : t('dashboardPage.errors.invalidMetricValue');
  const formatRevenueValue = (value) =>
    revenueMetricsUseSingleCurrency
      ? formatCurrency(value, overviewCurrencyCode)
      : formatNumber(value);
  const statsUnavailable = Boolean(overviewError && !loadingOverview && !overview);

  const cards = useMemo(() => {
    const data = overview || {};
    const leadsMetric = resolveOverviewMetric(data, ['total_leads', 'leads']);
    const contactsMetric = resolveOverviewMetric(data, ['total_contacts', 'contacts']);
    const dealsMetric = resolveOverviewMetric(data, ['total_deals', 'deals']);
    const revenueMetric = resolveOverviewMetric(data, ['total_revenue', 'revenue']);

    return [
      {
        key: 'leads',
        title: t('dashboardPage.cards.leads'),
        value: statsUnavailable || leadsMetric.isInvalid ? '—' : leadsMetric.value,
        icon: <UserOutlined />,
        helper: leadsMetric.isInvalid ? invalidMetricHelper : null,
      },
      {
        key: 'contacts',
        title: t('dashboardPage.cards.contacts'),
        value: statsUnavailable || contactsMetric.isInvalid ? '—' : contactsMetric.value,
        icon: <TeamOutlined />,
        helper: contactsMetric.isInvalid ? invalidMetricHelper : null,
      },
      {
        key: 'deals',
        title: t('dashboardPage.cards.deals'),
        value: statsUnavailable || dealsMetric.isInvalid ? '—' : dealsMetric.value,
        icon: <BarChartOutlined />,
        helper: dealsMetric.isInvalid ? invalidMetricHelper : null,
      },
      {
        key: 'revenue',
        title:
          revenueMetricsUseSingleCurrency && overviewCurrencyCode
            ? `${t('dashboardPage.cards.revenue')} (${overviewCurrencyCode})`
            : t('dashboardPage.cards.revenue'),
        value: statsUnavailable || revenueMetric.isInvalid ? '—' : revenueMetric.value,
        icon: <DollarCircleOutlined />,
        precision: statsUnavailable || revenueMetric.isInvalid ? undefined : 2,
        formatter: statsUnavailable || revenueMetric.isInvalid ? undefined : formatRevenueValue,
        helper: revenueMetric.isInvalid ? invalidMetricHelper : revenueHelper,
      },
    ];
  }, [
    formatRevenueValue,
    invalidMetricHelper,
    overview,
    overviewCurrencyCode,
    revenueHelper,
    revenueMetricsUseSingleCurrency,
    statsUnavailable,
  ]);

  const quickActions = useMemo(
    () => [
      {
        key: 'new-task',
        label: 'Задача',
        icon: <ThunderboltOutlined />,
        onClick: () => navigate('/tasks/new'),
      },
      {
        key: 'new-deal',
        label: 'Сделка',
        icon: <DollarCircleOutlined />,
        onClick: () => navigate('/deals/new'),
      },
      {
        key: 'new-process',
        label: 'Процесс',
        icon: <ProjectOutlined />,
        onClick: () => navigate('/projects/new'),
      },
      {
        key: 'chat',
        label: 'Чаты CRM',
        icon: <MessageOutlined />,
        onClick: () => navigate('/chat'),
      },
      {
        key: 'ai-chat',
        label: 'AI чат CRM',
        icon: <RobotOutlined />,
        onClick: () => navigate('/ai-chat'),
      },
    ],
    []
  );

  const inboxItems = useMemo(() => {
    const overdueTasksItems = inbox.overdueTasks.map((task) => ({
      key: `task-overdue-${task.id}`,
      type: 'Просроченная задача',
      typeColor: 'error',
      title: task?.name || 'Задача',
      meta: task?.due_date ? `Дедлайн: ${String(task.due_date).slice(0, 10)}` : 'Без дедлайна',
      actionLabel: 'Открыть задачу',
      onClick: () => navigate(task?.id ? `/tasks/${task.id}` : '/tasks'),
      priority: 1,
    }));

    const criticalDealsItems = inbox.criticalDeals.map((deal) => ({
      key: `deal-critical-${deal.id}`,
      type: 'Критичная сделка',
      typeColor: 'warning',
      title: deal?.name || 'Сделка без названия',
      meta: deal?.expected_close_date
        ? `План закрытия: ${String(deal.expected_close_date).slice(0, 10)}`
        : 'Без даты закрытия',
      actionLabel: 'Открыть сделку',
      onClick: () => navigate(deal?.id ? `/deals/${deal.id}` : '/deals'),
      priority: 2,
    }));

    const todayTasksItems = inbox.todayTasks.map((task) => ({
      key: `task-today-${task.id}`,
      type: 'Задача на сегодня',
      typeColor: 'processing',
      title: task?.name || 'Задача',
      meta: 'Требует выполнения сегодня',
      actionLabel: 'Открыть задачу',
      onClick: () => navigate(task?.id ? `/tasks/${task.id}` : '/tasks'),
      priority: 3,
    }));

    const newLeadsItems = inbox.newLeads.map((lead) => ({
      key: `lead-new-${lead.id}`,
      type: 'Новый лид',
      typeColor: 'success',
      title: lead?.name || lead?.full_name || lead?.title || 'Лид без названия',
      meta: lead?.source_name || lead?.source || 'Новый входящий лид',
      actionLabel: 'Открыть лид',
      onClick: () => navigate(lead?.id ? `/leads/${lead.id}` : '/leads'),
      priority: 4,
    }));

    return [...overdueTasksItems, ...criticalDealsItems, ...todayTasksItems, ...newLeadsItems]
      .sort((left, right) => left.priority - right.priority)
      .slice(0, 8);
  }, [inbox.criticalDeals, inbox.newLeads, inbox.overdueTasks, inbox.todayTasks]);

  const visibleCards = useMemo(() => {
    const hiddenSet = new Set(composerState.hidden || []);
    const pinnedSet = new Set(composerState.pinned || []);
    const filtered = cards.filter((card) => !hiddenSet.has(card.key));
    return filtered.sort((left, right) => {
      const leftPinned = pinnedSet.has(left.key) ? 1 : 0;
      const rightPinned = pinnedSet.has(right.key) ? 1 : 0;
      if (leftPinned === rightPinned) return 0;
      return rightPinned - leftPinned;
    });
  }, [cards, composerState.hidden, composerState.pinned]);

  const isWidgetPinned = (widgetKey) => (composerState.pinned || []).includes(widgetKey);
  const isWidgetHidden = (widgetKey) => (composerState.hidden || []).includes(widgetKey);

  const toggleWidgetPinned = (widgetKey) => {
    setComposerState((prev) => {
      const pinned = new Set(prev.pinned || []);
      if (pinned.has(widgetKey)) pinned.delete(widgetKey);
      else pinned.add(widgetKey);
      return { ...prev, pinned: Array.from(pinned) };
    });
  };

  const toggleWidgetHidden = (widgetKey) => {
    setComposerState((prev) => {
      const hidden = new Set(prev.hidden || []);
      if (hidden.has(widgetKey)) hidden.delete(widgetKey);
      else hidden.add(widgetKey);
      return { ...prev, hidden: Array.from(hidden) };
    });
  };

  const resetComposerState = () => {
    setComposerState({ hidden: [], pinned: [] });
  };

  async function loadOverviewData() {
    setOverviewError(null);
    setLoadingOverview(true);

    try {
      const overviewRes = await getOverview();
      setOverview(normalizeOverview(overviewRes));
    } catch (e) {
      const statusCode = Number(e?.status || e?.response?.status || e?.details?.status || 0);
      const accessRestricted = statusCode === 403;
      const correlationId = extractCorrelationId(e);
      const errorCode = extractErrorCode(e);
      const retryable = [429, 502, 503, 504].includes(statusCode) || statusCode >= 500;
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
        correlationId,
        code: errorCode,
        retryable,
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

  async function loadInboxData() {
    setInboxError(null);
    setLoadingInbox(true);

    try {
      const [tasksResponse, dealsResponse, leadsResponse] = await Promise.all([
        getTasks({ page_size: 200, ordering: 'due_date', active: true }),
        getDeals({ page_size: 200, ordering: 'expected_close_date' }),
        getLeads({ page_size: 200, ordering: '-create_date' }),
      ]);

      const now = new Date();
      const weekAhead = new Date(now);
      weekAhead.setDate(weekAhead.getDate() + 7);

      const tasks = toArrayPayload(tasksResponse);
      const deals = toArrayPayload(dealsResponse);
      const leads = toArrayPayload(leadsResponse);

      const overdueTasks = tasks
        .filter((task) => {
          if (isClosedTask(task)) return false;
          const dueDate = parseDateValue(task?.due_date);
          return Boolean(dueDate && dueDate.getTime() < now.getTime() && !isSameLocalDay(dueDate, now));
        })
        .slice(0, 5);

      if (overdueTasks.length > 0) {
        void trackCrmEvent('task_overdue', { count: overdueTasks.length });
        void trackCrmEvent('sla_breached', { source: 'tasks', count: overdueTasks.length });
      }

      const todayTasks = tasks
        .filter((task) => {
          if (isClosedTask(task)) return false;
          const dueDate = parseDateValue(task?.due_date);
          return Boolean(dueDate && isSameLocalDay(dueDate, now));
        })
        .slice(0, 5);

      const criticalDeals = deals
        .filter((deal) => {
          if (isClosedDeal(deal)) return false;
          const expectedCloseDate = parseDateValue(
            deal?.expected_close_date || deal?.close_date || deal?.closing_date
          );
          const probability = Number(deal?.probability || 0);
          const isSoonToClose =
            expectedCloseDate && expectedCloseDate.getTime() <= weekAhead.getTime();
          return Boolean(isSoonToClose || probability >= 70);
        })
        .sort((left, right) => {
          const leftDate = parseDateValue(
            left?.expected_close_date || left?.close_date || left?.closing_date
          );
          const rightDate = parseDateValue(
            right?.expected_close_date || right?.close_date || right?.closing_date
          );
          if (!leftDate && !rightDate) return 0;
          if (!leftDate) return 1;
          if (!rightDate) return -1;
          return leftDate.getTime() - rightDate.getTime();
        })
        .slice(0, 5);

      const newLeads = leads
        .filter((lead) => {
          const createdAt = parseDateValue(
            lead?.create_date
              || lead?.created_at
              || lead?.created
              || lead?.date_created
          );
          return Boolean(createdAt && isSameLocalDay(createdAt, now));
        })
        .slice(0, 5);

      setInbox({ overdueTasks, todayTasks, criticalDeals, newLeads });
    } catch (error) {
      setInbox({
        overdueTasks: [],
        todayTasks: [],
        criticalDeals: [],
        newLeads: [],
      });
      setInboxError(error?.message || 'Не удалось загрузить inbox действий');
    } finally {
      setLoadingInbox(false);
    }
  }

  async function loadData() {
    await Promise.allSettled([loadOverviewData(), loadActivityData(), loadInboxData()]);
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
          <Space wrap>
            {quickActions.map((action) => (
              <Button
                key={action.key}
                icon={action.icon}
                type={action.key === 'new-task' ? 'primary' : 'default'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </Space>
          <Text type="secondary">
            <PlusCircleOutlined style={{ marginRight: 6 }} />
            Быстрый запуск задач, сделок, процессов и коммуникаций.
          </Text>
        </Space>
      </Card>

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
          <Space wrap size={8}>
            <Text type="secondary">Фильтры:</Text>
            <Select
              size="small"
              style={{ minWidth: 170 }}
              value={managerFilter}
              options={managerOptions}
              onChange={setManagerFilter}
            />
            <Select
              size="small"
              style={{ minWidth: 160 }}
              value={pipelineFilter}
              options={pipelineOptions}
              onChange={setPipelineFilter}
            />
            <Select
              size="small"
              style={{ minWidth: 160 }}
              value={sourceFilter}
              options={sourceOptions}
              onChange={setSourceFilter}
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
          ) : overviewError ? (
            <Alert
              type={overviewError.type || 'warning'}
              showIcon
              message={overviewError.message}
              description={(
                <Space direction="vertical" size={0}>
                  {overviewError.description ? <Text>{overviewError.description}</Text> : null}
                  {overviewError.code ? (
                    <Text type="secondary">code: {overviewError.code}</Text>
                  ) : null}
                  {overviewError.correlationId ? (
                    <Text type="secondary">correlation_id: {overviewError.correlationId}</Text>
                  ) : null}
                  {overviewError.retryable != null ? (
                    <Text type="secondary">
                      retryable: {overviewError.retryable ? 'true' : 'false'}
                    </Text>
                  ) : null}
                </Space>
              )}
            />
          ) : null}
        </Space>
      </Card>

      <Spin spinning={loadingOverview}>
        <Row gutter={[16, 16]}>
          {visibleCards.map((card) => (
            <Col xs={24} sm={12} lg={6} key={card.key}>
              <Card
                data-widget-key={card.key}
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
                {isWidgetPinned(card.key) ? (
                  <Tag color="processing" style={{ marginBottom: 8 }}>
                    {t('dashboardPage.composer.pinned') === 'dashboardPage.composer.pinned'
                      ? 'Pinned'
                      : t('dashboardPage.composer.pinned')}
                  </Tag>
                ) : null}
                {card.helper ? <Text type="secondary">{card.helper}</Text> : null}
                <Space size={4} wrap style={{ marginTop: 10 }}>
                  <Button size="small" onClick={() => void loadOverviewData()}>
                    {t('actions.refresh') === 'actions.refresh' ? 'Обновить' : t('actions.refresh')}
                  </Button>
                  <Button size="small" onClick={() => setDrilldownCard(card)}>
                    {t('dashboardPage.actions.drilldown') === 'dashboardPage.actions.drilldown'
                      ? 'Drill-down'
                      : t('dashboardPage.actions.drilldown')}
                  </Button>
                  <Button size="small" onClick={() => setSettingsCard(card)}>
                    {t('dashboardPage.actions.settings') === 'dashboardPage.actions.settings'
                      ? 'Настройки'
                      : t('dashboardPage.actions.settings')}
                  </Button>
                  <Button
                    size="small"
                    icon={isWidgetPinned(card.key) ? <PushpinFilled /> : <PushpinOutlined />}
                    onClick={() => toggleWidgetPinned(card.key)}
                  >
                    {isWidgetPinned(card.key)
                      ? t('dashboardPage.composer.unpin') === 'dashboardPage.composer.unpin'
                        ? 'Unpin'
                        : t('dashboardPage.composer.unpin')
                      : t('dashboardPage.composer.pin') === 'dashboardPage.composer.pin'
                        ? 'Pin'
                        : t('dashboardPage.composer.pin')}
                  </Button>
                  <Button
                    size="small"
                    icon={<EyeInvisibleOutlined />}
                    onClick={() => toggleWidgetHidden(card.key)}
                  >
                    {t('dashboardPage.composer.hide') === 'dashboardPage.composer.hide'
                      ? 'Hide'
                      : t('dashboardPage.composer.hide')}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      const node = document.querySelector(`[data-widget-key="${card.key}"]`);
                      if (node?.requestFullscreen) {
                        node.requestFullscreen().catch(() => {});
                      }
                    }}
                  >
                    {t('dashboardPage.actions.fullscreen') === 'dashboardPage.actions.fullscreen'
                      ? 'Fullscreen'
                      : t('dashboardPage.actions.fullscreen')}
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
          {!visibleCards.length ? (
            <Col span={24}>
              <Card>
                <Empty
                  description={
                    t('dashboardPage.composer.empty') === 'dashboardPage.composer.empty'
                      ? 'Все виджеты скрыты'
                      : t('dashboardPage.composer.empty')
                  }
                >
                  <Button type="primary" onClick={resetComposerState}>
                    {t('dashboardPage.composer.restore') === 'dashboardPage.composer.restore'
                      ? 'Восстановить виджеты'
                      : t('dashboardPage.composer.restore')}
                  </Button>
                </Empty>
              </Card>
            </Col>
          ) : null}
        </Row>
      </Spin>

      <Card
        title="Inbox действий"
        extra={
          <Button size="small" onClick={() => void loadInboxData()}>
            {t('actions.refresh') === 'actions.refresh' ? 'Обновить' : t('actions.refresh')}
          </Button>
        }
        style={{
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgElevated,
          boxShadow: token.boxShadowTertiary,
        }}
      >
        <Spin spinning={loadingInbox}>
          {inboxError ? (
            <Alert
              type="warning"
              showIcon
              message={inboxError}
              action={
                <Button size="small" onClick={() => void loadInboxData()}>
                  {t('actions.retry') === 'actions.retry' ? 'Повторить' : t('actions.retry')}
                </Button>
              }
            />
          ) : (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space wrap size={8}>
                <Tag color="error" icon={<FireOutlined />}>
                  Просрочки: {inbox.overdueTasks.length}
                </Tag>
                <Tag color="processing" icon={<CalendarOutlined />}>
                  На сегодня: {inbox.todayTasks.length}
                </Tag>
                <Tag color="warning" icon={<DollarCircleOutlined />}>
                  Критичные сделки: {inbox.criticalDeals.length}
                </Tag>
                <Tag color="success" icon={<UserOutlined />}>
                  Новые лиды: {inbox.newLeads.length}
                </Tag>
              </Space>

              <List
                locale={{ emptyText: 'Нет действий, требующих внимания' }}
                dataSource={inboxItems}
                renderItem={(item) => (
                  <List.Item
                    key={item.key}
                    actions={[
                      <Button key={`${item.key}-open`} size="small" type="link" onClick={item.onClick}>
                        {item.actionLabel}
                      </Button>,
                    ]}
                  >
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Space wrap size={8}>
                        <Tag color={item.typeColor}>{item.type}</Tag>
                        <Text strong>{item.title}</Text>
                      </Space>
                      <Text type="secondary">{item.meta}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Space>
          )}
        </Spin>
      </Card>

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
              dataSource={filteredActivity}
              locale={{
                emptyText:
                  managerFilter !== HASH_FILTER_ALL
                  || pipelineFilter !== HASH_FILTER_ALL
                  || sourceFilter !== HASH_FILTER_ALL
                    ? 'Нет активности под выбранные фильтры'
                    : t('dashboardPage.lastActivity.empty'),
              }}
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
      <Modal
        open={Boolean(drilldownCard)}
        title={drilldownCard ? `${drilldownCard.title}: drill-down` : 'Drill-down'}
        footer={null}
        onCancel={() => setDrilldownCard(null)}
      >
        {drilldownCard ? (
          <Space direction="vertical" size="small">
            <Text>
              {t('dashboardPage.drilldown.currentValue') === 'dashboardPage.drilldown.currentValue'
                ? 'Текущее значение'
                : t('dashboardPage.drilldown.currentValue')}
              : <Text strong> {String(drilldownCard.value)}</Text>
            </Text>
            <Text type="secondary">
              {t('dashboardPage.drilldown.period') === 'dashboardPage.drilldown.period'
                ? 'Период'
                : t('dashboardPage.drilldown.period')}
              : {period}
            </Text>
            <Text type="secondary">
              {t('dashboardPage.drilldown.hint') === 'dashboardPage.drilldown.hint'
                ? 'Используйте страницу аналитики для детального среза по источникам и сегментам.'
                : t('dashboardPage.drilldown.hint')}
            </Text>
          </Space>
        ) : null}
      </Modal>
      <Modal
        open={Boolean(settingsCard)}
        title={settingsCard ? `${settingsCard.title}: ${t('dashboardPage.actions.settings') === 'dashboardPage.actions.settings' ? 'Настройки' : t('dashboardPage.actions.settings')}` : 'Settings'}
        footer={null}
        onCancel={() => setSettingsCard(null)}
      >
        {settingsCard ? (
          <Space direction="vertical" size="small">
            <Text type="secondary">
              {t('dashboardPage.widgetSettings.placeholder') === 'dashboardPage.widgetSettings.placeholder'
                ? 'Персонализация виджетов будет расширяться в следующих итерациях Dashboard Composer.'
                : t('dashboardPage.widgetSettings.placeholder')}
            </Text>
            <Text>
              {t('dashboardPage.widgetSettings.widget') === 'dashboardPage.widgetSettings.widget'
                ? 'Виджет'
                : t('dashboardPage.widgetSettings.widget')}
              : <Text strong> {settingsCard.key}</Text>
            </Text>
            <Text>
              {t('dashboardPage.widgetSettings.helperState') === 'dashboardPage.widgetSettings.helperState'
                ? 'Подсказка'
                : t('dashboardPage.widgetSettings.helperState')}
              : <Text strong> {settingsCard.helper ? 'ON' : 'OFF'}</Text>
            </Text>
            <Space wrap>
              <Button
                size="small"
                icon={isWidgetPinned(settingsCard.key) ? <PushpinFilled /> : <PushpinOutlined />}
                onClick={() => toggleWidgetPinned(settingsCard.key)}
              >
                {isWidgetPinned(settingsCard.key)
                  ? t('dashboardPage.composer.unpin') === 'dashboardPage.composer.unpin'
                    ? 'Unpin widget'
                    : t('dashboardPage.composer.unpin')
                  : t('dashboardPage.composer.pin') === 'dashboardPage.composer.pin'
                    ? 'Pin widget'
                    : t('dashboardPage.composer.pin')}
              </Button>
              <Button
                size="small"
                icon={<EyeInvisibleOutlined />}
                onClick={() => {
                  toggleWidgetHidden(settingsCard.key);
                  setSettingsCard(null);
                }}
              >
                {isWidgetHidden(settingsCard.key)
                  ? t('dashboardPage.composer.show') === 'dashboardPage.composer.show'
                    ? 'Show on dashboard'
                    : t('dashboardPage.composer.show')
                  : t('dashboardPage.composer.hide') === 'dashboardPage.composer.hide'
                    ? 'Hide on dashboard'
                    : t('dashboardPage.composer.hide')}
              </Button>
              <Button size="small" onClick={resetComposerState}>
                {t('dashboardPage.composer.restore') === 'dashboardPage.composer.restore'
                  ? 'Restore defaults'
                  : t('dashboardPage.composer.restore')}
              </Button>
            </Space>
          </Space>
        ) : null}
      </Modal>
    </Space>
  );
}

export default Dashboard;
