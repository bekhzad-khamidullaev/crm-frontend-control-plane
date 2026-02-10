import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useDepartments } from '../api/queries';

export interface DepartmentSelectProps extends SelectProps {}

export const DepartmentSelect: React.FC<DepartmentSelectProps> = (props) => {
  const { data, isLoading } = useDepartments();

  const options = useMemo(() => {
    return data?.results?.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];
  }, [data]);

  return (
    <Select
      placeholder="Выберите отдел"
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
