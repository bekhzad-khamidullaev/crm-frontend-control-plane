import { api } from './client.js';

export async function getBusinessProcessTemplates(params = {}) {
  return api.get('/api/business-processes/templates/', { params });
}

export async function getBusinessProcessTemplate(id) {
  return api.get(`/api/business-processes/templates/${id}/`);
}

export async function createBusinessProcessTemplate(body) {
  return api.post('/api/business-processes/templates/', { body });
}

export async function updateBusinessProcessTemplate(id, body) {
  return api.patch(`/api/business-processes/templates/${id}/`, { body });
}

export async function launchBusinessProcessTemplate(id, body = {}) {
  return api.post(`/api/business-processes/templates/${id}/launch/`, { body });
}

export async function getBusinessProcessInstances(params = {}) {
  return api.get('/api/business-processes/instances/', { params });
}

export async function getBusinessProcessInstance(id) {
  return api.get(`/api/business-processes/instances/${id}/`);
}

export async function advanceBusinessProcessInstance(id) {
  return api.post(`/api/business-processes/instances/${id}/advance/`, { body: {} });
}

export async function cancelBusinessProcessInstance(id, reason = '') {
  return api.post(`/api/business-processes/instances/${id}/cancel/`, { body: { reason } });
}
