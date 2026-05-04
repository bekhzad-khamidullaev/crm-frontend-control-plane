import { useCompanies } from '@/entities/company/api/queries';
import { CompaniesService } from '@/shared/api/generated/services/CompaniesService';
import { getCompanyDisplayName } from '@/lib/utils/company-display.js';
import { Select, SelectProps } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { normalizeSelectValue } from './selectValue';

export const CompanySelect: React.FC<SelectProps<any>> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useCompanies({ page: 1, pageSize: 500 });
  const [resolvedOption, setResolvedOption] = useState<{ label: string; value: number } | null>(null);

  const options = useMemo(() => (
    data?.results?.map((item) => ({
      label: getCompanyDisplayName(item) || 'Компания',
      value: item.id,
    })) || []
  ), [data]);
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
    CompaniesService.companiesRetrieve({ id: selectedId })
      .then((company) => {
        if (cancelled) return;
        setResolvedOption({
          value: selectedId,
          label: getCompanyDisplayName(company) || 'Компания',
        });
      })
      .catch(() => {
        if (cancelled) return;
        setResolvedOption({
          value: selectedId,
          label: 'Компания',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [options, value]);

  return (
    <Select
      placeholder="Выберите компанию"
      options={optionsWithResolved}
      value={normalizedValue}
      loading={isLoading}
      showSearch
      filterOption={(input, option) =>
        (String(option?.label) ?? '').toLowerCase().includes(input.toLowerCase())
      }
      {...restProps}
    />
  );
};
