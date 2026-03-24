import {
  countDistinctCurrencies,
  formatCurrency,
  formatCurrencyBreakdownFromItems,
  formatNumber,
  normalizeCurrencyCode,
  resolveCurrencyCode,
} from './format.js';

const DEFAULT_RECORD_CURRENCY_KEYS = ['currency_code', 'currency_name'];
const DEFAULT_SUMMARY_CURRENCY_KEYS = ['currency_code', 'currency_name', 'currency', 'currencyCode', 'currencyName'];

function toNumericValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCurrencyBreakdownEntries(rawBreakdown) {
  if (!rawBreakdown || typeof rawBreakdown !== 'object' || Array.isArray(rawBreakdown)) {
    return [];
  }

  return Object.entries(rawBreakdown)
    .map(([currencyCode, amount]) => {
      const numericAmount = toNumericValue(amount);
      if (numericAmount === null) return null;
      return {
        currencyCode: normalizeCurrencyCode(currencyCode),
        amount: numericAmount,
      };
    })
    .filter(Boolean);
}

export function extractCurrencyBreakdown(source, keys = []) {
  if (!source || typeof source !== 'object') return [];

  for (const key of keys) {
    const entries = normalizeCurrencyBreakdownEntries(source?.[key]);
    if (entries.length) return entries;
  }

  return [];
}

export function formatCurrencyBreakdownEntries(entries) {
  const items = Array.isArray(entries) ? entries.filter(({ amount }) => amount !== 0) : [];
  if (!items.length) return '—';

  return items
    .map(({ currencyCode, amount }) => formatCurrency(amount, currencyCode))
    .join(' + ');
}

export function getSingleCurrencyCode(
  rows,
  { currencyKeys = DEFAULT_RECORD_CURRENCY_KEYS } = {},
) {
  const codes = Array.from(
    new Set(
      (Array.isArray(rows) ? rows : [])
        .map((row) => resolveCurrencyCode(row, { currencyKeys, fallback: null }))
        .filter(Boolean),
    ),
  );

  return codes.length === 1 ? codes[0] : null;
}

export function formatAnalyticsMonetaryValue(value, { currencyCode = null } = {}) {
  return currencyCode ? formatCurrency(value, currencyCode) : formatNumber(value);
}

export function formatAdditiveSummaryValue(
  value,
  {
    rows = [],
    amountKey = 'amount',
    summary = null,
    breakdownKeys = [],
    currencyKeys = DEFAULT_RECORD_CURRENCY_KEYS,
    summaryCurrencyKeys = DEFAULT_SUMMARY_CURRENCY_KEYS,
  } = {},
) {
  const summaryBreakdown = extractCurrencyBreakdown(summary, breakdownKeys);
  if (summaryBreakdown.length) {
    return formatCurrencyBreakdownEntries(summaryBreakdown);
  }

  const summaryCurrencyCode = resolveCurrencyCode(summary, {
    currencyKeys: summaryCurrencyKeys,
    fallback: null,
  });
  if (summaryCurrencyCode) {
    return formatCurrency(value, summaryCurrencyCode);
  }

  const distinctRowCurrencies = countDistinctCurrencies(rows, { amountKey, currencyKeys });
  if (distinctRowCurrencies > 1) {
    return formatCurrencyBreakdownFromItems(rows, { amountKey, currencyKeys });
  }

  const singleRowCurrencyCode = getSingleCurrencyCode(rows, { currencyKeys });
  if (singleRowCurrencyCode) {
    return formatCurrency(value, singleRowCurrencyCode);
  }

  return formatNumber(value);
}

export function formatUnitSummaryValue(
  value,
  {
    rows = [],
    amountKey = 'amount',
    summary = null,
    currencyKeys = DEFAULT_RECORD_CURRENCY_KEYS,
    summaryCurrencyKeys = DEFAULT_SUMMARY_CURRENCY_KEYS,
    mixedLabel = 'Mixed currencies',
  } = {},
) {
  const summaryCurrencyCode = resolveCurrencyCode(summary, {
    currencyKeys: summaryCurrencyKeys,
    fallback: null,
  });
  if (summaryCurrencyCode) {
    return formatCurrency(value, summaryCurrencyCode);
  }

  const distinctRowCurrencies = countDistinctCurrencies(rows, { amountKey, currencyKeys });
  if (distinctRowCurrencies > 1) {
    return mixedLabel;
  }

  const singleRowCurrencyCode = getSingleCurrencyCode(rows, { currencyKeys });
  if (singleRowCurrencyCode) {
    return formatCurrency(value, singleRowCurrencyCode);
  }

  return formatNumber(value);
}
