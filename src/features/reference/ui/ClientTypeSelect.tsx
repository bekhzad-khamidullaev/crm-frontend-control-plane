import React from 'react';
import { Select, SelectProps } from 'antd';
import { useClientTypes } from '../api/queries';

export interface ClientTypeSelectProps extends SelectProps {
  // extended props if needed
}

export const ClientTypeSelect: React.FC<ClientTypeSelectProps> = (props) => {
  const { data, isLoading } = useClientTypes();

  const options = React.useMemo(() => {
    return data?.results?.map((type) => ({
      label: type.name,
      value: type.id,
    })) || [];
  }, [data]);

  return (
    <Select
      placeholder="Выберите тип клиента"
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
