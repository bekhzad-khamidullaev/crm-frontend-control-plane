export type SelectOption = {
  value: unknown;
  label?: unknown;
};

function normalizeSingleValue(value: unknown, options: SelectOption[]): unknown {
  const matched = options.find((option) => String(option?.value) === String(value));
  return matched ? matched.value : value;
}

export function normalizeSelectValue(
  value: unknown,
  options: SelectOption[],
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeSingleValue(item, options));
  }
  return normalizeSingleValue(value, options);
}
