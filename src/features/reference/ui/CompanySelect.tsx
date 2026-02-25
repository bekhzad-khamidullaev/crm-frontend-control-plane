import { useCompanies } from '@/entities/company/api/queries';
import { Select, SelectProps } from 'antd';
import React from 'react';

export const CompanySelect: React.FC<SelectProps<any>> = (props) => {
  const { data, isLoading } = useCompanies({ page: 1, pageSize: 100 });

  const options = data?.results?.map((item) => ({
    label: item.full_name || `Company #${item.id}`,
    value: item.id,
  }));

  return (
    <Select
      placeholder="Выберите компанию"
      options={options}
      loading={isLoading}
      showSearch
      filterOption={(input, option) =>
        (String(option?.label) ?? '').toLowerCase().includes(input.toLowerCase())
      }
      {...props}
    />
  );
};
