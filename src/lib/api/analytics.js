import { api } from './client.js';

/**
 * Analytics API module
 * Provides functions for fetching analytics and dashboard data
 */

/**
 * Get overview analytics for dashboard
 * @returns {Promise} Analytics overview data
 */
const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (Array.isArray(value)) {
    return value.length;
  }
  if (typeof value === 'object') {
    const candidate =
      value.count ??
      value.total ??
      value.value ??
      value.amount ??
      value.sum ??
      value.result ??
      value.results ??
      value.items ??
      value.data ??
      value.leads ??
      value.contacts ??
      value.deals ??
      value.revenue;
    return candidate !== undefined ? toNumber(candidate) : 0;
  }
  return 0;
};

const REPORT_COLLECTION_KEYS = ['results', 'items', 'data', 'rows', 'list'];
const REPORT_META_KEYS = new Set(['summary', 'totals', 'aggregate', 'metrics', 'kpis', 'meta']);

const firstText = (...values) => {
  const candidate = values.find((value) => typeof value === 'string' && value.trim());
  return candidate ? candidate.trim() : '';
};

const sumNumbers = (rows, field) =>
  rows.reduce((total, row) => total + toNumber(row?.[field]), 0);

const readSummaryNumber = (summary, keys, fallback = 0) => {
  if (!summary || typeof summary !== 'object') return fallback;
  for (const key of keys) {
    if (summary[key] !== undefined && summary[key] !== null && summary[key] !== '') {
      const numeric = toNumber(summary[key]);
      if (Number.isFinite(numeric)) return numeric;
    }
  }
  return fallback;
};

const readCurrencyBreakdown = (summary, keys) => {
  if (!summary || typeof summary !== 'object') return null;

  for (const key of keys) {
    const raw = summary[key];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;

    const normalized = Object.entries(raw).reduce((acc, [currencyCode, amount]) => {
      const numericAmount = toNumber(amount);
      if (!Number.isFinite(numericAmount)) return acc;
      acc[currencyCode] = numericAmount;
      return acc;
    }, {});

    if (Object.keys(normalized).length > 0) {
      return normalized;
    }
  }

  return null;
};

function extractReportRows(data, preferredKeys = []) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  for (const key of [...preferredKeys, ...REPORT_COLLECTION_KEYS]) {
    if (Array.isArray(data[key])) return data[key];
  }

  return [];
}

function normalizeReportSummary(summary = {}, defaults = {}) {
  const normalized = { ...defaults };

  Object.entries(summary).forEach(([key, value]) => {
    normalized[key] = toNumber(value);
  });

  return normalized;
}

function normalizeLeadChannelItem(item, index) {
  const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
  const currencyValue = firstText(source.currency_code, source.currency_name, source.currency);
  const channel = firstText(
    source.lead_source_name,
    source.channel,
    source.source,
    source.name,
    source.title,
    source.label,
    source.utm_source
  ) || `Channel ${index + 1}`;
  const leads = toNumber(
    source.leads ??
    source.leads_count ??
    source.total_leads ??
    source.lead_count ??
    source.count ??
    source.total ??
    source.value
  );
  const deals = toNumber(
    source.deals ??
    source.deals_count ??
    source.deal_count ??
    source.converted_deals ??
    source.won_deals
  );
  const revenue = toNumber(source.revenue ?? source.total_revenue ?? source.income ?? source.amount);
  const conversionRate =
    leads > 0
      ? (deals / leads) * 100
      : toNumber(
          source.conversion_rate ??
          source.conversion_rate_pct ??
          source.conversion ??
          source.lead_to_deal_rate ??
          source.lead_to_deal_pct
        );

  return {
    key: String(source.id ?? source.pk ?? source.lead_source_id ?? source.channel ?? source.source ?? index),
    channel,
    leads,
    deals,
    revenue,
    conversion_rate: Number.isFinite(conversionRate) ? conversionRate : 0,
    cpl: toNumber(source.cpl ?? source.cost_per_lead ?? (leads > 0 ? source.cost / leads : 0)),
    cost: toNumber(source.cost ?? source.spend ?? source.expense ?? source.budget),
    currency_code: currencyValue || null,
    currency_name: currencyValue || null,
    raw: source,
  };
}

