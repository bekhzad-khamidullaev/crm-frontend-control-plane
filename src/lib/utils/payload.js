export function normalizePayload(values = {}, options = {}) {
  const {
    preserveEmptyArrays = [],
    preserveNull = [],
    preserveEmptyStrings = [],
  } = options;

  const preserveEmptyArraysSet = new Set(preserveEmptyArrays);
  const preserveNullSet = new Set(preserveNull);
  const preserveEmptyStringsSet = new Set(preserveEmptyStrings);
  const payload = {};

  Object.entries(values || {}).forEach(([key, value]) => {
    if (value === undefined) return;

    if (value === null) {
      if (preserveNullSet.has(key)) {
        payload[key] = null;
      }
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        if (preserveEmptyStringsSet.has(key)) {
          payload[key] = value;
        }
        return;
      }
      payload[key] = trimmed;
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        if (preserveEmptyArraysSet.has(key)) {
          payload[key] = [];
        }
        return;
      }
      payload[key] = value;
      return;
    }

    payload[key] = value;
  });

  return payload;
}
