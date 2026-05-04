/**
 * SMS API - SMS sending and management
 */

import { del, get, patch, post } from './client.js';

/**
 * SMS API
 */
export const smsApi = {
  // Get SMS history
  history: (params) => get('/api/sms/history/', { params }),
  
  // Get available SMS providers
  providers: () => get('/api/sms/providers/'),

  // Create SMS provider
  createProvider: (payload) => post('/api/sms/providers/', { body: payload }),

  // Update SMS provider
  updateProvider: (id, payload) => patch(`/api/sms/providers/${id}/`, { body: payload }),

  // Delete SMS provider
  deleteProvider: (id) => del(`/api/sms/providers/${id}/`),
  
  // Send single SMS
  send: (payload) => post('/api/sms/send/', { body: payload }),
  
  // Send bulk SMS
  sendBulk: (payload) => post('/api/sms/send_bulk/', { body: payload }),
  
  // Get SMS status
  status: (params) => get('/api/sms/status/', { params }),
};

export default smsApi;
