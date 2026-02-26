import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useCities } from '../api/queries';

export interface CitySelectProps extends SelectProps {
  countryId?: number;
}

export const CitySelect: React.FC<CitySelectProps> = ({ countryId, ...props }) => {
  const { data, isLoading } = useCities(countryId);

  const options = useMemo(() => {
    return data?.results?.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];
  }, [data]);

  return (
    <Select
      placeholder={countryId ? "Выберите город" : "Сначала выберите страну"}
      loading={isLoading}
      options={options}
      disabled={!countryId}
      allowClear
      showSearch
      filterOption={(input, option) =>
        (String(option?.label) ?? '').toLowerCase().includes(input.toLowerCase())
      }
      {...props}
    />
  );
};
