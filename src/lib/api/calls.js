/**
 * Calls API client
 * Handles CRM call-logs operations according to Django-CRM API.yaml
 */

import { api as apiClient, getContacts, getDeal } from './client.js';

/**
 * Get list of call logs with optional filters
 * @param {Object} params - Query parameters
 * @param {string} [params.direction] - Filter by direction (inbound/outbound)
 * @param {string} [params.status] - Filter by status (completed/missed/busy/etc.)
 * @param {number} [params.limit] - Limit results
 * @param {string} [params.date_from] - Filter by date from
 * @param {string} [params.date_to] - Filter by date to
 * @param {string} [params.ordering] - Ordering field
 * @param {number} [params.page] - Page number
 * @param {number} [params.page_size] - Page size
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getCallLogs(params = {}) {
  return apiClient.get('/api/voip/call-logs/', { params });
}

/**
 * Get a single call log by ID
 * @param {string|number} logId - Call log ID
 * @returns {Promise<Object>}
 */
export async function getCallLog(logId) {
  return apiClient.get(`/api/voip/call-logs/${logId}/`);
}

/** @deprecated Use getCallLog instead */
export const getVoipCallLog = getCallLog;

/** @deprecated Use getCallLogs instead */
export const getVoipCallLogs = getCallLogs;

function normalizeCallLogPayload(data = {}) {
  const payload = { ...data };
  if (!payload.number && payload.phone_number) {
    payload.number = payload.phone_number;
  }
  delete payload.phone_number;
  delete payload.status;
  delete payload.started_at;
  delete payload.ended_at;
  delete payload.timestamp;
  return payload;
}

function normalizeKpiAlias(source, snakeKey, camelKey, fallback = null) {
  if (!source || typeof source !== 'object') return fallback;
  return source[snakeKey] ?? source[camelKey] ?? fallback;
}

function normalizeTrendAlias(...values) {
  const hasTrendPayload = (value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value === null || value === undefined || value === '') return false;
    if (typeof value !== 'object') return true;
    if (Array.isArray(value.results)) return value.results.length > 0;
    if (Array.isArray(value.labels)) return value.labels.length > 0;

    return Object.values(value).some((entry) => {
      if (Array.isArray(entry)) return entry.length > 0;
      return entry !== undefined && entry !== null && entry !== '';
    });
  };

  for (const value of values) {
    if (hasTrendPayload(value)) {
      return value;
    }
  }

  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return [];
}

function normalizeOmnichannelChannelEntry(source, key, fallbackLabel) {
  const raw = source?.[key];
  const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : { count: raw };
  const count = value.count ?? value.total ?? value.total_count ?? value.messages_total ?? value.value ?? 0;
  const inbound =
    value.inbound ?? value.total_social_inbound ?? value.social_inbound ?? value.inbound_count ?? 0;
  const outbound =
    value.outbound ?? value.total_social_outbound ?? value.social_outbound ?? value.outbound_count ?? 0;
  const activeConversations =
    value.active_conversations ??
    value.activeConversations ??
    value.open_conversations ??
    value.openConversations ??
    value.active ??
    null;
  const responseRate =
    value.response_rate ??
    value.responseRate ??
    value.reply_rate ??
    value.replyRate ??
    value.rate ??
    null;

  return {
    key,
    label: value.label ?? value.name ?? value.title ?? fallbackLabel,
    count: count ?? 0,
    inbound,
    outbound,
    active_conversations: activeConversations,
    activeConversations,
    response_rate: responseRate,
    responseRate,
    raw: value,
  };
}

