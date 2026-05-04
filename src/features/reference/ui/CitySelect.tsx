import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useCities } from '../api/queries';
import { normalizeSelectValue } from './selectValue';

export interface CitySelectProps extends SelectProps {
  countryId?: number;
}

export const CitySelect: React.FC<CitySelectProps> = ({ countryId, ...props }) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useCities(countryId);

  const options = useMemo(() => {
    return data?.results?.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];
  }, [data]);
  const normalizedValue = useMemo(() => normalizeSelectValue(value, options), [value, options]);

  return (
    <Select
      placeholder={countryId ? "Выберите город" : "Сначала выберите страну"}
      loading={isLoading}
      options={options}
      value={normalizedValue}
      disabled={!countryId}
      allowClear
      showSearch
      filterOption={(input, option) =>
        (String(option?.label) ?? '').toLowerCase().includes(input.toLowerCase())
      }
      {...restProps}
    />
  );
};
