/**
 * Settings API - Application settings
 */

import { get, patch } from './client.js';

/**
 * Settings API
 */
export const settingsApi = {
  // Get massmail settings
  massmail: () => get('/api/settings/massmail/'),
  updateMassmail: (payload) => patch('/api/settings/massmail/', { body: payload }),
  
  // Get public email domains list
  publicEmailDomains: () => get('/api/settings/public_email_domains/'),
  
  // Get reminders settings
  reminders: () => get('/api/settings/reminders/'),
  updateReminders: (payload) => patch('/api/settings/reminders/', { body: payload }),
};

export default settingsApi;
