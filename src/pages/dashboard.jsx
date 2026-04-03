import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Input,
  List,
  Modal,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tabs,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import {
  BarChartOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  DashboardOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  ReloadOutlined,
  SaveOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import ExportButton from '../components/ExportButton.jsx';
import PredictionChart from '../components/analytics/PredictionChart.jsx';
import { getActivityFeed, getFunnelData, getOverview, normalizeOverview } from '../lib/api/analytics.js';
import { getDeals } from '../lib/api/deals.js';
import { getLeads } from '../lib/api/leads.js';
import { revenuePredictions } from '../lib/api/predictions.js';
import { getTasks } from '../lib/api/tasks.js';
import { getUserFromToken } from '../lib/api/auth.js';
import { formatCurrency, formatDate, formatNumber } from '../lib/utils/format.js';
import { t } from '../lib/i18n/index.js';
import { navigate } from '../router.js';

const { Title, Text } = Typography;

const PERIOD_OPTIONS = [
  { label: '7d', value: '7d', days: 7 },
  { label: '30d', value: '30d', days: 30 },
  { label: '90d', value: '90d', days: 90 },
];
const PERIOD_VALUES = PERIOD_OPTIONS.map((option) => option.value);
const VIEW_OPTIONS = [
  { label: 'Mening kunim', value: 'my_day' },
  { label: 'Jamoa', value: 'team' },
  { label: 'Kompaniya', value: 'company' },
];
const FILTER_ALL = 'all';
const DEFAULT_PERIOD = '30d';
const DEFAULT_VIEW = 'my_day';
const SAVED_VIEWS_STORAGE_KEY = 'crm:dashboard:saved-views:v1';
const KPI_TOOLTIP_WIDTH = 320;
const SLA_RESPONSE_LIMIT_MINUTES = 30;
const LEAD_STALE_DAYS = 3;

function tr(key, fallback, params) {
  const value = t(key, params);
  return value === key ? fallback : value;
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

function replaceHashQuery(updates) {
  if (typeof window === 'undefined') return;

  const { path, params } = readHashState();
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === FILTER_ALL) {
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
      `${window.location.pathname}${window.location.search}${nextHash}`,
    );
  }
}

function getHashParams() {
  const params = readHashState().params;
  const period = params.get('period');
  const view = params.get('view');

  return {
    period: PERIOD_VALUES.includes(period) ? period : DEFAULT_PERIOD,
    view: VIEW_OPTIONS.some((entry) => entry.value === view) ? view : DEFAULT_VIEW,
    manager: params.get('manager') || FILTER_ALL,
    pipeline: params.get('pipeline') || FILTER_ALL,
    source: params.get('source') || FILTER_ALL,
  };
}

function parseFiniteNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function parseDateValue(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildFutureMonthLabels(count = 6) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + index + 1, 1);
    return monthDate.toLocaleString(undefined, { month: 'short' });
  });
}

function getPeriodDays(period) {
  const option = PERIOD_OPTIONS.find((entry) => entry.value === period);
  return option ? option.days : 30;
}

function getRangeForPeriod(period, now = new Date()) {
  const days = getPeriodDays(period);
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));

  return { start, end, prevStart, prevEnd, days };
}

