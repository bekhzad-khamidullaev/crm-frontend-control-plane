import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useLeads } from '@/entities/lead/api/queries';

export interface LeadSelectProps extends SelectProps {}

export const LeadSelect: React.FC<LeadSelectProps> = (props) => {
  const { data, isLoading } = useLeads({ page: 1, page_size: 100 });

  const options = useMemo(() => {
    return (
      data?.results?.map((item) => ({
        label: item.first_name ? `${item.first_name} ${item.last_name || ''}` : `Lead #${item.id}`,
        value: item.id,
      })) || []
    );
  }, [data]);

  return (
    <Select
      placeholder="Выберите лид"
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
