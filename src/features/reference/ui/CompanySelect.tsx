import { useCompanies } from '@/entities/company/api/queries';
import { Select, SelectProps } from 'antd';
import React, { useMemo } from 'react';
import { normalizeSelectValue } from './selectValue';

export const CompanySelect: React.FC<SelectProps<any>> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useCompanies({ page: 1, pageSize: 500 });

  const options = useMemo(() => (
    data?.results?.map((item) => ({
      label: item.full_name || 'Компания',
      value: item.id,
    })) || []
  ), [data]);
  const normalizedValue = useMemo(() => normalizeSelectValue(value, options), [value, options]);

  return (
    <Select
      placeholder="Выберите компанию"
      options={options}
      value={normalizedValue}
      loading={isLoading}
      showSearch
      filterOption={(input, option) =>
        (String(option?.label) ?? '').toLowerCase().includes(input.toLowerCase())
      }
      {...restProps}
    />
  );
};
