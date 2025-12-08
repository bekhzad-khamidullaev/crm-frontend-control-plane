/**
 * ReferenceSelect Component
 * 
 * Универсальный компонент для работы со справочными данными
 * Поддерживает автоматическую загрузку данных из API
 */

import React, { useState, useEffect } from 'react';
import { Select, Spin } from 'antd';
import * as referenceApi from '../lib/api/reference';

const { Option } = Select;

const ReferenceSelect = ({
  type,
  value,
  onChange,
  placeholder,
  allowClear = true,
  showSearch = true,
  disabled = false,
  style,
  ...restProps
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [type]);

  const loadData = async () => {
    setLoading(true);
    try {
      let response;
      
      // Выбираем нужный API метод на основе типа
      switch (type) {
        case 'stages':
          response = await referenceApi.getStages();
          break;
        case 'task-stages':
          response = await referenceApi.getTaskStages();
          break;
        case 'project-stages':
          response = await referenceApi.getProjectStages();
          break;
        case 'lead-sources':
          response = await referenceApi.getLeadSources();
          break;
        case 'industries':
          response = await referenceApi.getIndustries();
          break;
        case 'countries':
          response = await referenceApi.getCountries();
          break;
        case 'cities':
          response = await referenceApi.getCities();
          break;
        case 'currencies':
          response = await referenceApi.getCurrencies();
          break;
        case 'client-types':
          response = await referenceApi.getClientTypes();
          break;
        case 'closing-reasons':
          response = await referenceApi.getClosingReasons();
          break;
        case 'departments':
          response = await referenceApi.getDepartments();
          break;
        case 'crm-tags':
          response = await referenceApi.getCrmTags();
          break;
        case 'task-tags':
          response = await referenceApi.getTaskTags();
          break;
        default:
          console.warn(`Unknown reference type: ${type}`);
          return;
      }

      const items = response.results || response || [];
      setData(items);
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder || `Выберите ${getTypeName(type)}`}
      allowClear={allowClear}
      showSearch={showSearch}
      disabled={disabled || loading}
      style={style}
      loading={loading}
      notFoundContent={loading ? <Spin size="small" /> : 'Нет данных'}
      optionFilterProp="children"
      filterOption={(input, option) =>
        option.children.toLowerCase().includes(input.toLowerCase())
      }
      {...restProps}
    >
      {data.map((item) => (
        <Option key={item.id} value={item.id}>
          {item.name}
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
    'departments': 'отдел',
    'crm-tags': 'тег',
    'task-tags': 'тег задачи',
  };
  return names[type] || type;
}

export default ReferenceSelect;
