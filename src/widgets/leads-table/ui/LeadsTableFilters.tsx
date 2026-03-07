import { useDebounce } from '@/shared/hooks';
import React, { useEffect, useState } from 'react';
import { compactFilterChips, EntityListToolbar } from '@/shared/ui';
import {
  LeadSourceSelect,
  UserSelect,
  CountrySelect,
  CompanySelect
} from '@/features/reference';
import { LeadListParams } from '@/entities/lead';

interface LeadsTableFiltersProps {
  filters: LeadListParams;
  onChange: (filters: LeadListParams) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const LeadsTableFilters: React.FC<LeadsTableFiltersProps> = ({
  filters,
  onChange,
  onRefresh,
  loading,
}) => {
  const [search, setSearch] = useState(filters.search || '');
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setSearch(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    const nextValue = debouncedSearch.trim();
    const currentValue = String(filters.search || '').trim();
    if (nextValue === currentValue) return;
    onChange({
      ...filters,
      search: nextValue || undefined,
      page: 1,
    });
  }, [debouncedSearch, filters, onChange]);

  const handleFilterChange = (key: keyof LeadListParams, value: any) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const activeFilters = compactFilterChips([
    filters.search
      ? {
          key: 'search',
          label: 'Поиск',
          value: String(filters.search),
          onClear: () => onChange({ ...filters, search: undefined, page: 1 }),
        }
      : null,
    filters.leadSource
      ? {
          key: 'leadSource',
          label: 'Источник',
          onClear: () => handleFilterChange('leadSource', undefined),
        }
      : null,
    filters.owner
      ? {
          key: 'owner',
          label: 'Ответственный',
          onClear: () => handleFilterChange('owner', undefined),
        }
      : null,
    filters.country
      ? {
          key: 'country',
          label: 'Страна',
          onClear: () => handleFilterChange('country', undefined),
        }
      : null,
    filters.company
      ? {
          key: 'company',
          label: 'Компания',
          onClear: () => handleFilterChange('company', undefined),
        }
      : null,
  ]);

  return (
    <EntityListToolbar
      searchValue={search}
      searchPlaceholder="По имени, телефону, email..."
      onSearchChange={setSearch}
      onReset={() => onChange({ page: 1 })}
      onRefresh={onRefresh}
      activeFilters={activeFilters}
      loading={loading}
      filters={
        <>
          <LeadSourceSelect
            placeholder="Источник"
            value={filters.leadSource}
            onChange={(val) => handleFilterChange('leadSource', val)}
            allowClear
            style={{ width: 180 }}
          />
          <UserSelect
            placeholder="Ответственный"
            value={filters.owner}
            onChange={(val) => handleFilterChange('owner', val)}
            allowClear
            style={{ width: 180 }}
          />
          <CountrySelect
            placeholder="Страна"
            value={filters.country}
            onChange={(val) => handleFilterChange('country', val)}
            allowClear
            style={{ width: 180 }}
          />
          <CompanySelect
            placeholder="Компания"
            value={filters.company}
            onChange={(val) => handleFilterChange('company', val)}
            allowClear
            style={{ width: 220 }}
          />
        </>
      }
    />
  );
};
