/**
 * CRM Emails API
 * 
 * Управление email перепиской в CRM
 * (не массовые рассылки, а обычная переписка с клиентами)
 */

import { api } from './client.js';

// ============================================================================
// CRM Emails
// ============================================================================

/**
 * Get all CRM emails
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {number} params.contact - Filter by contact ID
 * @param {number} params.lead - Filter by lead ID
 * @param {number} params.deal - Filter by deal ID
 * @param {string} params.direction - Filter by direction (incoming, outgoing)
 * @param {string} params.status - Filter by status
 * @param {string} params.date_from - Filter from date (YYYY-MM-DD)
 * @param {string} params.date_to - Filter to date (YYYY-MM-DD)
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getCrmEmails(params = {}) {
  return api.get('/api/crm-emails/', { params });
}

/**
 * Get single CRM email by ID
 * @param {number} id - Email ID
 * @returns {Promise<Object>}
 */
export async function getCrmEmail(id) {
  return api.get(`/api/crm-emails/${id}/`);
}

/**
 * Create new CRM email
 * @param {Object} data - Email data
 * @param {string} data.subject - Email subject (required)
 * @param {string} data.body - Email body (required)
 * @param {string} data.from_email - Sender email (required)
 * @param {string} data.to_email - Recipient email (required)
 * @param {string} data.cc - CC recipients (comma-separated)
 * @param {string} data.bcc - BCC recipients (comma-separated)
 * @param {string} data.direction - Direction (incoming, outgoing)
 * @param {number} data.contact - Related contact ID
 * @param {number} data.lead - Related lead ID
 * @param {number} data.deal - Related deal ID
 * @param {Array} data.attachments - Attachment file IDs
 * @returns {Promise<Object>}
 */
export async function createCrmEmail(data) {
  return api.post('/api/crm-emails/', data);
}

/**
 * Update CRM email (full update)
 * @param {number} id - Email ID
 * @param {Object} data - Email data
 * @returns {Promise<Object>}
 */
export async function updateCrmEmail(id, data) {
  return api.put(`/api/crm-emails/${id}/`, data);
}

/**
 * Partially update CRM email
 * @param {number} id - Email ID
 * @param {Object} data - Partial email data
 * @returns {Promise<Object>}
 */
export async function patchCrmEmail(id, data) {
  return api.patch(`/api/crm-emails/${id}/`, data);
}

/**
 * Delete CRM email
 * @param {number} id - Email ID
 * @returns {Promise<void>}
 */
export async function deleteCrmEmail(id) {
  return api.delete(`/api/crm-emails/${id}/`);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get emails by contact
 * @param {number} contactId - Contact ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getEmailsByContact(contactId, params = {}) {
  return getCrmEmails({ ...params, contact: contactId });
}

/**
 * Get emails by lead
 * @param {number} leadId - Lead ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getEmailsByLead(leadId, params = {}) {
  return getCrmEmails({ ...params, lead: leadId });
}

/**
 * Get emails by deal
 * @param {number} dealId - Deal ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getEmailsByDeal(dealId, params = {}) {
  return getCrmEmails({ ...params, deal: dealId });
}

/**
 * Get incoming emails
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getIncomingEmails(params = {}) {
  return getCrmEmails({ ...params, direction: 'incoming' });
}

/**
 * Get outgoing emails
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getOutgoingEmails(params = {}) {
  return getCrmEmails({ ...params, direction: 'outgoing' });
}

/**
 * Get emails by date range
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getEmailsByDateRange(dateFrom, dateTo, params = {}) {
  return getCrmEmails({ ...params, date_from: dateFrom, date_to: dateTo });
}

/**
 * Get emails for today
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getEmailsToday(params = {}) {
  const today = new Date().toISOString().split('T')[0];
  return getEmailsByDateRange(today, today, params);
}

/**
 * Search emails by query
 * @param {string} query - Search query
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function searchEmails(query, params = {}) {
  return getCrmEmails({ ...params, search: query });
}

/**
 * Send email to contact
 * @param {number} contactId - Contact ID
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {string} fromEmail - Sender email
 * @param {Object} additionalData - Additional email data (cc, bcc, attachments)
 * @returns {Promise<Object>}
 */
export async function sendEmailToContact(contactId, subject, body, fromEmail, additionalData = {}) {
  return createCrmEmail({
    contact: contactId,
    subject,
    body,
    from_email: fromEmail,
    to_email: additionalData.to_email, // должен быть предоставлен
    direction: 'outgoing',
    ...additionalData,
  });
}

/**
 * Send email to lead
 * @param {number} leadId - Lead ID
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {string} fromEmail - Sender email
 * @param {string} toEmail - Recipient email
 * @param {Object} additionalData - Additional email data
 * @returns {Promise<Object>}
 */
export async function sendEmailToLead(leadId, subject, body, fromEmail, toEmail, additionalData = {}) {
  return createCrmEmail({
    lead: leadId,
    subject,
    body,
    from_email: fromEmail,
    to_email: toEmail,
    direction: 'outgoing',
    ...additionalData,
  });
}

/**
 * Reply to email
 * @param {number} originalEmailId - Original email ID
 * @param {string} body - Reply body
 * @param {string} fromEmail - Sender email
 * @returns {Promise<Object>}
 */
export async function replyToEmail(originalEmailId, body, fromEmail) {
  const originalEmail = await getCrmEmail(originalEmailId);
  
  return createCrmEmail({
    subject: `Re: ${originalEmail.subject}`,
    body,
    from_email: fromEmail,
    to_email: originalEmail.from_email,
    contact: originalEmail.contact,
    lead: originalEmail.lead,
    deal: originalEmail.deal,
    direction: 'outgoing',
  });
}

/**
 * Forward email
 * @param {number} originalEmailId - Original email ID
 * @param {string} toEmail - Forward to email
 * @param {string} fromEmail - Sender email
 * @param {string} additionalMessage - Additional message
 * @returns {Promise<Object>}
 */
export async function forwardEmail(originalEmailId, toEmail, fromEmail, additionalMessage = '') {
  const originalEmail = await getCrmEmail(originalEmailId);
  
  return createCrmEmail({
    subject: `Fwd: ${originalEmail.subject}`,
    body: `${additionalMessage}\n\n--- Forwarded message ---\n${originalEmail.body}`,
    from_email: fromEmail,
    to_email: toEmail,
    direction: 'outgoing',
  });
}

/**
 * Mark email as read
 * @param {number} id - Email ID
 * @returns {Promise<Object>}
 */
export async function markEmailAsRead(id) {
  return patchCrmEmail(id, { is_read: true });
}

/**
 * Mark email as unread
 * @param {number} id - Email ID
 * @returns {Promise<Object>}
 */
export async function markEmailAsUnread(id) {
  return patchCrmEmail(id, { is_read: false });
}

/**
 * Get unread emails count
 * @returns {Promise<number>}
 */
export async function getUnreadEmailsCount() {
  const response = await getCrmEmails({ is_read: false, page_size: 1 });
  return response.count || 0;
}

/**
 * Get email thread/conversation
 * @param {number} contactId - Contact ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getEmailThread(contactId, params = {}) {
  return getEmailsByContact(contactId, {
    ...params,
    ordering: 'created_at',
  });
}
