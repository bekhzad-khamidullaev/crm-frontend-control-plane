import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useUsers } from '../api/queries';

export interface UserSelectProps extends SelectProps {}

export const UserSelect: React.FC<UserSelectProps> = (props) => {
  const { data, isLoading } = useUsers();

  const options = useMemo(() => {
    return data?.results?.map((item) => ({
      label: `${item.first_name} ${item.last_name}`.trim() || item.email,
      value: item.id,
    })) || [];
  }, [data]);

  return (
    <Select
      placeholder="Выберите пользователя"
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