function normalizeCampaignItem(item, index) {
  const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
  const currencyValue = firstText(source.currency_code, source.currency_name, source.currency);
  const campaign = firstText(
    source.campaign_name,
    source.campaign,
    source.name,
    source.title,
    source.label,
    source.source
  ) || `Campaign ${index + 1}`;
  const leads = toNumber(
    source.leads ??
    source.attributed_leads ??
    source.total_leads ??
    source.lead_count ??
    source.count ??
    source.total ??
    source.value
  );
  const deals = toNumber(
    source.deals ??
    source.attributed_deals ??
    source.deal_count ??
    source.converted_deals ??
    source.won_deals
  );
  const cost = toNumber(
    source.cost ??
    source.sent ??
    source.spend ??
    source.expense ??
    source.budget ??
    source.amount
  );
  const revenue = toNumber(source.revenue ?? source.attributed_revenue ?? source.total_revenue ?? source.income);
  const conversionRate =
    leads > 0
      ? (deals / leads) * 100
      : toNumber(
          source.conversion_rate ??
          source.deal_conversion_pct ??
          source.conversion ??
          source.deal_conversion_rate
        );
  const cpl = toNumber(source.cpl ?? source.cost_per_lead ?? (leads > 0 ? cost / leads : 0));

  return {
    key: String(source.id ?? source.pk ?? source.campaign_id ?? source.campaign ?? source.name ?? index),
    campaign,
    leads,
    deals,
    cost,
    cpl,
    revenue,
    conversion_rate: Number.isFinite(conversionRate) ? conversionRate : 0,
    currency_code: currencyValue || null,
    currency_name: currencyValue || null,
    raw: source,
  };
}

function normalizeReportRows(data, { preferredKeys = [], kind = 'lead' } = {}) {
  const hasPreferredCollection = Boolean(
    data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      preferredKeys.some((key) => Array.isArray(data[key]))
  );
  const rows = extractReportRows(data, preferredKeys).map((item, index) =>
    kind === 'campaign' ? normalizeCampaignItem(item, index) : normalizeLeadChannelItem(item, index)
  );

  if (rows.length) return rows;
  if (hasPreferredCollection) return rows;

  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];

  return Object.entries(data)
    .filter(([key]) => !REPORT_META_KEYS.has(key))
    .map(([key, value], index) => {
      const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      return kind === 'campaign'
        ? normalizeCampaignItem({ campaign: key, ...source }, index)
        : normalizeLeadChannelItem({ channel: key, ...source }, index);
    });
}

export function normalizeLeadChannelsReport(data = {}) {
  const rows = normalizeReportRows(data, {
    preferredKeys: ['channels', 'sources', 'lead_channels', 'leadChannels'],
    kind: 'lead',
  });
  const rawSummary = data?.summary || data?.totals || data?.aggregate || data?.metrics || data?.kpis || {};
  const totalLeads = sumNumbers(rows, 'leads');
  const totalDeals = sumNumbers(rows, 'deals');
  const totalRevenue = sumNumbers(rows, 'revenue');
  const summary = normalizeReportSummary(data?.summary || data?.totals || data?.aggregate || data?.metrics || data?.kpis || {}, {
    total_leads: totalLeads,
    total_deals: totalDeals,
    total_revenue: totalRevenue,
    conversion_rate: totalLeads > 0 ? (totalDeals / totalLeads) * 100 : 0,
  });

  return {
    rows,
    summary: {
      ...summary,
      total_leads: readSummaryNumber(rawSummary, ['total_leads', 'totalLeads', 'leads_total', 'leads'], summary.total_leads),
      total_deals: readSummaryNumber(rawSummary, ['total_deals', 'totalDeals', 'deals_total', 'deals'], summary.total_deals),
      total_revenue: readSummaryNumber(rawSummary, ['total_revenue', 'totalRevenue', 'revenue_total', 'revenue'], summary.total_revenue),
      conversion_rate: readSummaryNumber(rawSummary, ['conversion_rate', 'conversionRate', 'conversion_rate_pct', 'lead_conversion_rate', 'conversion', 'leadConversion'], summary.conversion_rate),
      total_revenue_by_currency: readCurrencyBreakdown(rawSummary, ['total_revenue_by_currency', 'revenue_by_currency']),
    },
  };
}

