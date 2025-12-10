/**
 * SMS API - SMS sending and management
 */

import { get, post } from './client.js';

/**
 * SMS API
 */
export const smsApi = {
  // Get SMS history
  history: (params) => get('/api/sms/history/', { params }),
  
  // Get available SMS providers
  providers: () => get('/api/sms/providers/'),
  
  // Send single SMS
  send: (payload) => post('/api/sms/send/', { body: payload }),
  
  // Send bulk SMS
  sendBulk: (payload) => post('/api/sms/send_bulk/', { body: payload }),
  
  // Get SMS status
  status: (params) => get('/api/sms/status/', { params }),
};

export default smsApi;
