import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useClosingReasons } from '../api/queries';
import { normalizeSelectValue } from './selectValue';

export interface ClosingReasonSelectProps extends SelectProps {}

export const ClosingReasonSelect: React.FC<ClosingReasonSelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useClosingReasons();

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
      placeholder="Выберите причину закрытия"
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
