import { api as client } from './client';

export const getContacts = (params) => {
  return client.get('/contacts/', { params });
};

export const createContact = (data) => {
  return client.post('/contacts/', data);
};

export const getContact = (id) => {
  return client.get(`/contacts/${id}/`);
};

export const updateContact = (id, data) => {
  return client.put(`/contacts/${id}/`, data);
};

export const patchContact = (id, data) => {
  return client.patch(`/contacts/${id}/`, data);
};

export const deleteContact = (id) => {
  return client.delete(`/contacts/${id}/`);
};
