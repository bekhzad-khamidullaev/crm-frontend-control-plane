import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Select, Spin, message } from 'antd';

const warnedKeys = new Set();
const warnOnce = (key, text) => {
  if (!key) return;
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  message.warning(text);
};

const normalizeItems = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return Array.isArray(response.results) ? response.results : [];
};

const defaultLabel = (item) =>
  item?.full_name ||
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
          'Не удалось загрузить справочник для выбора. Проверьте доступ к API.'
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
    const existing = new Set(options.map((opt) => opt.value));
    const missing = selectedIds.filter((id) => !existing.has(id));
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
          if (!merged.some((opt) => opt.value === option.value)) {
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
      loadOptions(search);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [search, debounceMs]);

  useEffect(() => {
    ensureSelectedOptions();
  }, [value]);

  return (
    <Select
      value={value}
      onChange={onChange}
      mode={mode}
      placeholder={placeholder}
      allowClear={allowClear}
      showSearch={showSearch}
      disabled={disabled}
      style={style}
      loading={loading}
      filterOption={false}
      onSearch={setSearch}
      notFoundContent={loading ? <Spin size="small" /> : 'Нет данных'}
      options={options}
      {...restProps}
    />
  );
}

export default EntitySelect;
