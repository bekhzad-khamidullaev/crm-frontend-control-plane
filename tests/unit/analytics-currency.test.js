import { describe, expect, it } from 'vitest';

import {
  extractCurrencyBreakdown,
  formatAdditiveSummaryValue,
  formatAnalyticsMonetaryValue,
  formatUnitSummaryValue,
} from '../../src/lib/utils/analyticsCurrency.js';

describe('analytics currency helpers', () => {
  it('formats additive mixed-currency rows as breakdowns', () => {
    const result = formatAdditiveSummaryValue(3100, {
      rows: [
        { cost: 3000, currency_code: 'RUB' },
        { cost: 100, currency_code: 'USD' },
      ],
      amountKey: 'cost',
    });

    expect(result).toMatch(/3\s?000.*₽/);
    expect(result).toMatch(/100.*\$/);
  });

  it('prefers backend summary breakdowns when they are present', () => {
    const result = formatAdditiveSummaryValue(0, {
      summary: {
        total_revenue_by_currency: {
          RUB: 8000,
          USD: 500,
        },
      },
      breakdownKeys: ['total_revenue_by_currency'],
    });

    expect(result).toMatch(/8\s?000.*₽/);
    expect(result).toMatch(/500.*\$/);
  });

  it('marks unit metrics as mixed currency when rows span multiple currencies', () => {
    const result = formatUnitSummaryValue(93, {
      rows: [
        { cpl: 150, currency_code: 'RUB' },
        { cpl: 25, currency_code: 'USD' },
      ],
      amountKey: 'cpl',
    });

    expect(result).toBe('Mixed currencies');
  });

  it('formats analytics monetary values as plain numbers when currency is unknown', () => {
    const result = formatAnalyticsMonetaryValue(9000);
    expect(result).toContain('9');
    expect(result).not.toMatch(/[₽$€]/);
  });

  it('extracts currency breakdown from summary objects', () => {
    expect(
      extractCurrencyBreakdown(
        {
          total_cost_by_currency: {
            RUB: 3000,
            USD: 100,
          },
        },
        ['total_cost_by_currency'],
      ),
    ).toEqual([
      { currencyCode: 'RUB', amount: 3000 },
      { currencyCode: 'USD', amount: 100 },
    ]);
  });
});
