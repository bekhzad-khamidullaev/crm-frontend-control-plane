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

export function normalizeOverview(data = {}) {
  if (!data || typeof data !== 'object') return {};
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
    monthly_growth = rawGrowth;
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

export async function getOverview() {
  const res = await api.get('/api/analytics/overview/');
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
 * Get all dashboard data at once
 * @param {Object} params - Filter parameters
 * @returns {Promise<Object>} Object containing all dashboard data
 */
export async function getAllDashboardData(params = {}) {
  try {
    const [overview, analytics, funnel, activity] = await Promise.all([
      getOverview(),
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
  getAllDashboardData,
};
