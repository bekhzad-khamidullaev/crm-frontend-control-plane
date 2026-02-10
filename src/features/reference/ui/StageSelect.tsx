import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useStages } from '../api/queries';

export interface StageSelectProps extends SelectProps {}

export const StageSelect: React.FC<StageSelectProps> = (props) => {
  const { data, isLoading } = useStages();

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
      placeholder="Выберите стадию"
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
