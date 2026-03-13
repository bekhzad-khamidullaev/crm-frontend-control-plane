import React from 'react';
import { Select, SelectProps } from 'antd';
import { useIndustries } from '../api/queries';
import { normalizeSelectValue } from './selectValue';

export interface IndustrySelectProps extends SelectProps {
  // extended props if needed
}

export const IndustrySelect: React.FC<IndustrySelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useIndustries();

  const options = React.useMemo(() => {
    return data?.results?.map((industry) => ({
      label: industry.name,
      value: industry.id,
    })) || [];
  }, [data]);
  const normalizedValue = React.useMemo(() => normalizeSelectValue(value, options), [value, options]);

  return (
    <Select
      placeholder="Выберите индустрию"
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
