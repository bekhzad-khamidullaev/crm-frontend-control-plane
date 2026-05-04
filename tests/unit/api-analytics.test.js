import { describe, expect, it } from 'vitest';

import {
  normalizeLeadChannelsReport,
  normalizeMarketingCampaignsReport,
  normalizeDashboardAnalytics,
  normalizeOverview,
} from '../../src/lib/api/analytics.js';

describe('analytics api normalization', () => {
  it('preserves campaign row currencies and summary breakdowns', () => {
    const result = normalizeMarketingCampaignsReport({
      rows: [
        {
          campaign: 'Spring Push',
          cost: 3000,
          revenue: 8000,
          currency_name: 'RUB',
        },
        {
          campaign: 'USD Retargeting',
          cost: 100,
          revenue: 500,
          currency_code: 'USD',
        },
      ],
      summary: {
        total_cost: 3100,
        total_revenue: 8500,
        total_cost_by_currency: {
          RUB: 3000,
          USD: 100,
        },
        total_revenue_by_currency: {
          RUB: 8000,
          USD: 500,
        },
      },
    });

    expect(result.rows[0]).toMatchObject({
      currency_code: 'RUB',
      currency_name: 'RUB',
    });
    expect(result.rows[1]).toMatchObject({
      currency_code: 'USD',
      currency_name: 'USD',
    });
    expect(result.summary.total_cost_by_currency).toEqual({ RUB: 3000, USD: 100 });
    expect(result.summary.total_revenue_by_currency).toEqual({ RUB: 8000, USD: 500 });
  });

  it('preserves lead channel row currency names', () => {
    const result = normalizeLeadChannelsReport({
      rows: [
        {
          channel: 'Telegram',
          revenue: 2500,
          currency_name: 'EUR',
        },
      ],
      summary: {
        total_revenue: 2500,
        total_revenue_by_currency: {
          EUR: 2500,
        },
      },
    });

    expect(result.rows[0]).toMatchObject({
      currency_code: 'EUR',
      currency_name: 'EUR',
    });
    expect(result.summary.total_revenue_by_currency).toEqual({ EUR: 2500 });
  });

  it('keeps overview revenue breakdown when backend provides it', () => {
    const result = normalizeOverview({
      total_revenue: 9000,
      total_revenue_by_currency: {
        RUB: 8000,
        USD: 1000,
      },
    });

    expect(result.total_revenue_by_currency).toEqual({ RUB: 8000, USD: 1000 });
  });

  it('preserves overview currency display metadata from nested deals payload', () => {
    const result = normalizeOverview({
      deals: {
        total_amount: 9000,
        amount_currency: null,
        amount_currency_codes: ['RUB', 'USD'],
        amount_is_mixed_currency: true,
        amount_display_mode: 'mixed_currency_unscaled',
      },
    });

    expect(result).toMatchObject({
      total_revenue: 9000,
      amount_currency: null,
      amount_currency_codes: ['RUB', 'USD'],
      amount_is_mixed_currency: true,
      amount_display_mode: 'mixed_currency_unscaled',
    });
  });

  it('does not emit a fake overview currency when revenue breakdown is mixed', () => {
    const result = normalizeOverview({
      currency_code: 'RUB',
      total_revenue_by_currency: {
        RUB: 8000,
        USD: 1000,
      },
    });

    expect(result.currency_code).toBeNull();
    expect(result.currency_name).toBeNull();
  });

  it('normalizes dashboard monthly growth series and keeps currency metadata', () => {
    const result = normalizeDashboardAnalytics({
      currency_code: 'USD',
      monthly_growth: {
        labels: ['Jan', 'Feb'],
        revenue_series: [100, 150],
        deals_series: [2, 3],
        leads_series: [5, 7],
        revenue_currency_code: 'EUR',
      },
    });

    expect(result.monthly_growth).toMatchObject({
      labels: ['Jan', 'Feb'],
      revenue: [100, 150],
      deals: [2, 3],
      leads: [5, 7],
      currency_code: 'EUR',
    });
  });
});
