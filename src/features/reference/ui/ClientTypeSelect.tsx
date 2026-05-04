import React from 'react';
import { Select, SelectProps } from 'antd';
import { useClientTypes } from '../api/queries';
import { getClientTypeLabel } from '../lib/clientTypeLabel';
import { normalizeSelectValue } from './selectValue';
// @ts-ignore
import { getLocale } from '@/lib/i18n';

export interface ClientTypeSelectProps extends SelectProps {
  // extended props if needed
}

export const ClientTypeSelect: React.FC<ClientTypeSelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useClientTypes();
  const locale = getLocale();

  const options = React.useMemo(() => {
    return data?.results?.map((type) => ({
      label: getClientTypeLabel(type.name, locale),
      value: type.id,
    })) || [];
  }, [data, locale]);
  const normalizedValue = React.useMemo(() => normalizeSelectValue(value, options), [value, options]);

  return (
    <Select
      placeholder="Выберите тип клиента"
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
