import { useContacts } from '@/entities/contact/api/queries';
import { ContactsService } from '@/shared/api/generated/services/ContactsService';
import { Select, SelectProps } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { normalizeSelectValue } from './selectValue';

export interface ContactSelectProps extends SelectProps {}

export const ContactSelect: React.FC<ContactSelectProps> = (props) => {
  const { value, ...restProps } = props;
  const { data, isLoading } = useContacts({ page: 1, pageSize: 500 });
  const [resolvedOption, setResolvedOption] = useState<{ label: string; value: number } | null>(null);

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
    ContactsService.contactsRetrieve({ id: selectedId })
      .then((contact) => {
        if (cancelled) return;
        setResolvedOption({
          value: selectedId,
          label:
            contact.full_name ||
            `${contact.first_name || ''} ${contact.last_name || ''}`.trim() ||
            'Контакт',
        });
      })
      .catch(() => {
        if (cancelled) return;
        setResolvedOption({ value: selectedId, label: 'Контакт' });
      });

    return () => {
      cancelled = true;
    };
  }, [options, value]);

  return (
    <Select
      placeholder="Выберите контакт"
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
