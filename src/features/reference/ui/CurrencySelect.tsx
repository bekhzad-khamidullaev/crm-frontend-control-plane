import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useCurrencies } from '../api/queries';
import { normalizeSelectValue } from './selectValue';

export interface CurrencySelectProps extends SelectProps {}

export const CurrencySelect: React.FC<CurrencySelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useCurrencies();

  const options = useMemo(() => {
    return (
      data?.results?.map((item) => ({
        label: item.name,
        value: item.id,
      })) || []
    );
  }, [data]);
  const normalizedValue = useMemo(() => normalizeSelectValue(value, options), [value, options]);

  return (
    <Select
      placeholder="Выберите валюту"
      loading={isLoading}
      options={options}
      value={normalizedValue}
      allowClear
      showSearch
      filterOption={(input, option) =>
        (String(option?.label) ?? '').toLowerCase().includes(input.toLowerCase())
      }
      {...restProps}
    />
  );
};
