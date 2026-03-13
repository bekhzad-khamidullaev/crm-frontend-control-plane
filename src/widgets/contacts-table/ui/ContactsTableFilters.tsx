import { useCompanies } from '@/entities/company/api/queries';
import { useDebounce } from '@/shared/hooks';
import {
    CountrySelect,
    UserSelect
} from '@/features/reference';
import { SearchOutlined } from '@ant-design/icons';
import { Col, Input, Row, Select } from 'antd';
import React, { useEffect, useState } from 'react';

interface FiltersProps {
  filters?: Record<string, unknown>;
  onFilterChange: (filters: Record<string, unknown>) => void;
  loading?: boolean;
}

const normalizeOptionValue = (value: unknown, options: Array<{ value: unknown }>) => {
  const matched = options.find((option) => String(option.value) === String(value));
  return matched ? matched.value : value;
};

export const ContactsTableFilters: React.FC<FiltersProps> = ({ filters, onFilterChange, loading }) => {
  const [search, setSearch] = useState(String(filters?.search || ''));
  const debouncedSearch = useDebounce(search, 400);
  const lastSearchRef = React.useRef('');
  const { data: companies } = useCompanies({ page: 1, pageSize: 1000 });
  const companyOptions = React.useMemo(
    () =>
      (companies?.results || []).map((company: any) => ({
        value: company.id,
        label: company.full_name || company.name,
      })),
    [companies],
  );
  const normalizedCompanyValue = React.useMemo(
    () => normalizeOptionValue(filters?.company, companyOptions),
    [filters?.company, companyOptions],
  );

  useEffect(() => {
    setSearch(String(filters?.search || ''));
  }, [filters?.search]);

  useEffect(() => {
    const nextValue = debouncedSearch.trim();
    if (nextValue === lastSearchRef.current) return;
    lastSearchRef.current = nextValue;
    onFilterChange({ search: nextValue || undefined });
  }, [debouncedSearch, onFilterChange]);

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} lg={6}>
        <Input
          placeholder="Поиск..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Select
          style={{ width: '100%' }}
          placeholder="Компания"
          allowClear
          showSearch
          optionFilterProp="label"
          onChange={(val) => onFilterChange({ company: val })}
          value={(normalizedCompanyValue as any) ?? undefined}
          loading={loading}
          options={companyOptions}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <UserSelect
          placeholder="Ответственный"
          style={{ width: '100%' }}
          onChange={(val) => onFilterChange({ owner: val })}
          value={(filters?.owner as any) ?? undefined}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <CountrySelect
           placeholder="Страна"
           style={{ width: '100%' }}
           onChange={(val) => onFilterChange({ country: val })}
           value={(filters?.country as any) ?? undefined}
        />
      </Col>
    </Row>
  );
};
