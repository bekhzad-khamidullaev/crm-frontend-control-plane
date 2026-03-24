import { api } from './client';

export async function getLicenseEntitlements() {
  return api.get('/api/license/me/');
}

export async function getLicenseChallenge() {
  return api.get('/api/license/challenge/');
}

export async function verifyLicenseArtifact(payload, signature) {
  return api.post('/api/license/verify/', { body: { payload, signature } });
}

export async function installLicenseArtifact(payload, signature) {
  return api.post('/api/license/install/', { body: { payload, signature } });
}

export async function getLicenseEvents() {
  return api.get('/api/license/events/');
}
