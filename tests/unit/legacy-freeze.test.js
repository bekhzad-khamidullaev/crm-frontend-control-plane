import { afterEach, describe, expect, it } from 'vitest';
import { getControlPlaneTargetUrl, getLegacyFreezeCopy } from '../../src/lib/controlPlaneRedirect.js';

describe('controlPlaneRedirect', () => {
  afterEach(() => {
    window.__APP_CONFIG__ = undefined;
  });

  it('builds a control-plane redirect url from runtime config', () => {
    window.__APP_CONFIG__ = {
      controlPlaneBaseUrl: 'https://console.crm.windevs.uz',
    };

    expect(getControlPlaneTargetUrl('/chat')).toBe('https://console.crm.windevs.uz/#/chat');
  });

  it('returns onboarding copy with explicit control-plane target', () => {
    expect(getLegacyFreezeCopy('onboarding')).toEqual({
      title: 'Onboarding moved to control-plane',
      description:
        'The legacy onboarding wizard is frozen in crm-frontend. Open crm-frontend-control-plane to continue setup.',
      targetPath: '/onboarding',
      ctaLabel: 'Open onboarding in control-plane',
    });
  });
});
