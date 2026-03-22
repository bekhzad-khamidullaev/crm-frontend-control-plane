import { describe, expect, it } from 'vitest';

import { normalizeOverview } from '../../src/lib/api/analytics.js';

describe('normalizeOverview', () => {
  it('preserves currency metadata for analytics revenue when backend provides it', () => {
    expect(
      normalizeOverview({
        total_revenue: 12500,
        revenue_growth: 8.5,
        state_currency: 'usd',
        currency_name: 'US Dollar',
      })
    ).toMatchObject({
      total_revenue: 12500,
      revenue_growth: 8.5,
      currency_code: 'usd',
      currency_name: 'US Dollar',
      state_currency: 'usd',
    });
  });
});
