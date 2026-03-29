export const toResults = (response) => {
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.results) ? response.results : [];
};

export const toNumberSafe = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
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
