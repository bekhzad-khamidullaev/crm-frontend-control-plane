import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useCountries } from '../api/queries';

export interface CountrySelectProps extends SelectProps {}

export const CountrySelect: React.FC<CountrySelectProps> = (props) => {
  const { data, isLoading } = useCountries();

  const options = useMemo(() => {
    return data?.results?.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];
  }, [data]);

  return (
    <Select
      placeholder="Выберите страну"
      loading={isLoading}
      options={options}
      allowClear
      showSearch
      filterOption={(input, option) =>
        (String(option?.label) ?? '').toLowerCase().includes(input.toLowerCase())
      }
      {...props}
    />
  );
};
