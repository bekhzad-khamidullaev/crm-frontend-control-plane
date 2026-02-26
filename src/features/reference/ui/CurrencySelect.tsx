import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useCurrencies } from '../api/queries';

export interface CurrencySelectProps extends SelectProps {}

export const CurrencySelect: React.FC<CurrencySelectProps> = (props) => {
  const { data, isLoading } = useCurrencies();

  const options = useMemo(() => {
    return (
      data?.results?.map((item) => ({
        label: item.name,
        value: item.id,
      })) || []
    );
  }, [data]);

  return (
    <Select
      placeholder="Выберите валюту"
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
