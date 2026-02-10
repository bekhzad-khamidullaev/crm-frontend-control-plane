import React from 'react';
import { Select, SelectProps } from 'antd';
import { useIndustries } from '../api/queries';

export interface IndustrySelectProps extends SelectProps {
  // extended props if needed
}

export const IndustrySelect: React.FC<IndustrySelectProps> = (props) => {
  const { data, isLoading } = useIndustries();

  const options = React.useMemo(() => {
    return data?.results?.map((industry) => ({
      label: industry.name,
      value: industry.id,
    })) || [];
  }, [data]);

  return (
    <Select
      placeholder="Выберите индустрию"
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
