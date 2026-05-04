import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useTags } from '../api/queries';
import { normalizeSelectValue } from './selectValue';

export interface TagSelectProps extends SelectProps {}

export const TagSelect: React.FC<TagSelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useTags();

  const options = useMemo(() => {
    return data?.results?.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];
  }, [data]);
  const normalizedValue = useMemo(() => normalizeSelectValue(value, options), [value, options]);

  return (
    <Select
      placeholder="Выберите теги"
      loading={isLoading}
      options={options}
      value={normalizedValue}
      mode="multiple"
      allowClear
      showSearch
      filterOption={(input, option) =>
        (String(option?.label) ?? '').toLowerCase().includes(input.toLowerCase())
      }
      {...restProps}
    />
  );
};
