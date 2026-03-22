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

function toText(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map(toText).filter(Boolean).join("; ");
  }
  if (typeof value === "object") {
    if (typeof value.detail === "string") return value.detail;
    if (typeof value.message === "string") return value.message;
    if (typeof value.error === "string") return value.error;
    const nestedValues = Object.values(value).map(toText).filter(Boolean);
    return nestedValues[0] || "";
  }
  return "";
}

export function formatBackendError(error, fallback = "Request failed") {
  const payload = error?.details || error?.body || error?.response?.data || error;
  const data =
    payload && typeof payload === "object" && payload.details && typeof payload.details === "object"
      ? payload.details
      : payload;

  if (!data) return fallback;
  if (typeof data === "string") return data;

  const code = toText(data.code);
  const message = toText(data.message);
  const detail = toText(data.detail);

  const parts = [];
  if (code) parts.push(`code: ${code}`);
  if (message) parts.push(`message: ${message}`);
  if (detail) parts.push(`detail: ${detail}`);
  if (parts.length) return parts.join(" | ");

  return toText(data) || fallback;
}
