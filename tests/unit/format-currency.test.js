import { describe, expect, it } from 'vitest';

import {
  buildCurrencyTotals,
  formatCurrencyForRecord,
  resolveCurrencyCode,
} from '../../src/lib/utils/format.js';

describe('currency formatting helpers', () => {
  it('uses currency_name when currency_code is absent', () => {
    expect(
      formatCurrencyForRecord('1500.5', { currency_name: 'USD' })
    ).toMatch(/\$|USD/);
  });

  it('falls back to numeric formatting when no currency metadata is present', () => {
    expect(formatCurrencyForRecord('1500.5', {})).toContain('1');
  });

  it('resolves record currency from currency_name', () => {
    expect(resolveCurrencyCode({ currency_name: 'UZS' }, { fallback: null })).toBe('UZS');
  });

  it('groups totals by currency_name when currency_code is absent', () => {
    const totals = buildCurrencyTotals([
      { amount: '100', currency_name: 'USD' },
      { amount: '50', currency_name: 'USD' },
      { amount: '200', currency_name: 'UZS' },
    ]);

    expect(totals).toEqual([
      { currencyCode: 'USD', amount: 150 },
      { currencyCode: 'UZS', amount: 200 },
    ]);
  });
});
