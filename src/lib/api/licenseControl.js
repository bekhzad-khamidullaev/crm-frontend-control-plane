import { api } from './client';

export async function getCpCustomers(params = {}) {
  return api.get('/api/cp/customers/', { params });
}

export async function getCpCustomerDetail(customerId) {
  return api.get(`/api/cp/customers/${customerId}/detail/`);
}

export async function getCpUnlicensedDeployments() {
  return api.get('/api/cp/deployments/unlicensed/');
}

export async function assignCpDeploymentLicense(deploymentId, subscriptionId) {
  return api.post(`/api/cp/deployments/${deploymentId}/assign-license/`, {
    body: { subscription_id: subscriptionId },
  });
}

export async function getCpRuntimeUnlicensedRequests() {
  return api.get('/api/cp/runtime-license-requests/unlicensed/');
}

export async function getCpSubscriptions(params = {}) {
  return api.get('/api/cp/subscriptions/', { params });
}

export async function getCpDeployments(params = {}) {
  return api.get('/api/cp/deployments/', { params });
}

export async function approveCpRuntimeRequest(requestId, payload) {
  return api.post(`/api/cp/runtime-license-requests/${requestId}/approve/`, { body: payload });
}
