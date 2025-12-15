import { api } from './client.js';

/**
 * Analytics API module
 * Provides functions for fetching analytics and dashboard data
 */

/**
 * Get overview analytics for dashboard
 * @returns {Promise} Analytics overview data
 */
export async function getOverview() {
  try {
    const response = await api.get('/api/analytics/overview/');
    return response;
  } catch (error) {
    console.error('Failed to fetch analytics overview:', error);
    // Return fallback data instead of throwing for graceful degradation
    if (error.message && error.message.includes('Cannot connect to server')) {
      console.warn('Returning fallback overview data - backend unavailable');
      return {
        total_leads: 0,
        total_contacts: 0,
        total_deals: 0,
        total_revenue: 0,
        conversion_rate: 0,
      };
    }
    throw error;
  }
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
  try {
    const response = await api.get('/api/dashboard/analytics/', { params });
    return response;
  } catch (error) {
    console.error('Failed to fetch dashboard analytics:', error);
    // Return fallback data for graceful degradation
    if (error.message && error.message.includes('Cannot connect to server')) {
      console.warn('Returning fallback analytics data - backend unavailable');
      return {
        leads_by_status: [],
        deals_by_stage: [],
        revenue_trend: [],
      };
    }
    throw error;
  }
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
  try {
    const response = await api.get('/api/dashboard/funnel/', { params });
    return response;
  } catch (error) {
    console.error('Failed to fetch funnel data:', error);
    // Return fallback data for graceful degradation
    if (error.message && error.message.includes('Cannot connect to server')) {
      console.warn('Returning fallback funnel data - backend unavailable');
      return [];
    }
    throw error;
  }
}

/**
 * Get activity feed
 * @param {Object} params - Filter parameters
 * @returns {Promise} Activity feed data
 */
export async function getActivityFeed(params = {}) {
  try {
    const response = await api.get('/api/dashboard/activity/', { params });
    return response;
  } catch (error) {
    console.error('Failed to fetch activity feed:', error);
    // Return fallback data for graceful degradation
    if (error.message && error.message.includes('Cannot connect to server')) {
      console.warn('Returning fallback activity data - backend unavailable');
      return [];
    }
    throw error;
  }
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