export function normalizeMarketingCampaignsReport(data = {}) {
  const rows = normalizeReportRows(data, {
    preferredKeys: ['campaigns', 'items', 'marketing_campaigns', 'marketingCampaigns'],
    kind: 'campaign',
  });
  const rawSummary = data?.summary || data?.totals || data?.aggregate || data?.metrics || data?.kpis || {};
  const totalLeads = sumNumbers(rows, 'leads');
  const totalDeals = sumNumbers(rows, 'deals');
  const totalCost = sumNumbers(rows, 'cost');
  const totalRevenue = sumNumbers(rows, 'revenue');
  const summary = normalizeReportSummary(data?.summary || data?.totals || data?.aggregate || data?.metrics || data?.kpis || {}, {
    total_cost: totalCost,
    total_leads: totalLeads,
    total_deals: totalDeals,
    total_revenue: totalRevenue,
    conversion_rate: totalLeads > 0 ? (totalDeals / totalLeads) * 100 : 0,
    cpl: totalLeads > 0 ? totalCost / totalLeads : 0,
  });

  return {
    rows,
    summary: {
      ...summary,
      total_cost: readSummaryNumber(rawSummary, ['total_cost', 'totalCost', 'cost_total', 'cost', 'spend', 'sent'], summary.total_cost),
      total_leads: readSummaryNumber(rawSummary, ['total_leads', 'totalLeads', 'leads_total', 'attributed_leads'], summary.total_leads),
      total_deals: readSummaryNumber(rawSummary, ['total_deals', 'totalDeals', 'deals_total', 'attributed_deals'], summary.total_deals),
      total_revenue: readSummaryNumber(rawSummary, ['total_revenue', 'totalRevenue', 'revenue_total', 'revenue', 'attributed_revenue'], summary.total_revenue),
      conversion_rate: readSummaryNumber(rawSummary, ['conversion_rate', 'conversionRate', 'deal_conversion_rate', 'deal_conversion_pct', 'conversion', 'dealConversion'], summary.conversion_rate),
      cpl: readSummaryNumber(rawSummary, ['cpl', 'cost_per_lead', 'costPerLead'], summary.cpl),
      total_cost_by_currency: readCurrencyBreakdown(rawSummary, ['total_cost_by_currency', 'cost_by_currency', 'spend_by_currency']),
      total_revenue_by_currency: readCurrencyBreakdown(rawSummary, ['total_revenue_by_currency', 'revenue_by_currency', 'attributed_revenue_by_currency']),
      cpl_by_currency: readCurrencyBreakdown(rawSummary, ['cpl_by_currency', 'cost_per_lead_by_currency']),
    },
  };
}

