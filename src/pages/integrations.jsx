/**
 * Integrations Page
 * Manage SMS, telephony, and social integrations backed by CRM API
 */

import React, { useEffect, useState } from 'react';
import { Card, Space, Button, Modal, App, Table, Tag, Form, Input, InputNumber, Select, Switch, Popconfirm, Alert, Typography, Descriptions, theme as antdTheme } from 'antd';
import {
  ApiOutlined,
  MessageOutlined,
  PhoneOutlined,
  ReloadOutlined,
  FacebookOutlined,
  InstagramOutlined,
  SendOutlined,
  RobotOutlined,
  WhatsAppOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import IntegrationCard from '../components/IntegrationCard';
import LicenseRestrictedAction from '../components/LicenseRestrictedAction.jsx';
import SMSSettings from '../components/SMSSettings';
import TelephonySettings from '../components/TelephonySettings';
import FacebookConnect from '../components/FacebookConnect.jsx';
import InstagramConnect from '../components/InstagramConnect.jsx';
import TelegramConnect from '../components/TelegramConnect.jsx';
import WhatsAppConnect from '../components/WhatsAppConnect.jsx';
import smsApi from '../lib/api/sms.js';
import { getTelephonyStats, getVoIPConnections } from '../lib/api/telephony';
import { useTheme } from '../lib/hooks/useTheme.js';
import {
  getFacebookPages,
  disconnectFacebook,
  testFacebookPage,
  updateFacebookPage,
} from '../lib/api/integrations/facebook.js';
import {
  getInstagramAccounts,
  disconnectInstagram,
  testInstagramAccount,
  updateInstagramAccount,
} from '../lib/api/integrations/instagram.js';
import {
  getTelegramBots,
  disconnectTelegramBot,
  testTelegramBot,
  setTelegramWebhook,
  updateTelegramBot,
} from '../lib/api/integrations/telegram.js';
import {
  getAIProviders,
  createAIProvider,
  updateAIProvider,
  deleteAIProvider,
  testAIProviderConnection,
} from '../lib/api/integrations/ai.js';
import {
  getWhatsAppAccounts,
  testWhatsAppAccount,
  disconnectWhatsAppAccount,
  updateWhatsAppAccount,
} from '../lib/api/integrations/whatsapp.js';
import { apiConfig } from '../lib/api/client';
import {
  getOmnichannelDiagnostics,
  getOmnichannelEventPayload,
  getOmnichannelTimeline,
  replayOmnichannelEvent,
} from '../lib/api/compliance.js';
import { LICENSE_RESTRICTION_EVENT } from '../lib/api/licenseRestrictionBus.js';
import { getFeatureRestrictionReason } from '../lib/api/licenseRestrictionState.js';
import { t } from '../lib/i18n';

const formatDateTime = (value) => {
  if (!value) return '-';
  return dayjs(value).isValid() ? dayjs(value).format('DD.MM.YYYY HH:mm') : String(value);
};

dayjs.extend(relativeTime);

const { Text } = Typography;

const formatDiagnosticsTimestamp = (value) => {
  if (!value) return '';
  return dayjs(value).isValid() ? dayjs(value).fromNow() : '';
};

const buildDiagnosticsExplanation = (record, tr) => {
  const lines = [];
  const primaryError =
    record.processing_error ||
    record.replay_error ||
    record.verification_error ||
    '';

  if (record.signature_valid === false) {
    lines.push(tr('integrationsPage.diagnostics.explanations.signature', 'Подпись webhook не прошла проверку.'));
  }
  if (record.sla_status === 'breached') {
    lines.push(tr('integrationsPage.diagnostics.explanations.sla', 'Диалог уже попал в SLA risk.'));
  }
  if (record.replay_status === 'failed') {
    lines.push(tr('integrationsPage.diagnostics.explanations.replayFailed', 'Последний replay завершился ошибкой.'));
  } else if (record.replayable) {
    lines.push(tr('integrationsPage.diagnostics.explanations.replayReady', 'Событие можно безопасно отправить на replay.'));
  }
  if (record.processed_at) {
    lines.push(
      tr('integrationsPage.diagnostics.explanations.processedAt', 'Обработано {time}', {
        time: formatDiagnosticsTimestamp(record.processed_at),
      })
    );
  }
  if (record.replayed_at) {
    lines.push(
      tr('integrationsPage.diagnostics.explanations.replayedAt', 'Replay запускался {time}', {
        time: formatDiagnosticsTimestamp(record.replayed_at),
      })
    );
  }
  if (primaryError) {
    lines.push(primaryError);
  }

  return lines.slice(0, 3);
};

const getRawPreviewEntries = (rawPreview) =>
  rawPreview && typeof rawPreview === 'object' ? Object.entries(rawPreview).slice(0, 3) : [];

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.results) ? response.results : [];
};

const parseMultiline = (value) =>
  String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const stringifyMultiline = (items) => (Array.isArray(items) ? items.join('\n') : '');

const getDefaultTelegramWebhookUrl = () => {
  if (typeof window === 'undefined') return '';

  const fallbackOrigin = window.location.origin;
  try {
    const origin = new URL(apiConfig?.baseUrl || fallbackOrigin, fallbackOrigin).origin;
    return `${origin.replace(/\/+$/, '')}/api/telegram/webhook/`;
  } catch {
    return `${fallbackOrigin.replace(/\/+$/, '')}/api/telegram/webhook/`;
  }
};

const AI_PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'claude', label: 'Anthropic Claude' },
  { value: 'openai_compatible', label: 'OpenAI Compatible' },
  { value: 'custom', label: 'Custom HTTP' },
];

