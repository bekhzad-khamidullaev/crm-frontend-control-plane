import { describe, expect, it } from 'vitest';
import parseLicenseRestriction from '../../src/lib/api/licenseError';
import {
  LICENSE_RESTRICTION_EVENT,
  emitLicenseRestriction,
  parseLicenseRestrictionPayload,
} from '../../src/lib/api/licenseRestrictionBus.js';

describe('license restriction parsing', () => {
  it('parses feature-disabled errors', () => {
    const parsed = parseLicenseRestriction({
      response: {
        status: 403,
        data: {
          code: 'LICENSE_FEATURE_DISABLED',
          details: { feature: 'crm.deals' },
        },
      },
    });

    expect(parsed).toEqual({
      code: 'LICENSE_FEATURE_DISABLED',
      feature: 'crm.deals',
      message: undefined,
    });
  });

  it('parses seat-limit exceeded errors without feature', () => {
    const parsed = parseLicenseRestriction({
      code: 'LICENSE_SEAT_LIMIT_EXCEEDED',
      message: 'Seat cap reached',
    });

    expect(parsed).toEqual({
      code: 'LICENSE_SEAT_LIMIT_EXCEEDED',
      feature: undefined,
      message: 'Seat cap reached',
    });
  });

  it('returns null for non-license errors', () => {
    expect(parseLicenseRestriction({ code: 'FORBIDDEN' })).toBeNull();
  });

  it('parses payload restrictions from fetch client', () => {
    expect(
      parseLicenseRestrictionPayload({
        code: 'LICENSE_EXPIRED',
        message: 'Expired',
      }),
    ).toEqual({
      code: 'LICENSE_EXPIRED',
      feature: 'unknown.feature',
      message: 'Expired',
    });
  });

  it('emits browser event for license restriction payload', () => {
    let received = null;
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent;
      received = customEvent.detail;
    };
    window.addEventListener(LICENSE_RESTRICTION_EVENT, listener as EventListener);

    emitLicenseRestriction({
      code: 'LICENSE_FEATURE_DISABLED',
      feature: 'integrations.core',
      message: 'Blocked',
    });

    window.removeEventListener(LICENSE_RESTRICTION_EVENT, listener as EventListener);

    expect(received).toMatchObject({
      code: 'LICENSE_FEATURE_DISABLED',
      feature: 'integrations.core',
      message: 'Blocked',
    });
  });
});
