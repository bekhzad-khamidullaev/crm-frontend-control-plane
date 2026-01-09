import client from './client';

const getContacts = (params) => {
  return client.get('/contacts/', { params });
};

const createContact = (data) => {
  return client.post('/contacts/', data);
};

const getContact = (id) => {
  return client.get(`/contacts/${id}/`);
};

const updateContact = (id, data) => {
  return client.put(`/contacts/${id}/`, data);
};

const patchContact = (id, data) => {
  return client.patch(`/contacts/${id}/`, data);
};

const deleteContact = (id) => {
  return client.delete(`/contacts/${id}/`);
};

export default {
  getContacts,
  createContact,
  getContact,
  updateContact,
  patchContact,
  deleteContact,
};
