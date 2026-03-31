import React, { useEffect, useMemo, useState } from 'react';
import { Select, SelectProps } from 'antd';
import { useUsers } from '../api/queries';
import { UsersService } from '@/shared/api/generated/services/UsersService';
import { normalizeSelectValue } from './selectValue';

export interface UserSelectProps extends SelectProps {}

export const UserSelect: React.FC<UserSelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useUsers();
  const [resolvedOption, setResolvedOption] = useState<{ label: string; value: number } | null>(null);

  const options = useMemo(() => {
    return data?.results?.map((item) => ({
      label:
        `${item.first_name || ''} ${item.last_name || ''}`.trim()
        || item.username
        || item.email
        || `User #${item.id}`,
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
    UsersService.usersRetrieve({ id: selectedId })
      .then((user) => {
        if (cancelled) return;
        setResolvedOption({
          value: selectedId,
          label:
            `${user.first_name || ''} ${user.last_name || ''}`.trim()
            || user.username
            || user.email
            || `User #${selectedId}`,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setResolvedOption({ value: selectedId, label: `User #${selectedId}` });
      });

    return () => {
      cancelled = true;
    };
  }, [options, value]);

  return (
    <Select
      placeholder="Выберите пользователя"
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
