import { api } from './client';

export async function getCpCustomers(params = {}) {
  return api.get('/api/cp/customers/', { params });
}

export async function createCpCustomer(payload) {
  return api.post('/api/cp/customers/', { body: payload });
}

export async function updateCpCustomer(customerId, payload) {
  return api.patch(`/api/cp/customers/${customerId}/`, { body: payload });
}

export async function deleteCpCustomer(customerId) {
  return api.delete(`/api/cp/customers/${customerId}/`);
}

export async function getCpCustomerDetail(customerId) {
  return api.get(`/api/cp/customers/${customerId}/detail/`);
}

export async function createCpDeployment(payload) {
  return api.post('/api/cp/deployments/', { body: payload });
}

export async function updateCpDeployment(deploymentId, payload) {
  return api.patch(`/api/cp/deployments/${deploymentId}/`, { body: payload });
}

export async function deleteCpDeployment(deploymentId) {
  return api.delete(`/api/cp/deployments/${deploymentId}/`);
}

export async function getCpUnlicensedDeployments(params = {}) {
  return api.get('/api/cp/deployments/unlicensed/', { params });
}

export async function assignCpDeploymentLicense(deploymentId, subscriptionId) {
  return api.post(`/api/cp/deployments/${deploymentId}/assign-license/`, {
    body: { subscription_id: subscriptionId },
  });
}

export async function getCpRuntimeUnlicensedRequests(params = {}) {
  return api.get('/api/cp/runtime-license-requests/unlicensed/', { params });
}

export async function getCpSubscriptions(params = {}) {
  return api.get('/api/cp/subscriptions/', { params });
}

export async function createCpSubscription(payload) {
  return api.post('/api/cp/subscriptions/', { body: payload });
}

export async function updateCpSubscription(subscriptionId, payload) {
  return api.patch(`/api/cp/subscriptions/${subscriptionId}/`, { body: payload });
}

export async function deleteCpSubscription(subscriptionId) {
  return api.delete(`/api/cp/subscriptions/${subscriptionId}/`);
}

export async function getCpDeployments(params = {}) {
  return api.get('/api/cp/deployments/', { params });
}

export async function getCpFeatures(params = {}) {
  return api.get('/api/cp/features/', { params });
}

export async function createCpFeature(payload) {
  return api.post('/api/cp/features/', { body: payload });
}

export async function updateCpFeature(featureId, payload) {
  return api.patch(`/api/cp/features/${featureId}/`, { body: payload });
}

export async function deleteCpFeature(featureId) {
  return api.delete(`/api/cp/features/${featureId}/`);
}

export async function getCpPlans(params = {}) {
  return api.get('/api/cp/plans/', { params });
}

export async function createCpPlan(payload) {
  return api.post('/api/cp/plans/', { body: payload });
}

export async function updateCpPlan(planId, payload) {
  return api.patch(`/api/cp/plans/${planId}/`, { body: payload });
}

export async function deleteCpPlan(planId) {
  return api.delete(`/api/cp/plans/${planId}/`);
}

export async function getCpLicenseAudit(params = {}) {
  return api.get('/api/cp/license-audit/', { params });
}

export async function getCpLicenses(params = {}) {
  return api.get('/api/cp/licenses/', { params });
}

export async function getCpLicenseArtifact(issueId) {
  return api.get(`/api/cp/licenses/${issueId}/artifact/`);
}

export async function revokeCpLicense(issueId, reason = "") {
  return api.post(`/api/cp/licenses/${issueId}/revoke/`, {
    body: { reason },
  });
}

export async function getCpOverview() {
  return api.get('/api/cp/overview/');
}

export async function getLicenseMe() {
  return api.get('/api/license/me/');
}

export async function getLicenseOperationsSummary(params = {}) {
  return api.get('/api/license/operations-summary/', { params });
}

export async function getLicenseCoverageSummary() {
  return api.get('/api/license/coverage-summary/');
}

export async function approveCpRuntimeRequest(requestId, payload) {
  return api.post(`/api/cp/runtime-license-requests/${requestId}/approve/`, { body: payload });
}

export async function rejectCpRuntimeRequest(requestId, reviewNote = '') {
  return api.post(`/api/cp/runtime-license-requests/${requestId}/reject/`, {
    body: { review_note: reviewNote },
  });
}
