import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useClosingReasons } from '../api/queries';

export interface ClosingReasonSelectProps extends SelectProps {}

export const ClosingReasonSelect: React.FC<ClosingReasonSelectProps> = (props) => {
  const { data, isLoading } = useClosingReasons();

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
      placeholder="Выберите причину закрытия"
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
