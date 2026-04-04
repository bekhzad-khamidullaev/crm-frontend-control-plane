import { api } from './client.js';

export async function getWarehouseItems(params = {}) {
  return api.get('/api/warehouse-items/', { params });
}

export async function getWarehouseItem(id) {
  return api.get(`/api/warehouse-items/${id}/`);
}

export async function createWarehouseItem(data) {
  return api.post('/api/warehouse-items/', { body: data });
}

export async function updateWarehouseItem(id, data) {
  return api.put(`/api/warehouse-items/${id}/`, { body: data });
}

export async function patchWarehouseItem(id, data) {
  return api.patch(`/api/warehouse-items/${id}/`, { body: data });
}

export async function deleteWarehouseItem(id) {
  return api.delete(`/api/warehouse-items/${id}/`);
}
