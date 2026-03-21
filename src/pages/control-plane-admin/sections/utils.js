export function normalizeCollection(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

export function normalizeCount(response, fallback = 0) {
  if (typeof response?.count === "number") return response.count;
  const list = normalizeCollection(response);
  return Array.isArray(list) ? list.length : fallback;
}

export function formatDateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toISOString().slice(0, 16).replace("T", " ");
}
