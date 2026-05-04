import { useLeads } from '@/entities/lead/api/queries';
import { LeadsService } from '@/shared/api/generated/services/LeadsService';
import { Select, SelectProps } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { normalizeSelectValue } from './selectValue';

export interface LeadSelectProps extends SelectProps {}

export const LeadSelect: React.FC<LeadSelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useLeads({ page: 1, pageSize: 500 });
  const [resolvedOption, setResolvedOption] = useState<{ label: string; value: number } | null>(null);

  const options = useMemo(() => {
    return (
      data?.results?.map((item) => ({
        label: item.first_name ? `${item.first_name} ${item.last_name || ''}` : 'Лид',
        value: item.id,
      })) || []
    );
  }, [data]);
  const optionsWithResolved = useMemo(() => {
    if (!resolvedOption) return options;
    if (options.some((item) => String(item.value) === String(resolvedOption.value))) return options;
    return [resolvedOption, ...options];
  }, [options, resolvedOption]);
  const normalizedValue = useMemo(() => normalizeSelectValue(value, optionsWithResolved), [value, optionsWithResolved]);

  useEffect(() => {
    if (Array.isArray(value) || value === undefined || value === null || value === '') {
      setResolvedOption(null);
      return;
    }

    const selectedId = Number(value);
    if (!Number.isFinite(selectedId) || selectedId <= 0) {
      setResolvedOption(null);
      return;
    }
    if (options.some((item) => Number(item.value) === selectedId)) {
      setResolvedOption(null);
      return;
    }

    let cancelled = false;
    LeadsService.leadsRetrieve({ id: selectedId })
      .then((lead) => {
        if (cancelled) return;
        setResolvedOption({
          value: selectedId,
          label:
            lead.full_name ||
            `${lead.first_name || ''} ${lead.last_name || ''}`.trim() ||
            'Лид',
        });
      })
      .catch(() => {
        if (cancelled) return;
        setResolvedOption({ value: selectedId, label: 'Лид' });
      });

    return () => {
      cancelled = true;
    };
  }, [options, value]);

  return (
    <Select
      placeholder="Выберите лид"
      loading={isLoading}
      options={optionsWithResolved}
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
