/**
 * Payments API
 * 
 * Управление платежами и финансовыми транзакциями
 */

import { api } from './client.js';

// ============================================================================
// Payments (платежи)
// ============================================================================

/**
 * Get all payments
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {number} params.deal - Filter by deal ID
 * @param {number} params.contact - Filter by contact ID
 * @param {string} params.status - Filter by status
 * @param {string} params.payment_method - Filter by payment method
 * @param {string} params.date_from - Filter from date (YYYY-MM-DD)
 * @param {string} params.date_to - Filter to date (YYYY-MM-DD)
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getPayments(params = {}) {
  return api.get('/api/payments/', { params });
}

/**
 * Get single payment by ID
 * @param {number} id - Payment ID
 * @returns {Promise<Object>}
 */
export async function getPayment(id) {
  return api.get(`/api/payments/${id}/`);
}

/**
 * Create new payment
 * @param {Object} data - Payment data
 * @param {number} data.amount - Payment amount (required)
 * @param {string} data.currency - Currency code (required)
 * @param {string} data.payment_method - Payment method (required)
 * @param {string} data.status - Payment status
 * @param {number} data.deal - Related deal ID
 * @param {number} data.contact - Related contact ID
 * @param {string} data.payment_date - Payment date (YYYY-MM-DD)
 * @param {string} data.description - Payment description
 * @param {string} data.transaction_id - External transaction ID
 * @returns {Promise<Object>}
 */
export async function createPayment(data) {
  return api.post('/api/payments/', { body: data });
}

/**
 * Update payment (full update)
 * @param {number} id - Payment ID
 * @param {Object} data - Payment data
 * @returns {Promise<Object>}
 */
export async function updatePayment(id, data) {
  return api.put(`/api/payments/${id}/`, { body: data });
}

/**
 * Partially update payment
 * @param {number} id - Payment ID
 * @param {Object} data - Partial payment data
 * @returns {Promise<Object>}
 */
export async function patchPayment(id, data) {
  return api.patch(`/api/payments/${id}/`, { body: data });
}

/**
 * Delete payment
 * @param {number} id - Payment ID
 * @returns {Promise<void>}
 */
export async function deletePayment(id) {
  return api.delete(`/api/payments/${id}/`);
}

// ============================================================================
// Payment Summary (сводка по платежам)
// ============================================================================

/**
 * Get payment summary statistics
 * @param {Object} params - Query parameters
 * @param {string} params.date_from - Start date (YYYY-MM-DD)
 * @param {string} params.date_to - End date (YYYY-MM-DD)
 * @param {string} params.period - Period (day, week, month, year)
 * @returns {Promise<Object>}
 */
export async function getPaymentSummary(params = {}) {
  return api.get('/api/payments/summary/', { params });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get payments by deal
 * @param {number} dealId - Deal ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getPaymentsByDeal(dealId, params = {}) {
  return getPayments({ ...params, deal: dealId });
}

/**
 * Get payments by contact
 * @param {number} contactId - Contact ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getPaymentsByContact(contactId, params = {}) {
  return getPayments({ ...params, contact: contactId });
}

/**
 * Get payments by status
 * @param {string} status - Payment status (pending, completed, failed, refunded)
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getPaymentsByStatus(status, params = {}) {
  return getPayments({ ...params, status });
}

/**
 * Get payments by date range
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getPaymentsByDateRange(dateFrom, dateTo, params = {}) {
  return getPayments({ ...params, date_from: dateFrom, date_to: dateTo });
}

/**
 * Get payments for current month
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getPaymentsThisMonth(params = {}) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  return getPaymentsByDateRange(firstDay, lastDay, params);
}

/**
 * Get payments for today
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getPaymentsToday(params = {}) {
  const today = new Date().toISOString().split('T')[0];
  return getPaymentsByDateRange(today, today, params);
}

/**
 * Mark payment as completed
 * @param {number} id - Payment ID
 * @returns {Promise<Object>}
 */
export async function markPaymentCompleted(id) {
  return patchPayment(id, { status: 'completed' });
}

/**
 * Mark payment as failed
 * @param {number} id - Payment ID
 * @returns {Promise<Object>}
 */
export async function markPaymentFailed(id) {
  return patchPayment(id, { status: 'failed' });
}

/**
 * Refund payment
 * @param {number} id - Payment ID
 * @returns {Promise<Object>}
 */
export async function refundPayment(id) {
  return patchPayment(id, { status: 'refunded' });
}

/**
 * Get total revenue for period
 * @param {string} dateFrom - Start date
 * @param {string} dateTo - End date
 * @returns {Promise<number>}
 */
export async function getTotalRevenue(dateFrom, dateTo) {
  const summary = await getPaymentSummary({ date_from: dateFrom, date_to: dateTo });
  return summary.total_amount || 0;
}

/**
 * Get revenue by currency
 * @param {string} dateFrom - Start date
 * @param {string} dateTo - End date
 * @returns {Promise<Object>}
 */
export async function getRevenueByCurrency(dateFrom, dateTo) {
  const summary = await getPaymentSummary({ date_from: dateFrom, date_to: dateTo });
  return summary.by_currency || {};
}

/**
 * Get monthly summary for current year
 * @returns {Promise<Object>}
 */
export async function getMonthlySummary() {
  const year = new Date().getFullYear();
  const dateFrom = `${year}-01-01`;
  const dateTo = `${year}-12-31`;
  
  return getPaymentSummary({ 
    date_from: dateFrom, 
    date_to: dateTo,
    period: 'month'
  });
}