const AI_PROVIDER_MODELS = {
  openai: ['gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4o'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  claude: ['claude-sonnet-4-20250514', 'claude-3-7-sonnet-20250219', 'claude-3-5-haiku-20241022'],
};

const DIAGNOSTICS_SCOPE_VALUES = ['all', 'failures', 'replayable', 'archived'];
const DEFAULT_DIAGNOSTICS_FILTERS = {
  scope: 'all',
  channel: 'all',
  query: '',
  onlyNeedsAction: false,
};

function readHashState() {
  if (typeof window === 'undefined') {
    return { path: '/integrations', params: new URLSearchParams() };
  }

  const raw = (window.location.hash || '').replace(/^#/, '');
  const [rawPath = '/integrations', rawQuery = ''] = raw.split('?');
  return {
    path: rawPath || '/integrations',
    params: new URLSearchParams(rawQuery),
  };
}

function normalizeDiagnosticsFilters(value) {
  const scope = DIAGNOSTICS_SCOPE_VALUES.includes(String(value?.scope || ''))
    ? String(value.scope)
    : DEFAULT_DIAGNOSTICS_FILTERS.scope;
  const channelRaw = String(value?.channel || '').trim().toLowerCase();
  const channel = channelRaw || DEFAULT_DIAGNOSTICS_FILTERS.channel;
  const query = String(value?.query || '').trim();
  const onlyNeedsAction = Boolean(value?.onlyNeedsAction);

  return {
    scope,
    channel,
    query,
    onlyNeedsAction,
  };
}

function getDiagnosticsFiltersFromHash() {
  const params = readHashState().params;
  return normalizeDiagnosticsFilters({
    scope: params.get('diag_scope') || DEFAULT_DIAGNOSTICS_FILTERS.scope,
    channel: params.get('diag_channel') || DEFAULT_DIAGNOSTICS_FILTERS.channel,
    query: params.get('diag_q') || '',
    onlyNeedsAction: ['1', 'true', 'yes', 'on'].includes(String(params.get('diag_needs_action') || '').toLowerCase()),
  });
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

const getProviderModelOptions = (provider, currentValue) => {
  const modelValues = AI_PROVIDER_MODELS[provider] || [];
  const options = modelValues.map((value) => ({ value, label: value }));

  if (currentValue && !modelValues.includes(currentValue)) {
    options.unshift({ value: currentValue, label: `${currentValue} (текущая)` });
  }

  return options;
};

export default function IntegrationsPage({ embedded = false } = {}) {
  const { token } = antdTheme.useToken();
  const { message } = App.useApp();
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
  const [loading, setLoading] = useState({});
  const [statuses, setStatuses] = useState({
    sms: { status: 'disconnected', stats: {} },
    telephony: { status: 'disconnected', stats: {} },
    whatsapp: { status: 'disconnected', stats: {} },
    facebook: { status: 'disconnected', stats: {} },
    instagram: { status: 'disconnected', stats: {} },
    telegram: { status: 'disconnected', stats: {} },
    ai: { status: 'disconnected', stats: {} },
  });
  const [modalVisible, setModalVisible] = useState({
    sms: false,
    telephony: false,
    whatsapp: false,
    facebook: false,
    instagram: false,
    telegram: false,
    ai: false,
  });
  const [facebookPages, setFacebookPages] = useState([]);
  const [whatsAppAccounts, setWhatsAppAccounts] = useState([]);
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [telegramBots, setTelegramBots] = useState([]);
  const [aiProviders, setAIProviders] = useState([]);
  const [aiModal, setAIModal] = useState({ open: false, record: null });
  const [aiSaving, setAISaving] = useState(false);
  const [aiTestingId, setAITestingId] = useState(null);
  const [aiDefaultingId, setAIDefaultingId] = useState(null);
  const [aiForm] = Form.useForm();
  const [webhookModal, setWebhookModal] = useState({ open: false, bot: null });
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookForm] = Form.useForm();
  const [integrationEditModal, setIntegrationEditModal] = useState({ open: false, type: null, record: null });
  const [integrationEditSaving, setIntegrationEditSaving] = useState(false);
  const [integrationEditForm] = Form.useForm();
  const [omnichannelSummary, setOmnichannelSummary] = useState({ count: 0, queue: 0, active: 0, resolved: 0 });
  const [omnichannelDiagnostics, setOmnichannelDiagnostics] = useState({
    summary: {},
    channels: [],
    recent_failures: [],
    replay_candidates: [],
    recent_archived: [],
    filtered_events: [],
    filtered_count: 0,
    filtered_scope: 'all',
  });
  const [omnichannelDiagnosticsLoading, setOmnichannelDiagnosticsLoading] = useState(false);
  const [omnichannelReplayId, setOmnichannelReplayId] = useState(null);
  const [omnichannelEventModal, setOmnichannelEventModal] = useState({
    open: false,
    loading: false,
    record: null,
    payload: null,
    error: '',
  });
  const [diagnosticsFilters, setDiagnosticsFilters] = useState(getDiagnosticsFiltersFromHash);
  const [licenseRestriction, setLicenseRestriction] = useState(null);

  const getErrorText = (error, fallback) => {
    const details = error?.details || {};
    if (typeof details === 'string') return details;
    if (typeof details?.message === 'string') return details.message;
    if (typeof details?.error === 'string') return details.error;
    if (typeof details?.detail === 'string') return details.detail;
    if (typeof error?.message === 'string' && !error.message.startsWith('HTTP ')) return error.message;
    return fallback;
  };

  useEffect(() => {
    loadAllStatuses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOmnichannelDiagnostics(diagnosticsFilters);
    }, 220);
    return () => clearTimeout(timer);
  }, [
    diagnosticsFilters.scope,
    diagnosticsFilters.channel,
    diagnosticsFilters.query,
    diagnosticsFilters.onlyNeedsAction,
  ]);

  useEffect(() => {
    replaceHashQuery({
      diag_scope: diagnosticsFilters.scope !== DEFAULT_DIAGNOSTICS_FILTERS.scope ? diagnosticsFilters.scope : null,
      diag_channel: diagnosticsFilters.channel !== DEFAULT_DIAGNOSTICS_FILTERS.channel ? diagnosticsFilters.channel : null,
      diag_q: diagnosticsFilters.query || null,
      diag_needs_action: diagnosticsFilters.onlyNeedsAction ? '1' : null,
    });
  }, [
    diagnosticsFilters.scope,
    diagnosticsFilters.channel,
    diagnosticsFilters.query,
    diagnosticsFilters.onlyNeedsAction,
  ]);

  useEffect(() => {
    const onHashChange = () => {
      const nextFilters = getDiagnosticsFiltersFromHash();
      setDiagnosticsFilters((current) => {
        const normalizedCurrent = normalizeDiagnosticsFilters(current);
        if (
          normalizedCurrent.scope === nextFilters.scope &&
          normalizedCurrent.channel === nextFilters.channel &&
          normalizedCurrent.query === nextFilters.query &&
          normalizedCurrent.onlyNeedsAction === nextFilters.onlyNeedsAction
        ) {
          return current;
        }
        return nextFilters;
      });
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const onLicenseRestriction = (event) => {
      const detail = event?.detail || {};
      const feature = String(detail.feature || '');
      if (feature && !feature.startsWith('integrations.') && feature !== 'unknown.feature') return;
      setLicenseRestriction({
        code: String(detail.code || 'LICENSE_FEATURE_DISABLED'),
        feature: feature || 'integrations.core',
        message: String(detail.message || ''),
      });
      message.warning(detail.message || tr('integrationsPage.messages.restricted', 'Лицензия ограничивает доступ к интеграциям'));
    };

    window.addEventListener(LICENSE_RESTRICTION_EVENT, onLicenseRestriction);
    return () => window.removeEventListener(LICENSE_RESTRICTION_EVENT, onLicenseRestriction);
  }, [message]);

  const loadAllStatuses = async () => {
    await Promise.all([
      loadSMSStatus(),
      loadTelephonyStatus(),
      loadWhatsAppStatus(),
      loadFacebookStatus(),
      loadInstagramStatus(),
      loadTelegramStatus(),
      loadAIStatus(),
      loadOmnichannelSummary(),
      loadOmnichannelDiagnostics(diagnosticsFilters),
    ]);
  };

  const loadOmnichannelSummary = async () => {
    try {
      const response = await getOmnichannelTimeline({ limit: 200 });
      const items = Array.isArray(response?.results) ? response.results : [];
      setOmnichannelSummary({
        count: response?.count || items.length,
        queue: items.filter((item) => item.queue_bucket === 'queue').length,
        active: items.filter((item) => item.queue_bucket === 'active').length,
        resolved: items.filter((item) => item.queue_bucket === 'resolved').length,
      });
    } catch (error) {
      setOmnichannelSummary({ count: 0, queue: 0, active: 0, resolved: 0 });
    }
  };

  const loadOmnichannelDiagnostics = async (filters = diagnosticsFilters) => {
    setOmnichannelDiagnosticsLoading(true);
    try {
      const params = {
        limit: 10,
        event_limit: 120,
      };
      if (filters?.scope && filters.scope !== 'all') params.scope = filters.scope;
      if (filters?.channel && filters.channel !== 'all') params.channel = filters.channel;
      if (String(filters?.query || '').trim()) params.q = String(filters.query).trim();
      if (filters?.onlyNeedsAction) params.needs_action = 1;

      const response = await getOmnichannelDiagnostics(params);
      setOmnichannelDiagnostics({
        summary: response?.summary || {},
        channels: Array.isArray(response?.channels) ? response.channels : [],
        recent_failures: Array.isArray(response?.recent_failures) ? response.recent_failures : [],
        replay_candidates: Array.isArray(response?.replay_candidates) ? response.replay_candidates : [],
        recent_archived: Array.isArray(response?.recent_archived) ? response.recent_archived : [],
        filtered_events: Array.isArray(response?.filtered_events) ? response.filtered_events : [],
        filtered_count: Number(response?.filtered_count || 0),
        filtered_scope: String(response?.filtered_scope || 'all'),
      });
    } catch (error) {
      setOmnichannelDiagnostics({
        summary: {},
        channels: [],
        recent_failures: [],
        replay_candidates: [],
        recent_archived: [],
        filtered_events: [],
        filtered_count: 0,
        filtered_scope: 'all',
      });
    } finally {
      setOmnichannelDiagnosticsLoading(false);
    }
  };

  const handleOmnichannelReplay = async (record) => {
    if (!ensureIntegrationsAccess()) return;
    if (!record?.id) return;
    setOmnichannelReplayId(record.id);
    try {
      const result = await replayOmnichannelEvent(record.id);
      if (result?.event) {
        setOmnichannelEventModal((prev) => {
          if (!prev.open || String(prev.record?.id || '') !== String(record.id)) return prev;
          return {
            ...prev,
            payload: result.event,
            record: { ...(prev.record || {}), ...(result.event || {}) },
            error: '',
          };
        });
      }
      if (result?.success) {
        message.success(tr('integrationsPage.messages.replayOk', 'Событие повторно обработано'));
      } else {
        message.warning(getErrorText(result, tr('integrationsPage.messages.replayPartial', 'Replay завершился с предупреждением')));
      }
      await Promise.all([loadOmnichannelSummary(), loadOmnichannelDiagnostics(diagnosticsFilters)]);
    } catch (error) {
      message.error(getErrorText(error, tr('integrationsPage.messages.replayError', 'Не удалось выполнить replay события')));
    } finally {
      setOmnichannelReplayId(null);
    }
  };

  const closeOmnichannelEventModal = () =>
    setOmnichannelEventModal({
      open: false,
      loading: false,
      record: null,
      payload: null,
      error: '',
    });

  const handleOpenOmnichannelEvent = async (record) => {
    if (!record?.id) return;
    setOmnichannelEventModal({
      open: true,
      loading: true,
      record,
      payload: null,
      error: '',
    });
    try {
      const payload = await getOmnichannelEventPayload(record.id);
      setOmnichannelEventModal({
        open: true,
        loading: false,
        record,
        payload,
        error: '',
      });
    } catch (error) {
      setOmnichannelEventModal({
        open: true,
        loading: false,
        record,
        payload: null,
        error: getErrorText(error, tr('integrationsPage.messages.payloadError', 'Не удалось загрузить payload события')),
      });
    }
  };

  const loadSMSStatus = async () => {
    setLoading((prev) => ({ ...prev, sms: true }));
    try {
      const [providers, status] = await Promise.all([smsApi.providers(), smsApi.status()]);
      const list = normalizeList(providers);
      const configuredCountFromList = Array.isArray(list)
        ? list.filter((item) => item?.configured === true).length
        : 0;

      const stats = status && typeof status === 'object' ? status : {};
      const configuredCount =
        typeof stats.configured_providers === 'number'
          ? stats.configured_providers
          : configuredCountFromList;
      const successfulSends = Number(stats.total_sent || 0);
      const connected = configuredCount > 0 && successfulSends > 0;
      setStatuses((prev) => ({
        ...prev,
        sms: {
          status: connected ? 'connected' : 'disconnected',
          stats: {
            [tr('integrationsPage.stats.channels', 'Каналов')]: list.length,
            [tr('integrationsPage.stats.configuredChannels', 'Настроенных каналов')]: configuredCount,
            [tr('integrationsPage.stats.successfulSends', 'Успешных отправок')]: successfulSends,
            ...stats,
          },
        },
      }));
    } catch (error) {
      console.error('Error loading SMS status:', error);
      setStatuses((prev) => ({
        ...prev,
        sms: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, sms: false }));
    }
  };

  const loadTelephonyStatus = async () => {
    setLoading((prev) => ({ ...prev, telephony: true }));
    try {
      const [connections, stats] = await Promise.all([getVoIPConnections(), getTelephonyStats()]);
      const list = normalizeList(connections);
      const active = list.find((item) => item.active);

      setStatuses((prev) => ({
        ...prev,
        telephony: {
          status: active ? 'connected' : 'disconnected',
          stats: {
            [tr('integrationsPage.stats.connections', 'Подключений')]: list.length,
            [tr('integrationsPage.stats.activeProvider', 'Активный провайдер')]: active?.provider || '-',
            [tr('integrationsPage.stats.callsToday', 'Звонков сегодня')]: stats?.calls_today || stats?.total || 0,
            [tr('integrationsPage.stats.missed', 'Пропущенных')]: stats?.missed || stats?.missed_calls || 0,
          },
        },
      }));
    } catch (error) {
      console.error('Error loading telephony status:', error);
      setStatuses((prev) => ({
        ...prev,
        telephony: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, telephony: false }));
    }
  };

  const loadFacebookStatus = async () => {
    setLoading((prev) => ({ ...prev, facebook: true }));
    try {
      const response = await getFacebookPages({ page_size: 50 });
      const list = normalizeList(response);
      setFacebookPages(list);

      const stats = {
        [tr('integrationsPage.stats.pages', 'Страниц')]: list.length,
        [tr('integrationsPage.stats.messages', 'Сообщений')]: list.reduce((sum, item) => sum + (item.messages_synced || 0), 0),
        [tr('integrationsPage.stats.followers', 'Подписчиков')]: list.reduce((sum, item) => sum + (item.followers_count || 0), 0),
      };

      setStatuses((prev) => ({
        ...prev,
        facebook: { status: list.length ? 'connected' : 'disconnected', stats },
      }));
    } catch (error) {
      console.error('Error loading Facebook status:', error);
      setFacebookPages([]);
      setStatuses((prev) => ({
        ...prev,
        facebook: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, facebook: false }));
    }
  };

  const loadWhatsAppStatus = async () => {
    setLoading((prev) => ({ ...prev, whatsapp: true }));
    try {
      const response = await getWhatsAppAccounts({ page_size: 50 });
      const list = normalizeList(response);
      setWhatsAppAccounts(list);

      const stats = {
        [tr('integrationsPage.stats.accounts', 'Аккаунтов')]: list.length,
        [tr('integrationsPage.stats.messagesReceived', 'Сообщений получено')]: list.reduce((sum, item) => sum + (item.messages_received || 0), 0),
        [tr('integrationsPage.stats.messagesSent', 'Сообщений отправлено')]: list.reduce((sum, item) => sum + (item.messages_sent || 0), 0),
      };

      setStatuses((prev) => ({
        ...prev,
        whatsapp: { status: list.length ? 'connected' : 'disconnected', stats },
      }));
    } catch (error) {
      console.error('Error loading WhatsApp status:', error);
      setWhatsAppAccounts([]);
      setStatuses((prev) => ({
        ...prev,
        whatsapp: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, whatsapp: false }));
    }
  };

  const loadInstagramStatus = async () => {
    setLoading((prev) => ({ ...prev, instagram: true }));
    try {
      const response = await getInstagramAccounts({ page_size: 50 });
      const list = normalizeList(response);
      setInstagramAccounts(list);

      const stats = {
        [tr('integrationsPage.stats.accounts', 'Аккаунтов')]: list.length,
        [tr('integrationsPage.stats.messages', 'Сообщений')]: list.reduce((sum, item) => sum + (item.messages_synced || 0), 0),
        [tr('integrationsPage.stats.comments', 'Комментариев')]: list.reduce((sum, item) => sum + (item.comments_synced || 0), 0),
        [tr('integrationsPage.stats.followers', 'Подписчиков')]: list.reduce((sum, item) => sum + (item.followers_count || 0), 0),
      };

      setStatuses((prev) => ({
        ...prev,
        instagram: { status: list.length ? 'connected' : 'disconnected', stats },
      }));
    } catch (error) {
      console.error('Error loading Instagram status:', error);
      setInstagramAccounts([]);
      setStatuses((prev) => ({
        ...prev,
        instagram: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, instagram: false }));
    }
  };

  const loadTelegramStatus = async () => {
    setLoading((prev) => ({ ...prev, telegram: true }));
    try {
      const response = await getTelegramBots({ page_size: 50 });
      const list = normalizeList(response);
      setTelegramBots(list);

      const stats = {
        [tr('integrationsPage.stats.bots', 'Ботов')]: list.length,
        [tr('integrationsPage.stats.messagesReceived', 'Сообщений получено')]: list.reduce((sum, item) => sum + (item.messages_received || 0), 0),
        [tr('integrationsPage.stats.messagesSent', 'Сообщений отправлено')]: list.reduce((sum, item) => sum + (item.messages_sent || 0), 0),
        [tr('integrationsPage.stats.activeChats', 'Активных чатов')]: list.reduce((sum, item) => sum + (item.active_chats || 0), 0),
      };

      setStatuses((prev) => ({
        ...prev,
        telegram: { status: list.length ? 'connected' : 'disconnected', stats },
      }));
    } catch (error) {
      console.error('Error loading Telegram status:', error);
      setTelegramBots([]);
      setStatuses((prev) => ({
        ...prev,
        telegram: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, telegram: false }));
    }
  };

  const loadAIStatus = async () => {
    setLoading((prev) => ({ ...prev, ai: true }));
    try {
      const response = await getAIProviders({ page_size: 50 });
      const list = normalizeList(response);
      setAIProviders(list);

      const activeCount = list.filter((item) => item.is_active).length;
      const defaultProvider = list.find((item) => item.is_default);
      const stats = {
        [tr('integrationsPage.stats.providers', 'Провайдеров')]: list.length,
        [tr('integrationsPage.stats.active', 'Активных')]: activeCount,
        [tr('integrationsPage.stats.default', 'По умолчанию')]: defaultProvider?.name || '-',
      };

      setStatuses((prev) => ({
        ...prev,
        ai: { status: list.length ? 'connected' : 'disconnected', stats },
      }));
    } catch (error) {
      console.error('Error loading AI providers:', error);
      setAIProviders([]);
      setStatuses((prev) => ({
        ...prev,
        ai: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, ai: false }));
    }
  };

  const integrationsRestricted = !!(
    licenseRestriction
    && (
      String(licenseRestriction.feature || '').startsWith('integrations.')
      || String(licenseRestriction.feature || '') === 'unknown.feature'
    )
  );
  const integrationsRestrictionMessage =
    licenseRestriction?.message || getFeatureRestrictionReason('integrations.core', t);
  const restrictionShell = {
    border: isDark ? 'rgba(245, 158, 11, 0.38)' : 'rgba(217, 119, 6, 0.28)',
    background: isDark
      ? 'linear-gradient(180deg, rgba(69, 43, 12, 0.96), rgba(33, 22, 8, 0.94))'
      : 'linear-gradient(180deg, rgba(255, 251, 235, 0.98), rgba(255, 247, 214, 0.94))',
    title: isDark ? '#fff7ed' : '#7c2d12',
    text: isDark ? '#fde68a' : '#9a3412',
    meta: isDark ? '#fbbf24' : '#b45309',
    shadow: '0 14px 28px rgba(217, 119, 6, 0.12)',
  };

  const ensureIntegrationsAccess = () => {
    if (!integrationsRestricted) return true;
    message.warning(integrationsRestrictionMessage);
    return false;
  };

  const openModal = (type) => {
    if (!ensureIntegrationsAccess()) return;
    setModalVisible((prev) => ({ ...prev, [type]: true }));
  };
  const closeModal = (type) => setModalVisible((prev) => ({ ...prev, [type]: false }));

  const handleIntegrationSuccess = async (type) => {
    closeModal(type);
    message.success(t('integrationsPage.messages.settingsSaved'));
    if (type === 'sms') await loadSMSStatus();
    if (type === 'telephony') await loadTelephonyStatus();
    if (type === 'whatsapp') await loadWhatsAppStatus();
    if (type === 'facebook') await loadFacebookStatus();
    if (type === 'instagram') await loadInstagramStatus();
    if (type === 'telegram') await loadTelegramStatus();
    if (type === 'ai') await loadAIStatus();
  };

  const openAIModal = (record = null) => {
    if (!ensureIntegrationsAccess()) return;
    if (record) {
      aiForm.setFieldsValue({
        name: record.name,
        provider: record.provider,
        model: record.model || '',
        base_url: record.base_url || '',
        api_key: '',
        is_active: !!record.is_active,
        is_default: !!record.is_default,
        timeout_seconds: record.timeout_seconds || 45,
        temperature: Number(record.temperature ?? 0.2),
        max_tokens: record.max_tokens || 800,
      });
    } else {
      aiForm.setFieldsValue({
        name: '',
        provider: 'openai',
        model: 'gpt-4o-mini',
        base_url: '',
        api_key: '',
        is_active: true,
        is_default: false,
        timeout_seconds: 45,
        temperature: 0.2,
        max_tokens: 800,
      });
    }
    setAIModal({ open: true, record });
  };

  const handleAIProviderChange = (provider) => {
    const currentModel = aiForm.getFieldValue('model');
    const modelsForProvider = AI_PROVIDER_MODELS[provider] || [];
    if (!modelsForProvider.length) return;
    if (!modelsForProvider.includes(currentModel)) {
      aiForm.setFieldsValue({ model: modelsForProvider[0] });
    }
  };

  const closeAIModal = () => {
    setAIModal({ open: false, record: null });
    aiForm.resetFields();
  };

  const handleAISave = async () => {
    try {
      const values = await aiForm.validateFields();
      setAISaving(true);
      const payload = { ...values };

      if (aiModal.record && !payload.api_key) {
        delete payload.api_key;
      }

      if (aiModal.record?.id) {
        await updateAIProvider(aiModal.record.id, payload);
        message.success(tr('integrationsPage.messages.aiProviderUpdated', 'AI провайдер обновлен'));
      } else {
        await createAIProvider(payload);
        message.success(tr('integrationsPage.messages.aiProviderAdded', 'AI провайдер добавлен'));
      }

      closeAIModal();
      loadAIStatus();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorText(error, tr('integrationsPage.messages.aiProviderSaveError', 'Не удалось сохранить AI провайдера')));
    } finally {
      setAISaving(false);
    }
  };

  const handleAITest = async (record) => {
    if (!ensureIntegrationsAccess()) return;
    setAITestingId(record.id);
    try {
      const result = await testAIProviderConnection(record.id);
      message.success(result?.output_text ? tr('integrationsPage.messages.testOkOutput', 'Тест OK: {output}', { output: result.output_text }) : tr('integrationsPage.messages.connectionChecked', 'Подключение проверено'));
      loadAIStatus();
    } catch (error) {
      message.error(getErrorText(error, tr('integrationsPage.messages.aiProviderTestError', 'Не удалось проверить AI провайдера')));
    } finally {
      setAITestingId(null);
    }
  };

  const handleAIDelete = async (record) => {
    if (!ensureIntegrationsAccess()) return;
    try {
      await deleteAIProvider(record.id);
      message.success(tr('integrationsPage.messages.aiProviderDeleted', 'AI провайдер удален'));
      loadAIStatus();
    } catch (error) {
      message.error(getErrorText(error, tr('integrationsPage.messages.aiProviderDeleteError', 'Не удалось удалить AI провайдера')));
    }
  };

  const handleAIMakeDefault = async (record) => {
    if (!ensureIntegrationsAccess()) return;
    if (!record?.id) return;
    setAIDefaultingId(record.id);
    try {
      await updateAIProvider(record.id, { is_default: true, is_active: true });
      message.success(tr('integrationsPage.messages.aiProviderDefaultSet', 'Провайдер "{name}" установлен по умолчанию', { name: record.name }));
      loadAIStatus();
    } catch (error) {
      message.error(getErrorText(error, tr('integrationsPage.messages.aiProviderDefaultSetError', 'Не удалось установить провайдера по умолчанию')));
    } finally {
      setAIDefaultingId(null);
    }
  };

  const handleFacebookTest = async (record) => {
    try {
      await testFacebookPage(record.id);
      message.success(tr('integrationsPage.messages.facebookTestOk', 'Facebook подключение проверено'));
      loadFacebookStatus();
    } catch (error) {
      message.error(tr('integrationsPage.messages.facebookTestError', 'Не удалось проверить Facebook подключение'));
    }
  };

  const handleFacebookDisconnect = async (record) => {
    try {
      await disconnectFacebook(record.id);
      message.success(tr('integrationsPage.messages.facebookDisconnected', 'Facebook страница отключена'));
      loadFacebookStatus();
    } catch (error) {
      message.error(tr('integrationsPage.messages.facebookDisconnectError', 'Не удалось отключить Facebook страницу'));
    }
  };

  const handleInstagramTest = async (record) => {
    try {
      await testInstagramAccount(record.id);
      message.success(tr('integrationsPage.messages.instagramTestOk', 'Instagram подключение проверено'));
      loadInstagramStatus();
    } catch (error) {
      message.error(tr('integrationsPage.messages.instagramTestError', 'Не удалось проверить Instagram подключение'));
    }
  };

  const handleInstagramDisconnect = async (record) => {
    try {
      await disconnectInstagram(record.id);
      message.success(tr('integrationsPage.messages.instagramDisconnected', 'Instagram аккаунт отключен'));
      loadInstagramStatus();
    } catch (error) {
      message.error(tr('integrationsPage.messages.instagramDisconnectError', 'Не удалось отключить Instagram аккаунт'));
    }
  };

  const handleTelegramTest = async (record) => {
    try {
      await testTelegramBot(record.id);
      message.success(tr('integrationsPage.messages.telegramTestOk', 'Telegram подключение проверено'));
      loadTelegramStatus();
    } catch (error) {
      message.error(tr('integrationsPage.messages.telegramTestError', 'Не удалось проверить Telegram подключение'));
    }
  };

  const handleTelegramDisconnect = async (record) => {
    try {
      await disconnectTelegramBot(record.id);
      message.success(tr('integrationsPage.messages.telegramDisconnected', 'Telegram бот отключен'));
      loadTelegramStatus();
    } catch (error) {
      message.error(tr('integrationsPage.messages.telegramDisconnectError', 'Не удалось отключить Telegram бот'));
    }
  };

  const handleWhatsAppTest = async (record) => {
    try {
      await testWhatsAppAccount(record.id);
      message.success(tr('integrationsPage.messages.whatsappTestOk', 'WhatsApp подключение проверено'));
      loadWhatsAppStatus();
    } catch (error) {
      message.error(getErrorText(error, tr('integrationsPage.messages.whatsappTestError', 'Не удалось проверить WhatsApp подключение')));
    }
  };

  const handleWhatsAppDisconnect = async (record) => {
    try {
      await disconnectWhatsAppAccount(record.id);
      message.success(tr('integrationsPage.messages.whatsappDisconnected', 'WhatsApp аккаунт отключен'));
      loadWhatsAppStatus();
    } catch (error) {
      message.error(getErrorText(error, tr('integrationsPage.messages.whatsappDisconnectError', 'Не удалось отключить WhatsApp аккаунт')));
    }
  };

  const openIntegrationEditModal = (type, record) => {
    if (!ensureIntegrationsAccess()) return;
    if (!record?.id) return;
    const valuesByType = {
      whatsapp: {
        business_name: record.business_name || '',
        phone_number: record.phone_number || '',
        webhook_url: record.webhook_url || '',
        is_active: !!record.is_active,
        auto_sync_messages: !!record.auto_sync_messages,
        auto_create_leads: !!record.auto_create_leads,
      },
      facebook: {
        page_name: record.page_name || '',
        webhook_url: record.webhook_url || '',
        is_active: !!record.is_active,
        auto_sync_messages: !!record.auto_sync_messages,
        auto_sync_comments: !!record.auto_sync_comments,
        auto_sync_posts: !!record.auto_sync_posts,
      },
      instagram: {
        username: record.username || '',
        webhook_url: record.webhook_url || '',
        is_active: !!record.is_active,
        auto_sync_messages: !!record.auto_sync_messages,
        auto_sync_comments: !!record.auto_sync_comments,
      },
      telegram: {
        webhook_url: record.webhook_url || getDefaultTelegramWebhookUrl(),
        welcome_message: record.welcome_message || '',
        allowed_chat_ids_text: stringifyMultiline(record.allowed_chat_ids),
        is_active: !!record.is_active,
        auto_reply: !!record.auto_reply,
        use_webhook: record.use_webhook !== false,
      },
    };
    integrationEditForm.setFieldsValue(valuesByType[type] || {});
    setIntegrationEditModal({ open: true, type, record });
  };

  const closeIntegrationEditModal = () => {
    setIntegrationEditModal({ open: false, type: null, record: null });
    integrationEditForm.resetFields();
  };

  const handleIntegrationEditSave = async () => {
    const { type, record } = integrationEditModal;
    if (!type || !record?.id) return;
    try {
      const values = await integrationEditForm.validateFields();
      setIntegrationEditSaving(true);

      if (type === 'whatsapp') {
        await updateWhatsAppAccount(record.id, {
          business_name: values.business_name,
          phone_number: values.phone_number,
          webhook_url: values.webhook_url || '',
          is_active: !!values.is_active,
          auto_sync_messages: !!values.auto_sync_messages,
          auto_create_leads: !!values.auto_create_leads,
        });
        await loadWhatsAppStatus();
      }

      if (type === 'facebook') {
        await updateFacebookPage(record.id, {
          page_name: values.page_name,
          webhook_url: values.webhook_url || '',
          is_active: !!values.is_active,
          auto_sync_messages: !!values.auto_sync_messages,
          auto_sync_comments: !!values.auto_sync_comments,
          auto_sync_posts: !!values.auto_sync_posts,
        });
        await loadFacebookStatus();
      }

      if (type === 'instagram') {
        await updateInstagramAccount(record.id, {
          username: values.username,
          webhook_url: values.webhook_url || '',
          is_active: !!values.is_active,
          auto_sync_messages: !!values.auto_sync_messages,
          auto_sync_comments: !!values.auto_sync_comments,
        });
        await loadInstagramStatus();
      }

      if (type === 'telegram') {
        await updateTelegramBot(record.id, {
          webhook_url: values.webhook_url || '',
          welcome_message: values.welcome_message || '',
          allowed_chat_ids: parseMultiline(values.allowed_chat_ids_text),
          is_active: !!values.is_active,
          auto_reply: !!values.auto_reply,
          use_webhook: !!values.use_webhook,
        });
        await loadTelegramStatus();
      }

      message.success(tr('integrationsPage.messages.settingsSaved', 'Настройки сохранены'));
      closeIntegrationEditModal();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorText(error, tr('integrationsPage.messages.saveError', 'Не удалось сохранить настройки')));
    } finally {
      setIntegrationEditSaving(false);
    }
  };

  const openWebhookModal = (bot) => {
    webhookForm.setFieldsValue({ webhook_url: bot?.webhook_url || getDefaultTelegramWebhookUrl() });
    setWebhookModal({ open: true, bot });
  };

  const closeWebhookModal = () => {
    setWebhookModal({ open: false, bot: null });
    webhookForm.resetFields();
  };

  const handleWebhookSave = async () => {
    try {
      const values = await webhookForm.validateFields();
      if (!webhookModal.bot?.id) {
        message.error(tr('integrationsPage.messages.botNotDetected', 'Не удалось определить бота'));
        return;
      }
      setWebhookSaving(true);
      await setTelegramWebhook(webhookModal.bot.id, values);
      message.success(tr('integrationsPage.messages.webhookUpdated', 'Webhook обновлен'));
      closeWebhookModal();
      loadTelegramStatus();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorText(error, tr('integrationsPage.messages.webhookUpdateError', 'Не удалось обновить webhook')));
    } finally {
      setWebhookSaving(false);
    }
  };

  const copyUrlToClipboard = async (value) => {
    const text = (value || '').trim();
    if (!text) {
      message.warning(tr('integrationsPage.messages.urlEmpty', 'URL пустой'));
      return false;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      message.success(tr('integrationsPage.messages.urlCopied', 'URL скопирован'));
      return true;
    } catch (error) {
      message.error(tr('integrationsPage.messages.urlCopyError', 'Не удалось скопировать URL'));
      return false;
    }
  };

  const copyTextToClipboard = async (value, successMessage, errorMessage) => {
    const text = String(value || '').trim();
    if (!text) {
      message.warning(tr('integrationsPage.messages.copyEmpty', 'Нет данных для копирования'));
      return false;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      message.success(successMessage || tr('integrationsPage.messages.copyOk', 'Скопировано в буфер обмена'));
      return true;
    } catch (error) {
      message.error(errorMessage || tr('integrationsPage.messages.copyError', 'Не удалось скопировать данные'));
      return false;
    }
  };

  const handleCopyWebhookUrl = async () => {
    const value = webhookForm.getFieldValue('webhook_url');
    await copyUrlToClipboard(value);
  };

  const handleCopyAiBaseUrl = async () => {
    const value = aiForm.getFieldValue('base_url');
    await copyUrlToClipboard(value);
  };

  const diagnosticsSummary = omnichannelDiagnostics.summary || {};
  const diagnosticsMergedRows = Array.from(
    new Map(
      [
        ...(Array.isArray(omnichannelDiagnostics.recent_failures) ? omnichannelDiagnostics.recent_failures : []),
        ...(Array.isArray(omnichannelDiagnostics.replay_candidates) ? omnichannelDiagnostics.replay_candidates : []),
        ...(Array.isArray(omnichannelDiagnostics.recent_archived) ? omnichannelDiagnostics.recent_archived : []),
      ].map((record) => [String(record?.id || `${record?.external_id || ''}:${record?.message_id || ''}`), record])
    ).values()
  );
  const diagnosticsRows = Array.isArray(omnichannelDiagnostics.filtered_events)
    ? omnichannelDiagnostics.filtered_events
    : diagnosticsMergedRows;
  const diagnosticsChannelValues = new Set(
    diagnosticsMergedRows
      .map((record) => String(record?.channel_type || '').trim().toLowerCase())
      .filter(Boolean)
  );
  if (diagnosticsFilters.channel && diagnosticsFilters.channel !== 'all') {
    diagnosticsChannelValues.add(diagnosticsFilters.channel);
  }
  const diagnosticsChannelOptions = [
    { value: 'all', label: tr('integrationsPage.filters.allChannels', 'Все каналы') },
    ...Array.from(diagnosticsChannelValues).map((value) => ({ value, label: value })),
  ];
  const diagnosticsAlertType =
    diagnosticsSummary.transport_health === 'degraded' ||
    Number(diagnosticsSummary.failed_events || 0) > 0
      ? 'error'
      : diagnosticsSummary.business_health === 'degraded' ||
          Number(diagnosticsSummary.breached_sla || 0) > 0 ||
          Number(diagnosticsSummary.replayable_events || 0) > 0
        ? 'warning'
        : 'success';
  const diagnosticsHighlights = [
    {
      key: 'queue',
      label: tr('integrationsPage.diagnostics.queue', 'В очереди'),
      value: omnichannelSummary.queue || 0,
      tone: 'info',
    },
    {
      key: 'breached',
      label: tr('integrationsPage.diagnostics.breached', 'SLA breach'),
      value: diagnosticsSummary.breached_sla || 0,
      tone: Number(diagnosticsSummary.breached_sla || 0) > 0 ? 'danger' : 'default',
    },
    {
      key: 'failed',
      label: tr('integrationsPage.diagnostics.failed', 'Ошибок'),
      value: diagnosticsSummary.failed_events || 0,
      tone: Number(diagnosticsSummary.failed_events || 0) > 0 ? 'danger' : 'default',
    },
    {
      key: 'replayable',
      label: tr('integrationsPage.diagnostics.replayable', 'Replay-ready'),
      value: diagnosticsSummary.replayable_events || 0,
      tone: Number(diagnosticsSummary.replayable_events || 0) > 0 ? 'warning' : 'default',
    },
  ];
  const diagnosticsToneStyles = {
    info: {
      border: isDark ? 'rgba(96, 165, 250, 0.34)' : 'rgba(59, 130, 246, 0.18)',
      background: isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(239, 246, 255, 0.92)',
      value: isDark ? '#dbeafe' : '#1d4ed8',
      label: isDark ? '#93c5fd' : '#2563eb',
    },
    warning: {
      border: isDark ? 'rgba(251, 191, 36, 0.34)' : 'rgba(245, 158, 11, 0.2)',
      background: isDark ? 'rgba(69, 39, 10, 0.9)' : 'rgba(255, 247, 237, 0.96)',
      value: isDark ? '#fde68a' : '#b45309',
      label: isDark ? '#fbbf24' : '#c2410c',
    },
    danger: {
      border: isDark ? 'rgba(248, 113, 113, 0.34)' : 'rgba(239, 68, 68, 0.2)',
      background: isDark ? 'rgba(69, 10, 10, 0.88)' : 'rgba(254, 242, 242, 0.96)',
      value: isDark ? '#fecaca' : '#b91c1c',
      label: isDark ? '#fca5a5' : '#dc2626',
    },
    default: {
      border: isDark ? 'rgba(148, 163, 184, 0.24)' : token.colorBorderSecondary,
      background: isDark ? 'rgba(15, 23, 42, 0.82)' : token.colorBgContainer,
      value: isDark ? '#e2e8f0' : token.colorText,
      label: token.colorTextSecondary,
    },
  };

  return (
    <div style={{ padding: embedded ? 0 : 24 }}>
      <Card
        style={{
          borderRadius: token.borderRadiusLG,
          border: embedded ? 'none' : `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgElevated,
          boxShadow: embedded ? 'none' : token.boxShadowTertiary,
        }}
        title={embedded ? null : (
          <Space>
            <ApiOutlined />
            <span>{t('integrationsPage.title')}</span>
          </Space>
        )}
        extra={embedded ? null : (
          <Button icon={<ReloadOutlined />} onClick={loadAllStatuses} disabled={integrationsRestricted}>
            {t('integrationsPage.actions.refreshAll')}
          </Button>
        )}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            type="info"
            showIcon
            message={tr('integrationsPage.messages.omnichannelSummary', 'Omnichannel: всего {count}, в очереди {queue}, в работе {active}, закрыто {resolved}', omnichannelSummary)}
          />
          <Card
            size="small"
            title={tr('integrationsPage.cards.omnichannelDiagnostics.title', 'Meta and Inbox Diagnostics')}
            extra={(
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadOmnichannelDiagnostics(diagnosticsFilters)}
                loading={omnichannelDiagnosticsLoading}
                disabled={integrationsRestricted}
              >
                {tr('integrationsPage.actions.refreshDiagnostics', 'Обновить диагностику')}
              </Button>
            )}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                type={diagnosticsAlertType}
                showIcon
                message={tr(
                  'integrationsPage.diagnostics.overview',
                  'Transport {transport}, business {business}, queue {queue}, breached SLA {breached}',
                  {
                    transport: diagnosticsSummary.transport_health || 'unknown',
                    business: diagnosticsSummary.business_health || 'unknown',
                    queue: omnichannelSummary.queue || 0,
                    breached: diagnosticsSummary.breached_sla || 0,
                  }
                )}
                description={tr(
                  'integrationsPage.diagnostics.overviewDescription',
                  'Карточки ниже помогают быстро увидеть, где нужен manual replay, разбор SLA или восстановление канала.'
                )}
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                }}
              >
                {diagnosticsHighlights.map((item) => {
                  const tone = diagnosticsToneStyles[item.tone] || diagnosticsToneStyles.default;
                  return (
                    <div
                      key={item.key}
                      style={{
                        borderRadius: token.borderRadiusLG,
                        border: `1px solid ${tone.border}`,
                        background: tone.background,
                        padding: 14,
                        minHeight: 92,
                        boxShadow: isDark ? '0 8px 20px rgba(2, 6, 23, 0.18)' : '0 8px 18px rgba(15, 23, 42, 0.06)',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: tone.label, marginBottom: 8 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 28, lineHeight: 1, fontWeight: 800, color: tone.value }}>
                        {item.value}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Space wrap size={[8, 8]}>
                <Tag color={diagnosticsSummary.transport_health === 'degraded' ? 'error' : 'success'}>
                  {tr('integrationsPage.diagnostics.transport', 'Transport')}: {diagnosticsSummary.transport_health || 'unknown'}
                </Tag>
                <Tag color={diagnosticsSummary.business_health === 'degraded' ? 'warning' : 'success'}>
                  {tr('integrationsPage.diagnostics.business', 'Business')}: {diagnosticsSummary.business_health || 'unknown'}
                </Tag>
                <Tag>{tr('integrationsPage.diagnostics.failed', 'Ошибок')}: {diagnosticsSummary.failed_events || 0}</Tag>
                <Tag>{tr('integrationsPage.diagnostics.replayable', 'Replay-ready')}: {diagnosticsSummary.replayable_events || 0}</Tag>
                <Tag>{tr('integrationsPage.diagnostics.archived', 'Archived')}: {diagnosticsSummary.archived_events || 0}</Tag>
                <Tag>{tr('integrationsPage.diagnostics.signatureRejected', 'Signature rejected')}: {diagnosticsSummary.signature_rejected_events || 0}</Tag>
                <Tag>{tr('integrationsPage.diagnostics.unassigned', 'Без привязки')}: {diagnosticsSummary.unassigned_events || 0}</Tag>
                <Tag>{tr('integrationsPage.diagnostics.breached', 'SLA breach')}: {diagnosticsSummary.breached_sla || 0}</Tag>
              </Space>
              <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space wrap size={[8, 8]}>
                  <Input.Search
                    allowClear
                    size="small"
                    placeholder={tr('integrationsPage.filters.searchDiagnostics', 'Поиск по external ID, message ID или тексту')}
                    value={diagnosticsFilters.query}
                    onChange={(event) => setDiagnosticsFilters((prev) => ({ ...prev, query: event.target.value }))}
                    style={{ width: 280, maxWidth: '100%' }}
                  />
                  <Select
                    size="small"
                    value={diagnosticsFilters.scope}
                    style={{ width: 190 }}
                    onChange={(value) => setDiagnosticsFilters((prev) => ({ ...prev, scope: value }))}
                    options={[
                      { value: 'all', label: tr('integrationsPage.filters.scopeAll', 'Все события') },
                      { value: 'failures', label: tr('integrationsPage.filters.scopeFailures', 'Только ошибки') },
                      { value: 'replayable', label: tr('integrationsPage.filters.scopeReplayable', 'Replay-ready') },
                      { value: 'archived', label: tr('integrationsPage.filters.scopeArchived', 'Archived sample') },
                    ]}
                  />
                  <Select
                    size="small"
                    value={diagnosticsFilters.channel}
                    style={{ width: 170 }}
                    onChange={(value) => setDiagnosticsFilters((prev) => ({ ...prev, channel: value }))}
                    options={diagnosticsChannelOptions}
                  />
                  <Switch
                    size="small"
                    checked={diagnosticsFilters.onlyNeedsAction}
                    onChange={(checked) => setDiagnosticsFilters((prev) => ({ ...prev, onlyNeedsAction: checked }))}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {tr('integrationsPage.filters.onlyNeedsAction', 'Только требует действия')}
                  </Text>
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {tr('integrationsPage.diagnostics.filteredCount', 'Показано {count} событий', { count: omnichannelDiagnostics.filtered_count || diagnosticsRows.length })}
                </Text>
              </Space>
              {omnichannelDiagnostics.channels?.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                  }}
                >
                  {omnichannelDiagnostics.channels.map((channel) => (
                    <div
                      key={channel.channel}
                      style={{
                        borderRadius: token.borderRadiusLG,
                        border: `1px solid ${
                          channel.health === 'degraded'
                            ? isDark
                              ? 'rgba(248, 113, 113, 0.32)'
                              : 'rgba(239, 68, 68, 0.2)'
                            : isDark
                              ? 'rgba(74, 222, 128, 0.24)'
                              : 'rgba(34, 197, 94, 0.18)'
                        }`,
                        background: isDark ? 'rgba(15, 23, 42, 0.74)' : token.colorBgContainer,
                        padding: 14,
                      }}
                    >
                      <Space direction="vertical" size={10} style={{ width: '100%' }}>
                        <Space align="center" wrap>
                          <Text strong>{channel.channel}</Text>
                          <Tag color={channel.health === 'degraded' ? 'error' : 'success'} style={{ marginInlineEnd: 0 }}>
                            {channel.health === 'degraded'
                              ? tr('integrationsPage.diagnostics.degraded', 'Degraded')
                              : tr('integrationsPage.diagnostics.healthy', 'Healthy')}
                          </Tag>
                        </Space>
                        <Space wrap size={[6, 6]}>
                          <Tag style={{ marginInlineEnd: 0 }}>{tr('integrationsPage.diagnostics.total', 'Всего')}: {channel.total || 0}</Tag>
                          <Tag style={{ marginInlineEnd: 0 }}>{tr('integrationsPage.diagnostics.archived', 'Archived')}: {channel.archived_events || 0}</Tag>
                          <Tag color={(channel.failed || 0) > 0 ? 'error' : 'default'} style={{ marginInlineEnd: 0 }}>
                            {tr('integrationsPage.diagnostics.failed', 'Ошибок')}: {channel.failed || 0}
                          </Tag>
                          <Tag color={(channel.replayable || 0) > 0 ? 'processing' : 'default'} style={{ marginInlineEnd: 0 }}>
                            {tr('integrationsPage.diagnostics.replayable', 'Replay-ready')}: {channel.replayable || 0}
                          </Tag>
                        </Space>
                      </Space>
                    </div>
                  ))}
                </div>
              )}
              <Table
                size="small"
                pagination={false}
                rowKey={(record) => record.id}
                dataSource={diagnosticsRows}
                locale={{
                  emptyText: tr('integrationsPage.diagnostics.empty', 'Ошибок и replay-ready событий пока нет'),
                }}
                columns={[
                  {
                    title: tr('integrationsPage.table.channel', 'Канал'),
                    dataIndex: 'channel_type',
                    key: 'channel_type',
                    render: (value) => <Tag>{value || '-'}</Tag>,
                  },
                  {
                    title: tr('integrationsPage.table.status', 'Статус'),
                    key: 'status',
                    render: (_, record) => (
                      <Space size={4} wrap>
                        <Tag color={['failed', 'error', 'dead_letter'].includes(String(record.queue_state || '').toLowerCase()) ? 'error' : 'default'}>
                          {record.queue_state || record.status || '-'}
                        </Tag>
                        {record.sla_status === 'breached' && <Tag color="warning">SLA risk</Tag>}
                        {record.signature_valid === false && <Tag color="volcano">Signature</Tag>}
                        {record.replayable && <Tag color="processing">Replay</Tag>}
                      </Space>
                    ),
                  },
                  {
                    title: tr('integrationsPage.table.message', 'Сообщение'),
                    key: 'text',
                    render: (_, record) => {
                      const explanationLines = buildDiagnosticsExplanation(record, tr);
                      const rawPreviewEntries = getRawPreviewEntries(record.raw_preview);
                      return (
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Text strong style={{ color: token.colorText }}>
                            {record.text || record.external_id || '-'}
                          </Text>
                          {explanationLines.map((line, index) => (
                            <Text
                              key={`${record.id}-exp-${index}`}
                              type="secondary"
                              style={{ fontSize: 12, lineHeight: 1.45 }}
                            >
                              {line}
                            </Text>
                          ))}
                          {rawPreviewEntries.length > 0 && (
                            <Space size={[4, 4]} wrap>
                              {rawPreviewEntries.map(([key, value]) => (
                                <Tag key={`${record.id}-${key}`} style={{ marginInlineEnd: 0 }}>
                                  {key}: {String(value)}
                                </Tag>
                              ))}
                            </Space>
                          )}
                        </Space>
                      );
                    },
                  },
                  {
                    title: tr('integrationsPage.table.created', 'Создано'),
                    dataIndex: 'created_at',
                    key: 'created_at',
                    render: formatDateTime,
                  },
                  {
                    title: tr('integrationsPage.table.actions', 'Действия'),
                    key: 'actions',
                    render: (_, record) => (
                      <Space size={8} wrap>
                        <Button
                          size="small"
                          onClick={() => handleOpenOmnichannelEvent(record)}
                        >
                          {tr('integrationsPage.actions.details', 'Детали')}
                        </Button>
                        <Button
                          size="small"
                          icon={<CopyOutlined />}
                          title={tr('integrationsPage.actions.copyEventId', 'Скопировать ID')}
                          onClick={() => copyTextToClipboard(
                            record.external_id || record.message_id || record.text,
                            tr('integrationsPage.messages.eventIdCopied', 'Идентификатор события скопирован'),
                            tr('integrationsPage.messages.eventIdCopyError', 'Не удалось скопировать идентификатор события')
                          )}
                        />
                        <LicenseRestrictedAction
                          restricted={integrationsRestricted}
                          reason={integrationsRestrictionMessage}
                          feature="integrations.core"
                        >
                          <Button
                            size="small"
                            onClick={() => handleOmnichannelReplay(record)}
                            loading={omnichannelReplayId === record.id}
                            disabled={!record.replayable || integrationsRestricted}
                          >
                            {tr('integrationsPage.actions.replay', 'Replay')}
                          </Button>
                        </LicenseRestrictedAction>
                      </Space>
                    ),
                  },
                ]}
              />
            </Space>
          </Card>
          {integrationsRestricted && (
            <div
              style={{
                padding: 1,
                borderRadius: 16,
                border: `1px solid ${restrictionShell.border}`,
                background: restrictionShell.background,
                boxShadow: restrictionShell.shadow,
              }}
            >
              <Alert
                type="warning"
                showIcon
                message={(
                  <span style={{ color: restrictionShell.title, fontWeight: 700 }}>
                    {tr('integrationsPage.messages.restricted', 'Лицензия ограничивает доступ к интеграциям')}
                  </span>
                )}
                description={(
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <span style={{ color: restrictionShell.text, lineHeight: 1.55 }}>
                      {integrationsRestrictionMessage}
                    </span>
                    <span style={{ color: restrictionShell.meta, fontSize: 12, lineHeight: 1.45 }}>
                      {tr(
                        'integrationsPage.messages.restrictedHint',
                        'Connect, test, and edit controls stay disabled until the license is refreshed.',
                      )}
                    </span>
                  </Space>
                )}
                style={{ background: 'transparent', border: 'none' }}
              />
            </div>
          )}
          <IntegrationCard
            title="SMS"
            description={tr('integrationsPage.cards.sms.description', 'Провайдеры и статус отправки SMS')}
            icon={<MessageOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
            type="sms"
            status={statuses.sms.status}
            stats={statuses.sms.stats}
            error={statuses.sms.error}
            loading={loading.sms}
            onConnect={() => openModal('sms')}
            onSettings={() => openModal('sms')}
            onRefresh={loadSMSStatus}
            disabled={integrationsRestricted}
            disabledReason={integrationsRestrictionMessage}
          />

          <IntegrationCard
            title={tr('integrationsPage.cards.telephony.title', 'Телефония')}
            description={tr('integrationsPage.cards.telephony.description', 'Подключения VoIP/SIP для звонков из CRM')}
            icon={<PhoneOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
            type="telephony"
            status={statuses.telephony.status}
            stats={statuses.telephony.stats}
            error={statuses.telephony.error}
            loading={loading.telephony}
            onConnect={() => openModal('telephony')}
            onSettings={() => openModal('telephony')}
            onRefresh={loadTelephonyStatus}
            disabled={integrationsRestricted}
            disabledReason={integrationsRestrictionMessage}
          />

          <IntegrationCard
            title="WhatsApp Business"
            description={tr('integrationsPage.cards.whatsapp.description', 'Cloud API аккаунты для омниканала поддержки и продаж')}
            icon={<WhatsAppOutlined style={{ fontSize: 24, color: '#25D366' }} />}
            type="whatsapp"
            status={statuses.whatsapp.status}
            stats={statuses.whatsapp.stats}
            error={statuses.whatsapp.error}
            loading={loading.whatsapp}
            onConnect={() => openModal('whatsapp')}
            onSettings={() => openModal('whatsapp')}
            onRefresh={loadWhatsAppStatus}
            disabled={integrationsRestricted}
            disabledReason={integrationsRestrictionMessage}
          >
            {whatsAppAccounts.length > 0 && (
              <Table
                size="small"
                rowKey={(record) => record.id || record.phone_number_id}
                columns={[
                  { title: tr('integrationsPage.table.account', 'Аккаунт'), dataIndex: 'business_name', key: 'business_name' },
                  { title: tr('integrationsPage.table.number', 'Номер'), dataIndex: 'phone_number', key: 'phone_number' },
                  { title: tr('integrationsPage.table.phoneId', 'Phone ID'), dataIndex: 'phone_number_id', key: 'phone_number_id' },
                  {
                    title: tr('integrationsPage.table.status', 'Статус'),
                    dataIndex: 'is_active',
                    key: 'is_active',
                    render: (value) => (
                      <Tag
                        color={value ? 'success' : 'default'}
                        bordered={false}
                        style={{
                          fontWeight: 600,
                          borderRadius: 999,
                          paddingInline: 10,
                          border: `1px solid ${value ? 'rgba(82, 196, 26, 0.32)' : 'rgba(148, 163, 184, 0.24)'}`,
                        }}
                      >
                        {value ? tr('integrationsPage.status.active', 'Активен') : tr('integrationsPage.status.paused', 'Пауза')}
                      </Tag>
                    ),
                  },
                  {
                    title: tr('integrationsPage.table.lastActivity', 'Последняя активность'),
                    dataIndex: 'last_activity_at',
                    key: 'last_activity_at',
                    render: formatDateTime,
                  },
                  {
                    title: tr('integrationsPage.table.actions', 'Действия'),
                    key: 'actions',
                    render: (_, record) => (
                      <Space>
                        <LicenseRestrictedAction restricted={integrationsRestricted} reason={integrationsRestrictionMessage} feature="integrations.core">
                          <Button type="link" disabled={integrationsRestricted} onClick={() => openIntegrationEditModal('whatsapp', record)}>
                            {tr('integrationsPage.actions.edit', 'Редактировать')}
                          </Button>
                        </LicenseRestrictedAction>
                        <LicenseRestrictedAction restricted={integrationsRestricted} reason={integrationsRestrictionMessage} feature="integrations.core">
                          <Button type="link" disabled={integrationsRestricted} onClick={() => handleWhatsAppTest(record)}>
                            {tr('integrationsPage.actions.test', 'Тест')}
                          </Button>
                        </LicenseRestrictedAction>
                        <LicenseRestrictedAction restricted={integrationsRestricted} reason={integrationsRestrictionMessage} feature="integrations.core">
                          <Button type="link" danger disabled={integrationsRestricted} onClick={() => handleWhatsAppDisconnect(record)}>
                            {tr('integrationsPage.actions.disconnect', 'Отключить')}
                          </Button>
                        </LicenseRestrictedAction>
                      </Space>
                    ),
                  },
                ]}
                dataSource={whatsAppAccounts}
                pagination={false}
              />
            )}
          </IntegrationCard>

          <IntegrationCard
            title="Facebook Messenger"
            description={tr('integrationsPage.cards.facebook.description', 'Подключенные страницы для обработки сообщений')}
            icon={<FacebookOutlined style={{ fontSize: 24, color: '#1877F2' }} />}
            type="facebook"
            status={statuses.facebook.status}
            stats={statuses.facebook.stats}
            error={statuses.facebook.error}
            loading={loading.facebook}
            onConnect={() => openModal('facebook')}
            onSettings={() => openModal('facebook')}
            onRefresh={loadFacebookStatus}
            disabled={integrationsRestricted}
            disabledReason={integrationsRestrictionMessage}
          >
            {facebookPages.length > 0 && (
              <Table
                size="small"
                rowKey={(record) => record.id || record.facebook_page_id}
                columns={[
                  { title: tr('integrationsPage.table.page', 'Страница'), dataIndex: 'page_name', key: 'page_name' },
                  {
                    title: tr('integrationsPage.table.status', 'Статус'),
                    dataIndex: 'is_active',
                    key: 'is_active',
                    render: (value) => (
                      <Tag
                        color={value ? 'success' : 'default'}
                        bordered={false}
                        style={{
                          fontWeight: 600,
                          borderRadius: 999,
                          paddingInline: 10,
                          border: `1px solid ${value ? 'rgba(82, 196, 26, 0.32)' : 'rgba(148, 163, 184, 0.24)'}`,
                        }}
                      >
                        {value ? tr('integrationsPage.status.activeFeminine', 'Активна') : tr('integrationsPage.status.paused', 'Пауза')}
                      </Tag>
                    ),
                  },
                  {
                    title: tr('integrationsPage.table.sync', 'Синхронизация'),
                    dataIndex: 'last_sync_at',
                    key: 'last_sync_at',
                    render: formatDateTime,
                  },
                  {
                    title: tr('integrationsPage.table.actions', 'Действия'),
                    key: 'actions',
                    render: (_, record) => (
                      <Space>
                        <LicenseRestrictedAction restricted={integrationsRestricted} reason={integrationsRestrictionMessage} feature="integrations.core">
                          <Button type="link" disabled={integrationsRestricted} onClick={() => openIntegrationEditModal('facebook', record)}>
                            {tr('integrationsPage.actions.edit', 'Редактировать')}
                          </Button>
                        </LicenseRestrictedAction>
                        <LicenseRestrictedAction restricted={integrationsRestricted} reason={integrationsRestrictionMessage} feature="integrations.core">
                          <Button type="link" disabled={integrationsRestricted} onClick={() => handleFacebookTest(record)}>
                            {tr('integrationsPage.actions.test', 'Тест')}
                          </Button>
                        </LicenseRestrictedAction>
                        <LicenseRestrictedAction restricted={integrationsRestricted} reason={integrationsRestrictionMessage} feature="integrations.core">
                          <Button type="link" danger disabled={integrationsRestricted} onClick={() => handleFacebookDisconnect(record)}>
                            {tr('integrationsPage.actions.disconnect', 'Отключить')}
                          </Button>
                        </LicenseRestrictedAction>
                      </Space>
                    ),
                  },
                ]}
                dataSource={facebookPages}
                pagination={false}
              />
            )}
          </IntegrationCard>

          <IntegrationCard
            title={t('integrationsPage.cards.instagram.title')}
            description={t('integrationsPage.cards.instagram.description')}
            icon={<InstagramOutlined style={{ fontSize: 24, color: '#E1306C' }} />}
            type="instagram"
            status={statuses.instagram.status}
            stats={statuses.instagram.stats}
            error={statuses.instagram.error}
            loading={loading.instagram}
            onConnect={() => openModal('instagram')}
            onSettings={() => openModal('instagram')}
            onRefresh={loadInstagramStatus}
            disabled={integrationsRestricted}
            disabledReason={integrationsRestrictionMessage}
          >
            {instagramAccounts.length > 0 && (
              <Table
                size="small"
                rowKey={(record) => record.id || record.instagram_user_id}
                columns={[
                  { title: 'Username', dataIndex: 'username', key: 'username' },
                  {
                    title: tr('integrationsPage.table.status', 'Статус'),
                    dataIndex: 'is_active',
                    key: 'is_active',
                    render: (value) => (
                      <Tag
                        color={value ? 'success' : 'default'}
                        bordered={false}
                        style={{
                          fontWeight: 600,
                          borderRadius: 999,
                          paddingInline: 10,
                          border: `1px solid ${value ? 'rgba(82, 196, 26, 0.32)' : 'rgba(148, 163, 184, 0.24)'}`,
                        }}
                      >
                        {value ? tr('integrationsPage.status.active', 'Активен') : tr('integrationsPage.status.paused', 'Пауза')}
                      </Tag>
                    ),
                  },
                  {
                    title: tr('integrationsPage.table.sync', 'Синхронизация'),
                    dataIndex: 'last_sync_at',
                    key: 'last_sync_at',
                    render: formatDateTime,
                  },
                  {
                    title: tr('integrationsPage.table.actions', 'Действия'),
                    key: 'actions',
                    render: (_, record) => (
                      <Space>
                        <LicenseRestrictedAction restricted={integrationsRestricted} reason={integrationsRestrictionMessage} feature="integrations.core">
                          <Button type="link" disabled={integrationsRestricted} onClick={() => openIntegrationEditModal('instagram', record)}>
                            {tr('integrationsPage.actions.edit', 'Редактировать')}
                          </Button>
                        </LicenseRestrictedAction>
                        <LicenseRestrictedAction restricted={integrationsRestricted} reason={integrationsRestrictionMessage} feature="integrations.core">
                          <Button type="link" disabled={integrationsRestricted} onClick={() => handleInstagramTest(record)}>
                            {tr('integrationsPage.actions.test', 'Тест')}
                          </Button>
                        </LicenseRestrictedAction>
                        <LicenseRestrictedAction restricted={integrationsRestricted} reason={integrationsRestrictionMessage} feature="integrations.core">
                          <Button type="link" danger disabled={integrationsRestricted} onClick={() => handleInstagramDisconnect(record)}>
                            {tr('integrationsPage.actions.disconnect', 'Отключить')}
                          </Button>
                        </LicenseRestrictedAction>
                      </Space>
                    ),
                  },
                ]}
                dataSource={instagramAccounts}
                pagination={false}
              />
            )}
          </IntegrationCard>

          <IntegrationCard
            title={t('integrationsPage.cards.telegram.title')}
            description={t('integrationsPage.cards.telegram.description')}
            icon={<SendOutlined style={{ fontSize: 24, color: '#2AABEE' }} />}
            type="telegram"
            status={statuses.telegram.status}
            stats={statuses.telegram.stats}
            error={statuses.telegram.error}
            loading={loading.telegram}
            onConnect={() => openModal('telegram')}
            onSettings={() => openModal('telegram')}
            onRefresh={loadTelegramStatus}
            disabled={integrationsRestricted}
            disabledReason={integrationsRestrictionMessage}
          >
            {telegramBots.length > 0 && (
              <Table
                size="small"
                rowKey={(record) => record.id || record.bot_username}
                columns={[
                  { title: tr('integrationsPage.table.bot', 'Бот'), dataIndex: 'bot_name', key: 'bot_name' },
                  { title: tr('integrationsPage.table.username', 'Username'), dataIndex: 'bot_username', key: 'bot_username' },
                  {
                    title: tr('integrationsPage.table.status', 'Статус'),
                    dataIndex: 'is_active',
                    key: 'is_active',
                    render: (value) => (
                      <Tag
                        color={value ? 'success' : 'default'}
                        bordered={false}
                        style={{
                          fontWeight: 600,
                          borderRadius: 999,
                          paddingInline: 10,
                          border: `1px solid ${value ? 'rgba(82, 196, 26, 0.32)' : 'rgba(148, 163, 184, 0.24)'}`,
                        }}
                      >
                        {value ? tr('integrationsPage.status.active', 'Активен') : tr('integrationsPage.status.paused', 'Пауза')}
                      </Tag>
                    ),
                  },
                  {
                    title: tr('integrationsPage.table.lastActivity', 'Последняя активность'),
                    dataIndex: 'last_activity_at',
                    key: 'last_activity_at',
                    render: formatDateTime,
                  },
                  {
                    title: tr('integrationsPage.table.actions', 'Действия'),
                    key: 'actions',
                    render: (_, record) => (
                      <Space>
                        <LicenseRestrictedAction restricted={integrationsRestricted} reason={integrationsRestrictionMessage} feature="integrations.core">
                          <Button type="link" disabled={integrationsRestricted} onClick={() => openIntegrationEditModal('telegram', record)}>
                            {tr('integrationsPage.actions.edit', 'Редактировать')}
                          </Button>
                        </LicenseRestrictedAction>
                        <LicenseRestrictedAction restricted={integrationsRestricted} reason={integrationsRestrictionMessage} feature="integrations.core">
                          <Button type="link" disabled={integrationsRestricted} onClick={() => handleTelegramTest(record)}>
                            {tr('integrationsPage.actions.test', 'Тест')}
                          </Button>
                        </LicenseRestrictedAction>
                        <LicenseRestrictedAction restricted={integrationsRestricted} reason={integrationsRestrictionMessage} feature="integrations.core">
                          <Button type="link" disabled={integrationsRestricted} onClick={() => openWebhookModal(record)}>
                            {tr('integrationsPage.actions.webhook', 'Webhook')}
                          </Button>
                        </LicenseRestrictedAction>
                        <LicenseRestrictedAction restricted={integrationsRestricted} reason={integrationsRestrictionMessage} feature="integrations.core">
                          <Button type="link" danger disabled={integrationsRestricted} onClick={() => handleTelegramDisconnect(record)}>
                            {tr('integrationsPage.actions.disconnect', 'Отключить')}
                          </Button>
                        </LicenseRestrictedAction>
                      </Space>
                    ),
                  },
                ]}
                dataSource={telegramBots}
                pagination={false}
              />
            )}
          </IntegrationCard>

          <IntegrationCard
            title={t('integrationsPage.cards.ai.title')}
            description={t('integrationsPage.cards.ai.description')}
            icon={<RobotOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
            type="ai"
            status={statuses.ai.status}
            stats={statuses.ai.stats}
            error={statuses.ai.error}
            loading={loading.ai}
            onConnect={() => openAIModal()}
            onSettings={() => openAIModal()}
            onRefresh={loadAIStatus}
            disabled={integrationsRestricted}
            disabledReason={integrationsRestrictionMessage}
          >
            {aiProviders.length > 0 && (
              <Table
                size="small"
                rowKey={(record) => record.id}
                columns={[
                  { title: tr('integrationsPage.table.name', 'Название'), dataIndex: 'name', key: 'name' },
                  { title: tr('integrationsPage.table.provider', 'Провайдер'), dataIndex: 'provider', key: 'provider' },
                  { title: tr('integrationsPage.table.model', 'Модель'), dataIndex: 'model', key: 'model', render: (value) => value || '-' },
                  {
                    title: tr('integrationsPage.table.status', 'Статус'),
                    key: 'status',
                    render: (_, record) => (
                      <Space>
                        <Tag
                          color={record.is_active ? 'success' : 'default'}
                          bordered={false}
                          style={{
                            fontWeight: 600,
                            borderRadius: 999,
                            paddingInline: 10,
                            border: `1px solid ${record.is_active ? 'rgba(82, 196, 26, 0.32)' : 'rgba(148, 163, 184, 0.24)'}`,
                          }}
                        >
                          {record.is_active ? tr('integrationsPage.status.active', 'Активен') : tr('integrationsPage.status.paused', 'Пауза')}
                        </Tag>
                        {record.is_default && (
                          <Tag
                            color="processing"
                            bordered={false}
                            style={{
                              fontWeight: 600,
                              borderRadius: 999,
                              paddingInline: 10,
                              border: '1px solid rgba(24, 144, 255, 0.32)',
                            }}
                          >
                            {tr('integrationsPage.status.default', 'По умолчанию')}
                          </Tag>
                        )}
                      </Space>
                    ),
                  },
                  {
                    title: tr('integrationsPage.table.key', 'Ключ'),
                    dataIndex: 'api_key_preview',
                    key: 'api_key_preview',
                    render: (value) => value || '-',
                  },
                  {
                    title: tr('integrationsPage.table.actions', 'Действия'),
                    key: 'actions',
                    render: (_, record) => (
                      <Space>
                        <Button
                          type="link"
                          disabled={integrationsRestricted}
                          loading={aiTestingId === record.id}
                          onClick={() => handleAITest(record)}
                        >
                          {tr('integrationsPage.actions.test', 'Тест')}
                        </Button>
                        <Button type="link" disabled={integrationsRestricted} onClick={() => openAIModal(record)}>
                          {tr('integrationsPage.actions.edit', 'Редактировать')}
                        </Button>
                        {!record.is_default && (
                          <Button
                            type="link"
                            disabled={integrationsRestricted}
                            loading={aiDefaultingId === record.id}
                            onClick={() => handleAIMakeDefault(record)}
                          >
                            {tr('integrationsPage.actions.makeDefault', 'По умолчанию')}
                          </Button>
                        )}
                        <Popconfirm
                          title={tr('integrationsPage.actions.deleteProviderConfirm', 'Удалить AI провайдера?')}
                          onConfirm={() => handleAIDelete(record)}
                          okText={tr('actions.delete', 'Удалить')}
                          cancelText={tr('actions.cancel', 'Отмена')}
                        >
                          <Button type="link" danger disabled={integrationsRestricted}>
                            {tr('actions.delete', 'Удалить')}
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
                dataSource={aiProviders}
                pagination={false}
              />
            )}
          </IntegrationCard>
        </Space>
      </Card>

      <Modal
        title={tr('integrationsPage.modals.eventDetails', 'Детали omnichannel события')}
        open={omnichannelEventModal.open}
        footer={[
          <Button key="close" onClick={closeOmnichannelEventModal}>
            {tr('actions.close', 'Закрыть')}
          </Button>,
          <LicenseRestrictedAction
            key="replay-license"
            restricted={integrationsRestricted}
            reason={integrationsRestrictionMessage}
            feature="integrations.core"
          >
            <Button
              type="primary"
              loading={omnichannelReplayId === omnichannelEventModal.record?.id}
              disabled={
                integrationsRestricted
                || !(omnichannelEventModal.payload?.replayable || omnichannelEventModal.record?.replayable)
              }
              onClick={() => handleOmnichannelReplay(omnichannelEventModal.record)}
            >
              {tr('integrationsPage.actions.replay', 'Replay')}
            </Button>
          </LicenseRestrictedAction>,
        ]}
        width={860}
        onCancel={closeOmnichannelEventModal}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {omnichannelEventModal.error ? (
            <Alert type="error" showIcon message={omnichannelEventModal.error} />
          ) : null}

          <Card
            size="small"
            title={tr('integrationsPage.diagnostics.summaryTitle', 'Summary')}
            loading={omnichannelEventModal.loading}
          >
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label={tr('integrationsPage.table.channel', 'Канал')}>
                {omnichannelEventModal.payload?.channel_name ||
                  omnichannelEventModal.record?.channel_name ||
                  omnichannelEventModal.payload?.channel_type ||
                  omnichannelEventModal.record?.channel_type ||
                  '-'}
              </Descriptions.Item>
              <Descriptions.Item label={tr('integrationsPage.table.status', 'Статус')}>
                <Space size={[4, 4]} wrap>
                  <Tag>{omnichannelEventModal.payload?.queue_state || omnichannelEventModal.record?.queue_state || '-'}</Tag>
                  {(
                    omnichannelEventModal.payload?.sla_status ||
                    omnichannelEventModal.record?.sla_status
                  ) === 'breached' && <Tag color="warning">SLA risk</Tag>}
                  {(omnichannelEventModal.payload?.replayable || omnichannelEventModal.record?.replayable) && (
                    <Tag color="processing">Replay-ready</Tag>
                  )}
                  {(
                    omnichannelEventModal.payload?.signature_valid ??
                    omnichannelEventModal.record?.signature_valid
                  ) === false && <Tag color="volcano">Signature</Tag>}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="External ID">
                <Space size={8} wrap>
                  <span>{omnichannelEventModal.payload?.external_id || omnichannelEventModal.record?.external_id || '-'}</span>
                  {(omnichannelEventModal.payload?.external_id || omnichannelEventModal.record?.external_id) && (
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      title={tr('integrationsPage.actions.copyExternalId', 'Скопировать External ID')}
                      onClick={() => copyTextToClipboard(
                        omnichannelEventModal.payload?.external_id || omnichannelEventModal.record?.external_id,
                        tr('integrationsPage.messages.externalIdCopied', 'External ID скопирован'),
                        tr('integrationsPage.messages.externalIdCopyError', 'Не удалось скопировать External ID')
                      )}
                    />
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Message ID">
                <Space size={8} wrap>
                  <span>{omnichannelEventModal.payload?.message_id || omnichannelEventModal.record?.message_id || '-'}</span>
                  {(omnichannelEventModal.payload?.message_id || omnichannelEventModal.record?.message_id) && (
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      title={tr('integrationsPage.actions.copyMessageId', 'Скопировать Message ID')}
                      onClick={() => copyTextToClipboard(
                        omnichannelEventModal.payload?.message_id || omnichannelEventModal.record?.message_id,
                        tr('integrationsPage.messages.messageIdCopied', 'Message ID скопирован'),
                        tr('integrationsPage.messages.messageIdCopyError', 'Не удалось скопировать Message ID')
                      )}
                    />
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={tr('integrationsPage.table.message', 'Сообщение')} span={2}>
                {omnichannelEventModal.payload?.text ||
                  omnichannelEventModal.record?.text ||
                  '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            size="small"
            title={tr('integrationsPage.diagnostics.routingTitle', 'Routing')}
            loading={omnichannelEventModal.loading}
          >
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="Sender">
                {omnichannelEventModal.payload?.sender_id || omnichannelEventModal.record?.sender_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Recipient">
                {omnichannelEventModal.payload?.recipient_id || omnichannelEventModal.record?.recipient_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Direction">
                {omnichannelEventModal.payload?.direction || omnichannelEventModal.record?.direction || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={tr('integrationsPage.table.created', 'Создано')}>
                {formatDateTime(omnichannelEventModal.payload?.created_at || omnichannelEventModal.record?.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label={tr('integrationsPage.diagnostics.processedAt', 'Обработано')}>
                {formatDateTime(omnichannelEventModal.payload?.processed_at)}
              </Descriptions.Item>
              <Descriptions.Item label={tr('integrationsPage.diagnostics.replayedAt', 'Replay запуск')}>
                {formatDateTime(omnichannelEventModal.payload?.replayed_at)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            size="small"
            title={tr('integrationsPage.diagnostics.errorsTitle', 'Errors и processing')}
            loading={omnichannelEventModal.loading}
          >
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Processing status">
                {omnichannelEventModal.payload?.processing_status || omnichannelEventModal.record?.processing_status || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Replay status">
                {omnichannelEventModal.payload?.replay_status || omnichannelEventModal.record?.replay_status || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Replay count">
                {omnichannelEventModal.payload?.replay_count ?? omnichannelEventModal.record?.replay_count ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="Verification error">
                {omnichannelEventModal.payload?.verification_error || omnichannelEventModal.record?.verification_error || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Processing error">
                {omnichannelEventModal.payload?.processing_error || omnichannelEventModal.record?.processing_error || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Replay error">
                {omnichannelEventModal.payload?.replay_error || omnichannelEventModal.record?.replay_error || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            size="small"
            title={tr('integrationsPage.diagnostics.explanationsTitle', 'Операторская сводка')}
            loading={omnichannelEventModal.loading}
          >
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {buildDiagnosticsExplanation(
                omnichannelEventModal.payload || omnichannelEventModal.record || {},
                tr
              ).map((line, index) => (
                <Text key={`event-summary-${index}`} style={{ lineHeight: 1.5 }}>
                  {line}
                </Text>
              ))}
              {!buildDiagnosticsExplanation(
                omnichannelEventModal.payload || omnichannelEventModal.record || {},
                tr
              ).length && (
                <Text type="secondary">
                  {tr('integrationsPage.diagnostics.noSummary', 'Для этого события пока нет дополнительной операторской сводки.')}
                </Text>
              )}
            </Space>
          </Card>

          <Card
            size="small"
            title={tr('integrationsPage.diagnostics.payloadPreview', 'Payload preview')}
            loading={omnichannelEventModal.loading}
          >
            {getRawPreviewEntries(
              omnichannelEventModal.payload?.raw_preview || omnichannelEventModal.record?.raw_preview
            ).length ? (
              <Descriptions size="small" column={1} bordered>
                {getRawPreviewEntries(
                  omnichannelEventModal.payload?.raw_preview || omnichannelEventModal.record?.raw_preview
                ).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    <Text code>{String(value)}</Text>
                  </Descriptions.Item>
                ))}
              </Descriptions>
            ) : (
              <Text type="secondary">
                {tr('integrationsPage.diagnostics.noPayloadPreview', 'Короткий preview payload недоступен.')}
              </Text>
            )}
          </Card>

          <Card
            size="small"
            title={tr('integrationsPage.diagnostics.rawArchive', 'Raw archive')}
            extra={(
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                title={tr('integrationsPage.actions.copyRawArchive', 'Скопировать Raw archive')}
                disabled={!Object.keys(omnichannelEventModal.payload?.raw || {}).length}
                onClick={() => copyTextToClipboard(
                  JSON.stringify(omnichannelEventModal.payload?.raw || {}, null, 2),
                  tr('integrationsPage.messages.rawCopied', 'Raw archive скопирован'),
                  tr('integrationsPage.messages.rawCopyError', 'Не удалось скопировать Raw archive')
                )}
              >
                {tr('integrationsPage.actions.copy', 'Скопировать')}
              </Button>
            )}
            loading={omnichannelEventModal.loading}
          >
            <Input.TextArea
              readOnly
              autoSize={{ minRows: 8, maxRows: 18 }}
              value={JSON.stringify(omnichannelEventModal.payload?.raw || {}, null, 2)}
            />
          </Card>
        </Space>
      </Modal>

      <Modal
        title={tr('integrationsPage.modals.smsSettings', 'Настройка SMS')}
        open={modalVisible.sms}
        onCancel={() => closeModal('sms')}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <SMSSettings onSuccess={() => handleIntegrationSuccess('sms')} />
      </Modal>

      <Modal
        title={tr('integrationsPage.modals.telephonySettings', 'Настройка телефонии')}
        open={modalVisible.telephony}
        onCancel={() => closeModal('telephony')}
        footer={null}
        width={980}
        style={{ top: 20 }}
      >
        <TelephonySettings onSuccess={() => handleIntegrationSuccess('telephony')} />
      </Modal>

      <Modal
        title={tr('integrationsPage.modals.connectWhatsapp', 'Подключение WhatsApp Business')}
        open={modalVisible.whatsapp}
        onCancel={() => closeModal('whatsapp')}
        footer={null}
        width={720}
      >
        <WhatsAppConnect onSuccess={() => handleIntegrationSuccess('whatsapp')} onCancel={() => closeModal('whatsapp')} />
      </Modal>

      <Modal
        title={tr('integrationsPage.modals.connectFacebook', 'Подключение Facebook')}
        open={modalVisible.facebook}
        onCancel={() => closeModal('facebook')}
        footer={null}
        width={720}
      >
        <FacebookConnect onSuccess={() => handleIntegrationSuccess('facebook')} onCancel={() => closeModal('facebook')} />
      </Modal>

      <Modal
        title={tr('integrationsPage.modals.connectInstagram', 'Подключение Instagram')}
        open={modalVisible.instagram}
        onCancel={() => closeModal('instagram')}
        footer={null}
        width={720}
      >
        <InstagramConnect onSuccess={() => handleIntegrationSuccess('instagram')} onCancel={() => closeModal('instagram')} />
      </Modal>

      <Modal
        title={tr('integrationsPage.modals.connectTelegram', 'Подключение Telegram')}
        open={modalVisible.telegram}
        onCancel={() => closeModal('telegram')}
        footer={null}
        width={720}
      >
        <TelegramConnect onSuccess={() => handleIntegrationSuccess('telegram')} onCancel={() => closeModal('telegram')} />
      </Modal>

      <Modal
        title={tr('integrationsPage.modals.telegramWebhook', 'Webhook Telegram')}
        open={webhookModal.open}
        forceRender
        onCancel={closeWebhookModal}
        onOk={handleWebhookSave}
        okText={tr('actions.save', 'Сохранить')}
        confirmLoading={webhookSaving}
      >
        <Form form={webhookForm} layout="vertical">
          <Form.Item
            label="Webhook URL"
            name="webhook_url"
            rules={[{ type: 'url', message: tr('integrationsPage.validation.url', 'Укажите корректный URL') }]}
          >
            <Input
              placeholder={tr('integrationsPage.placeholders.webhookUrl', 'Оставьте пустым для автогенерации URL')}
              addonAfter={
                <Button type="text" size="small" icon={<CopyOutlined />} onClick={handleCopyWebhookUrl}>
                  {tr('integrationsPage.actions.copy', 'Скопировать')}
                </Button>
              }
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={aiModal.record ? tr('integrationsPage.modals.editAiProvider', 'Редактирование AI провайдера') : tr('integrationsPage.modals.addAiProvider', 'Добавление AI провайдера')}
        open={aiModal.open}
        forceRender
        onCancel={closeAIModal}
        onOk={handleAISave}
        okText={tr('actions.save', 'Сохранить')}
        confirmLoading={aiSaving}
        width={760}
      >
        <Form form={aiForm} layout="vertical">
          <Form.Item
            label={tr('integrationsPage.form.name', 'Название')}
            name="name"
            rules={[{ required: true, message: tr('integrationsPage.validation.providerName', 'Введите название провайдера') }]}
          >
            <Input placeholder="OpenAI Prod" />
          </Form.Item>

          <Form.Item
            label={tr('integrationsPage.form.provider', 'Провайдер')}
            name="provider"
            rules={[{ required: true, message: tr('integrationsPage.validation.providerSelect', 'Выберите провайдера') }]}
          >
            <Select options={AI_PROVIDER_OPTIONS} onChange={handleAIProviderChange} />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, next) => prev.provider !== next.provider || prev.model !== next.model}>
            {({ getFieldValue }) => {
              const provider = getFieldValue('provider');
              const model = getFieldValue('model');
              const isCustomModel = provider === 'openai_compatible' || provider === 'custom';
              const providerModelOptions = getProviderModelOptions(provider, model);

              return (
                <Form.Item
                  label={tr('integrationsPage.form.model', 'Модель')}
                  name="model"
                  rules={[{ required: true, message: tr('integrationsPage.validation.modelSelect', 'Выберите или укажите модель') }]}
                >
                  {isCustomModel ? (
                    <Input placeholder={tr('integrationsPage.placeholders.customModel', 'Введите модель, поддерживаемую вашим провайдером')} />
                  ) : (
                    <Select
                      showSearch
                      options={providerModelOptions}
                      placeholder={tr('integrationsPage.placeholders.modelSelect', 'Выберите модель')}
                      optionFilterProp="label"
                    />
                  )}
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item label="Base URL" name="base_url">
            <Input
              placeholder="https://api.openai.com"
              addonAfter={
                <Button type="text" size="small" icon={<CopyOutlined />} onClick={handleCopyAiBaseUrl}>
                  Скопировать
                </Button>
              }
            />
          </Form.Item>

          <Form.Item
            label={aiModal.record ? tr('integrationsPage.form.apiKeyOptional', 'API Key (оставьте пустым, чтобы не менять)') : tr('integrationsPage.form.apiKey', 'API Key')}
            name="api_key"
            rules={aiModal.record ? [] : [{ required: true, message: tr('integrationsPage.validation.apiKey', 'Введите API ключ') }]}
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item label="Timeout (sec)" name="timeout_seconds">
              <InputNumber min={5} max={300} />
            </Form.Item>
            <Form.Item label="Temperature" name="temperature">
              <InputNumber min={0} max={2} step={0.1} />
            </Form.Item>
            <Form.Item label="Max tokens" name="max_tokens">
              <InputNumber min={1} max={8000} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item label={tr('integrationsPage.form.active', 'Активен')} name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label={tr('integrationsPage.form.default', 'По умолчанию')} name="is_default" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title={tr('integrationsPage.modals.editIntegration', 'Редактирование интеграции')}
        open={integrationEditModal.open}
        forceRender
        onCancel={closeIntegrationEditModal}
        onOk={handleIntegrationEditSave}
        okText={tr('actions.save', 'Сохранить')}
        confirmLoading={integrationEditSaving}
      >
        <Form form={integrationEditForm} layout="vertical">
          {integrationEditModal.type === 'whatsapp' && (
            <>
              <Form.Item label={tr('integrationsPage.form.accountName', 'Название аккаунта')} name="business_name" rules={[{ required: true, message: tr('integrationsPage.validation.accountName', 'Введите название аккаунта') }]}>
                <Input />
              </Form.Item>
              <Form.Item label={tr('integrationsPage.form.phone', 'Номер')} name="phone_number">
                <Input />
              </Form.Item>
              <Form.Item label="Webhook URL" name="webhook_url" rules={[{ type: 'url', message: tr('integrationsPage.validation.url', 'Укажите корректный URL') }]}>
                <Input placeholder="https://crm.example.com/integrations/whatsapp/webhook/" />
              </Form.Item>
              <Space size="large">
                <Form.Item label={tr('integrationsPage.form.active', 'Активен')} name="is_active" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item label={tr('integrationsPage.form.autoSync', 'Автосинк')} name="auto_sync_messages" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item label={tr('integrationsPage.form.autoLeads', 'Авто-лиды')} name="auto_create_leads" valuePropName="checked"><Switch /></Form.Item>
              </Space>
            </>
          )}

          {integrationEditModal.type === 'facebook' && (
            <>
              <Form.Item label={tr('integrationsPage.form.pageName', 'Название страницы')} name="page_name" rules={[{ required: true, message: tr('integrationsPage.validation.pageName', 'Введите название страницы') }]}>
                <Input />
              </Form.Item>
              <Form.Item label="Webhook URL" name="webhook_url" rules={[{ type: 'url', message: tr('integrationsPage.validation.url', 'Укажите корректный URL') }]}>
                <Input placeholder="https://crm.example.com/integrations/facebook/webhook/" />
              </Form.Item>
              <Space size="large">
                <Form.Item label={tr('integrationsPage.form.active', 'Активна')} name="is_active" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item label={tr('integrationsPage.form.autoMessages', 'Автосинк сообщений')} name="auto_sync_messages" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item label={tr('integrationsPage.form.autoComments', 'Автосинк комментариев')} name="auto_sync_comments" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item label={tr('integrationsPage.form.autoPosts', 'Автосинк постов')} name="auto_sync_posts" valuePropName="checked"><Switch /></Form.Item>
              </Space>
            </>
          )}

          {integrationEditModal.type === 'instagram' && (
            <>
              <Form.Item label="Username" name="username" rules={[{ required: true, message: tr('integrationsPage.validation.username', 'Введите username') }]}>
                <Input />
              </Form.Item>
              <Form.Item label="Webhook URL" name="webhook_url" rules={[{ type: 'url', message: tr('integrationsPage.validation.url', 'Укажите корректный URL') }]}>
                <Input placeholder="https://crm.example.com/integrations/instagram/webhook/" />
              </Form.Item>
              <Space size="large">
                <Form.Item label={tr('integrationsPage.form.active', 'Активен')} name="is_active" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item label={tr('integrationsPage.form.autoMessages', 'Автосинк сообщений')} name="auto_sync_messages" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item label={tr('integrationsPage.form.autoComments', 'Автосинк комментариев')} name="auto_sync_comments" valuePropName="checked"><Switch /></Form.Item>
              </Space>
            </>
          )}

          {integrationEditModal.type === 'telegram' && (
            <>
              <Form.Item label="Webhook URL" name="webhook_url" rules={[{ type: 'url', message: tr('integrationsPage.validation.url', 'Укажите корректный URL') }]}>
                <Input placeholder={getDefaultTelegramWebhookUrl()} />
              </Form.Item>
              <Form.Item label={tr('integrationsPage.form.welcomeMessage', 'Приветственное сообщение')} name="welcome_message">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item
                label={tr('integrationsPage.form.allowedChatIds', 'Разрешённые chat_id')}
                name="allowed_chat_ids_text"
                extra={tr('integrationsPage.form.allowedChatIdsHint', 'По одному ID чата на строку. Пусто = разрешены все чаты.')}
              >
                <Input.TextArea rows={4} placeholder={'123456789\n-1001234567890'} />
              </Form.Item>
              <Space size="large">
                <Form.Item label={tr('integrationsPage.form.active', 'Активен')} name="is_active" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item label={tr('integrationsPage.form.autoReply', 'Автоответ')} name="auto_reply" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item label={tr('integrationsPage.form.useWebhook', 'Использовать webhook')} name="use_webhook" valuePropName="checked"><Switch /></Form.Item>
              </Space>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
