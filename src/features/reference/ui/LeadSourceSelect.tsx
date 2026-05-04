import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useLeadSources } from '../api/queries';
import { normalizeSelectValue } from './selectValue';
import { getLeadSourceLabel } from '../lib/leadSourceLabel';
// @ts-ignore
import { getLocale, t } from '@/lib/i18n';

export interface LeadSourceSelectProps extends SelectProps {}

export const LeadSourceSelect: React.FC<LeadSourceSelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useLeadSources();
  const locale = getLocale();

  const options = useMemo(() => {
    return data?.results?.map((item) => ({
      label: getLeadSourceLabel(item.name, locale),
      value: item.id,
    })) || [];
  }, [data, locale]);
  const normalizedValue = useMemo(() => normalizeSelectValue(value, options), [value, options]);

  return (
    <Select
      placeholder={t('leadSourceSelect.placeholder', 'Выберите источник')}
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
