import { api } from './client.js';

export async function getFinancePlans(params = {}) {
  return api.get('/api/finance-plans/', { params });
}

export async function getFinancePlan(id) {
  return api.get(`/api/finance-plans/${id}/`);
}

export async function createFinancePlan(data) {
  return api.post('/api/finance-plans/', { body: data });
}

export async function updateFinancePlan(id, data) {
  return api.put(`/api/finance-plans/${id}/`, { body: data });
}

export async function patchFinancePlan(id, data) {
  return api.patch(`/api/finance-plans/${id}/`, { body: data });
}

export async function deleteFinancePlan(id) {
  return api.delete(`/api/finance-plans/${id}/`);
}