export function normalizeOverview(data = {}) {
  if (!data || typeof data !== 'object') return {};
  const dealsPayload = data?.deals && typeof data.deals === 'object' ? data.deals : {};
  const totalRevenueByCurrency = readCurrencyBreakdown(data, ['total_revenue_by_currency', 'revenue_by_currency', 'by_currency']);
  const hasMixedRevenueBreakdown = totalRevenueByCurrency && Object.keys(totalRevenueByCurrency).length > 1;
  const overviewCurrency = hasMixedRevenueBreakdown ? '' : firstText(
    data.currency_code,
    data.currency_name,
    data.currency,
    dealsPayload.amount_currency,
    dealsPayload.currency_code,
    dealsPayload.currency_name,
    dealsPayload.currency,
  );
  // Backend analytics_overview returns nested: { deals: {total, active, total_amount}, leads: {total, new, qualified}, contacts: {total}, companies: {total} }
  // Flatten into the expected shape:
  return {
    total_leads: toNumber(
      data.total_leads ?? data.leads_count ?? data.totalLeads ??
      (typeof data.leads === 'object' ? (data.leads?.total ?? data.leads?.count) : data.leads)
    ),
    total_contacts: toNumber(
      data.total_contacts ?? data.contacts_count ?? data.totalContacts ??
      (typeof data.contacts === 'object' ? (data.contacts?.total ?? data.contacts?.count) : data.contacts)
    ),
    total_deals: toNumber(
      data.total_deals ?? data.deals_count ?? data.totalDeals ??
      (typeof data.deals === 'object' ? (data.deals?.total ?? data.deals?.count) : data.deals)
    ),
    total_revenue: toNumber(
      data.total_revenue ?? data.revenue_total ?? data.totalRevenue ??
      (typeof data.deals === 'object' ? data.deals?.total_amount : undefined)
    ),
    leads_growth: toNumber(data.leads_growth ?? data.leads_growth_percent ?? data.leadsGrowth),
    deals_growth: toNumber(data.deals_growth ?? data.deals_growth_percent ?? data.dealsGrowth),
    revenue_growth: toNumber(data.revenue_growth ?? data.revenue_growth_percent ?? data.revenueGrowth),
    conversion_rate: toNumber(data.conversion_rate ?? data.conversion ?? data.conversionRate),
    open_pipeline_amount: toNumber(
      data.open_pipeline_amount ??
      data.pipeline_amount ??
      data.active_deals_amount ??
      data.deals_in_progress_amount ??
      (typeof data.deals === 'object'
        ? (
          data.deals?.open_amount ??
          data.deals?.active_amount ??
          data.deals?.pipeline_amount ??
          data.deals?.in_progress_amount
        )
        : undefined)
    ),
    currency_code: overviewCurrency || null,
    currency_name: overviewCurrency || null,
    total_revenue_by_currency: totalRevenueByCurrency,
    amount_currency: firstText(data.amount_currency, dealsPayload.amount_currency) || null,
    amount_currency_codes: Array.isArray(data.amount_currency_codes)
      ? data.amount_currency_codes
      : Array.isArray(dealsPayload.amount_currency_codes)
        ? dealsPayload.amount_currency_codes
        : [],
    amount_is_mixed_currency: Boolean(data.amount_is_mixed_currency ?? dealsPayload.amount_is_mixed_currency),
    amount_display_mode: firstText(data.amount_display_mode, dealsPayload.amount_display_mode) || 'none',
  };
}

export function normalizeDashboardAnalytics(data = {}) {
  if (!data || typeof data !== 'object') return {};

  // Backend returns monthly_growth as scalar counts, not time-series arrays.
  // Only treat it as chart-ready if it has labels/arrays form.
  const rawGrowth = data.monthly_growth || data.monthlyGrowth || data.revenue_series || data.revenueSeries;
  let monthly_growth = null;
  if (rawGrowth && Array.isArray(rawGrowth.labels)) {
    // Already in chart-ready format
    monthly_growth = {
      ...rawGrowth,
      revenue: rawGrowth.revenue || rawGrowth.revenue_series || rawGrowth.values || rawGrowth.data || [],
      deals: rawGrowth.deals || rawGrowth.deals_series || [],
      leads: rawGrowth.leads || rawGrowth.leads_series || [],
      currency_code: firstText(
        rawGrowth.currency_code,
        rawGrowth.currency_name,
        rawGrowth.currency,
        rawGrowth.revenue_currency_code,
        data.currency_code,
        data.currency_name,
        data.currency,
      ) || null,
      currency_name: firstText(
        rawGrowth.currency_name,
        rawGrowth.currency_code,
        rawGrowth.currency,
        rawGrowth.revenue_currency_code,
        data.currency_name,
        data.currency_code,
        data.currency,
      ) || null,
      revenue_by_currency: rawGrowth.revenue_by_currency || rawGrowth.by_month_by_currency || null,
    };
  } else if (rawGrowth && typeof rawGrowth === 'object' && !Array.isArray(rawGrowth)) {
    // Scalar counts from backend - convert to bar chart format
    const LABEL_MAP = {
      contacts: 'Контакты',
      companies: 'Компании',
      deals: 'Сделки',
      leads: 'Лиды',
      revenue: 'Выручка',
    };
    const keys = Object.keys(rawGrowth).filter(k => typeof rawGrowth[k] === 'number');
    if (keys.length) {
      monthly_growth = {
        labels: keys.map(k => LABEL_MAP[k] || k),
        leads: keys.map(k => rawGrowth[k]),
        deals: [],
        revenue: [],
        _isSummary: true,
        currency_code: firstText(data.currency_code, data.currency_name, data.currency) || null,
        currency_name: firstText(data.currency_name, data.currency_code, data.currency) || null,
      };
    }
  }

  // tasks → tasks_by_status
  const rawTasks = data.tasks_by_status || data.tasksByStatus || data.tasks;
  let tasks_by_status = null;
  if (rawTasks && typeof rawTasks === 'object') {
    tasks_by_status = {
      pending: rawTasks.pending ?? rawTasks.todo ?? 0,
      in_progress: rawTasks.in_progress ?? rawTasks.active ?? 0,
      completed: rawTasks.completed ?? rawTasks.done ?? 0,
      overdue: rawTasks.overdue ?? 0,
    };
  }

  return {
    ...data,
    monthly_growth,
    lead_sources: data.lead_sources || data.leads_by_source || data.sources || data.leadSources,
    lead_statuses: data.lead_statuses || data.leads_by_status || data.statuses || data.leadStatuses,
    prediction: data.prediction || data.forecast || data.revenue_prediction,
    tasks_by_status,
  };
}

