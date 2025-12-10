/**
 * Settings API - Application settings
 */

import { get } from './client.js';

/**
 * Settings API
 */
export const settingsApi = {
  // Get massmail settings
  massmail: () => get('/api/settings/massmail/'),
  
  // Get public email domains list
  publicEmailDomains: () => get('/api/settings/public_email_domains/'),
  
  // Get reminders settings
  reminders: () => get('/api/settings/reminders/'),
};

export default settingsApi;
