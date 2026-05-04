import { api as client } from './client';

export const getContacts = (params) => {
  return client.get('/api/contacts/', { params });
};

export const createContact = (data) => {
  return client.post('/api/contacts/', { body: data });
};

export const getContact = (id) => {
  return client.get(`/api/contacts/${id}/`);
};

export const updateContact = (id, data) => {
  return client.put(`/api/contacts/${id}/`, { body: data });
};

export const patchContact = (id, data) => {
  return client.patch(`/api/contacts/${id}/`, { body: data });
};

export const deleteContact = (id) => {
  return client.delete(`/api/contacts/${id}/`);
};
