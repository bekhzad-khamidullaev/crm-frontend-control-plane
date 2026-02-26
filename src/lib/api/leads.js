import { leadsApi } from './client';

export const getLeads = (params) => leadsApi.list(params);
export const getLead = (id) => leadsApi.retrieve(id);
export const createLead = (payload) => leadsApi.create(payload);
export const updateLead = (id, payload) => leadsApi.update(id, payload);
export const patchLead = (id, payload) => leadsApi.patch(id, payload);
export const deleteLead = (id) => leadsApi.remove(id);
export const assignLead = (id, payload) => leadsApi.assign(id, payload);
export const convertLead = (id, payload) => leadsApi.convert(id, payload);
export const disqualifyLead = (id, payload) => leadsApi.disqualify(id, payload);
export const bulkTagLeads = (payload) => leadsApi.bulkTag(payload);
