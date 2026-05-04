import React, { useEffect, useMemo, useState } from 'react';
import { Select, SelectProps } from 'antd';
import { useDepartments } from '../api/queries';
import { DepartmentsService } from '@/shared/api/generated/services/DepartmentsService';
import { normalizeSelectValue } from './selectValue';

export interface DepartmentSelectProps extends SelectProps {}

export const DepartmentSelect: React.FC<DepartmentSelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useDepartments();
  const [resolvedOption, setResolvedOption] = useState<{ label: string; value: number } | null>(null);

  const options = useMemo(() => {
    return data?.results?.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];
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
    DepartmentsService.departmentsRetrieve({ id: selectedId })
      .then((department) => {
        if (cancelled) return;
        setResolvedOption({
          value: selectedId,
          label: department.name || `Department #${selectedId}`,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setResolvedOption({ value: selectedId, label: `Department #${selectedId}` });
      });

    return () => {
      cancelled = true;
    };
  }, [options, value]);

  return (
    <Select
      placeholder="Выберите отдел"
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
