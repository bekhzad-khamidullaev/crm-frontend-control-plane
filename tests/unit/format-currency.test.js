import { describe, expect, it } from 'vitest';

import {
  buildCurrencyTotals,
  countDistinctCurrencies,
  formatCurrencyBreakdownFromItems,
  resolveCurrencyCode,
} from '../../src/lib/utils/format.js';

describe('currency formatting helpers', () => {
  it('groups totals by normalized currency code', () => {
    expect(
      buildCurrencyTotals([
        { amount: '10', currency_code: 'usd' },
        { amount: '15', currency_code: '$' },
        { amount: '25', currency_code: 'UZS' },
        { amount: 'bad', currency_code: 'USD' },
      ])
    ).toEqual([
      { currencyCode: 'USD', amount: 25 },
      { currencyCode: 'UZS', amount: 25 },
    ]);
  });

  it('counts only known distinct currencies for mixed-currency UI', () => {
    expect(
      countDistinctCurrencies([
        { amount: '10', currency_code: 'usd' },
        { amount: '5', currency_code: '$' },
        { amount: '1', currency_code: null },
        { amount: '7', currency_code: 'UZS' },
      ])
    ).toBe(2);
  });

  it('resolves currency from currency_name fallback fields', () => {
    expect(resolveCurrencyCode({ currency_name: 'usd' }, { fallback: null })).toBe('USD');
    expect(
      buildCurrencyTotals([
        { amount: '10', currency_name: 'USD' },
        { amount: '15', currency_name: '$' },
      ])
    ).toEqual([{ currencyCode: 'USD', amount: 25 }]);
  });

  it('builds a readable breakdown for multi-currency totals', () => {
    const result = formatCurrencyBreakdownFromItems([
      { amount: '1500', currency_code: 'RUB' },
      { amount: '20', currency_code: 'USD' },
    ]);

    expect(result).toContain('₽');
    expect(result).toContain('$');
    expect(result).toContain(' + ');
  });
});
