import { useContacts } from '@/entities/contact/api/queries';
import { Select, SelectProps } from 'antd';
import React, { useMemo } from 'react';
import { normalizeSelectValue } from './selectValue';

export interface ContactSelectProps extends SelectProps {}

export const ContactSelect: React.FC<ContactSelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useContacts({ page: 1, pageSize: 500 });

  const options = useMemo(() => {
    return (
      data?.results?.map((item) => ({
        label:
          item.full_name ||
          `${item.first_name || ''} ${item.last_name || ''}`.trim() ||
          'Контакт',
        value: item.id,
      })) || []
    );
  }, [data]);
  const normalizedValue = useMemo(() => normalizeSelectValue(value, options), [value, options]);

  return (
    <Select
      placeholder="Выберите контакт"
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
