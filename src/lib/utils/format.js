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
export function formatCurrency(value, currencyCode = 'RUB') {
  const num = parseFloat(value) || 0;
  const code = (currencyCode || 'RUB').trim();

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
