import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Select, App } from 'antd';

const { Option } = Select;

const warnedKeys = new Set();
const warnOnce = (key, text, message) => {
  if (!key) return;
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  message.error(text);
};

const normalizeItems = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return Array.isArray(response.results) ? response.results : [];
};

const valuesEqual = (left, right) => String(left) === String(right);

const normalizeSelectedValue = (value, options = []) => {
  const normalizeSingle = (currentValue) => {
    const matched = options.find((option) => valuesEqual(option?.value, currentValue));
    return matched ? matched.value : currentValue;
  };
  if (Array.isArray(value)) return value.map((item) => normalizeSingle(item));
  return normalizeSingle(value);
};

const defaultLabel = (item) =>
  [item?.first_name, item?.last_name].filter(Boolean).join(' ').trim() ||
  item?.full_name ||
  item?.username ||
  item?.name ||
  item?.title ||
  item?.email ||
  item?.phone ||
  item?.number ||
  item?.id?.toString() ||
  'Без названия';

function EntitySelect({
  value,
  onChange,
  placeholder,
  mode,
  allowClear = true,
  showSearch = true,
  disabled = false,
  style,
  fetchOptions,
  fetchList,
  fetchById,
  labelKey = 'name',
  valueKey = 'id',
  optionLabel,
  debounceMs = 300,
  ...restProps
}) {
  const { message } = App.useApp();
  const resolvedFetchOptions = fetchOptions || fetchList;
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const requestIdRef = useRef(0);

  const getLabel = useMemo(() => {
    if (typeof optionLabel === 'function') return optionLabel;
    return (item) => item?.[labelKey] || defaultLabel(item);
  }, [labelKey, optionLabel]);

  const loadOptions = async (query = '') => {
    if (typeof resolvedFetchOptions !== 'function') return;
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const response = await resolvedFetchOptions({
        search: query || undefined,
        page: 1,
        page_size: 50,
      });
      if (requestIdRef.current !== currentRequestId) return;
      const items = normalizeItems(response);
      const mapped = items.map((item) => ({
        value: item?.[valueKey],
        label: getLabel(item),
        item,
      }));
      setOptions(mapped);
    } catch (error) {
      if (requestIdRef.current !== currentRequestId) return;
      setOptions([]);
      console.error('EntitySelect load error:', error);
      if (error?.name !== 'AbortError') {
        warnOnce(
          `entityselect:${labelKey}:${valueKey}`,
          'Не удалось загрузить справочник для выбора. Проверьте доступ к API.',
          message
        );
      }
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
      }
    }
  };

  const ensureSelectedOptions = async () => {
    if (!fetchById) return;
    const selectedIds = mode === 'multiple' ? value || [] : value ? [value] : [];
    if (!selectedIds.length) return;
    const missing = selectedIds.filter(
      (id) => !options.some((opt) => valuesEqual(opt?.value, id))
    );
    if (!missing.length) return;

    try {
      const fetched = await Promise.all(missing.map((id) => fetchById(id)));
      const mapped = fetched
        .filter(Boolean)
        .map((item) => ({
          value: item?.[valueKey],
          label: getLabel(item),
          item,
        }));
      setOptions((prev) => {
        const merged = [...prev];
        mapped.forEach((option) => {
          if (!merged.some((opt) => valuesEqual(opt?.value, option?.value))) {
            merged.push(option);
          }
        });
        return merged;
      });
    } catch (error) {
      console.error('EntitySelect fetchById error:', error);
    }
  };

  useEffect(() => {
    loadOptions('');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSearch) {
        loadOptions(search);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [search, debounceMs, showSearch]);

  useEffect(() => {
    ensureSelectedOptions();
  }, [value]);

  const isDisabled = disabled || (showSearch && !resolvedFetchOptions);
  const selectValue = normalizeSelectedValue(value, options);
  const mergedStyle = { width: '100%', ...(style || {}) };

  return (
    <Select
      value={selectValue}
      onChange={onChange}
      placeholder={placeholder}
      mode={mode}
      allowClear={allowClear}
      showSearch={showSearch}
      disabled={isDisabled}
      loading={loading}
      style={mergedStyle}
      onSearch={showSearch ? setSearch : undefined}
      filterOption={false}
      {...restProps}
    >
      {options.map((option) => (
        <Option key={option.value} value={option.value}>
          {option.label}
        </Option>
      ))}
    </Select>
  );
}

export default EntitySelect;
