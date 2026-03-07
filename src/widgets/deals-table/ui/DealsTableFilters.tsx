import { useDebounce } from '@/shared/hooks';
import React, { useEffect, useState } from 'react';
import { Input, Row, Col } from 'antd';
import { StageSelect, UserSelect, CompanySelect } from '@/features/reference';
import { DealListParams } from '@/entities/deal';

interface DealsTableFiltersProps {
  filters: DealListParams;
  onFilterChange: (key: string, value: any) => void;
}

export const DealsTableFilters: React.FC<DealsTableFiltersProps> = ({
  filters,
  onFilterChange,
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
    onFilterChange('search', nextValue || undefined);
  }, [debouncedSearch, filters.search, onFilterChange]);

  const handleChange = (key: keyof DealListParams, value: any) => {
    onFilterChange(String(key), value || undefined);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Input.Search
            placeholder="Поиск по названию..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StageSelect
            placeholder="Стадия"
            value={filters.stage}
            onChange={(val) => handleChange('stage', val)}
            style={{ width: '100%' }}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <UserSelect
            placeholder="Ответственный"
            value={filters.owner}
            onChange={(val) => handleChange('owner', val)}
            style={{ width: '100%' }}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <CompanySelect
            placeholder="Компания"
            value={filters.company}
            onChange={(val) => handleChange('company', val)}
            style={{ width: '100%' }}
            allowClear
          />
        </Col>
      </Row>
    </div>
  );
};
