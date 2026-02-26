import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useTags } from '../api/queries';

export interface TagSelectProps extends SelectProps {}

export const TagSelect: React.FC<TagSelectProps> = (props) => {
  const { data, isLoading } = useTags();

  const options = useMemo(() => {
    return data?.results?.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];
  }, [data]);

  return (
    <Select
      placeholder="Выберите теги"
      loading={isLoading}
      options={options}
      mode="multiple"
      allowClear
      showSearch
      filterOption={(input, option) =>
        (String(option?.label) ?? '').toLowerCase().includes(input.toLowerCase())
      }
      {...props}
    />
  );
};
