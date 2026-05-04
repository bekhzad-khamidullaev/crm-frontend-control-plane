import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useStages } from '../api/queries';
import { normalizeSelectValue } from './selectValue';

export interface StageSelectProps extends SelectProps {}

export const StageSelect: React.FC<StageSelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useStages();

  const options = useMemo(() => {
    return (
      data?.results?.map((item) => ({
        label: item.name,
        value: item.id,
      })) || []
    );
  }, [data]);
  const normalizedValue = useMemo(() => normalizeSelectValue(value, options), [value, options]);

  return (
    <Select
      placeholder="Выберите стадию"
      loading={isLoading}
      options={options}
      value={normalizedValue}
      allowClear
      showSearch
      filterOption={(input, option) =>
        (String(option?.label) ?? '').toLowerCase().includes(input.toLowerCase())
      }
      {...restProps}
    />
  );
};
