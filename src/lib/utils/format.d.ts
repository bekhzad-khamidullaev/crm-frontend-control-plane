export const APP_LOCALE: string;
export const APP_CURRENCY_CODE: string;

export function normalizeCurrencyCode(value: unknown): string;
export function resolveCurrencyCode(
  record: unknown,
  options?: {
    currencyKeys?: string[];
    fallback?: string | null;
  },
): string | null;
export function formatCurrencyForRecord(
  value: unknown,
  record: unknown,
  options?: {
    currencyKeys?: string[];
    emptyFallback?: string;
  },
): string;
export function buildCurrencyTotals(
  items: unknown[],
  options?: {
    amountKey?: string;
    currencyKey?: string;
    currencyKeys?: string[];
  },
): Array<{ currencyCode: string; amount: number }>;
export function countDistinctCurrencies(
  items: unknown[],
  options?: {
    amountKey?: string;
    currencyKey?: string;
    currencyKeys?: string[];
  },
): number;
export function formatCurrencyBreakdownFromItems(
  items: unknown[],
  options?: {
    amountKey?: string;
    currencyKey?: string;
    currencyKeys?: string[];
  },
): string;
export function formatCurrency(value: unknown, currencyCode?: string): string;
export function formatNumber(value: unknown): string;
export function formatDate(value: unknown, mode?: 'date' | 'datetime'): string;
