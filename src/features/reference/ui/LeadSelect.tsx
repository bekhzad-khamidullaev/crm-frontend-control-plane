import { useLeads } from '@/entities/lead/api/queries';
import { Select, SelectProps } from 'antd';
import React, { useMemo } from 'react';
import { normalizeSelectValue } from './selectValue';

export interface LeadSelectProps extends SelectProps {}

export const LeadSelect: React.FC<LeadSelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useLeads({ page: 1, pageSize: 500 });

  const options = useMemo(() => {
    return (
      data?.results?.map((item) => ({
        label: item.first_name ? `${item.first_name} ${item.last_name || ''}` : `Lead #${item.id}`,
        value: item.id,
      })) || []
    );
  }, [data]);
  const normalizedValue = useMemo(() => normalizeSelectValue(value, options), [value, options]);

  return (
    <Select
      placeholder="Выберите лид"
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