export async function getOverview(params = {}) {
  const res = await api.get('/api/analytics/overview/', { params });
  return normalizeOverview(res);
}

/**
 * Get dashboard analytics with filters
 * @param {Object} params - Filter parameters
 * @param {string} params.period - Time period (7d|30d|90d)
 * @param {number} params.owner - Owner ID filter
 * @param {number} params.department - Department ID filter
 * @returns {Promise} Dashboard analytics data
 */
export async function getDashboardAnalytics(params = {}) {
  const res = await api.get('/api/dashboard/analytics/', { params });
  return normalizeDashboardAnalytics(res);
}

/**
 * Get sales funnel data
 * @param {Object} params - Filter parameters
 * @param {string} params.period - Time period (7d|30d|90d)
 * @param {number} params.owner - Owner ID filter
 * @param {number} params.department - Department ID filter
 * @returns {Promise} Sales funnel data as list of {label, value}
 */
export async function getFunnelData(params = {}) {
  return api.get('/api/dashboard/funnel/', { params });
}

/**
 * Get activity feed
 * @param {Object} params - Filter parameters
 * @returns {Promise} Activity feed data
 */
export async function getActivityFeed(params = {}) {
  return api.get('/api/dashboard/activity/', { params });
}

/**
 * Get lead channels BI analytics
 * @param {Object} params - Filter parameters
 * @param {string} params.period - Time period (7d|30d|90d)
 * @returns {Promise<{rows: Array, summary: Object}>}
 */
export async function getLeadChannels(params = {}) {
  const res = await api.get('/api/analytics/lead-channels/', { params });
  return normalizeLeadChannelsReport(res);
}

/**
 * Get marketing campaigns BI analytics
 * @param {Object} params - Filter parameters
 * @param {string} params.period - Time period (7d|30d|90d)
 * @returns {Promise<{rows: Array, summary: Object}>}
 */
export async function getMarketingCampaigns(params = {}) {
  const res = await api.get('/api/analytics/marketing-campaigns/', { params });
  return normalizeMarketingCampaignsReport(res);
}

/**
 * Get all dashboard data at once
 * @param {Object} params - Filter parameters
 * @returns {Promise<Object>} Object containing all dashboard data
 */
export async function getAllDashboardData(params = {}) {
  try {
    const [overview, analytics, funnel, activity] = await Promise.all([
      getOverview(params),
      getDashboardAnalytics(params),
      getFunnelData(params),
      getActivityFeed(params),
    ]);

    return {
      overview,
      analytics,
      funnel,
      activity,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    throw error;
  }
}

export default {
  getOverview,
  getDashboardAnalytics,
  getFunnelData,
  getActivityFeed,
  getLeadChannels,
  getMarketingCampaigns,
  getAllDashboardData,
};