function normalizeOmnichannelPayload(source) {
  if (!source || typeof source !== 'object') return null;

  const channelsSource =
    source.channels ??
    source.channel_breakdown ??
    source.channelBreakdown ??
    source.breakdown ??
    source.channels_breakdown ??
    source.channelsBreakdown ??
    source.meta_channels ??
    source.metaChannels ??
    null;

  const preferredChannelOrder = ['instagram', 'facebook', 'whatsapp'];
  const channels = [];
  const seenKeys = new Set();

  if (Array.isArray(channelsSource)) {
    channelsSource.forEach((item, index) => {
      if (!item) return;
      const key = item.key ?? item.id ?? item.code ?? item.channel ?? item.name ?? `channel-${index}`;
      const label = item.label ?? item.name ?? item.title ?? key;
      const count =
        item.count ?? item.total ?? item.total_count ?? item.messages_total ?? item.value ?? 0;
      const inbound =
        item.inbound ?? item.total_social_inbound ?? item.social_inbound ?? item.inbound_count ?? 0;
      const outbound =
        item.outbound ??
        item.total_social_outbound ??
        item.social_outbound ??
        item.outbound_count ??
        0;
      const activeConversations =
        item.active_conversations ??
        item.activeConversations ??
        item.open_conversations ??
        item.openConversations ??
        item.active ??
        null;
      const responseRate =
        item.response_rate ?? item.responseRate ?? item.reply_rate ?? item.replyRate ?? item.rate ?? null;

      channels.push({
        key,
        label,
        count,
        inbound,
        outbound,
        active_conversations: activeConversations,
        activeConversations,
        response_rate: responseRate,
        responseRate,
        raw: item,
      });
      seenKeys.add(String(key).toLowerCase());
    });
  } else if (channelsSource && typeof channelsSource === 'object') {
    preferredChannelOrder.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(channelsSource, key)) {
        channels.push(normalizeOmnichannelChannelEntry(channelsSource, key, key));
        seenKeys.add(key.toLowerCase());
      }
    });

    Object.entries(channelsSource).forEach(([key, value]) => {
      if (seenKeys.has(String(key).toLowerCase())) return;
      if (!value) return;
      const item = value && typeof value === 'object' && !Array.isArray(value) ? value : { count: value };
      const count =
        item.count ?? item.total ?? item.total_count ?? item.messages_total ?? item.value ?? 0;
      const inbound =
        item.inbound ?? item.total_social_inbound ?? item.social_inbound ?? item.inbound_count ?? 0;
      const outbound =
        item.outbound ??
        item.total_social_outbound ??
        item.social_outbound ??
        item.outbound_count ??
        0;
      const activeConversations =
        item.active_conversations ??
        item.activeConversations ??
        item.open_conversations ??
        item.openConversations ??
        item.active ??
        null;
      const responseRate =
        item.response_rate ??
        item.responseRate ??
        item.reply_rate ??
        item.replyRate ??
        item.rate ??
        null;

      channels.push({
        key,
        label: item.label ?? item.name ?? item.title ?? key,
        count,
        inbound,
        outbound,
        active_conversations: activeConversations,
        activeConversations,
        response_rate: responseRate,
        responseRate,
        raw: item,
      });
    });
  } else {
    preferredChannelOrder.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        channels.push(normalizeOmnichannelChannelEntry(source, key, key));
      }
    });
  }

  const totalSocialInbound = source.total_social_inbound ?? source.totalSocialInbound ?? source.inbound ?? null;
  const totalSocialOutbound =
    source.total_social_outbound ?? source.totalSocialOutbound ?? source.outbound ?? null;
  const responseRate =
    source.response_rate ?? source.responseRate ?? source.reply_rate ?? source.replyRate ?? null;
  const activeConversations =
    source.active_conversations ??
    source.activeConversations ??
    source.open_conversations ??
    source.openConversations ??
    null;

  const derivedInbound =
    totalSocialInbound ??
    channels.reduce((sum, item) => sum + (Number(item.inbound) || 0), 0);
  const derivedOutbound =
    totalSocialOutbound ??
    channels.reduce((sum, item) => sum + (Number(item.outbound) || 0), 0);
  const derivedActiveConversations =
    activeConversations ??
    channels.reduce((sum, item) => sum + (Number(item.active_conversations) || 0), 0);
  const derivedResponseRate =
    responseRate ??
    (channels.length > 0
      ? channels.reduce((sum, item) => sum + (Number(item.response_rate) || 0), 0) / channels.length
      : null);

  const sortedChannels = channels.sort((a, b) => {
    const aIndex = preferredChannelOrder.indexOf(String(a.key).toLowerCase());
    const bIndex = preferredChannelOrder.indexOf(String(b.key).toLowerCase());
    if (aIndex === -1 && bIndex === -1) return String(a.label || a.key).localeCompare(String(b.label || b.key));
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return {
    ...source,
    license_restricted: Boolean(source.license_restricted ?? source.licenseRestricted ?? false),
    total_social_inbound: derivedInbound,
    totalSocialInbound: derivedInbound,
    total_social_outbound: derivedOutbound,
    totalSocialOutbound: derivedOutbound,
    response_rate: derivedResponseRate,
    responseRate: derivedResponseRate,
    active_conversations: derivedActiveConversations,
    activeConversations: derivedActiveConversations,
    channels: sortedChannels,
    channel_breakdown: sortedChannels,
    channelBreakdown: sortedChannels,
    breakdown: sortedChannels,
  };
}

/**
 * Create a new CRM call log
 * @param {Object} data - Call log data
 * @returns {Promise<Object>}
 */
export async function createCallLog(data) {
  return apiClient.post('/api/voip/call-logs/', { body: normalizeCallLogPayload(data) });
}

/**
 * Update a CRM call log (add note or patch metadata)
 * @param {string|number} logId - Call log ID
 * @param {Object} data - Call log updates
 * @returns {Promise<Object>}
 */
export async function updateCallLog(logId, data) {
  return apiClient.patch(`/api/voip/call-logs/${logId}/`, { body: normalizeCallLogPayload(data) });
}

/**
 * Delete a CRM call log
 * @param {string|number} logId - Call log ID
 * @returns {Promise<void>}
 */
export async function deleteCallLog(logId) {
  return apiClient.delete(`/api/voip/call-logs/${logId}/`);
}

/**
 * Create a new call log
 * Note: POST method not available in API.yaml for /api/voip/call-logs/
 * This is a read-only endpoint. Call logs are created by VoIP system.
 * @param {Object} data - Call log data
 * @returns {Promise<Object>}
 */
export async function addCallNote(logId, data) {
  return apiClient.post(`/api/voip/call-logs/${logId}/add-note/`, { body: data });
}

/**
 * Get call logs for a specific entity (lead or contact)
 * @param {string} entityType - Entity type ('lead' or 'contact')
 * @param {string|number} entityId - Entity ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getEntityCallLogs(entityType, entityId, params = {}) {
  const response = await getCallLogs({
    ...params,
    ordering: '-timestamp',
    page_size: params.page_size || 200,
  });
  const results = response?.results || response || [];

  if (entityType === 'contact' && entityId) {
    const filtered = results.filter(
      (call) => Number(call.contact ?? call.related_contact) === Number(entityId)
    );
    return { count: filtered.length, results: filtered };
  }

  return {
    count: response?.count ?? results.length,
    results,
  };
}

/**
 * Get call logs for a company (through related contacts)
 * @param {string|number} companyId - Company ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getCompanyCallLogs(companyId, params = {}) {
  const contactsResponse = await getContacts({ company: companyId, page_size: 500 });
  const contacts = contactsResponse?.results || contactsResponse || [];
  const contactIds = contacts.map((contact) => Number(contact.id)).filter(Boolean);

  if (contactIds.length === 0) {
    return { count: 0, results: [] };
  }

  const response = await getCallLogs({
    ...params,
    ordering: '-timestamp',
    page_size: params.page_size || 1000,
  });
  const results = response?.results || response || [];
  const filtered = results.filter((call) =>
    contactIds.includes(Number(call.contact ?? call.related_contact))
  );
  return { count: filtered.length, results: filtered };
}

/**
 * Get call logs for a deal (through related contact)
 * @param {string|number} dealId - Deal ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<{count: number, results: Array}>}
 */
export async function getDealCallLogs(dealId, params = {}) {
  const deal = await getDeal(dealId);
  if (!deal?.contact) {
    return { count: 0, results: [] };
  }
  return getEntityCallLogs('contact', deal.contact, params);
}

/**
 * Get call statistics
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Object>} Statistics object
 */
export async function getCallStatistics(params = {}) {
  const stats = await apiClient.get('/api/voip/call-statistics/', { params });
  if (!stats || typeof stats !== 'object') {
    return stats;
  }

  return {
    ...stats,
    total: stats.total ?? stats.total_calls ?? stats.calls_total ?? stats.count ?? 0,
    inbound: stats.inbound ?? stats.incoming ?? stats.incoming_calls ?? 0,
    outbound: stats.outbound ?? stats.outgoing ?? stats.outgoing_calls ?? 0,
    completed: stats.completed ?? stats.answered ?? stats.connected ?? 0,
    missed: stats.missed ?? stats.missed_calls ?? stats.no_answer ?? 0,
    totalDuration: stats.totalDuration ?? stats.total_duration ?? stats.duration_total ?? 0,
    averageDuration: stats.averageDuration ?? stats.average_duration ?? stats.avg_duration ?? 0,
    hourly_distribution: stats.hourly_distribution ?? stats.hourlyDistribution ?? [],
    status_breakdown: stats.status_breakdown ?? stats.statusBreakdown ?? [],
    cause_breakdown: stats.cause_breakdown ?? stats.causeBreakdown ?? [],
  };
}

/**
 * Get contact center KPI economics
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function getContactCenterKpi(params = {}) {
  const kpi = await apiClient.get('/api/voip/contact-center-kpi/', { params });
  if (!kpi || typeof kpi !== 'object') {
    return kpi;
  }

  const current = kpi.current ?? kpi.current_period ?? null;
  const previous = kpi.previous ?? kpi.previous_period ?? null;
  const normalizedCurrent = current
    ? {
        ...current,
        daily_trend: normalizeTrendAlias(
          normalizeKpiAlias(current, 'daily_trend', 'dailyTrend', [])
        ),
        dailyTrend: normalizeTrendAlias(
          normalizeKpiAlias(current, 'daily_trend', 'dailyTrend', [])
        ),
      }
    : null;
  const normalizedPrevious = previous
    ? {
        ...previous,
        daily_trend: normalizeTrendAlias(
          normalizeKpiAlias(previous, 'daily_trend', 'dailyTrend', [])
        ),
        dailyTrend: normalizeTrendAlias(
          normalizeKpiAlias(previous, 'daily_trend', 'dailyTrend', [])
        ),
      }
    : null;
  const omnichannelSource = normalizeKpiAlias(
    kpi,
    'omnichannel',
    'omniChannel',
    normalizeKpiAlias(kpi, 'omnichannel_kpi', 'omniChannelKpi', null)
  );
  const normalizedOmnichannel = normalizeOmnichannelPayload(
    omnichannelSource ??
      normalizedCurrent?.omnichannel ??
      normalizedCurrent?.omniChannel ??
      normalizedCurrent?.omnichannel_kpi ??
      normalizedCurrent?.omniChannelKpi ??
      normalizedPrevious?.omnichannel ??
      normalizedPrevious?.omniChannel ??
      normalizedPrevious?.omnichannel_kpi ??
      normalizedPrevious?.omniChannelKpi ??
      null
  );
  const dailyTrend = normalizeTrendAlias(
    normalizeKpiAlias(kpi, 'daily_trend', 'dailyTrend', []),
    normalizeKpiAlias(normalizedCurrent, 'daily_trend', 'dailyTrend', []),
    normalizeKpiAlias(kpi?.current ?? kpi?.current_period ?? null, 'daily_trend', 'dailyTrend', [])
  );
  const previousDailyTrend = normalizeTrendAlias(
    normalizeKpiAlias(kpi, 'previous_daily_trend', 'previousDailyTrend', []),
    normalizeKpiAlias(normalizedPrevious, 'daily_trend', 'dailyTrend', [])
  );

  return {
    ...kpi,
    current: normalizedCurrent,
    previous: normalizedPrevious,
    daily_trend: dailyTrend,
    dailyTrend,
    previous_daily_trend: previousDailyTrend,
    previousDailyTrend,
    omnichannel: normalizedOmnichannel,
    omnichannel_license_restricted: normalizedOmnichannel?.license_restricted ?? false,
    hourly_distribution:
      kpi.hourly_distribution ??
      kpi.hourlyDistribution ??
      normalizedCurrent?.hourly_distribution ??
      normalizedCurrent?.hourlyDistribution ??
      [],
    status_breakdown:
      kpi.status_breakdown ??
      kpi.statusBreakdown ??
      normalizedCurrent?.status_breakdown ??
      normalizedCurrent?.statusBreakdown ??
      [],
    cause_breakdown:
      kpi.cause_breakdown ??
      kpi.causeBreakdown ??
      kpi.failure_reason_breakdown ??
      kpi.failureReasonBreakdown ??
      normalizedCurrent?.cause_breakdown ??
      normalizedCurrent?.causeBreakdown ??
      normalizedCurrent?.failure_reason_breakdown ??
      normalizedCurrent?.failureReasonBreakdown ??
      [],
  };
}

/**
 * Get contact center drilldown by teams and agents
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function getContactCenterDrilldown(params = {}) {
  return apiClient.get('/api/voip/contact-center-drilldown/', { params });
}

/**
 * List QA scores for calls
 * @param {Object} params
 * @returns {Promise<{results: Array, count: number}>}
 */
export async function getCallQaScores(params = {}) {
  return apiClient.get('/api/voip/qa-scores/', { params });
}

/**
 * Create/update current reviewer QA score for a call
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function upsertCallQaScore(data) {
  return apiClient.post('/api/voip/qa-scores/', { body: data });
}

/**
 * Get QA summary
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function getCallQaSummary(params = {}) {
  return apiClient.get('/api/voip/qa-summary/', { params });
}

/**
 * Generate weekly pilot board report
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function generatePilotWeeklyReport(data = {}) {
  return apiClient.post('/api/voip/pilot-weekly-reports/generate/', { body: data });
}

/**
 * List pilot weekly reports
 * @param {Object} params
 * @returns {Promise<{results: Array, count: number}>}
 */
export async function getPilotWeeklyReports(params = {}) {
  return apiClient.get('/api/voip/pilot-weekly-reports/', { params });
}

/**
 * Export pilot weekly report
 * @param {number|string} reportId
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function exportPilotWeeklyReport(reportId, params = { export_format: 'md' }) {
  return apiClient.get(`/api/voip/pilot-weekly-reports/${reportId}/export/`, { params });
}

/**
 * Get report automation health and runs
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function getPilotReportAutomationHealth(params = {}) {
  return apiClient.get('/api/voip/pilot-weekly-reports/automation-health/', { params });
}

/**
 * Trigger report automation now
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function runPilotReportAutomationNow(data = { async: false }) {
  return apiClient.post('/api/voip/pilot-weekly-reports/run-automation-now/', { body: data });
}

/**
 * Get CRM call statistics (client-side aggregation)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getCrmCallStatistics(params = {}) {
  const response = await getCallLogs({ ...params, page_size: params.page_size || 1000 });
  const results = response?.results || response || [];
  const totalDuration = results.reduce((sum, c) => sum + (c.duration || 0), 0);
  return {
    total: results.length,
    inbound: results.filter((c) => c.direction === 'inbound').length,
    outbound: results.filter((c) => c.direction === 'outbound').length,
    totalDuration,
    averageDuration: results.length > 0 ? totalDuration / results.length : 0,
  };
}
