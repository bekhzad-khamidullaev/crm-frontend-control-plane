/**
 * ReferenceSelect Component
 * 
 * Универсальный компонент для работы со справочными данными
 * Поддерживает автоматическую загрузку данных из API
 * Rewritten to use only Ant Design components
 */

import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import { api } from '../lib/api/client';
import * as referenceApi from '../lib/api/reference';

const { Option } = Select;

const listLoaders = {
  stages: referenceApi.getStages,
  'task-stages': referenceApi.getTaskStages,
  'project-stages': referenceApi.getProjectStages,
  'lead-sources': referenceApi.getLeadSources,
  industries: referenceApi.getIndustries,
  countries: referenceApi.getCountries,
  cities: referenceApi.getCities,
  currencies: referenceApi.getCurrencies,
  'client-types': referenceApi.getClientTypes,
  'closing-reasons': referenceApi.getClosingReasons,
  resolutions: referenceApi.getResolutions,
  departments: referenceApi.getDepartments,
  'crm-tags': referenceApi.getCrmTags,
  'task-tags': referenceApi.getTaskTags,
};

const byIdLoaders = {
  stages: referenceApi.getStage,
  'task-stages': referenceApi.getTaskStage,
  'project-stages': referenceApi.getProjectStage,
  'lead-sources': referenceApi.getLeadSource,
  industries: referenceApi.getIndustry,
  countries: referenceApi.getCountry,
  cities: referenceApi.getCity,
  currencies: referenceApi.getCurrency,
  'client-types': referenceApi.getClientType,
  'closing-reasons': referenceApi.getClosingReason,
  resolutions: referenceApi.getResolution,
  departments: referenceApi.getDepartment,
  'crm-tags': referenceApi.getCrmTag,
  'task-tags': referenceApi.getTaskTag,
};

const toItems = (response) => (Array.isArray(response) ? response : (response?.results || []));

const ReferenceSelect = ({
  type,
  value,
  onChange,
  placeholder,
  allowClear = true,
  showSearch = true,
  disabled = false,
  style,
  endpoint, // optional override: '/api/cities/'
  valueKey = 'id',
  labelKey = 'name',
  params = {},
  paginated = true,
  mode, // for multi-select support
  ...restProps
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadData();
  }, [type, endpoint, JSON.stringify(params)]);

  useEffect(() => {
    ensureSelectedValuesLoaded();
  }, [value, data, type, endpoint, valueKey]);

  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      let response;
      
      // Выбираем нужный API метод на основе типа
      if (endpoint) {
        response = await api.get(endpoint, { params });
      } else {
        const loadList = listLoaders[type];
        if (!loadList) {
          console.warn(`Unknown reference type: ${type}`);
          setLoadError('Справочник недоступен');
          return;
        }
        response = await loadList(params);
      }

      setData(toItems(response));
    } catch (error) {
      setLoadError(`Не удалось загрузить ${getTypeName(type)}`);
      console.error(`Error loading ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const ensureSelectedValuesLoaded = async () => {
    if (endpoint) return;

    const rawValues = Array.isArray(value) ? value : [value];
    const selectedValues = rawValues.filter((item) => item !== undefined && item !== null && item !== '');

    if (!selectedValues.length) return;

    const missingValues = selectedValues.filter(
      (selectedValue) => !data.some((item) => String(item?.[valueKey]) === String(selectedValue))
    );

    if (!missingValues.length) return;

    const loadById = byIdLoaders[type];
    if (!loadById) return;

    try {
      const results = await Promise.allSettled(
        missingValues.map((itemValue) => loadById(itemValue))
      );

      const loadedItems = results
        .filter((result) => result.status === 'fulfilled' && result.value)
        .map((result) => result.value);

      if (!loadedItems.length) return;

      setData((prev) => {
        const next = [...prev];
        loadedItems.forEach((item) => {
          const itemValue = item?.[valueKey];
          if (!next.some((existing) => String(existing?.[valueKey]) === String(itemValue))) {
            next.push(item);
          }
        });
        return next;
      });
    } catch (error) {
      setLoadError(`Не удалось загрузить выбранное значение для ${getTypeName(type)}`);
      console.error(`Error loading selected ${type} values:`, error);
    }
  };

  const normalizeSingleValue = (currentValue) => {
    const matched = data.find((item) => String(item?.[valueKey]) === String(currentValue));
    return matched ? matched[valueKey] : currentValue;
  };

  const selectValue = Array.isArray(value)
    ? value.map((itemValue) => normalizeSingleValue(itemValue))
    : normalizeSingleValue(value);
  const mergedStyle = { width: '100%', ...(style || {}) };

  return (
    <Select
      value={selectValue}
      onChange={onChange}
      placeholder={placeholder || `Выберите ${getTypeName(type)}`}
      allowClear={allowClear}
      showSearch={showSearch}
      disabled={disabled}
      loading={loading}
      status={loadError ? 'error' : undefined}
      notFoundContent={loadError || undefined}
      style={mergedStyle}
      mode={mode}
      filterOption={(input, option) =>
        String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
      }
      {...restProps}
    >
      {data.map((item) => (
        <Option key={item[valueKey]} value={item[valueKey]}>
          {item[labelKey] ?? item.name ?? item.title ?? item.slug ?? item.id}
        </Option>
      ))}
    </Select>
  );
};

// Вспомогательная функция для получения русского названия типа
function getTypeName(type) {
  const names = {
    'stages': 'этап',
    'task-stages': 'этап задачи',
    'project-stages': 'этап проекта',
    'lead-sources': 'источник',
    'industries': 'отрасль',
    'countries': 'страну',
    'cities': 'город',
    'currencies': 'валюту',
    'client-types': 'тип клиента',
    'closing-reasons': 'причину закрытия',
    'resolutions': 'резолюцию',
    'departments': 'отдел',
    'crm-tags': 'тег',
    'task-tags': 'тег задачи',
  };
  return names[type] || type;
}

export default ReferenceSelect;
