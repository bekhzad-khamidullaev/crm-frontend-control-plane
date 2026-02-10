import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useLeadSources } from '../api/queries';

export interface LeadSourceSelectProps extends SelectProps {}

export const LeadSourceSelect: React.FC<LeadSourceSelectProps> = (props) => {
  const { data, isLoading } = useLeadSources();

  const options = useMemo(() => {
    return data?.results?.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];
  }, [data]);

  return (
    <Select
      placeholder="Выберите источник"
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
