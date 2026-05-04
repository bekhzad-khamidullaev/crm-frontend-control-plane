import { api } from './client.js';

export async function getMeetings(params = {}) {
  return api.get('/api/meetings/', { params });
}

export async function getMeeting(id) {
  return api.get(`/api/meetings/${id}/`);
}

export async function createMeeting(data) {
  return api.post('/api/meetings/', { body: data });
}

export async function updateMeeting(id, data) {
  return api.put(`/api/meetings/${id}/`, { body: data });
}

export async function patchMeeting(id, data) {
  return api.patch(`/api/meetings/${id}/`, { body: data });
}

export async function deleteMeeting(id) {
  return api.delete(`/api/meetings/${id}/`);
}
