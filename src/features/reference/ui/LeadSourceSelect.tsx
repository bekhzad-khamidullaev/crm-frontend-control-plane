import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useLeadSources } from '../api/queries';
import { normalizeSelectValue } from './selectValue';

export interface LeadSourceSelectProps extends SelectProps {}

export const LeadSourceSelect: React.FC<LeadSourceSelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useLeadSources();

  const options = useMemo(() => {
    return data?.results?.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];
  }, [data]);
  const normalizedValue = useMemo(() => normalizeSelectValue(value, options), [value, options]);

  return (
    <Select
      placeholder="Выберите источник"
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
