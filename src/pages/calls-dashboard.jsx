/**
 * Communications Dashboard Page
 * Shows unified channel analytics (telephony + omnichannel)
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Table,
  Tag,
  Alert,
  Empty,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  ReloadOutlined,
  PhoneTwoTone,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import {
  getCallStatistics,
  getVoipCallLogs,
  getContactCenterKpi,
  getContactCenterDrilldown,
  getCallQaSummary,
  getCallQaScores,
  upsertCallQaScore,
  generatePilotWeeklyReport,
  getPilotWeeklyReports,
  exportPilotWeeklyReport,
  getPilotReportAutomationHealth,
  runPilotReportAutomationNow,
} from '../lib/api/calls.js';
import {
  CallsActivityChart,
  CallsDistributionChart,
  CallsDailyTrendChart,
  CallsStatusChart,
  CallsDurationChart,
} from '../components/CallsCharts.jsx';
import ChannelBrandIcon from '../components/channel/ChannelBrandIcon.jsx';
import { KpiStatCard } from '../shared/ui';
import dayjs from 'dayjs';
import { t } from '../lib/i18n/index.js';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PERCENT_DISPLAY_THRESHOLD = 1;
const COMMUNICATION_CHANNEL_ALIASES = {
  call: 'telephony',
  calls: 'telephony',
  phone: 'telephony',
  voip: 'telephony',
  fb: 'facebook',
  messenger: 'facebook',
  facebook_messenger: 'facebook',
  ig: 'instagram',
  insta: 'instagram',
  crm_email: 'crm-email',
  email: 'crm-email',
  crm_emails: 'crm-email',
  crm_chat: 'chat',
  webchat: 'chat',
};
const COMMUNICATION_CHANNEL_LABELS = {
  telephony: 'Телефония',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook Messenger',
  instagram: 'Instagram',
  telegram: 'Telegram',
  sms: 'SMS',
  'crm-email': 'CRM Email',
  massmail: 'Массовые рассылки',
  chat: 'CRM Chat',
  omnichannel: 'Omnichannel',
};
const COMMUNICATION_CHANNEL_ICON_KEYS = {
  telephony: 'telephony',
  whatsapp: 'whatsapp',
  facebook: 'facebook',
  instagram: 'instagram',
  telegram: 'telegram',
  sms: 'sms',
  'crm-email': 'crm-email',
  massmail: 'massmail',
  chat: 'chat',
  omnichannel: 'omnichannel',
};

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDisplayPercent(value) {
  const parsed = toNumber(value);
  if (parsed === null) return null;
  if (Math.abs(parsed) > 0 && Math.abs(parsed) <= PERCENT_DISPLAY_THRESHOLD) {
    return parsed * 100;
  }
  return parsed;
}

function formatShortDuration(seconds) {
  const parsed = toNumber(seconds);
  if (parsed === null || parsed === 0) return '0:00';
  const totalSeconds = Math.abs(Math.round(parsed));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatPercentValue(value, digits = 1) {
  const parsed = toDisplayPercent(value);
  if (parsed === null) return '-';
  return `${parsed.toFixed(digits)}%`;
}

function formatSignedPercentDelta(current, previous, digits = 1) {
  const currentValue = toDisplayPercent(current);
  const previousValue = toDisplayPercent(previous);
  if (currentValue === null || previousValue === null) return null;
  const delta = currentValue - previousValue;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(digits)} pp`;
}

function formatSignedSecondsDelta(current, previous) {
  const currentValue = toNumber(current);
  const previousValue = toNumber(previous);
  if (currentValue === null || previousValue === null) return null;
  const delta = Math.round(currentValue - previousValue);
  const sign = delta > 0 ? '+' : delta < 0 ? '-' : '';
  return `${sign}${formatShortDuration(Math.abs(delta))}`;
}

function normalizeListPayload(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.results)) return value.results;
  return [];
}

function normalizeBreakdownPayload(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.results)) return value.results;
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value).map(([label, item]) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return {
        key: item.key ?? item.id ?? item.code ?? label,
        label: item.label ?? item.name ?? item.reason ?? item.status ?? label,
        ...item,
      };
    }

    return {
      key: label,
      label,
      count: item,
    };
  });
}

function normalizeChannelPayload(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.results)) return value.results;
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value).map(([label, item]) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return {
        key: item.key ?? item.id ?? item.code ?? label,
        label: item.label ?? item.name ?? item.title ?? label,
        ...item,
      };
    }

    return {
      key: label,
      label,
      count: item,
    };
  });
}

function getFirstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function getDeltaTone(delta, higherIsBetter = true) {
  if (delta === null || delta === undefined || Number.isNaN(delta)) return 'default';
  if (delta === 0) return 'default';
  const improved = higherIsBetter ? delta > 0 : delta < 0;
  return improved ? 'success' : 'error';
}

function formatBreakdownCount(value) {
  const parsed = toNumber(value);
  return parsed === null ? '-' : parsed.toLocaleString('en-US');
}

function normalizeCommunicationChannelKey(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  return COMMUNICATION_CHANNEL_ALIASES[normalized] || normalized || 'omnichannel';
}

function resolveCommunicationChannelLabel(channelKey, fallbackLabel = 'Канал') {
  return COMMUNICATION_CHANNEL_LABELS[channelKey] || fallbackLabel || channelKey || 'Канал';
}

function resolveCommunicationChannelIcon(channelKey) {
  return COMMUNICATION_CHANNEL_ICON_KEYS[channelKey] || channelKey || 'omnichannel';
}

function CallsDashboard() {
  const [loading, setLoading] = useState(false);
  const [qaSubmitting, setQaSubmitting] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [automationRunning, setAutomationRunning] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [contactCenterKpi, setContactCenterKpi] = useState(null);
  const [contactCenterDrilldown, setContactCenterDrilldown] = useState({ teams: [], agents: [] });
  const [qaSummary, setQaSummary] = useState(null);
  const [qaScores, setQaScores] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [automationHealth, setAutomationHealth] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [qaModalVisible, setQaModalVisible] = useState(false);
  const [selectedQaCall, setSelectedQaCall] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'days'), dayjs()]);
  const [period, setPeriod] = useState('week'); // week, month, year
  const [selectedCommunicationChannel, setSelectedCommunicationChannel] = useState('all');
  const fixedStatCardProps = {
    width: '100%',
    height: 112,
    bodyPadding: '12px',
    titleMinHeight: 40,
  };
  const [qaForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load statistics
      const params = {};
      if (dateRange && dateRange.length === 2) {
        params.date_from = dateRange[0].format('YYYY-MM-DD');
        params.date_to = dateRange[1].format('YYYY-MM-DD');
      }

      const stats = await getCallStatistics(params);
      const [
        kpiResponse,
        drilldownResponse,
        qaSummaryResponse,
        qaScoresResponse,
        reportsResponse,
        automationHealthResponse,
        callsResponse,
        allCallsResponse,
      ] = await Promise.all([
        getContactCenterKpi({ ...params, period }),
        getContactCenterDrilldown({ ...params, period }),
        getCallQaSummary({ ...params, period }),
        getCallQaScores({ ...params, period, limit: 50 }),
        getPilotWeeklyReports({ limit: 20 }),
        getPilotReportAutomationHealth({ limit: 10 }),
        getVoipCallLogs({ ...params, limit: 10 }),
        getVoipCallLogs({ ...params, limit: 1000 }),
      ]);
      setStatistics(stats);
      setContactCenterKpi(kpiResponse);
      setContactCenterDrilldown(drilldownResponse || { teams: [], agents: [] });
      setQaSummary(qaSummaryResponse || null);
      setQaScores(qaScoresResponse?.results || []);
      setWeeklyReports(reportsResponse?.results || []);
      setAutomationHealth(automationHealthResponse || null);

      const recent = callsResponse?.results || callsResponse || [];
      setRecentCalls(recent);

      // Process data for charts
      const allCalls = allCallsResponse?.results || allCallsResponse || [];
      processChartData(allCalls);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      message.error(t('callsDashboardPage.messages.loadError'));
      setStatistics(null);
      setContactCenterKpi(null);
      setContactCenterDrilldown({ teams: [], agents: [] });
      setQaSummary(null);
      setQaScores([]);
      setWeeklyReports([]);
      setAutomationHealth(null);
      setRecentCalls([]);
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value) => {
    setPeriod(value);
    const now = dayjs();
    let startDate;

    switch (value) {
      case 'today':
        startDate = now.startOf('day');
        break;
      case 'week':
        startDate = now.subtract(7, 'days');
        break;
      case 'month':
        startDate = now.subtract(30, 'days');
        break;
      case 'year':
        startDate = now.subtract(365, 'days');
        break;
      default:
        startDate = now.subtract(7, 'days');
    }

    setDateRange([startDate, now]);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return t('callsDashboardPage.duration.hoursMinutes', {
      hours: String(hours),
      minutes: String(mins),
    });
  };

  const formatSeconds = (seconds) => {
    if (!seconds) return t('callsDashboardPage.duration.secondsZero');
    return t('callsDashboardPage.duration.secondsValue', { value: String(Math.round(seconds)) });
  };

  const calculateSuccessRate = () => {
    if (!statistics) return 0;
    const total = statistics.total || 0;
    const completed = statistics.completed ?? statistics.answered ?? statistics.connected ?? 0;
    return total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
  };

  const processChartData = (calls) => {
    // Group by date
    const dateGroups = {};
    calls.forEach((call) => {
      const date = dayjs(call.started_at || call.timestamp).format('DD.MM');
      if (!dateGroups[date]) {
        dateGroups[date] = { inbound: 0, outbound: 0, durations: [] };
      }
      if (call.direction === 'inbound') {
        dateGroups[date].inbound++;
      } else {
        dateGroups[date].outbound++;
      }
      if (call.duration) {
        dateGroups[date].durations.push(call.duration);
      }
    });

    const labels = Object.keys(dateGroups).sort((a, b) => {
      const [dayA, monthA] = a.split('.').map(Number);
      const [dayB, monthB] = b.split('.').map(Number);
      return monthA === monthB ? dayA - dayB : monthA - monthB;
    });

    const activityData = {
      labels,
      inbound: labels.map((date) => dateGroups[date].inbound),
      outbound: labels.map((date) => dateGroups[date].outbound),
    };

    const durationData = {
      labels,
      averageDuration: labels.map((date) => {
        const durations = dateGroups[date].durations;
        if (durations.length === 0) return 0;
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        return (avg / 60).toFixed(2); // Convert to minutes
      }),
    };

    setChartData({
      activity: activityData,
      duration: durationData,
    });
  };

  const recentCallsColumns = [
    {
      title: t('callsDashboardPage.columns.direction'),
      dataIndex: 'direction',
      key: 'direction',
      width: 120,
      render: (direction) => (
        <Space>
          <PhoneTwoTone twoToneColor={direction === 'inbound' ? '#52c41a' : '#1890ff'} />
          {direction === 'inbound'
            ? t('callsDashboardPage.direction.inbound')
            : t('callsDashboardPage.direction.outbound')}
        </Space>
      ),
    },
    {
      title: t('callsDashboardPage.columns.number'),
      dataIndex: 'phone_number',
      key: 'phone_number',
      render: (phone, record) => phone || record.number,
    },
    {
      title: t('callsDashboardPage.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = {
          completed: {
            color: 'success',
            text: t('callsDashboardPage.status.completed'),
            icon: <CheckCircleOutlined />,
          },
          answered: {
            color: 'success',
            text: t('callsDashboardPage.status.answered'),
            icon: <CheckCircleOutlined />,
          },
          missed: {
            color: 'error',
            text: t('callsDashboardPage.status.missed'),
            icon: <CloseCircleOutlined />,
          },
          no_answer: {
            color: 'error',
            text: t('callsDashboardPage.status.noAnswer'),
            icon: <CloseCircleOutlined />,
          },
          busy: {
            color: 'warning',
            text: t('callsDashboardPage.status.busy'),
            icon: <CloseCircleOutlined />,
          },
          failed: {
            color: 'error',
            text: t('callsDashboardPage.status.failed'),
            icon: <CloseCircleOutlined />,
          },
        };
        const style = config[status] || config.completed;
        return (
          <Tag color={style.color} icon={style.icon}>
            {style.text}
          </Tag>
        );
      },
    },
    {
      title: t('callsDashboardPage.columns.time'),
      dataIndex: 'started_at',
      key: 'started_at',
      render: (date, record) => dayjs(date || record.timestamp).format('HH:mm'),
    },
    {
      title: t('callsDashboardPage.columns.duration'),
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => formatDuration(duration),
    },
    {
      title: 'QA',
      key: 'qa_action',
      width: 120,
      render: (_, record) => (
        <Button size="small" onClick={() => openQaModal(record)}>
          {t('callsDashboardPage.columns.rate')}
        </Button>
      ),
    },
  ];

  const teamColumns = [
    { title: t('callsDashboardPage.columns.team'), dataIndex: 'group_name', key: 'group_name' },
    {
      title: t('callsDashboardPage.columns.total'),
      dataIndex: 'total_calls',
      key: 'total_calls',
      width: 90,
    },
    {
      title: 'Answer rate',
      dataIndex: 'answer_rate',
      key: 'answer_rate',
      width: 110,
      render: (v) => `${v}%`,
    },
    {
      title: 'Abandon rate',
      dataIndex: 'abandon_rate',
      key: 'abandon_rate',
      width: 120,
      render: (v) => `${v}%`,
    },
    {
      title: 'AHT',
      dataIndex: 'aht_seconds',
      key: 'aht_seconds',
      width: 100,
      render: formatSeconds,
    },
    {
      title: 'ASA',
      dataIndex: 'asa_seconds',
      key: 'asa_seconds',
      width: 100,
      render: formatSeconds,
    },
    {
      title: 'SLA breach',
      dataIndex: 'sla_breach_rate',
      key: 'sla_breach_rate',
      width: 120,
      render: (v) => `${v}%`,
    },
  ];

  const agentColumns = [
    { title: t('callsDashboardPage.columns.agent'), dataIndex: 'agent_name', key: 'agent_name' },
    { title: 'Ext', dataIndex: 'extension', key: 'extension', width: 100 },
    {
      title: t('callsDashboardPage.columns.total'),
      dataIndex: 'total_calls',
      key: 'total_calls',
      width: 90,
    },
    {
      title: 'Answer rate',
      dataIndex: 'answer_rate',
      key: 'answer_rate',
      width: 110,
      render: (v) => `${v}%`,
    },
    {
      title: 'Abandon rate',
      dataIndex: 'abandon_rate',
      key: 'abandon_rate',
      width: 120,
      render: (v) => `${v}%`,
    },
    {
      title: 'AHT',
      dataIndex: 'aht_seconds',
      key: 'aht_seconds',
      width: 100,
      render: formatSeconds,
    },
    {
      title: 'ASA',
      dataIndex: 'asa_seconds',
      key: 'asa_seconds',
      width: 100,
      render: formatSeconds,
    },
    {
      title: 'SLA breach',
      dataIndex: 'sla_breach_rate',
      key: 'sla_breach_rate',
      width: 120,
      render: (v) => `${v}%`,
    },
  ];

  const currentKpi = contactCenterKpi?.current || null;
  const previousKpi = contactCenterKpi?.previous || null;
  const omnichannelKpi = getFirstDefined(
    contactCenterKpi?.omnichannel,
    contactCenterKpi?.omniChannel,
    currentKpi?.omnichannel,
    currentKpi?.omniChannel,
    previousKpi?.omnichannel,
    previousKpi?.omniChannel
  );
  const currentQaSummary = qaSummary?.summary || null;
  const dailyTrendData = getFirstDefined(
    contactCenterKpi?.daily_trend,
    contactCenterKpi?.dailyTrend,
    currentKpi?.daily_trend,
    currentKpi?.dailyTrend
  );
  const previousDailyTrendData = getFirstDefined(
    contactCenterKpi?.previous_daily_trend,
    contactCenterKpi?.previousDailyTrend,
    previousKpi?.daily_trend,
    previousKpi?.dailyTrend
  );
  const answerRateDelta =
    currentKpi && previousKpi
      ? formatSignedPercentDelta(currentKpi.answer_rate, previousKpi.answer_rate)
      : null;

  const analyticsHourlyDistribution = normalizeListPayload(
    getFirstDefined(
      statistics?.hourly_distribution,
      statistics?.hourlyDistribution,
      contactCenterKpi?.hourly_distribution,
      contactCenterKpi?.hourlyDistribution,
      currentKpi?.hourly_distribution,
      currentKpi?.hourlyDistribution
    )
  ).map((row, index) => ({
    key: row.id ?? row.key ?? row.hour ?? row.label ?? row.time_slot ?? index,
    hour:
      row.hour ??
      row.label ??
      row.time_slot ??
      row.bucket ??
      row.slot ??
      row.period ??
      `#${index + 1}`,
    total: toNumber(
      row.total ?? row.calls_total ?? row.calls ?? row.count ?? row.value ?? row.total_calls
    ),
    answered: toNumber(
      row.answered ?? row.completed ?? row.connected ?? row.successful_calls ?? row.answer_count
    ),
    missed: toNumber(row.missed ?? row.no_answer ?? row.no_answered ?? row.missed_calls),
    abandoned: toNumber(row.abandoned ?? row.abandon ?? row.abandoned_calls),
    answerRate: toDisplayPercent(row.answer_rate ?? row.answerRate),
    ahtSeconds: toNumber(row.aht_seconds ?? row.avg_aht_seconds ?? row.aht),
    asaSeconds: toNumber(row.asa_seconds ?? row.avg_asa_seconds ?? row.asa),
    slaBreachRate: toDisplayPercent(row.sla_breach_rate ?? row.sla_breach ?? row.slaBreachRate),
  }));

  const normalizeBreakdownRows = (source) => {
    const rows = normalizeBreakdownPayload(source).map((row, index) => {
      const count =
        toNumber(row.count ?? row.total ?? row.calls ?? row.value ?? row.items ?? row.records) ?? 0;
      const rate = getFirstDefined(
        row.rate,
        row.percent,
        row.percentage,
        row.share,
        row.ratio,
        row.share_rate
      );
      return {
        key: row.key ?? row.id ?? row.code ?? row.label ?? `row-${index}`,
        label: row.label ?? row.name ?? row.reason ?? row.status ?? row.code ?? `Item ${index + 1}`,
        count,
        rate: rate !== null && rate !== undefined ? toDisplayPercent(rate) : null,
      };
    });

    const total = rows.reduce((sum, row) => sum + (row.count || 0), 0);
    return rows
      .map((row) => ({
        ...row,
        rate: row.rate ?? (total > 0 ? (row.count / total) * 100 : null),
      }))
      .sort((a, b) => (b.count || 0) - (a.count || 0));
  };

  const analyticsStatusBreakdown = normalizeBreakdownRows(
    getFirstDefined(
      statistics?.status_breakdown,
      statistics?.statusBreakdown,
      contactCenterKpi?.status_breakdown,
      contactCenterKpi?.statusBreakdown,
      currentKpi?.status_breakdown,
      currentKpi?.statusBreakdown
    )
  );

  const analyticsCauseBreakdown = normalizeBreakdownRows(
    getFirstDefined(
      statistics?.cause_breakdown,
      statistics?.causeBreakdown,
      contactCenterKpi?.cause_breakdown,
      contactCenterKpi?.causeBreakdown,
      currentKpi?.cause_breakdown,
      currentKpi?.causeBreakdown
    )
  );

  const omnichannelChannelRows = normalizeChannelPayload(
    getFirstDefined(
      omnichannelKpi?.channels,
      omnichannelKpi?.channel_breakdown,
      omnichannelKpi?.channelBreakdown,
      omnichannelKpi?.breakdown
    )
  ).map((row, index) => ({
    key: row.key ?? row.id ?? row.code ?? row.channel ?? row.label ?? `channel-${index}`,
    label: row.label ?? row.name ?? row.title ?? row.channel ?? `Channel ${index + 1}`,
    count: toNumber(
      row.count ??
        row.total ??
        row.total_count ??
        row.totalCalls ??
        row.total_calls ??
        row.messages_total ??
        row.messagesTotal ??
        row.value
    ),
    inbound: toNumber(
      row.inbound ??
        row.total_social_inbound ??
        row.totalSocialInbound ??
        row.social_inbound ??
        row.socialInbound ??
        row.inbound_count
    ),
    outbound: toNumber(
      row.outbound ??
        row.total_social_outbound ??
        row.totalSocialOutbound ??
        row.social_outbound ??
        row.socialOutbound ??
        row.outbound_count
    ),
    activeConversations: toNumber(
      row.active_conversations ??
        row.activeConversations ??
        row.open_conversations ??
        row.openConversations ??
        row.active
    ),
    responseRate: toDisplayPercent(
      row.response_rate ?? row.responseRate ?? row.reply_rate ?? row.replyRate
    ),
  }));

  const omnichannelRestricted = Boolean(omnichannelKpi?.license_restricted);
  const telephonyTotal =
    toNumber(statistics?.total ?? statistics?.total_calls ?? statistics?.calls_total) ?? 0;
  const telephonyInbound =
    toNumber(statistics?.inbound ?? statistics?.incoming ?? statistics?.incoming_calls) ?? 0;
  const telephonyOutbound =
    toNumber(statistics?.outbound ?? statistics?.outgoing ?? statistics?.outgoing_calls) ?? 0;
  const telephonyCompleted =
    toNumber(statistics?.completed ?? statistics?.answered ?? statistics?.connected) ?? 0;
  const telephonyMissed =
    toNumber(statistics?.missed ?? statistics?.missed_calls ?? statistics?.no_answer) ?? 0;
  const telephonySuccessRate = telephonyTotal > 0 ? (telephonyCompleted / telephonyTotal) * 100 : null;

  const communicationChannelsMap = new Map();
  const pushCommunicationRow = (row) => {
    const key = normalizeCommunicationChannelKey(row?.key || row?.label);
    if (!key) return;
    const normalizedRow = {
      key,
      label: resolveCommunicationChannelLabel(key, row?.label || key),
      iconChannel: resolveCommunicationChannelIcon(key),
      total: toNumber(row?.total) ?? 0,
      inbound: toNumber(row?.inbound),
      outbound: toNumber(row?.outbound),
      missed: toNumber(row?.missed),
      activeConversations: toNumber(row?.activeConversations),
      rate: toDisplayPercent(row?.rate),
      rateLabel: row?.rateLabel || 'Response rate',
      source: row?.source || 'omnichannel',
    };

    const existing = communicationChannelsMap.get(key);
    if (!existing) {
      communicationChannelsMap.set(key, normalizedRow);
      return;
    }

    const mergeMetric = (left, right) => {
      if (left === null || left === undefined) return right;
      if (right === null || right === undefined) return left;
      return left + right;
    };
    communicationChannelsMap.set(key, {
      ...existing,
      total: mergeMetric(existing.total, normalizedRow.total),
      inbound: mergeMetric(existing.inbound, normalizedRow.inbound),
      outbound: mergeMetric(existing.outbound, normalizedRow.outbound),
      missed: mergeMetric(existing.missed, normalizedRow.missed),
      activeConversations: mergeMetric(
        existing.activeConversations,
        normalizedRow.activeConversations
      ),
      rate: normalizedRow.rate ?? existing.rate,
      rateLabel: normalizedRow.rateLabel || existing.rateLabel,
      source: key === 'telephony' ? 'telephony' : 'omnichannel',
    });
  };

  pushCommunicationRow({
    key: 'telephony',
    label: 'Телефония',
    total: telephonyTotal,
    inbound: telephonyInbound,
    outbound: telephonyOutbound,
    missed: telephonyMissed,
    rate: telephonySuccessRate,
    rateLabel: 'Success rate',
    source: 'telephony',
  });

  omnichannelChannelRows.forEach((row) => {
    const total =
      toNumber(row.count) ??
      ((toNumber(row.inbound) ?? 0) + (toNumber(row.outbound) ?? 0)) ??
      0;
    pushCommunicationRow({
      key: row.key ?? row.label,
      label: row.label,
      total,
      inbound: row.inbound,
      outbound: row.outbound,
      activeConversations: row.activeConversations,
      rate: row.responseRate,
      rateLabel: 'Response rate',
      source: 'omnichannel',
    });
  });

  const communicationChannelRows = Array.from(communicationChannelsMap.values()).sort((a, b) => {
    if (a.key === 'telephony') return -1;
    if (b.key === 'telephony') return 1;
    return (b.total ?? 0) - (a.total ?? 0);
  });

  const communicationChannelOptions = [
    { value: 'all', label: 'Все каналы' },
    ...communicationChannelRows.map((row) => ({
      value: row.key,
      label: row.label,
    })),
  ];

  useEffect(() => {
    if (selectedCommunicationChannel === 'all') return;
    const exists = communicationChannelRows.some(
      (row) => row.key === selectedCommunicationChannel
    );
    if (!exists) {
      setSelectedCommunicationChannel('all');
    }
  }, [communicationChannelRows, selectedCommunicationChannel]);

  const selectedCommunicationRow =
    selectedCommunicationChannel === 'all'
      ? null
      : communicationChannelRows.find((row) => row.key === selectedCommunicationChannel) || null;

  const visibleCommunicationRows = selectedCommunicationRow
    ? [selectedCommunicationRow]
    : communicationChannelRows;

  const aggregatedCommunicationSummary = visibleCommunicationRows.reduce(
    (acc, row) => {
      acc.total += row.total ?? 0;
      acc.inbound += row.inbound ?? 0;
      acc.outbound += row.outbound ?? 0;
      acc.missed += row.missed ?? 0;
      acc.activeConversations += row.activeConversations ?? 0;
      if (row.rate !== null && row.rate !== undefined) {
        const weight = row.total && row.total > 0 ? row.total : 1;
        acc.rateSum += row.rate * weight;
        acc.rateWeight += weight;
      }
      return acc;
    },
    {
      total: 0,
      inbound: 0,
      outbound: 0,
      missed: 0,
      activeConversations: 0,
      rateSum: 0,
      rateWeight: 0,
    }
  );

  const communicationSummary = selectedCommunicationRow
    ? {
        ...selectedCommunicationRow,
        total: selectedCommunicationRow.total ?? 0,
        inbound: selectedCommunicationRow.inbound ?? 0,
        outbound: selectedCommunicationRow.outbound ?? 0,
        missed: selectedCommunicationRow.missed ?? 0,
        activeConversations: selectedCommunicationRow.activeConversations ?? 0,
        rate: selectedCommunicationRow.rate ?? null,
      }
    : {
        key: 'all',
        label: 'Все каналы',
        iconChannel: 'omnichannel',
        total: aggregatedCommunicationSummary.total,
        inbound: aggregatedCommunicationSummary.inbound,
        outbound: aggregatedCommunicationSummary.outbound,
        missed: aggregatedCommunicationSummary.missed,
        activeConversations: aggregatedCommunicationSummary.activeConversations,
        rate:
          aggregatedCommunicationSummary.rateWeight > 0
            ? aggregatedCommunicationSummary.rateSum / aggregatedCommunicationSummary.rateWeight
            : null,
        rateLabel: 'Response / Success rate',
      };

  const renderKpiCard = ({
    title,
    currentValue,
    previousValue,
    formatValue = (value) => value,
    scale = 'raw',
    higherIsBetter = true,
    accentColor,
    icon,
  }) => {
    const currentNum = toNumber(currentValue);
    const previousNum = toNumber(previousValue);
    const currentDisplay = scale === 'percent' ? toDisplayPercent(currentNum) : currentNum;
    const previousDisplay = scale === 'percent' ? toDisplayPercent(previousNum) : previousNum;
    const deltaValue =
      currentDisplay !== null && previousDisplay !== null ? currentDisplay - previousDisplay : null;
    const deltaColor = getDeltaTone(deltaValue, higherIsBetter);
    const deltaLabel =
      scale === 'percent'
        ? formatSignedPercentDelta(currentDisplay, previousDisplay)
        : formatSignedSecondsDelta(currentNum, previousNum);

    return (
      <Card loading={loading} style={{ height: '100%' }}>
        <Space direction="vertical" size={6} style={{ width: '100%' }}>
          <Text type="secondary">{title}</Text>
          <Space align="baseline" size={8} wrap>
            {icon}
            <Text style={{ fontSize: 28, fontWeight: 600, lineHeight: 1, color: accentColor }}>
              {formatValue(scale === 'percent' ? currentDisplay : currentNum)}
            </Text>
            {previousDisplay !== null && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Prev: {formatValue(scale === 'percent' ? previousDisplay : previousNum)}
              </Text>
            )}
          </Space>
          <Space direction="vertical" size={2}>
            {deltaValue !== null ? (
              <Tag color={deltaColor}>
                <Space size={4}>
                  {deltaValue > 0 ? (
                    <ArrowUpOutlined />
                  ) : deltaValue < 0 ? (
                    <ArrowDownOutlined />
                  ) : (
                    <MinusOutlined />
                  )}
                  <span>{deltaLabel}</span>
                </Space>
              </Tag>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                No previous period
              </Text>
            )}
          </Space>
        </Space>
      </Card>
    );
  };

  const outcomeLabelMap = {
    converted: 'Converted',
    follow_up: 'Follow-up',
    escalated: 'Escalated',
    callback_scheduled: 'Callback',
    unresolved: 'Unresolved',
    wrong_number: 'Wrong Number',
    do_not_call: 'Do Not Call',
  };

  const qaColumns = [
    {
      title: t('callsDashboardPage.qa.session'),
      dataIndex: 'call_session_id',
      key: 'call_session_id',
      width: 180,
    },
    {
      title: 'Reviewer',
      dataIndex: 'reviewer_name',
      key: 'reviewer_name',
      width: 130,
    },
    {
      title: 'Outcome',
      dataIndex: 'outcome_tag',
      key: 'outcome_tag',
      render: (value) => outcomeLabelMap[value] || value,
    },
    {
      title: 'Total',
      dataIndex: 'total_score',
      key: 'total_score',
      width: 90,
    },
    {
      title: 'Status',
      dataIndex: 'qa_passed',
      key: 'qa_passed',
      width: 120,
      render: (value) => (
        <Tag color={value ? 'success' : 'error'}>{value ? 'Passed' : 'Failed'}</Tag>
      ),
    },
    {
      title: t('callsDashboardPage.qa.date'),
      dataIndex: 'reviewed_at',
      key: 'reviewed_at',
      width: 160,
      render: (value) => dayjs(value).format('DD.MM HH:mm'),
    },
  ];

  const openQaModal = (call) => {
    setSelectedQaCall(call);
    qaForm.setFieldsValue({
      script_adherence_score: 80,
      communication_score: 80,
      resolution_quality_score: 80,
      outcome_tag: 'follow_up',
      strengths: '',
      improvements: '',
    });
    setQaModalVisible(true);
  };

  const closeQaModal = () => {
    setQaModalVisible(false);
    setSelectedQaCall(null);
    qaForm.resetFields();
  };

  const handleSubmitQa = async () => {
    try {
      const values = await qaForm.validateFields();
      if (!selectedQaCall?.id) {
        message.error(t('callsDashboardPage.messages.qaCallNotSelected'));
        return;
      }
      setQaSubmitting(true);
      await upsertCallQaScore({
        call_log: selectedQaCall.id,
        ...values,
      });
      message.success(t('callsDashboardPage.messages.qaSaved'));
      closeQaModal();
      loadData();
    } catch (error) {
      if (error?.errorFields) return;
      console.error('Failed to save QA score', error);
      message.error(t('callsDashboardPage.messages.qaSaveError'));
    } finally {
      setQaSubmitting(false);
    }
  };

  const handleGenerateWeeklyReport = async () => {
    try {
      setReportGenerating(true);
      const payload = {
        period: 'week',
        baseline_weeks: 4,
      };
      if (dateRange && dateRange.length === 2) {
        payload.date_from = dateRange[0].format('YYYY-MM-DD');
        payload.date_to = dateRange[1].format('YYYY-MM-DD');
      }
      await generatePilotWeeklyReport(payload);
      message.success(t('callsDashboardPage.messages.weeklyGenerated'));
      loadData();
    } catch (error) {
      console.error('Failed to generate weekly report', error);
      message.error(t('callsDashboardPage.messages.weeklyGenerateError'));
    } finally {
      setReportGenerating(false);
    }
  };

  const handleExportWeeklyReport = async (reportId) => {
    try {
      const data = await exportPilotWeeklyReport(reportId, { export_format: 'md' });
      const markdown = data?.markdown || '';
      const title = (data?.title || `weekly-report-${reportId}`).replace(/[^\w.-]+/g, '_');
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export weekly report', error);
      message.error(t('callsDashboardPage.messages.weeklyExportError'));
    }
  };

  const handleRunAutomationNow = async () => {
    try {
      setAutomationRunning(true);
      await runPilotReportAutomationNow({ async: false });
      message.success('Automation run completed');
      loadData();
    } catch (error) {
      console.error('Failed to run automation now', error);
      message.error(t('callsDashboardPage.messages.automationRunError'));
    } finally {
      setAutomationRunning(false);
    }
  };

  const weeklyReportColumns = [
    {
      title: t('callsDashboardPage.weekly.period'),
      key: 'period',
      render: (_, record) => `${record.week_start_date} - ${record.week_end_date}`,
    },
    {
      title: 'Answer Δ',
      key: 'answer_delta',
      width: 120,
      render: (_, record) => `${record?.payload?.delta?.answer_rate ?? 0} pp`,
    },
    {
      title: 'Abandon Δ',
      key: 'abandon_delta',
      width: 120,
      render: (_, record) => `${record?.payload?.delta?.abandon_rate ?? 0} pp`,
    },
    {
      title: 'QA Pass Δ',
      key: 'qa_delta',
      width: 120,
      render: (_, record) => `${record?.payload?.delta?.qa_pass_rate ?? 0} pp`,
    },
    {
      title: t('callsDashboardPage.weekly.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (value) => dayjs(value).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: t('callsDashboardPage.weekly.export'),
      key: 'export',
      width: 130,
      render: (_, record) => (
        <Button size="small" onClick={() => handleExportWeeklyReport(record.id)}>
          Markdown
        </Button>
      ),
    },
  ];

  const automationRunColumns = [
    {
      title: t('callsDashboardPage.automation.start'),
      dataIndex: 'started_at',
      key: 'started_at',
      width: 170,
      render: (value) => dayjs(value).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: t('callsDashboardPage.automation.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value) => <Tag color={value === 'success' ? 'success' : 'error'}>{value}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'created_reports',
      key: 'created_reports',
      width: 90,
    },
    {
      title: 'Notified',
      dataIndex: 'notified',
      key: 'notified',
      width: 100,
      render: (value) => (value ? 'Yes' : 'No'),
    },
    {
      title: 'TG Sent',
      key: 'telegram_sent',
      width: 90,
      render: (_, record) => record?.run_context?.telegram?.sent ?? 0,
    },
    {
      title: t('callsDashboardPage.automation.error'),
      dataIndex: 'error_message',
      key: 'error_message',
      ellipsis: true,
      render: (value) => value || '-',
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          {t('callsDashboardPage.communicationTitle', 'Коммуникационный дашборд')}
        </Title>
        <Space>
          <Button type="primary" loading={reportGenerating} onClick={handleGenerateWeeklyReport}>
            Weekly Report
          </Button>
          <Select
            value={selectedCommunicationChannel}
            onChange={setSelectedCommunicationChannel}
            style={{ width: 210 }}
            options={communicationChannelOptions}
          />
          <Select value={period} onChange={handlePeriodChange} style={{ width: 150 }}>
            <Option value="today">{t('callsDashboardPage.period.today')}</Option>
            <Option value="week">{t('callsDashboardPage.period.week')}</Option>
            <Option value="month">{t('callsDashboardPage.period.month')}</Option>
            <Option value="year">{t('callsDashboardPage.period.year')}</Option>
          </Select>
          <RangePicker value={dateRange} onChange={setDateRange} format="DD.MM.YYYY" />
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            {t('callsDashboardPage.common.refresh')}
          </Button>
        </Space>
      </div>

      {/* Main Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <KpiStatCard
            loading={loading}
            {...fixedStatCardProps}
            title={t('callsDashboardPage.stats.totalCalls')}
            value={statistics?.total || 0}
            prefix={<ChannelBrandIcon channel="telephony" size={16} />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiStatCard
            loading={loading}
            {...fixedStatCardProps}
            title={t('callsDashboardPage.stats.inbound')}
            value={statistics?.inbound || 0}
            prefix={<PhoneTwoTone twoToneColor="#52c41a" />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiStatCard
            loading={loading}
            {...fixedStatCardProps}
            title={t('callsDashboardPage.stats.outbound')}
            value={statistics?.outbound || 0}
            prefix={<PhoneTwoTone twoToneColor="#1890ff" />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiStatCard
            loading={loading}
            {...fixedStatCardProps}
            title={t('callsDashboardPage.stats.successRate')}
            value={calculateSuccessRate()}
            suffix="%"
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
      </Row>

      {/* QA Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <KpiStatCard
            loading={loading}
            {...fixedStatCardProps}
            title="QA Pass Rate"
            value={currentQaSummary?.pass_rate || 0}
            suffix="%"
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiStatCard
            loading={loading}
            {...fixedStatCardProps}
            title="Avg Script Adherence"
            value={currentQaSummary?.avg_script_adherence || 0}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiStatCard
            loading={loading}
            {...fixedStatCardProps}
            title="Avg Communication"
            value={currentQaSummary?.avg_communication || 0}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiStatCard
            loading={loading}
            {...fixedStatCardProps}
            title="Avg Resolution Quality"
            value={currentQaSummary?.avg_resolution_quality || 0}
          />
        </Col>
      </Row>

      {/* Contact Center KPI Economics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          {renderKpiCard({
            title: 'AHT',
            currentValue: currentKpi?.aht_seconds,
            previousValue: previousKpi?.aht_seconds,
            formatValue: (value) =>
              value === null || value === undefined ? '-' : formatSeconds(value),
            scale: 'raw',
            higherIsBetter: false,
            accentColor: '#1677ff',
            icon: <ClockCircleOutlined />,
          })}
        </Col>
        <Col xs={24} sm={12} lg={8}>
          {renderKpiCard({
            title: 'ASA',
            currentValue: currentKpi?.asa_seconds,
            previousValue: previousKpi?.asa_seconds,
            formatValue: (value) =>
              value === null || value === undefined ? '-' : formatSeconds(value),
            scale: 'raw',
            higherIsBetter: false,
            accentColor: '#1890ff',
            icon: <ClockCircleOutlined />,
          })}
        </Col>
        <Col xs={24} sm={12} lg={8}>
          {renderKpiCard({
            title: 'FCR',
            currentValue: currentKpi?.fcr_rate,
            previousValue: previousKpi?.fcr_rate,
            formatValue: (value) =>
              value === null || value === undefined ? '-' : formatPercentValue(value),
            scale: 'percent',
            higherIsBetter: true,
            accentColor: '#52c41a',
            icon: <CheckCircleOutlined />,
          })}
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          {renderKpiCard({
            title: 'SLA Breach',
            currentValue: currentKpi?.sla_breach_rate,
            previousValue: previousKpi?.sla_breach_rate,
            formatValue: (value) =>
              value === null || value === undefined ? '-' : formatPercentValue(value),
            scale: 'percent',
            higherIsBetter: false,
            accentColor: '#fa8c16',
            icon: <CloseCircleOutlined />,
          })}
        </Col>
        <Col xs={24} sm={12} lg={8}>
          {renderKpiCard({
            title: 'Abandon Rate',
            currentValue: currentKpi?.abandon_rate,
            previousValue: previousKpi?.abandon_rate,
            formatValue: (value) =>
              value === null || value === undefined ? '-' : formatPercentValue(value),
            scale: 'percent',
            higherIsBetter: false,
            accentColor: '#ff4d4f',
            icon: <CloseCircleOutlined />,
          })}
        </Col>
        <Col xs={24} sm={12} lg={8}>
          {renderKpiCard({
            title: 'Answer Rate',
            currentValue: currentKpi?.answer_rate,
            previousValue: previousKpi?.answer_rate,
            formatValue: (value) =>
              value === null || value === undefined ? '-' : formatPercentValue(value),
            scale: 'percent',
            higherIsBetter: true,
            accentColor: '#13c2c2',
            icon: <CheckCircleOutlined />,
          })}
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <CallsDailyTrendChart
            data={dailyTrendData}
            previousData={previousDailyTrendData}
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={24} lg={12}>
          <Card loading={loading} title="Conversion by Direction">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>
                Inbound:{' '}
                {contactCenterKpi?.conversion_by_direction?.inbound?.conversion_rate ===
                  undefined ||
                contactCenterKpi?.conversion_by_direction?.inbound?.conversion_rate === null
                  ? '-'
                  : formatPercentValue(
                      contactCenterKpi?.conversion_by_direction?.inbound?.conversion_rate
                    )}
              </Text>
              <Text>
                Outbound:{' '}
                {contactCenterKpi?.conversion_by_direction?.outbound?.conversion_rate ===
                  undefined ||
                contactCenterKpi?.conversion_by_direction?.outbound?.conversion_rate === null
                  ? '-'
                  : formatPercentValue(
                      contactCenterKpi?.conversion_by_direction?.outbound?.conversion_rate
                    )}
              </Text>
              <Text>
                Internal:{' '}
                {contactCenterKpi?.conversion_by_direction?.internal?.conversion_rate ===
                  undefined ||
                contactCenterKpi?.conversion_by_direction?.internal?.conversion_rate === null
                  ? '-'
                  : formatPercentValue(
                      contactCenterKpi?.conversion_by_direction?.internal?.conversion_rate
                    )}
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={24} lg={12}>
          <Card loading={loading} title="Answer Rate Delta vs Previous">
            <Space align="baseline" size={8} wrap>
              <Text style={{ fontSize: 28, fontWeight: 600, lineHeight: 1 }}>
                {answerRateDelta ?? 'No data'}
              </Text>
            </Space>
            <Text type="secondary">
              Current:{' '}
              {currentKpi?.answer_rate === undefined || currentKpi?.answer_rate === null
                ? '-'
                : formatPercentValue(currentKpi?.answer_rate)}{' '}
              | Previous:{' '}
              {previousKpi?.answer_rate === undefined || previousKpi?.answer_rate === null
                ? '-'
                : formatPercentValue(previousKpi?.answer_rate)}
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card loading={loading} title="Коммуникации по каналам">
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              {omnichannelRestricted && (
                <Alert
                  type="warning"
                  showIcon
                  message="Часть digital-каналов ограничена текущей лицензией."
                  description="Телефония доступна полностью; данные по Meta/omnichannel могут быть частично скрыты."
                />
              )}

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                  <KpiStatCard
                    {...fixedStatCardProps}
                    title="Всего коммуникаций"
                    value={communicationSummary.total}
                    prefix={<ChannelBrandIcon channel={communicationSummary.iconChannel} size={16} />}
                    valueStyle={{ color: '#1677ff' }}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <KpiStatCard
                    {...fixedStatCardProps}
                    title="Inbound"
                    value={communicationSummary.inbound}
                    prefix={<ArrowDownOutlined />}
                    valueStyle={{ color: '#13c2c2' }}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <KpiStatCard
                    {...fixedStatCardProps}
                    title="Outbound"
                    value={communicationSummary.outbound}
                    prefix={<ArrowUpOutlined />}
                    valueStyle={{ color: '#1677ff' }}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <KpiStatCard
                    {...fixedStatCardProps}
                    title={communicationSummary.rateLabel || 'Response / Success rate'}
                    value={
                      communicationSummary.rate === null || communicationSummary.rate === undefined
                        ? '-'
                        : Number(communicationSummary.rate.toFixed(1))
                    }
                    suffix={communicationSummary.rate === null || communicationSummary.rate === undefined ? '' : '%'}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>

              <Table
                dataSource={visibleCommunicationRows}
                rowKey="key"
                pagination={false}
                size="small"
                locale={{
                  emptyText: (
                    <Empty
                      description="Нет данных по каналам за выбранный период."
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
                columns={[
                  {
                    title: 'Канал',
                    dataIndex: 'label',
                    key: 'label',
                    render: (label, record) => (
                      <Space size={8} align="center">
                        <ChannelBrandIcon channel={record.iconChannel} size={14} />
                        <span>{label}</span>
                      </Space>
                    ),
                  },
                  {
                    title: 'Всего',
                    dataIndex: 'total',
                    key: 'total',
                    width: 120,
                    render: (value) => formatBreakdownCount(value),
                  },
                  {
                    title: 'Inbound',
                    dataIndex: 'inbound',
                    key: 'inbound',
                    width: 120,
                    render: (value) => formatBreakdownCount(value),
                  },
                  {
                    title: 'Outbound',
                    dataIndex: 'outbound',
                    key: 'outbound',
                    width: 120,
                    render: (value) => formatBreakdownCount(value),
                  },
                  {
                    title: 'Missed',
                    dataIndex: 'missed',
                    key: 'missed',
                    width: 120,
                    render: (value) => (value === null || value === undefined ? '-' : formatBreakdownCount(value)),
                  },
                  {
                    title: 'Активные диалоги',
                    dataIndex: 'activeConversations',
                    key: 'activeConversations',
                    width: 150,
                    render: (value) => (value === null || value === undefined ? '-' : formatBreakdownCount(value)),
                  },
                  {
                    title: selectedCommunicationRow?.rateLabel || 'Response / Success rate',
                    dataIndex: 'rate',
                    key: 'rate',
                    width: 170,
                    render: (value) =>
                      value === null || value === undefined ? '-' : formatPercentValue(value),
                  },
                ]}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Secondary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <KpiStatCard
            loading={loading}
            width="100%"
            height={112}
            title={t('callsDashboardPage.stats.completed')}
            value={statistics?.completed ?? statistics?.answered ?? statistics?.connected ?? 0}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
            bodyPadding="12px"
            titleMinHeight={40}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiStatCard
            loading={loading}
            width="100%"
            height={112}
            title={t('callsDashboardPage.stats.missed')}
            value={statistics?.missed ?? statistics?.missed_calls ?? statistics?.no_answer ?? 0}
            prefix={<CloseCircleOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
            bodyPadding="12px"
            titleMinHeight={40}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiStatCard
            loading={loading}
            width="100%"
            height={112}
            title={t('callsDashboardPage.stats.totalDuration')}
            value={
              statistics
                ? formatTotalDuration(statistics.totalDuration || statistics.total_duration || 0)
                : t('callsDashboardPage.duration.hoursMinutes', { hours: '0', minutes: '0' })
            }
            prefix={<ClockCircleOutlined />}
            bodyPadding="12px"
            titleMinHeight={40}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiStatCard
            loading={loading}
            width="100%"
            height={112}
            title={t('callsDashboardPage.stats.averageDuration')}
            value={
              statistics
                ? formatDuration(Math.round(statistics.averageDuration || statistics.average_duration || 0))
                : '0:00'
            }
            prefix={<ClockCircleOutlined />}
            bodyPadding="12px"
            titleMinHeight={40}
          />
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <CallsActivityChart data={chartData?.activity} loading={loading} />
        </Col>
        <Col xs={24} lg={12}>
          <CallsDistributionChart data={statistics} loading={loading} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <CallsStatusChart data={statistics} loading={loading} />
        </Col>
        <Col xs={24} lg={12}>
          <CallsDurationChart data={chartData?.duration} loading={loading} />
        </Col>
      </Row>

      {(analyticsHourlyDistribution.length > 0 ||
        analyticsStatusBreakdown.length > 0 ||
        analyticsCauseBreakdown.length > 0) && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {analyticsHourlyDistribution.length > 0 && (
            <Col xs={24} lg={12}>
              <Card title="Hourly distribution" loading={loading}>
                <Table
                  dataSource={analyticsHourlyDistribution}
                  rowKey="key"
                  pagination={false}
                  size="small"
                  scroll={{ x: 900 }}
                  columns={[
                    { title: 'Hour', dataIndex: 'hour', key: 'hour', width: 90 },
                    {
                      title: 'Total',
                      dataIndex: 'total',
                      key: 'total',
                      width: 90,
                      render: formatBreakdownCount,
                    },
                    {
                      title: 'Answered',
                      dataIndex: 'answered',
                      key: 'answered',
                      width: 100,
                      render: formatBreakdownCount,
                    },
                    {
                      title: 'Missed',
                      dataIndex: 'missed',
                      key: 'missed',
                      width: 90,
                      render: formatBreakdownCount,
                    },
                    {
                      title: 'Abandoned',
                      dataIndex: 'abandoned',
                      key: 'abandoned',
                      width: 100,
                      render: formatBreakdownCount,
                    },
                    {
                      title: 'Answer rate',
                      dataIndex: 'answerRate',
                      key: 'answerRate',
                      width: 110,
                      render: (value) =>
                        value === null || value === undefined ? '-' : formatPercentValue(value),
                    },
                    {
                      title: 'AHT',
                      dataIndex: 'ahtSeconds',
                      key: 'ahtSeconds',
                      width: 100,
                      render: (value) =>
                        value === null || value === undefined ? '-' : formatSeconds(value),
                    },
                    {
                      title: 'ASA',
                      dataIndex: 'asaSeconds',
                      key: 'asaSeconds',
                      width: 100,
                      render: (value) =>
                        value === null || value === undefined ? '-' : formatSeconds(value),
                    },
                    {
                      title: 'SLA breach',
                      dataIndex: 'slaBreachRate',
                      key: 'slaBreachRate',
                      width: 120,
                      render: (value) =>
                        value === null || value === undefined ? '-' : formatPercentValue(value),
                    },
                  ]}
                />
              </Card>
            </Col>
          )}
          {(analyticsStatusBreakdown.length > 0 || analyticsCauseBreakdown.length > 0) && (
            <Col xs={24} lg={analyticsHourlyDistribution.length > 0 ? 12 : 24}>
              <Card title="Status mix and failure reasons" loading={loading}>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  {analyticsStatusBreakdown.length > 0 && (
                    <div>
                      <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
                        Status mix
                      </Title>
                      <Table
                        dataSource={analyticsStatusBreakdown.slice(0, 8)}
                        rowKey="key"
                        pagination={false}
                        size="small"
                        columns={[
                          { title: 'Status', dataIndex: 'label', key: 'label' },
                          {
                            title: 'Count',
                            dataIndex: 'count',
                            key: 'count',
                            width: 90,
                            render: formatBreakdownCount,
                          },
                          {
                            title: 'Share',
                            dataIndex: 'rate',
                            key: 'rate',
                            width: 100,
                            render: (value) =>
                              value === null || value === undefined
                                ? '-'
                                : formatPercentValue(value),
                          },
                        ]}
                      />
                    </div>
                  )}
                  {analyticsCauseBreakdown.length > 0 && (
                    <div>
                      <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
                        Top failure reasons
                      </Title>
                      <Table
                        dataSource={analyticsCauseBreakdown.slice(0, 8)}
                        rowKey="key"
                        pagination={false}
                        size="small"
                        columns={[
                          { title: 'Reason', dataIndex: 'label', key: 'label' },
                          {
                            title: 'Count',
                            dataIndex: 'count',
                            key: 'count',
                            width: 90,
                            render: formatBreakdownCount,
                          },
                          {
                            title: 'Share',
                            dataIndex: 'rate',
                            key: 'rate',
                            width: 100,
                            render: (value) =>
                              value === null || value === undefined
                                ? '-'
                                : formatPercentValue(value),
                          },
                        ]}
                      />
                    </div>
                  )}
                </Space>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Recent Calls */}
      <Card title={t('callsDashboardPage.recent.title')} loading={loading}>
        <Table
          dataSource={recentCalls}
          columns={recentCallsColumns}
          rowKey="id"
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                description={t('callsDashboardPage.recent.empty')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={t('callsDashboardPage.drilldown.teams')} loading={loading}>
            <Table
              dataSource={contactCenterDrilldown?.teams || []}
              columns={teamColumns}
              rowKey="group_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('callsDashboardPage.drilldown.agents')} loading={loading}>
            <Table
              dataSource={contactCenterDrilldown?.agents || []}
              columns={agentColumns}
              rowKey="agent_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card
            title="Automation Health"
            loading={loading}
            extra={
              <Button loading={automationRunning} onClick={handleRunAutomationNow}>
                Run Now
              </Button>
            }
          >
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} lg={6}>
                <KpiStatCard
                  {...fixedStatCardProps}
                  title="Total Runs"
                  value={automationHealth?.summary?.total_runs || 0}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <KpiStatCard
                  {...fixedStatCardProps}
                  title="Success Runs"
                  value={automationHealth?.summary?.success_runs || 0}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <KpiStatCard
                  {...fixedStatCardProps}
                  title="Failed Runs"
                  value={automationHealth?.summary?.failed_runs || 0}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <KpiStatCard
                  {...fixedStatCardProps}
                  title="Failure Rate"
                  value={automationHealth?.summary?.failure_rate || 0}
                  suffix="%"
                />
              </Col>
            </Row>
            <Table
              dataSource={automationHealth?.runs || []}
              columns={automationRunColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Weekly Pilot Board Reports" loading={loading}>
            <Table
              dataSource={weeklyReports}
              columns={weeklyReportColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="QA Reviews" loading={loading}>
            <Table
              dataSource={qaScores}
              columns={qaColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={`${t('callsDashboardPage.qa.modalTitle')} ${selectedQaCall?.session_id || ''}`}
        open={qaModalVisible}
        forceRender
        onOk={handleSubmitQa}
        onCancel={closeQaModal}
        confirmLoading={qaSubmitting}
        okText={t('callsDashboardPage.qa.save')}
        cancelText={t('callsDashboardPage.qa.cancel')}
      >
        <Form layout="vertical" form={qaForm}>
          <Form.Item
            name="script_adherence_score"
            label="Script Adherence (0-100)"
            rules={[{ required: true, message: t('callsDashboardPage.qa.validation.script') }]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="communication_score"
            label="Communication (0-100)"
            rules={[
              { required: true, message: t('callsDashboardPage.qa.validation.communication') },
            ]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="resolution_quality_score"
            label="Resolution Quality (0-100)"
            rules={[{ required: true, message: t('callsDashboardPage.qa.validation.result') }]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="outcome_tag"
            label="Outcome"
            rules={[{ required: true, message: t('callsDashboardPage.qa.validation.outcome') }]}
          >
            <Select
              options={Object.entries(outcomeLabelMap).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="strengths" label="Strengths">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="improvements" label="Improvements">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default CallsDashboard;
