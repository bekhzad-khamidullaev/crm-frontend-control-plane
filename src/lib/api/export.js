/**
 * Export API
 * Export data to CSV/Excel
 */

import { api } from './client';

/**
 * Export data to CSV
 * @param {string} entityType - Entity type (leads, contacts, deals, etc.)
 * @param {Object} params - Export parameters
 * @param {Array<string>} params.fields - Fields to export
 * @param {Object} params.filters - Filters to apply
 * @param {string} params.format - Export format (csv, xlsx)
 * @returns {Promise<Blob>}
 */
export async function exportData(entityType, params = {}) {
  const { fields, filters, format = 'csv' } = params;
  
  const response = await api.get(`/api/${entityType}/export/`, {
    params: {
      fields: fields?.join(','),
      format,
      ...filters,
    },
    responseType: 'blob',
  });

  return response;
}

/**
 * Export projects
 * Note: According to Django-CRM API.yaml, only /api/projects/export/ exists
 */
export async function exportProjects(params = {}) {
  return exportData('projects', params);
}

/**
 * Export leads
 * Note: This endpoint doesn't exist in Django-CRM API.yaml
 * This is a placeholder that will fail gracefully
 */
export async function exportLeads(params = {}) {
  try {
    return await exportData('leads', params);
  } catch (error) {
    console.warn('Export endpoint for leads not available in API');
    throw new Error('Leads export requires backend implementation');
  }
}

/**
 * Export contacts
 * Note: This endpoint doesn't exist in Django-CRM API.yaml
 */
export async function exportContacts(params = {}) {
  try {
    return await exportData('contacts', params);
  } catch (error) {
    console.warn('Export endpoint for contacts not available in API');
    throw new Error('Contacts export requires backend implementation');
  }
}

/**
 * Export deals
 * Note: This endpoint doesn't exist in Django-CRM API.yaml
 */
export async function exportDeals(params = {}) {
  try {
    return await exportData('deals', params);
  } catch (error) {
    console.warn('Export endpoint for deals not available in API');
    throw new Error('Deals export requires backend implementation');
  }
}

/**
 * Export tasks
 * Note: This endpoint doesn't exist in Django-CRM API.yaml
 */
export async function exportTasks(params = {}) {
  try {
    return await exportData('tasks', params);
  } catch (error) {
    console.warn('Export endpoint for tasks not available in API');
    throw new Error('Tasks export requires backend implementation');
  }
}

/**
 * Download exported file
 * @param {Blob} blob - File blob
 * @param {string} filename - File name
 */
export function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Export and download
 */
export async function exportAndDownload(entityType, params = {}, filename = null) {
  try {
    const blob = await exportData(entityType, params);
    const defaultFilename = `${entityType}_${new Date().toISOString().split('T')[0]}.${params.format || 'csv'}`;
    downloadFile(blob, filename || defaultFilename);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}
