import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useCountries } from '../api/queries';
import { normalizeSelectValue } from './selectValue';

export interface CountrySelectProps extends SelectProps {}

export const CountrySelect: React.FC<CountrySelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useCountries();

  const options = useMemo(() => {
    return data?.results?.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];
  }, [data]);
  const normalizedValue = useMemo(() => normalizeSelectValue(value, options), [value, options]);

  return (
    <Select
      placeholder="Выберите страну"
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
