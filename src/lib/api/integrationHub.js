import { api } from './client';

export async function getIntegrationCatalog() {
  return api.get('/api/settings/integration-hub/catalog/');
}

export async function getIntegrationStatusCards() {
  return api.get('/api/settings/integration-hub/status-cards/');
}

export async function getIntegrationWizardContext(channel) {
  return api.get('/api/settings/integration-hub/wizard-context/', {
    params: { channel },
  });
}

