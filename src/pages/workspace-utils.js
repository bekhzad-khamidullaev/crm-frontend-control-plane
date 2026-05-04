export const toResults = (response) => {
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.results) ? response.results : [];
};

export const toNumberSafe = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeDecimalRaw = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(/\s+/g, '').replace(',', '.');
};

export const toMoneyMinor = (value, scale = 2) => {
  const factor = 10 ** scale;
  const raw = normalizeDecimalRaw(value);
  if (!raw) return 0;

  const match = raw.match(/^(-)?(\d+)(?:\.(\d+))?$/);
  if (!match) return 0;

  const sign = match[1] ? -1 : 1;
  const integerPart = match[2] || '0';
  const fractionPart = match[3] || '';
  const paddedFraction = `${fractionPart}${'0'.repeat(scale + 1)}`;
  const keptFraction = paddedFraction.slice(0, scale);
  const roundingDigit = Number(paddedFraction[scale] || '0');

  let baseMinor = (Number(integerPart) * factor) + Number(keptFraction || '0');
  if (roundingDigit >= 5) {
    baseMinor += 1;
  }
  return sign * baseMinor;
};

export const fromMoneyMinor = (minor, scale = 2) => {
  const factor = 10 ** scale;
  return toNumberSafe(minor) / factor;
};

export const formatDateSafe = (value, locale = 'ru-RU') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(locale);
};

export const containsText = (value, query) => {
  if (!query) return true;
  const source = String(value || '').toLowerCase();
  return source.includes(String(query).toLowerCase());
};
