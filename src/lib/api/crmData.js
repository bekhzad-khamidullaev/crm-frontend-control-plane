import { api } from './client.js';

export async function exportCrmDataExcel() {
  return api.get('/api/crm-data/export/', { responseType: 'blob' });
}

export async function importCrmDataExcel(file) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/crm-data/import/', { body: formData });
}
