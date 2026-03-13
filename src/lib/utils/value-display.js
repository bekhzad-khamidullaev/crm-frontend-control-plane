import dayjs from 'dayjs';

export function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value) && !dayjs.isDayjs(value) && !(value instanceof Date);
}

export function isDateLikeKey(key = '') {
  const normalized = String(key || '').toLowerCase();
  return normalized.includes('date') || normalized.includes('time') || normalized.endsWith('_at') || normalized.endsWith('_on');
}

export function isDateLikeString(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!Number.isNaN(Date.parse(trimmed))) return true;
  return /^\d{4}-\d{2}-\d{2}(?:[ t]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:z|[+\-]\d{2}:\d{2})?)?$/i.test(trimmed);
}

export function unwrapSingleValue(value) {
  if (Array.isArray(value) && value.length === 1) {
    return unwrapSingleValue(value[0]);
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 1) {
      return unwrapSingleValue(entries[0][1]);
    }
    const numericEntries = entries.filter(([key]) => /^\d+$/.test(String(key)));
    if (numericEntries.length === 1) {
      return unwrapSingleValue(numericEntries[0][1]);
    }
  }

  return value;
}

export function formatDateValue(value, locale = 'ru-RU') {
  if (value === null || value === undefined || value === '') return '-';
  const raw = dayjs(value);
  if (!raw.isValid()) return String(value);
  return raw.locale(locale === 'ru-RU' ? 'ru' : 'en').format('DD.MM.YYYY HH:mm:ss');
}

export function formatValueForUi(value, { key = '', locale = 'ru-RU' } = {}) {
  const unwrapped = unwrapSingleValue(value);

  if (unwrapped === null || unwrapped === undefined || unwrapped === '') {
    return { kind: 'text', text: '-' };
  }

  if (typeof unwrapped === 'boolean') {
    return { kind: 'text', text: unwrapped ? 'Да' : 'Нет' };
  }

  if (typeof unwrapped === 'number') {
    return { kind: 'number', number: unwrapped, text: String(unwrapped) };
  }

  if (dayjs.isDayjs(unwrapped) || unwrapped instanceof Date) {
    return { kind: 'text', text: formatDateValue(unwrapped, locale) };
  }

  if (typeof unwrapped === 'string') {
    if (isDateLikeKey(key) || isDateLikeString(unwrapped)) {
      return { kind: 'text', text: formatDateValue(unwrapped, locale) };
    }
    return { kind: 'text', text: unwrapped };
  }

  if (Array.isArray(unwrapped)) {
    return { kind: 'text', text: unwrapped.length ? unwrapped.map((item) => String(unwrapSingleValue(item))).join(', ') : '-' };
  }

  if (isPlainObject(unwrapped)) {
    return { kind: 'complex', value: unwrapped };
  }

  return { kind: 'text', text: String(unwrapped) };
}
