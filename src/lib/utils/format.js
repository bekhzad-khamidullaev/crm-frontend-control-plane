/**
 * Единые утилиты форматирования для всего приложения.
 * Импортируйте отсюда, а не дублируйте логику в компонентах.
 */

/**
 * Список стандартных ISO 4217 кодов валют, поддерживаемых через Intl.NumberFormat.
 */
const ISO_CURRENCY_CODES = new Set([
  'RUB', 'USD', 'EUR', 'GBP', 'KZT', 'UZS', 'CNY', 'JPY', 'CHF', 'TRY',
]);

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
export function formatCurrency(value, _currencyCode = 'RUB') {
  const num = parseFloat(value) || 0;
  const code = APP_CURRENCY_CODE;

  if (ISO_CURRENCY_CODES.has(code)) {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  }

  // Нестандартный символ или название валюты
  return `${num.toLocaleString('ru-RU')} ${code}`;
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
  return num.toLocaleString('ru-RU');
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
  if (mode === 'datetime') return date.toLocaleString('ru-RU');
  return date.toLocaleDateString('ru-RU');
}