function isDateInRange(date, start, end) {
  if (!date) return false;
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

function toPercent(value, precision = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(precision)}%`;
}

function detectActivityType(activityItem) {
  const typeCandidate = String(
    activityItem?.event_type
      || activityItem?.type
      || activityItem?.kind
      || activityItem?.event
      || activityItem?.title
      || ''
  ).toLowerCase();

  if (/call|звон|qo'ng|qo‘ng/.test(typeCandidate)) return 'call';
  if (/message|msg|chat|telegram|whatsapp|facebook|instagram|sms|xabar|сообщ/.test(typeCandidate)) return 'message';
  if (/meeting|встреч|uchrash/.test(typeCandidate)) return 'meeting';
  return 'other';
}

function readField(item, keys, fallback = '—') {
  for (const key of keys) {
    const value = item?.[key];
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return fallback;
}

function normalizePredictionSeries(payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  const unwrapped = source?.data && typeof source.data === 'object' ? source.data : source;
  const pickArray = (...candidates) => candidates.find((candidate) => Array.isArray(candidate));

  let labels = [];
  let predictedData = [];
  let confidenceLower = [];
  let confidenceUpper = [];

  const directLabels = pickArray(unwrapped?.labels, unwrapped?.x_labels, unwrapped?.months);
  const directPredicted = pickArray(
    unwrapped?.predicted_data,
    unwrapped?.predicted,
    unwrapped?.forecast_values,
    unwrapped?.values,
    unwrapped?.revenue,
  );
  const directLower = pickArray(unwrapped?.confidence_lower, unwrapped?.lower_bound, unwrapped?.lower);
  const directUpper = pickArray(unwrapped?.confidence_upper, unwrapped?.upper_bound, unwrapped?.upper);

  if (directPredicted?.length) {
    labels = directLabels || [];
    predictedData = directPredicted;
    confidenceLower = directLower || [];
    confidenceUpper = directUpper || [];
  } else {
    const rows = pickArray(
      unwrapped?.forecast_points,
      unwrapped?.prediction_points,
      unwrapped?.points,
      unwrapped?.results,
      unwrapped?.forecast,
      unwrapped?.data,
      Array.isArray(unwrapped) ? unwrapped : null,
    ) || [];

    if (rows.length) {
      labels = rows.map((item, index) =>
        readField(item, ['label', 'period', 'month', 'date', 'x'], String(index + 1)),
      );
      predictedData = rows.map((item) =>
        parseFiniteNumber(
          item?.predicted ?? item?.forecast ?? item?.value ?? item?.amount ?? item?.revenue,
          NaN,
        ),
      );
      confidenceLower = rows.map((item) =>
        parseFiniteNumber(item?.confidence_lower ?? item?.lower_bound ?? item?.lower, NaN),
      );
      confidenceUpper = rows.map((item) =>
        parseFiniteNumber(item?.confidence_upper ?? item?.upper_bound ?? item?.upper, NaN),
      );
    }
  }

  const normalizedPredicted = predictedData
    .map((value) => parseFiniteNumber(value, NaN))
    .filter((value) => Number.isFinite(value));

  if (!normalizedPredicted.length) {
    return null;
  }

  const length = normalizedPredicted.length;
  const normalizedLabels = (labels.length ? labels : buildFutureMonthLabels(length))
    .slice(0, length)
    .map((label, index) => String(label || buildFutureMonthLabels(length)[index]));

  const normalizedLower = confidenceLower.length
    ? confidenceLower.slice(0, length).map((value, index) => {
      const parsed = parseFiniteNumber(value, NaN);
      return Number.isFinite(parsed) ? parsed : normalizedPredicted[index] * 0.88;
    })
    : normalizedPredicted.map((value) => value * 0.88);

  const normalizedUpper = confidenceUpper.length
    ? confidenceUpper.slice(0, length).map((value, index) => {
      const parsed = parseFiniteNumber(value, NaN);
      return Number.isFinite(parsed) ? parsed : normalizedPredicted[index] * 1.12;
    })
    : normalizedPredicted.map((value) => value * 1.12);

  return {
    labels: normalizedLabels,
    predictedData: normalizedPredicted,
    confidenceLower: normalizedLower.map((value, index) => Math.min(value, normalizedPredicted[index])),
    confidenceUpper: normalizedUpper.map((value, index) => Math.max(value, normalizedPredicted[index])),
  };
}

function readResponseMinutes(item) {
  const sec = parseFiniteNumber(item?.first_response_sec, NaN);
  if (Number.isFinite(sec) && sec >= 0) return sec / 60;
  const min = parseFiniteNumber(item?.first_response_minutes, NaN);
  if (Number.isFinite(min) && min >= 0) return min;
  const ms = parseFiniteNumber(item?.first_response_ms, NaN);
  if (Number.isFinite(ms) && ms >= 0) return ms / 60000;
  return null;
}

function getDealStatus(deal) {
  return String(deal?.status || deal?.deal_status || '').toLowerCase();
}

function isDealClosed(deal) {
  return ['won', 'lost', 'closed', 'cancelled', 'canceled', 'rejected'].includes(getDealStatus(deal));
}

function isTaskClosed(task) {
  const status = String(task?.status || '').toLowerCase();
  return ['done', 'closed', 'completed', 'cancelled', 'canceled'].includes(status);
}

function getSavedViews() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => ({
        id: String(entry?.id || ''),
        name: String(entry?.name || '').trim(),
        period: PERIOD_VALUES.includes(entry?.period) ? entry.period : DEFAULT_PERIOD,
        view: VIEW_OPTIONS.some((item) => item.value === entry?.view) ? entry.view : DEFAULT_VIEW,
        manager: entry?.manager || FILTER_ALL,
        pipeline: entry?.pipeline || FILTER_ALL,
        source: entry?.source || FILTER_ALL,
      }))
      .filter((entry) => entry.id && entry.name);
  } catch {
    return [];
  }
}

function saveViews(views) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(views));
}

function metricDelta(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function freshnessBadge(timestamp) {
  if (!timestamp) return { text: '—', status: 'default' };

  const ageMs = Date.now() - timestamp.getTime();
  if (ageMs < 2 * 60 * 1000) {
    return { text: tr('dashboardPage.freshness.live', 'hozir yangilandi'), status: 'success' };
  }
  if (ageMs < 15 * 60 * 1000) {
    return { text: tr('dashboardPage.freshness.recent', 'yaqinda yangilandi'), status: 'processing' };
  }
  return { text: tr('dashboardPage.freshness.stale', 'kechikkan'), status: 'warning' };
}

function Dashboard() {
  const { token } = theme.useToken();
  const { message } = App.useApp();

  const initialHash = getHashParams();
  const [period, setPeriod] = useState(initialHash.period);
  const [viewMode, setViewMode] = useState(initialHash.view);
  const [managerFilter, setManagerFilter] = useState(initialHash.manager);
  const [pipelineFilter, setPipelineFilter] = useState(initialHash.pipeline);
  const [sourceFilter, setSourceFilter] = useState(initialHash.source);

  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [deals, setDeals] = useState([]);
  const [leads, setLeads] = useState([]);
  const [predictionSeries, setPredictionSeries] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qualityIssues, setQualityIssues] = useState([]);

  const [savedViews, setSavedViews] = useState(getSavedViews);
  const [saveViewModalOpen, setSaveViewModalOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const [lastUpdated, setLastUpdated] = useState({
    overview: null,
    activity: null,
    funnel: null,
    entities: null,
  });

  const user = useMemo(() => getUserFromToken(), []);

  useEffect(() => {
    void loadDashboardData();
  }, [period]);

  useEffect(() => {
    replaceHashQuery({
      period,
      view: viewMode,
      manager: managerFilter,
      pipeline: pipelineFilter,
      source: sourceFilter,
    });
  }, [period, viewMode, managerFilter, pipelineFilter, sourceFilter]);

  useEffect(() => {
    const onHashChange = () => {
      const hashParams = getHashParams();
      setPeriod((current) => (current === hashParams.period ? current : hashParams.period));
      setViewMode((current) => (current === hashParams.view ? current : hashParams.view));
      setManagerFilter((current) => (current === hashParams.manager ? current : hashParams.manager));
      setPipelineFilter((current) => (current === hashParams.pipeline ? current : hashParams.pipeline));
      setSourceFilter((current) => (current === hashParams.source ? current : hashParams.source));
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    saveViews(savedViews);
  }, [savedViews]);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);

    const issues = [];

    try {
      const [overviewPayload, activityPayload, funnelPayload, tasksPayload, dealsPayload, leadsPayload, predictionPayload] =
        await Promise.allSettled([
          getOverview(),
          getActivityFeed({ period }),
          getFunnelData({ period }),
          getTasks({ page_size: 300, ordering: 'due_date' }),
          getDeals({ page_size: 300, ordering: '-expected_close_date' }),
          getLeads({ page_size: 300, ordering: '-create_date' }),
          revenuePredictions.forecast({ period }),
        ]);

      if (overviewPayload.status === 'fulfilled') {
        setOverview(normalizeOverview(overviewPayload.value));
        setLastUpdated((prev) => ({ ...prev, overview: new Date() }));
      } else {
        issues.push(tr('dashboardPage.quality.overviewUnavailable', 'Сводная аналитика недоступна'));
      }

      if (activityPayload.status === 'fulfilled') {
        setActivity(safeArray(activityPayload.value));
        setLastUpdated((prev) => ({ ...prev, activity: new Date() }));
      } else {
        issues.push(tr('dashboardPage.quality.activityUnavailable', 'Лента активности недоступна'));
        setActivity([]);
      }

      if (funnelPayload.status === 'fulfilled') {
        setFunnel(safeArray(funnelPayload.value));
        setLastUpdated((prev) => ({ ...prev, funnel: new Date() }));
      } else {
        issues.push(tr('dashboardPage.quality.funnelUnavailable', 'Воронка недоступна'));
        setFunnel([]);
      }

      if (tasksPayload.status === 'fulfilled') {
        setTasks(safeArray(tasksPayload.value));
      } else {
        issues.push(tr('dashboardPage.quality.tasksUnavailable', 'Не удалось загрузить задачи для блока исключений'));
        setTasks([]);
      }

      if (dealsPayload.status === 'fulfilled') {
        setDeals(safeArray(dealsPayload.value));
      } else {
        issues.push(tr('dashboardPage.quality.dealsUnavailable', 'Не удалось загрузить сделки для оперативных KPI'));
        setDeals([]);
      }

      if (leadsPayload.status === 'fulfilled') {
        setLeads(safeArray(leadsPayload.value));
      } else {
        issues.push(tr('dashboardPage.quality.leadsUnavailable', 'Не удалось загрузить лиды для оперативных KPI'));
        setLeads([]);
      }

      if (predictionPayload.status === 'fulfilled') {
        setPredictionSeries(normalizePredictionSeries(predictionPayload.value));
      } else {
        setPredictionSeries(null);
      }

      setLastUpdated((prev) => ({ ...prev, entities: new Date() }));
      setQualityIssues(issues);

      const allFailed = [overviewPayload, activityPayload, funnelPayload, tasksPayload, dealsPayload, leadsPayload]
        .every((result) => result.status === 'rejected');
      if (allFailed) {
        setError({
          message: tr('dashboardPage.errors.loadData', 'Не удалось загрузить данные дашборда'),
        });
      }
    } catch (e) {
      console.error('Dashboard load error:', e);
      setError({ message: tr('dashboardPage.errors.loadData', 'Не удалось загрузить данные дашборда') });
    } finally {
      setLoading(false);
    }
  }

  const rangeMeta = useMemo(() => getRangeForPeriod(period), [period]);

  const managerOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        activity.map((item) => readField(item, ['manager_name', 'manager', 'owner_name', 'owner', 'user', 'author']))
      )
    ).filter((value) => value && value !== '—');

    return [
      { label: tr('dashboardPage.filters.allManagers', 'Barcha menejerlar'), value: FILTER_ALL },
      ...values.map((value) => ({ label: value, value })),
    ];
  }, [activity]);

  const pipelineOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        activity.map((item) => readField(item, ['pipeline_name', 'pipeline', 'stage_name', 'stage']))
      )
    ).filter((value) => value && value !== '—');

    return [
      { label: tr('dashboardPage.filters.allPipelines', 'Barcha voronkalar'), value: FILTER_ALL },
      ...values.map((value) => ({ label: value, value })),
    ];
  }, [activity]);

  const sourceOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        activity.map((item) => readField(item, ['source_name', 'source', 'channel', 'lead_source']))
      )
    ).filter((value) => value && value !== '—');

    return [
      { label: tr('dashboardPage.filters.allSources', 'Barcha manbalar'), value: FILTER_ALL },
      ...values.map((value) => ({ label: value, value })),
    ];
  }, [activity]);

  const filteredActivity = useMemo(
    () => activity.filter((item) => {
      const managerValue = readField(item, ['manager_name', 'manager', 'owner_name', 'owner', 'user', 'author']);
      const pipelineValue = readField(item, ['pipeline_name', 'pipeline', 'stage_name', 'stage']);
      const sourceValue = readField(item, ['source_name', 'source', 'channel', 'lead_source']);

      if (managerFilter !== FILTER_ALL && managerValue !== managerFilter) return false;
      if (pipelineFilter !== FILTER_ALL && pipelineValue !== pipelineFilter) return false;
      if (sourceFilter !== FILTER_ALL && sourceValue !== sourceFilter) return false;
      return true;
    }),
    [activity, managerFilter, pipelineFilter, sourceFilter]
  );

  const activityStats = useMemo(() => {
    const scoped = filteredActivity;
    const byType = scoped.reduce((acc, item) => {
      const type = detectActivityType(item);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, { call: 0, message: 0, meeting: 0, other: 0 });

    const responseMinutes = scoped.map(readResponseMinutes).filter((value) => Number.isFinite(value));
    const firstResponseAvg = responseMinutes.length
      ? responseMinutes.reduce((sum, value) => sum + value, 0) / responseMinutes.length
      : null;
    const slaBreachesFromResponses = responseMinutes.filter((value) => value > SLA_RESPONSE_LIMIT_MINUTES).length;

    return {
      total: scoped.length,
      byType,
      firstResponseAvg,
      slaBreachesFromResponses,
    };
  }, [filteredActivity]);

  const derivedMetrics = useMemo(() => {
    const { start, end, prevStart, prevEnd, days } = rangeMeta;

    const openDeals = deals.filter((deal) => !isDealClosed(deal));
    const wonDeals = deals.filter((deal) => getDealStatus(deal) === 'won');
    const lostDeals = deals.filter((deal) => getDealStatus(deal) === 'lost');

    const openPipelineAmount = openDeals.reduce(
      (sum, deal) => sum + parseFiniteNumber(deal?.amount || deal?.total_amount || deal?.value, 0),
      0,
    );

    const forecastCloseAmount = openDeals
      .filter((deal) => {
        const expectedClose = parseDateValue(deal?.expected_close_date || deal?.close_date || deal?.closing_date);
        return expectedClose && isDateInRange(expectedClose, start, end);
      })
      .reduce((sum, deal) => sum + parseFiniteNumber(deal?.amount || deal?.total_amount || deal?.value, 0), 0);

    const wonAmountInPeriod = deals
      .filter((deal) => {
        const status = getDealStatus(deal);
        if (status !== 'won') return false;
        const wonDate = parseDateValue(
          deal?.closed_date || deal?.closed_at || deal?.updated_at || deal?.close_date,
        );
        return wonDate && isDateInRange(wonDate, start, end);
      })
      .reduce((sum, deal) => sum + parseFiniteNumber(deal?.amount || deal?.total_amount || deal?.value, 0), 0);

    const wonAmountPrevPeriod = deals
      .filter((deal) => {
        const status = getDealStatus(deal);
        if (status !== 'won') return false;
        const wonDate = parseDateValue(
          deal?.closed_date || deal?.closed_at || deal?.updated_at || deal?.close_date,
        );
        return wonDate && isDateInRange(wonDate, prevStart, prevEnd);
      })
      .reduce((sum, deal) => sum + parseFiniteNumber(deal?.amount || deal?.total_amount || deal?.value, 0), 0);

    const leadsInRange = leads.filter((lead) => {
      const created = parseDateValue(lead?.create_date || lead?.created_at || lead?.created || lead?.date_created);
      return created && isDateInRange(created, start, end);
    });

    const leadsPrevRange = leads.filter((lead) => {
      const created = parseDateValue(lead?.create_date || lead?.created_at || lead?.created || lead?.date_created);
      return created && isDateInRange(created, prevStart, prevEnd);
    });

    const processedLeads = leadsInRange.filter((lead) => {
      const status = String(lead?.status || lead?.stage || '').toLowerCase();
      return !['new', 'created', 'pending'].includes(status);
    });

    const staleLeads = leads.filter((lead) => {
      const lastActivity = parseDateValue(
        lead?.last_activity_at || lead?.updated_at || lead?.last_contact_at,
      );
      if (!lastActivity) return true;
      const diffDays = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= LEAD_STALE_DAYS;
    });

    const overdueTasks = tasks.filter((task) => {
      if (isTaskClosed(task)) return false;
      const due = parseDateValue(task?.due_date || task?.deadline || task?.planned_date);
      return due ? due.getTime() < Date.now() : false;
    });

    const activeTasks = tasks.filter((task) => !isTaskClosed(task));
    const completedTasks = tasks.filter((task) => isTaskClosed(task));
    const taskThroughput = activeTasks.length + completedTasks.length > 0
      ? (completedTasks.length / (activeTasks.length + completedTasks.length)) * 100
      : 0;

    const leadToDealConversion = leadsInRange.length
      ? (openDeals.length + wonDeals.length + lostDeals.length) / leadsInRange.length * 100
      : parseFiniteNumber(overview?.conversion_rate, 0);

    const dealToWonConversion = (wonDeals.length + lostDeals.length)
      ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
      : 0;

    const salesVelocity = days > 0 ? wonAmountInPeriod / days : 0;
    const salesVelocityPrev = days > 0 ? wonAmountPrevPeriod / days : 0;
    const winRatePercent = (wonDeals.length + lostDeals.length) > 0
      ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
      : 0;
    const averageDealSize = openDeals.length > 0 ? openPipelineAmount / openDeals.length : 0;
    const forecastCoveragePercent = openPipelineAmount > 0
      ? (forecastCloseAmount / openPipelineAmount) * 100
      : 0;

    return {
      leadsNew: leadsInRange.length,
      leadsNewPrev: leadsPrevRange.length,
      processedLeads: processedLeads.length,
      staleLeads: staleLeads.length,
      overdueTasks: overdueTasks.length,
      taskThroughput,
      openDealsCount: openDeals.length,
      openPipelineAmount,
      forecastCloseAmount,
      wonDeals: wonDeals.length,
      lostDeals: lostDeals.length,
      leadToDealConversion,
      dealToWonConversion,
      salesVelocity,
      salesVelocityPrev,
      wonAmountInPeriod,
      winRatePercent,
      averageDealSize,
      forecastCoveragePercent,
    };
  }, [deals, leads, overview, rangeMeta, tasks]);

  const summaryCards = useMemo(() => {
    const cards = [
      {
        key: 'leads_new',
        title: tr('dashboardPage.kpi.leadsNew', 'Yangi lidlar'),
        value: derivedMetrics.leadsNew,
        trend: metricDelta(derivedMetrics.leadsNew, derivedMetrics.leadsNewPrev),
        formatter: (value) => formatNumber(value),
        drilldownPath: '/leads',
        definition: tr('dashboardPage.kpiDef.leadsNew', 'Davr ichida yaratilgan yangi lidlar soni.'),
      },
      {
        key: 'leads_processed',
        title: tr('dashboardPage.kpi.leadsProcessed', 'Qayta ishlangan lidlar'),
        value: derivedMetrics.processedLeads,
        formatter: (value) => formatNumber(value),
        drilldownPath: '/leads',
        definition: tr('dashboardPage.kpiDef.leadsProcessed', 'Statusi “new”dan o‘zgargan lidlar soni.'),
      },
      {
        key: 'overdue_sla',
        title: tr('dashboardPage.kpi.overdueSla', 'SLA / muddat buzilishi'),
        value: derivedMetrics.overdueTasks + activityStats.slaBreachesFromResponses,
        formatter: (value) => formatNumber(value),
        drilldownPath: '/tasks',
        definition: tr('dashboardPage.kpiDef.overdueSla', 'Muddati o‘tgan vazifalar va javob SLA limiti oshgan holatlar.'),
      },
      {
        key: 'pipeline_amount',
        title: tr('dashboardPage.kpi.pipelineAmount', 'Ishdagi bitimlar summasi'),
        value: derivedMetrics.openPipelineAmount,
        formatter: (value) => formatCurrency(value, overview?.currency_code || 'UZS'),
        drilldownPath: '/deals',
        definition: tr('dashboardPage.kpiDef.pipelineAmount', 'Yopilmagan bitimlar umumiy summasi.'),
      },
      {
        key: 'forecast_close',
        title: tr('dashboardPage.kpi.forecastClose', 'Prognoz yopilish summasi'),
        value: derivedMetrics.forecastCloseAmount,
        formatter: (value) => formatCurrency(value, overview?.currency_code || 'UZS'),
        drilldownPath: '/deals',
        definition: tr('dashboardPage.kpiDef.forecastClose', 'Tanlangan davrda yopilishi kutilayotgan bitimlar summasi.'),
      },
      {
        key: 'won_lost',
        title: tr('dashboardPage.kpi.wonLost', 'Won / Lost'),
        value: `${formatNumber(derivedMetrics.wonDeals)} / ${formatNumber(derivedMetrics.lostDeals)}`,
        formatter: (value) => value,
        drilldownPath: '/deals',
        definition: tr('dashboardPage.kpiDef.wonLost', 'Yutilgan va yo‘qotilgan bitimlar nisbati.'),
      },
      {
        key: 'conversion',
        title: tr('dashboardPage.kpi.conversion', 'Konversiya'),
        value: derivedMetrics.leadToDealConversion,
        formatter: (value) => toPercent(value, 1),
        suffix: ` | ${tr('dashboardPage.kpi.dealToWon', 'Deal→Won')}: ${toPercent(derivedMetrics.dealToWonConversion, 1)}`,
        drilldownPath: '/dashboard',
        definition: tr('dashboardPage.kpiDef.conversion', 'Lead→Deal va Deal→Won bosqich konversiyalari.'),
      },
      {
        key: 'sales_velocity',
        title: tr('dashboardPage.kpi.salesVelocity', 'Sales velocity (kuniga)'),
        value: derivedMetrics.salesVelocity,
        trend: metricDelta(derivedMetrics.salesVelocity, derivedMetrics.salesVelocityPrev),
        formatter: (value) => formatCurrency(value, overview?.currency_code || 'UZS'),
        drilldownPath: '/dashboard',
        definition: tr('dashboardPage.kpiDef.salesVelocity', 'Tanlangan davrda yutilgan summa / kunlar soni.'),
      },
    ];

    if (viewMode === 'my_day') {
      return cards.filter((card) => ['leads_new', 'overdue_sla', 'pipeline_amount', 'sales_velocity'].includes(card.key));
    }

    if (viewMode === 'team') {
      return cards.filter((card) => ['leads_new', 'leads_processed', 'overdue_sla', 'conversion', 'won_lost'].includes(card.key));
    }

    return cards;
  }, [activityStats.slaBreachesFromResponses, derivedMetrics, overview?.currency_code, viewMode]);

  const exceptions = useMemo(() => {
    const rows = [];

    const overdueTasks = tasks
      .filter((task) => {
        if (isTaskClosed(task)) return false;
        const due = parseDateValue(task?.due_date || task?.deadline || task?.planned_date);
        return due ? due.getTime() < Date.now() : false;
      })
      .slice(0, 5);

    overdueTasks.forEach((task) => {
      rows.push({
        key: `task-${task?.id || Math.random()}`,
        type: tr('dashboardPage.exceptions.taskOverdue', 'Muddati o‘tgan vazifa'),
        priority: 'high',
        title: task?.name || task?.title || tr('dashboardPage.unknownTask', 'Vazifa'),
        details: task?.due_date ? `${tr('dashboardPage.deadline', 'Muddat')}: ${formatDate(task.due_date)}` : '—',
        actionLabel: tr('dashboardPage.actions.openTask', 'Vazifani ochish'),
        action: () => navigate(task?.id ? `/tasks/${task.id}` : '/tasks'),
      });
    });

    const staleLeadList = leads
      .filter((lead) => {
        const lastActivity = parseDateValue(lead?.last_activity_at || lead?.updated_at || lead?.last_contact_at);
        if (!lastActivity) return true;
        const diffDays = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= LEAD_STALE_DAYS;
      })
      .slice(0, 5);

    staleLeadList.forEach((lead) => {
      rows.push({
        key: `lead-${lead?.id || Math.random()}`,
        type: tr('dashboardPage.exceptions.leadNoActivity', 'Faolliksiz lid'),
        priority: 'medium',
        title: lead?.name || lead?.full_name || tr('dashboardPage.unknownLead', 'Lid'),
        details: tr('dashboardPage.exceptions.leadNoActivityHint', '{days} kundan beri faollik yo‘q', { days: LEAD_STALE_DAYS }),
        actionLabel: tr('dashboardPage.actions.openLead', 'Lidni ochish'),
        action: () => navigate(lead?.id ? `/leads/${lead.id}` : '/leads'),
      });
    });

    const riskyDeals = deals
      .filter((deal) => {
        if (isDealClosed(deal)) return false;
        const expected = parseDateValue(deal?.expected_close_date || deal?.close_date || deal?.closing_date);
        const probability = parseFiniteNumber(deal?.probability, 0);
        const nearClose = expected ? expected.getTime() <= Date.now() + (5 * 24 * 60 * 60 * 1000) : false;
        return nearClose || probability >= 75;
      })
      .slice(0, 5);

    riskyDeals.forEach((deal) => {
      rows.push({
        key: `deal-${deal?.id || Math.random()}`,
        type: tr('dashboardPage.exceptions.riskyDeal', 'Xatarli bitim'),
        priority: 'medium',
        title: deal?.name || tr('dashboardPage.unknownDeal', 'Bitim'),
        details: deal?.expected_close_date
          ? `${tr('dashboardPage.closeDate', 'Yopilish sanasi')}: ${formatDate(deal.expected_close_date)}`
          : tr('dashboardPage.noCloseDate', 'Yopilish sanasi yo‘q'),
        actionLabel: tr('dashboardPage.actions.openDeal', 'Bitimni ochish'),
        action: () => navigate(deal?.id ? `/deals/${deal.id}` : '/deals'),
      });
    });

    return rows
      .sort((left, right) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[left.priority] - order[right.priority];
      })
      .slice(0, 10);
  }, [deals, leads, tasks]);

  const teamLoadRows = useMemo(() => {
    const grouped = new Map();

    filteredActivity.forEach((item) => {
      const manager = readField(item, ['manager_name', 'manager', 'owner_name', 'owner', 'user', 'author']);
      const type = detectActivityType(item);
      if (!grouped.has(manager)) {
        grouped.set(manager, {
          key: manager,
          manager,
          total: 0,
          calls: 0,
          messages: 0,
          meetings: 0,
          breaches: 0,
        });
      }

      const row = grouped.get(manager);
      row.total += 1;
      if (type === 'call') row.calls += 1;
      if (type === 'message') row.messages += 1;
      if (type === 'meeting') row.meetings += 1;
      const responseMinutes = readResponseMinutes(item);
      if (Number.isFinite(responseMinutes) && responseMinutes > SLA_RESPONSE_LIMIT_MINUTES) {
        row.breaches += 1;
      }
    });

    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  }, [filteredActivity]);

  const funnelRows = useMemo(() => {
    const grouped = new Map();

    safeArray(funnel).forEach((item, index) => {
      const stageName = readField(
        item,
        ['stage_name', 'stage', 'name', 'label'],
        `${tr('dashboardPage.stage', 'Bosqich')} ${index + 1}`,
      );
      const normalizedStage = String(stageName || '').trim();
      const stageKey = normalizedStage.toLocaleLowerCase() || `__stage_${index}`;
      const count = parseFiniteNumber(item?.value ?? item?.count ?? item?.total, 0);
      const amount = parseFiniteNumber(item?.amount ?? item?.sum ?? item?.revenue, 0);

      if (!grouped.has(stageKey)) {
        grouped.set(stageKey, {
          key: stageKey,
          stage: normalizedStage || stageName,
          count: 0,
          amount: 0,
        });
      }

      const row = grouped.get(stageKey);
      row.count += count;
      row.amount += amount;
    });

    return Array.from(grouped.values());
  }, [funnel]);

  const kpiCatalogRows = useMemo(() => [
    {
      key: 'leads_new',
      kpi: tr('dashboardPage.kpi.leadsNew', 'Yangi lidlar'),
      definition: tr('dashboardPage.kpiDef.leadsNew', 'Davr ichida yaratilgan yangi lidlar soni.'),
      source: 'leads.create_date',
      refresh: tr('dashboardPage.refreshSource.live', 'Real-time + qo‘lda yangilash'),
    },
    {
      key: 'pipeline_amount',
      kpi: tr('dashboardPage.kpi.pipelineAmount', 'Ishdagi bitimlar summasi'),
      definition: tr('dashboardPage.kpiDef.pipelineAmount', 'Yopilmagan bitimlar umumiy summasi.'),
      source: 'deals.amount,status',
      refresh: tr('dashboardPage.refreshSource.hourly', 'Har soatda'),
    },
    {
      key: 'conversion',
      kpi: tr('dashboardPage.kpi.conversion', 'Konversiya'),
      definition: tr('dashboardPage.kpiDef.conversion', 'Lead→Deal va Deal→Won bosqich konversiyalari.'),
      source: 'leads + deals (status transitions)',
      refresh: tr('dashboardPage.refreshSource.hourly', 'Har soatda'),
    },
    {
      key: 'sales_velocity',
      kpi: tr('dashboardPage.kpi.salesVelocity', 'Sales velocity'),
      definition: tr('dashboardPage.kpiDef.salesVelocity', 'Tanlangan davrda yutilgan summa / kunlar soni.'),
      source: 'deals.closed_date, deals.amount',
      refresh: tr('dashboardPage.refreshSource.daily', 'Kunlik'),
    },
    {
      key: 'sla',
      kpi: tr('dashboardPage.kpi.overdueSla', 'SLA / muddat buzilishi'),
      definition: tr('dashboardPage.kpiDef.overdueSla', 'Muddati o‘tgan vazifalar va javob SLA limiti oshgan holatlar.'),
      source: 'tasks.due_date + activity.first_response_*',
      refresh: tr('dashboardPage.refreshSource.live', 'Real-time + qo‘lda yangilash'),
    },
  ], []);

  const exportData = useMemo(() => {
    return [
      ...summaryCards.map((card) => ({
        section: tr('dashboardPage.export.sectionKpi', 'KPI'),
        metric: card.title,
        value: typeof card.value === 'number' ? card.value : String(card.value),
        details: card.definition,
      })),
      ...exceptions.map((item) => ({
        section: tr('dashboardPage.export.sectionExceptions', 'Istisnolar'),
        metric: item.type,
        value: item.title,
        details: item.details,
      })),
    ];
  }, [exceptions, summaryCards]);

  const exportColumns = useMemo(() => [
    { key: 'section', label: tr('dashboardPage.export.columns.section', 'Bo‘lim') },
    { key: 'metric', label: tr('dashboardPage.export.columns.metric', 'Ko‘rsatkich') },
    { key: 'value', label: tr('dashboardPage.export.columns.value', 'Qiymat') },
    { key: 'details', label: tr('dashboardPage.export.columns.details', 'Tafsilot') },
  ], []);

  const leadSourceRows = useMemo(() => {
    const grouped = new Map();

    leads.forEach((lead) => {
      const source = readField(lead, ['source_name', 'source', 'lead_source', 'channel'], tr('dashboardPage.sourceUnknown', 'Не указан'));
      if (!grouped.has(source)) {
        grouped.set(source, { key: source, source, total: 0, processed: 0 });
      }

      const row = grouped.get(source);
      row.total += 1;

      const status = String(lead?.status || lead?.stage || '').toLowerCase();
      if (!['new', 'created', 'pending'].includes(status)) {
        row.processed += 1;
      }
    });

    return Array.from(grouped.values())
      .map((row) => ({
        ...row,
        conversion: row.total > 0 ? (row.processed / row.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [leads]);

  const additionalDashboards = useMemo(() => ([
    {
      key: 'calls',
      title: tr('dashboardPage.extraDashboards.callsTitle', 'Дашборд звонков'),
      description: tr('dashboardPage.extraDashboards.callsDesc', 'Операционные показатели звонков, SLA и QA.'),
      path: '/calls-dashboard',
    },
    {
      key: 'telephony',
      title: tr('dashboardPage.extraDashboards.telephonyTitle', 'Телефония'),
      description: tr('dashboardPage.extraDashboards.telephonyDesc', 'Очереди звонков, каналы и маршрутизация обращений.'),
      path: '/telephony',
    },
    {
      key: 'integrations',
      title: tr('dashboardPage.extraDashboards.integrationsTitle', 'Интеграции'),
      description: tr('dashboardPage.extraDashboards.integrationsDesc', 'Meta/каналы коммуникаций и состояние подключений.'),
      path: '/integrations',
    },
  ]), []);

  const predictionChartData = useMemo(() => {
    if (predictionSeries?.predictedData?.length) {
      return predictionSeries;
    }

    const points = 6;
    const baseMonthly = Math.max(
      derivedMetrics.forecastCloseAmount / Math.max(1, getPeriodDays(period) / 30),
      derivedMetrics.salesVelocity * 30,
      derivedMetrics.averageDealSize,
      derivedMetrics.openPipelineAmount / points,
      0,
    );
    const trend = derivedMetrics.winRatePercent >= 45 ? 1.03 : 1.01;
    const predictedData = Array.from({ length: points }, (_, index) =>
      Math.max(0, baseMonthly * Math.pow(trend, index)),
    );
    const confidenceLower = predictedData.map((value) => Math.max(0, value * 0.88));
    const confidenceUpper = predictedData.map((value) => value * 1.12);

    return {
      labels: buildFutureMonthLabels(points),
      predictedData,
      confidenceLower,
      confidenceUpper,
    };
  }, [derivedMetrics, period, predictionSeries]);

  const compactMetricCardStyle = useMemo(() => ({
    borderRadius: token.borderRadius,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,
    minHeight: 132,
  }), [token.borderRadius, token.colorBgContainer, token.colorBorderSecondary]);

  const compactMetricCardBody = useMemo(() => ({
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 132,
  }), []);

  const dashboardTabItems = useMemo(() => ([
    {
      key: 'sales',
      label: tr('dashboardPage.dashboards.salesTab', 'Продажи'),
      children: (
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Card size="small" style={compactMetricCardStyle} styles={{ body: compactMetricCardBody }}>
              <Statistic
                title={tr('dashboardPage.dashboards.planFact', 'План/факт закрытия')}
                value={Math.max(0, Math.min(100, derivedMetrics.forecastCoveragePercent))}
                precision={1}
                suffix="%"
              />
              <Progress
                percent={Math.max(0, Math.min(100, Math.round(derivedMetrics.forecastCoveragePercent)))}
                status={derivedMetrics.forecastCoveragePercent >= 70 ? 'success' : 'active'}
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" style={compactMetricCardStyle} styles={{ body: compactMetricCardBody }}>
              <Statistic
                title={tr('dashboardPage.dashboards.avgDealSize', 'Средний размер сделки')}
                value={derivedMetrics.averageDealSize}
                formatter={(value) => formatCurrency(value, overview?.currency_code || 'UZS')}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" style={compactMetricCardStyle} styles={{ body: compactMetricCardBody }}>
              <Statistic
                title={tr('dashboardPage.dashboards.winRate', 'Win rate')}
                value={derivedMetrics.winRatePercent}
                precision={1}
                suffix="%"
              />
            </Card>
          </Col>
          <Col span={24}>
            <Table
              rowKey="key"
              size="small"
              pagination={false}
              dataSource={funnelRows}
              locale={{ emptyText: tr('dashboardPage.company.funnelEmpty', 'Нет данных воронки') }}
              columns={[
                {
                  title: tr('dashboardPage.company.columns.stage', 'Этап'),
                  dataIndex: 'stage',
                  key: 'stage',
                },
                {
                  title: tr('dashboardPage.company.columns.count', 'Количество'),
                  dataIndex: 'count',
                  key: 'count',
                  render: (value) => formatNumber(value),
                },
                {
                  title: tr('dashboardPage.company.columns.amount', 'Сумма'),
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (value) => formatCurrency(value, overview?.currency_code || 'UZS'),
                },
              ]}
            />
          </Col>
        </Row>
      ),
    },
    {
      key: 'team',
      label: tr('dashboardPage.dashboards.teamTab', 'Команда'),
      children: (
        <Table
          rowKey="key"
          size="small"
          pagination={false}
          dataSource={teamLoadRows}
          locale={{ emptyText: tr('dashboardPage.team.empty', 'Нет данных по команде') }}
          columns={[
            {
              title: tr('dashboardPage.team.columns.manager', 'Менеджер'),
              dataIndex: 'manager',
              key: 'manager',
            },
            {
              title: tr('dashboardPage.team.columns.total', 'Всего активности'),
              dataIndex: 'total',
              key: 'total',
              render: (value) => formatNumber(value),
            },
            {
              title: tr('dashboardPage.team.columns.calls', 'Звонки'),
              dataIndex: 'calls',
              key: 'calls',
              render: (value) => formatNumber(value),
            },
            {
              title: tr('dashboardPage.team.columns.messages', 'Сообщения'),
              dataIndex: 'messages',
              key: 'messages',
              render: (value) => formatNumber(value),
            },
            {
              title: tr('dashboardPage.team.columns.breaches', 'Нарушения SLA'),
              dataIndex: 'breaches',
              key: 'breaches',
              render: (value) => (
                <Tag color={value > 0 ? 'error' : 'success'}>{formatNumber(value)}</Tag>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'sources',
      label: tr('dashboardPage.dashboards.sourcesTab', 'Источники'),
      children: (
        <Table
          rowKey="key"
          size="small"
          pagination={false}
          dataSource={leadSourceRows}
          locale={{ emptyText: tr('dashboardPage.dashboards.sourcesEmpty', 'Нет данных по источникам') }}
          columns={[
            {
              title: tr('dashboardPage.dashboards.sourceColumn', 'Источник'),
              dataIndex: 'source',
              key: 'source',
            },
            {
              title: tr('dashboardPage.dashboards.leadsColumn', 'Лиды'),
              dataIndex: 'total',
              key: 'total',
              render: (value) => formatNumber(value),
            },
            {
              title: tr('dashboardPage.dashboards.processedColumn', 'Обработано'),
              dataIndex: 'processed',
              key: 'processed',
              render: (value) => formatNumber(value),
            },
            {
              title: tr('dashboardPage.dashboards.sourceConversionColumn', 'Конверсия'),
              dataIndex: 'conversion',
              key: 'conversion',
              render: (value) => `${value.toFixed(1)}%`,
            },
          ]}
        />
      ),
    },
    {
      key: 'communications',
      label: tr('dashboardPage.dashboards.communicationsTab', 'Коммуникации'),
      children: (
        <Row gutter={[12, 12]}>
          <Col xs={24} md={6}>
            <Card size="small" style={compactMetricCardStyle} styles={{ body: compactMetricCardBody }}>
              <Statistic title={tr('dashboardPage.activity.calls', 'Звонки')} value={activityStats.byType.call} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" style={compactMetricCardStyle} styles={{ body: compactMetricCardBody }}>
              <Statistic title={tr('dashboardPage.activity.messages', 'Сообщения')} value={activityStats.byType.message} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" style={compactMetricCardStyle} styles={{ body: compactMetricCardBody }}>
              <Statistic title={tr('dashboardPage.activity.meetings', 'Встречи')} value={activityStats.byType.meeting} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" style={compactMetricCardStyle} styles={{ body: compactMetricCardBody }}>
              <Statistic
                title={tr('dashboardPage.activity.firstResponse', 'Средний первый ответ')}
                value={Number.isFinite(activityStats.firstResponseAvg) ? activityStats.firstResponseAvg : 0}
                precision={1}
                suffix={tr('dashboardPage.minutes', 'мин')}
              />
            </Card>
          </Col>
          <Col span={24}>
            <List
              locale={{ emptyText: tr('dashboardPage.lastActivity.empty', 'Нет активности за выбранный период') }}
              dataSource={filteredActivity.slice(0, 6)}
              renderItem={(item, index) => (
                <List.Item key={`${item?.id || 'activity'}-tab-${index}`}>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Text strong>{item?.title || item?.event || tr('dashboardPage.lastActivity.fallbackEvent', 'Событие')}</Text>
                    <Text type="secondary">
                      {item?.description || item?.message || tr('dashboardPage.lastActivity.fallbackDescription', 'Без описания')}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </Col>
        </Row>
      ),
    },
  ]), [
    activityStats.byType.call,
    activityStats.byType.meeting,
    activityStats.byType.message,
    activityStats.firstResponseAvg,
    derivedMetrics.averageDealSize,
    derivedMetrics.forecastCoveragePercent,
    derivedMetrics.winRatePercent,
    filteredActivity,
    funnelRows,
    leadSourceRows,
    overview?.currency_code,
    teamLoadRows,
  ]);

  function applySavedView(savedViewId) {
    const savedView = savedViews.find((entry) => entry.id === savedViewId);
    if (!savedView) return;

    setPeriod(savedView.period);
    setViewMode(savedView.view);
    setManagerFilter(savedView.manager || FILTER_ALL);
    setPipelineFilter(savedView.pipeline || FILTER_ALL);
    setSourceFilter(savedView.source || FILTER_ALL);
  }

  function saveCurrentView() {
    const normalizedName = newViewName.trim();
    if (!normalizedName) {
      message.warning(tr('dashboardPage.messages.viewNameRequired', 'Saqlangan ko‘rinish nomini kiriting'));
      return;
    }

    const nextEntry = {
      id: String(Date.now()),
      name: normalizedName,
      period,
      view: viewMode,
      manager: managerFilter,
      pipeline: pipelineFilter,
      source: sourceFilter,
    };

    setSavedViews((prev) => [nextEntry, ...prev].slice(0, 12));
    setNewViewName('');
    setSaveViewModalOpen(false);
    message.success(tr('dashboardPage.messages.viewSaved', 'Ko‘rinish saqlandi'));
  }

  async function copyShareLink() {
    const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success(tr('dashboardPage.messages.linkCopied', 'Havola nusxalandi'));
    } catch {
      message.warning(shareUrl);
    }
  }

  const qualityFreshness = freshnessBadge(lastUpdated.overview || lastUpdated.activity || lastUpdated.entities);

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Card
        size="small"
        style={{
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgElevated,
          boxShadow: token.boxShadowTertiary,
        }}
        styles={{ body: { padding: 14 } }}
      >
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            <Space direction="vertical" size={0}>
              <Title level={3} style={{ margin: 0, fontSize: 20 }}>{tr('dashboardPage.title', 'Boshqaruv paneli')}</Title>
              <Text type="secondary">{tr('dashboardPage.subtitle', "Asosiy CRM ko'rsatkichlari")}</Text>
              <Space size={8}>
                <Tag color={qualityFreshness.status}>
                  {tr('dashboardPage.updated', 'Yangilanish')}: {qualityFreshness.text}
                </Tag>
                {user?.username ? (
                  <Tag icon={<UserOutlined />}>{`${tr('dashboardPage.user', 'Foydalanuvchi')}: ${user.username}`}</Tag>
                ) : null}
              </Space>
            </Space>

            <Space wrap>
              <Button icon={<ReloadOutlined />} onClick={() => void loadDashboardData()}>
                {tr('actions.refresh', 'Yangilash')}
              </Button>
              <ExportButton
                data={exportData}
                columns={exportColumns}
                filename="crm_dashboard_report"
                title={tr('dashboardPage.export.title', 'CRM Dashboard Report')}
              />
              <Button icon={<CopyOutlined />} onClick={() => void copyShareLink()}>
                {tr('dashboardPage.actions.share', 'Havola ulashish')}
              </Button>
            </Space>
          </Space>

          <Space wrap size={8}>
            <Segmented
              value={period}
              options={[
                { label: tr('dashboardPage.periods.d7', '7 kun'), value: '7d' },
                { label: tr('dashboardPage.periods.d30', '30 kun'), value: '30d' },
                { label: tr('dashboardPage.periods.d90', '90 kun'), value: '90d' },
              ]}
              onChange={(value) => setPeriod(String(value))}
            />
            <Segmented
              value={viewMode}
              options={VIEW_OPTIONS}
              onChange={(value) => setViewMode(String(value))}
            />
            <Select
              value={managerFilter}
              options={managerOptions}
              style={{ minWidth: 180 }}
              onChange={setManagerFilter}
              suffixIcon={<FilterOutlined />}
            />
            <Select
              value={pipelineFilter}
              options={pipelineOptions}
              style={{ minWidth: 170 }}
              onChange={setPipelineFilter}
              suffixIcon={<FilterOutlined />}
            />
            <Select
              value={sourceFilter}
              options={sourceOptions}
              style={{ minWidth: 170 }}
              onChange={setSourceFilter}
              suffixIcon={<FilterOutlined />}
            />
            <Select
              allowClear
              placeholder={tr('dashboardPage.filters.savedView', 'Saqlangan ko‘rinish')}
              style={{ minWidth: 200 }}
              options={savedViews.map((entry) => ({ label: entry.name, value: entry.id }))}
              onChange={(value) => applySavedView(value)}
            />
            <Button icon={<SaveOutlined />} onClick={() => setSaveViewModalOpen(true)}>
              {tr('dashboardPage.actions.saveView', 'Ko‘rinishni saqlash')}
            </Button>
          </Space>

          {error ? (
            <Alert
              type="error"
              showIcon
              message={error.message}
              action={
                <Button size="small" onClick={() => void loadDashboardData()}>
                  {tr('actions.retry', 'Qayta urinish')}
                </Button>
              }
            />
          ) : null}

          {qualityIssues.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              message={tr('dashboardPage.quality.title', 'Maʼlumot sifati bo‘yicha ogohlantirishlar')}
              description={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {qualityIssues.slice(0, 5).map((issue, index) => (
                    <li key={`${issue}-${index}`}>{issue}</li>
                  ))}
                </ul>
              }
            />
          ) : null}
        </Space>
      </Card>

      <Spin spinning={loading}>
        <Row gutter={[12, 12]}>
          {summaryCards.map((card) => (
            <Col xs={24} sm={12} xl={6} key={card.key}>
              <Card
                size="small"
                style={{
                  borderRadius: token.borderRadiusLG,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorBgContainer,
                  minHeight: 180,
                }}
                styles={{ body: { padding: 12 } }}
              >
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text strong>{card.title}</Text>
                    <Tooltip title={card.definition} overlayStyle={{ maxWidth: KPI_TOOLTIP_WIDTH }}>
                      <Button size="small" type="text" icon={<ExclamationCircleOutlined />} />
                    </Tooltip>
                  </Space>

                  <Statistic value={card.value} formatter={card.formatter} />

                  {card.suffix ? <Text type="secondary">{card.suffix}</Text> : null}

                  {Number.isFinite(card.trend) ? (
                    <Tag color={card.trend >= 0 ? 'success' : 'error'}>
                      {`${card.trend >= 0 ? '+' : ''}${card.trend.toFixed(1)}% vs prev`}
                    </Tag>
                  ) : (
                    <Tag>{tr('dashboardPage.noPrevComparison', 'Oldingi davr bilan solishtirish mavjud emas')}</Tag>
                  )}

                  <Button type="link" style={{ paddingInline: 0 }} onClick={() => navigate(card.drilldownPath)}>
                    {tr('dashboardPage.actions.drilldown', 'Ro‘yxatga o‘tish')} →
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      <Card
        size="small"
        title={tr('dashboardPage.insights.title', 'Расширенная информационная панель')}
        style={{
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgElevated,
        }}
      >
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Card size="small" style={compactMetricCardStyle} styles={{ body: compactMetricCardBody }}>
              <Statistic
                title={tr('dashboardPage.insights.planFact', 'План/факт закрытия периода')}
                value={Math.max(0, Math.min(100, derivedMetrics.forecastCoveragePercent))}
                precision={1}
                suffix="%"
              />
              <Progress
                percent={Math.max(0, Math.min(100, Math.round(derivedMetrics.forecastCoveragePercent)))}
                status={derivedMetrics.forecastCoveragePercent >= 70 ? 'success' : 'active'}
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" style={compactMetricCardStyle} styles={{ body: compactMetricCardBody }}>
              <Statistic
                title={tr('dashboardPage.insights.avgDealSize', 'Средний чек по открытым сделкам')}
                value={derivedMetrics.averageDealSize}
                formatter={(value) => formatCurrency(value, overview?.currency_code || 'UZS')}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" style={compactMetricCardStyle} styles={{ body: compactMetricCardBody }}>
              <Statistic
                title={tr('dashboardPage.insights.winRate', 'Доля выигранных сделок')}
                value={derivedMetrics.winRatePercent}
                precision={1}
                suffix="%"
              />
              <Text type="secondary">
                {tr('dashboardPage.insights.velocity', 'Sales velocity')}: {formatCurrency(derivedMetrics.salesVelocity, overview?.currency_code || 'UZS')}
              </Text>
            </Card>
          </Col>
        </Row>
      </Card>

      <PredictionChart
        title={tr('dashboard.analytics.predictionTitle', 'Прогнозируемая выручка на следующие 6 месяцев')}
        labels={predictionChartData.labels}
        predictedData={predictionChartData.predictedData}
        confidenceLower={predictionChartData.confidenceLower}
        confidenceUpper={predictionChartData.confidenceUpper}
        currencyCode={overview?.currency_code || 'UZS'}
        formatAsCurrency
        height={280}
      />

      <Card
        size="small"
        title={tr('dashboardPage.dashboards.title', 'Дополнительные дашборды')}
        style={{
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgElevated,
        }}
      >
        <Tabs items={dashboardTabItems} />
      </Card>

      <Card
        size="small"
        title={tr('dashboardPage.extraDashboards.title', 'Переход к специализированным дашбордам')}
        style={{
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgElevated,
        }}
      >
        <Row gutter={[12, 12]}>
          {additionalDashboards.map((item) => (
            <Col xs={24} md={12} xl={6} key={item.key}>
              <Card size="small" style={{ height: '100%' }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text strong>{item.title}</Text>
                  <Text type="secondary">{item.description}</Text>
                  <Button type="primary" block onClick={() => navigate(item.path)}>
                    {tr('dashboardPage.extraDashboards.open', 'Открыть')}
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={14}>
          <Card
            size="small"
            title={
              <Space>
                <WarningOutlined />
                {tr('dashboardPage.exceptions.title', 'Diqqat talab qiladigan holatlar')}
                <Tag color="error">{exceptions.length}</Tag>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/tasks')}>
                {tr('dashboardPage.actions.openList', 'Ro‘yxatni ochish')}
              </Button>
            }
            style={{
              borderRadius: token.borderRadiusLG,
              border: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorBgElevated,
            }}
          >
            {exceptions.length === 0 ? (
              <Empty description={tr('dashboardPage.exceptions.empty', 'Hozircha kritik holatlar yo‘q')} />
            ) : (
              <List
                dataSource={exceptions}
                renderItem={(item) => (
                  <List.Item
                    key={item.key}
                    actions={[
                      <Button key={`${item.key}-action`} size="small" type="link" onClick={item.action}>
                        {item.actionLabel}
                      </Button>,
                    ]}
                  >
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Space wrap>
                        <Tag color={item.priority === 'high' ? 'error' : 'warning'}>{item.type}</Tag>
                        <Text strong>{item.title}</Text>
                      </Space>
                      <Text type="secondary">{item.details}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            size="small"
            title={
              <Space>
                <ThunderboltOutlined />
                {tr('dashboardPage.activity.title', 'Faollik va SLA')}
              </Space>
            }
            style={{
              borderRadius: token.borderRadiusLG,
              border: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorBgElevated,
            }}
          >
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Statistic title={tr('dashboardPage.activity.calls', 'Qo‘ng‘iroqlar')} value={activityStats.byType.call} />
                </Col>
                <Col span={12}>
                  <Statistic title={tr('dashboardPage.activity.messages', 'Xabarlar')} value={activityStats.byType.message} />
                </Col>
                <Col span={12}>
                  <Statistic title={tr('dashboardPage.activity.meetings', 'Uchrashuvlar')} value={activityStats.byType.meeting} />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={tr('dashboardPage.activity.firstResponse', 'Avg first response')}
                    value={Number.isFinite(activityStats.firstResponseAvg) ? activityStats.firstResponseAvg.toFixed(1) : '—'}
                    suffix={tr('dashboardPage.minutes', 'min')}
                  />
                </Col>
              </Row>

              <Text type="secondary">
                {tr('dashboardPage.activity.noActivityLeads', 'Faolliksiz lidlar')}:{' '}
                <Text strong>{formatNumber(derivedMetrics.staleLeads)}</Text>
              </Text>
              <Progress
                percent={Math.max(0, Math.min(100, Math.round(derivedMetrics.taskThroughput)))}
                status={derivedMetrics.taskThroughput >= 70 ? 'success' : 'active'}
                format={(value) => `${tr('dashboardPage.activity.taskCompletion', 'Task completion')}: ${value}%`}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {viewMode === 'my_day' ? (
        <Card
          size="small"
          title={
            <Space>
              <UserOutlined />
              {tr('dashboardPage.mode.myDay', 'Mening kunim')}
            </Space>
          }
          style={{
            borderRadius: token.borderRadiusLG,
            border: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgElevated,
          }}
        >
          <List
            locale={{ emptyText: tr('dashboardPage.lastActivity.empty', 'Tanlangan davrda faollik yo‘q') }}
            dataSource={filteredActivity.slice(0, 8)}
            renderItem={(item, index) => (
              <List.Item key={`${item?.id || 'activity'}-${index}`}>
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text strong>{item?.title || item?.event || tr('dashboardPage.lastActivity.fallbackEvent', 'Hodisa')}</Text>
                  <Text type="secondary">
                    {item?.description || item?.message || tr('dashboardPage.lastActivity.fallbackDescription', 'Tavsif yo‘q')}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      ) : null}

      {viewMode === 'team' ? (
        <Card
          size="small"
          title={
            <Space>
              <TeamOutlined />
              {tr('dashboardPage.mode.team', 'Jamoa ko‘rsatkichi')}
            </Space>
          }
          style={{
            borderRadius: token.borderRadiusLG,
            border: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgElevated,
          }}
        >
          <Table
            rowKey="key"
            size="small"
            pagination={false}
            locale={{ emptyText: tr('dashboardPage.team.empty', 'Jamoa bo‘yicha maʼlumot yo‘q') }}
            dataSource={teamLoadRows}
            columns={[
              {
                title: tr('dashboardPage.team.columns.manager', 'Menejer'),
                dataIndex: 'manager',
                key: 'manager',
              },
              {
                title: tr('dashboardPage.team.columns.total', 'Jami faollik'),
                dataIndex: 'total',
                key: 'total',
                render: (value) => formatNumber(value),
              },
              {
                title: tr('dashboardPage.team.columns.calls', 'Qo‘ng‘iroq'),
                dataIndex: 'calls',
                key: 'calls',
                render: (value) => formatNumber(value),
              },
              {
                title: tr('dashboardPage.team.columns.messages', 'Xabar'),
                dataIndex: 'messages',
                key: 'messages',
                render: (value) => formatNumber(value),
              },
              {
                title: tr('dashboardPage.team.columns.breaches', 'SLA breach'),
                dataIndex: 'breaches',
                key: 'breaches',
                render: (value) => (
                  <Tag color={value > 0 ? 'error' : 'success'}>{formatNumber(value)}</Tag>
                ),
              },
            ]}
          />
        </Card>
      ) : null}

      {viewMode === 'company' ? (
        <Row gutter={[12, 12]}>
          <Col xs={24} lg={12}>
            <Card
              size="small"
              title={
                <Space>
                  <BarChartOutlined />
                  {tr('dashboardPage.company.funnel', 'Voronka bosqichlari')}
                </Space>
              }
              style={{
                borderRadius: token.borderRadiusLG,
                border: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorBgElevated,
              }}
            >
              <Table
                rowKey="key"
                size="small"
                pagination={false}
                dataSource={funnelRows.slice(0, 8)}
                locale={{ emptyText: tr('dashboardPage.company.funnelEmpty', 'Voronka maʼlumoti topilmadi') }}
                columns={[
                  {
                    title: tr('dashboardPage.company.columns.stage', 'Bosqich'),
                    dataIndex: 'stage',
                    key: 'stage',
                  },
                  {
                    title: tr('dashboardPage.company.columns.count', 'Soni'),
                    dataIndex: 'count',
                    key: 'count',
                    render: (value) => formatNumber(value),
                  },
                  {
                    title: tr('dashboardPage.company.columns.amount', 'Summa'),
                    dataIndex: 'amount',
                    key: 'amount',
                    render: (value) => formatCurrency(value, overview?.currency_code || 'UZS'),
                  },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              size="small"
              title={
                <Space>
                  <DashboardOutlined />
                  {tr('dashboardPage.company.kpiCatalog', 'KPI maʼlumotnomasi')}
                </Space>
              }
              style={{
                borderRadius: token.borderRadiusLG,
                border: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorBgElevated,
              }}
            >
              <Table
                rowKey="key"
                size="small"
                pagination={false}
                dataSource={kpiCatalogRows}
                columns={[
                  {
                    title: tr('dashboardPage.company.columns.kpi', 'KPI'),
                    dataIndex: 'kpi',
                    key: 'kpi',
                  },
                  {
                    title: tr('dashboardPage.company.columns.definition', 'Taʼrif'),
                    dataIndex: 'definition',
                    key: 'definition',
                  },
                  {
                    title: tr('dashboardPage.company.columns.source', 'Manba'),
                    dataIndex: 'source',
                    key: 'source',
                    render: (value) => <Text code>{value}</Text>,
                  },
                  {
                    title: tr('dashboardPage.company.columns.refresh', 'Yangilanish'),
                    dataIndex: 'refresh',
                    key: 'refresh',
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      ) : null}

      <Card
        size="small"
        title={
          <Space>
            <ClockCircleOutlined />
            {tr('dashboardPage.freshness.title', 'Widget yangilanish holati')}
          </Space>
        }
        style={{
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgElevated,
        }}
      >
        <Row gutter={[12, 12]}>
          {[
            { key: 'overview', label: tr('dashboardPage.freshness.overview', 'KPI bloki'), value: lastUpdated.overview },
            { key: 'activity', label: tr('dashboardPage.freshness.activity', 'Faollik bloki'), value: lastUpdated.activity },
            { key: 'funnel', label: tr('dashboardPage.freshness.funnel', 'Voronka bloki'), value: lastUpdated.funnel },
            { key: 'entities', label: tr('dashboardPage.freshness.entities', 'Istisnolar bloki'), value: lastUpdated.entities },
          ].map((item) => {
            const state = freshnessBadge(item.value);
            return (
              <Col xs={24} sm={12} lg={6} key={item.key}>
                <Card size="small" style={{ borderRadius: token.borderRadius }}>
                  <Space direction="vertical" size={0}>
                    <Text>{item.label}</Text>
                    <Tag color={state.status}>{state.text}</Tag>
                    <Text type="secondary">
                      {item.value ? formatDate(item.value.toISOString(), 'datetime') : '—'}
                    </Text>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Modal
        open={saveViewModalOpen}
        title={tr('dashboardPage.saveView.title', 'Ko‘rinishni saqlash')}
        onCancel={() => {
          setSaveViewModalOpen(false);
          setNewViewName('');
        }}
        onOk={saveCurrentView}
        okText={tr('dashboardPage.saveView.save', 'Saqlash')}
        cancelText={tr('dashboardPage.saveView.cancel', 'Bekor qilish')}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text type="secondary">{tr('dashboardPage.saveView.description', 'Joriy filtr va ko‘rinish sozlamalarini saqlang.')}</Text>
          <Input
            value={newViewName}
            onChange={(event) => setNewViewName(event.target.value)}
            placeholder={tr('dashboardPage.saveView.placeholder', 'Masalan: Ertalabki nazorat')}
            maxLength={60}
          />
        </Space>
      </Modal>
    </Space>
  );
}

export default Dashboard;
