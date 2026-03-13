/**
 * Единые утилиты форматирования для всего приложения.
 * Импортируйте отсюда, а не дублируйте логику в компонентах.
 */

export const APP_LOCALE = 'ru-RU';

/**
 * Список стандартных ISO 4217 кодов валют, поддерживаемых через Intl.NumberFormat.
 */
const ISO_CURRENCY_CODES = new Set([
  'RUB', 'USD', 'EUR', 'GBP', 'KZT', 'UZS', 'CNY', 'JPY', 'CHF', 'TRY',
]);

const CURRENCY_ALIASES = {
  '₽': 'RUB',
  'РУБ': 'RUB',
  'РУБ.': 'RUB',
  'RUR': 'RUB',
  'РУБЛЬ': 'RUB',
  'РУБЛИ': 'RUB',
  'РУБЛЕЙ': 'RUB',
  '$': 'USD',
  'US$': 'USD',
  'ДОЛЛАР': 'USD',
  'ДОЛЛАРЫ': 'USD',
  'ДОЛЛАРОВ': 'USD',
  '€': 'EUR',
  'ЕВРО': 'EUR',
  'СУМ': 'UZS',
  'СУМЫ': 'UZS',
  "SO'M": 'UZS',
  "SO`M": 'UZS',
  SUM: 'UZS',
};

/**
 * Единая валюта отображения по всему приложению.
 * При необходимости можно переопределить через localStorage: enterprise_crm_currency.
 */
export const APP_CURRENCY_CODE = (() => {
  try {
    const stored = (typeof window !== 'undefined' && window.localStorage.getItem('enterprise_crm_currency')) || '';
    const normalized = stored.trim().toUpperCase();
    return ISO_CURRENCY_CODES.has(normalized) ? normalized : 'RUB';
  } catch {
    return 'RUB';
  }
})();

export function normalizeCurrencyCode(value) {
  if (value === null || value === undefined) return APP_CURRENCY_CODE;

  const raw = String(value).trim();
  if (!raw) return APP_CURRENCY_CODE;

  const normalized = raw.toUpperCase();
  if (ISO_CURRENCY_CODES.has(normalized)) return normalized;
  if (CURRENCY_ALIASES[normalized]) return CURRENCY_ALIASES[normalized];

  const normalizedNoDots = normalized.replace(/\./g, '');
  if (CURRENCY_ALIASES[normalizedNoDots]) return CURRENCY_ALIASES[normalizedNoDots];

  return APP_CURRENCY_CODE;
}

/**
 * Форматирует денежную сумму единообразно по всему приложению.
 *
 * @param {number|string} value        - Числовое значение суммы
 * @param {string}        currencyCode - ISO-код ('RUB', 'USD') или произвольный символ ('₽')
 *                                       По умолчанию 'RUB'.
 * @returns {string} Отформатированная строка, например «1 234 ₽» или «1 234 $»
 *
 * @example
 * formatCurrency(1234)           // → "1 234 ₽"
 * formatCurrency(1234, 'USD')    // → "1 234 $"
 * formatCurrency(1234, 'EUR')    // → "1 234 €"
 * formatCurrency(1234, 'UZS')    // → "1 234 UZS"
 * formatCurrency(null)           // → "0 ₽"
 */
export function formatCurrency(value, currencyCode = APP_CURRENCY_CODE) {
  const parsed = parseFloat(value);
  const num = Number.isFinite(parsed) ? parsed : 0;
  const code = normalizeCurrencyCode(currencyCode);

  if (ISO_CURRENCY_CODES.has(code)) {
    return new Intl.NumberFormat(APP_LOCALE, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  }

  // Нестандартный символ или название валюты
  return `${num.toLocaleString(APP_LOCALE)} ${code}`;
}

/**
 * Форматирует число с разделителями тысяч (без валюты).
 *
 * @param {number|string} value
 * @returns {string}
 */
export function formatNumber(value) {
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString(APP_LOCALE);
}

/**
 * Форматирует дату/время в русской локали.
 *
 * @param {string|Date} value
 * @param {'date'|'datetime'} mode
 * @returns {string}
 */
export function formatDate(value, mode = 'date') {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '—';
  if (mode === 'datetime') return date.toLocaleString(APP_LOCALE);
  return date.toLocaleDateString(APP_LOCALE);
}
