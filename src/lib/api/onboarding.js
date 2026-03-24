import { api } from './client.js';

export const getOnboardingState = () =>
  api.get('/api/settings/onboarding/');

export const saveOnboardingProgress = (payload = {}) =>
  api.post('/api/settings/onboarding/progress/', { body: payload });

export const restartOnboarding = () =>
  api.post('/api/settings/onboarding/restart/', { body: {} });

export const bootstrapOnboardingTemplate = (payload = {}) =>
  api.post('/api/settings/onboarding/bootstrap/', { body: payload });
