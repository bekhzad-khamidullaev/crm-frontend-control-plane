import { describe, expect, it } from 'vitest';
import { formatBackendError } from '../../src/pages/control-plane-admin/sections/utils.js';

describe('control-plane admin utils', () => {
  describe('formatBackendError', () => {
    it('formats code, message, and detail from backend payloads', () => {
      const error = {
        response: {
          data: {
            details: {
              code: 'LICENSE_LIMIT_REACHED',
              message: 'No available seats',
              detail: 'Activate 2 more seats to continue',
            },
          },
        },
      };

      expect(formatBackendError(error, 'Fallback message')).toBe(
        'code: LICENSE_LIMIT_REACHED | message: No available seats | detail: Activate 2 more seats to continue',
      );
    });

    it('returns the provided fallback when the error has no useful payload', () => {
      expect(formatBackendError(null, 'Fallback message')).toBe('Fallback message');
      expect(formatBackendError({}, 'Fallback message')).toBe('Fallback message');
    });
  });
});
