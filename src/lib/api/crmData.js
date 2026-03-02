import { api } from './client.js';

export async function exportCrmDataExcel() {
  try {
    return await api.get('/api/crm-data/export/', { responseType: 'blob' });
  } catch (error) {
    // Fallback for deployments with strict no-trailing-slash routing
    return api.get('/api/crm-data/export', { responseType: 'blob' });
  }
}

export async function importCrmDataExcel(file) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    return await api.post('/api/crm-data/import/', { body: formData });
  } catch (error) {
    // Fallback for deployments with strict no-trailing-slash routing
    return api.post('/api/crm-data/import', { body: formData });
  }
}
