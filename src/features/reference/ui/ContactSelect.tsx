import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useContacts } from '@/entities/contact/api/queries';

export interface ContactSelectProps extends SelectProps {}

export const ContactSelect: React.FC<ContactSelectProps> = (props) => {
  const { data, isLoading } = useContacts({ page: 1, page_size: 100 });

  const options = useMemo(() => {
    return (
      data?.results?.map((item) => ({
        label:
          item.full_name ||
          `${item.first_name || ''} ${item.last_name || ''}`.trim() ||
          `Contact #${item.id}`,
        value: item.id,
      })) || []
    );
  }, [data]);

  return (
    <Select
      placeholder="Выберите контакт"
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
