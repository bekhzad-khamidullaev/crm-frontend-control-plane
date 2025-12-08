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
 * Export leads
 */
export async function exportLeads(params = {}) {
  return exportData('leads', params);
}

/**
 * Export contacts
 */
export async function exportContacts(params = {}) {
  return exportData('contacts', params);
}

/**
 * Export deals
 */
export async function exportDeals(params = {}) {
  return exportData('deals', params);
}

/**
 * Export tasks
 */
export async function exportTasks(params = {}) {
  return exportData('tasks', params);
}

/**
 * Export projects
 */
export async function exportProjects(params = {}) {
  return exportData('projects', params);
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
