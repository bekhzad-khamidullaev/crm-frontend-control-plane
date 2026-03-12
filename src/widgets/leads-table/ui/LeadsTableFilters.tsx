import { useDebounce } from '@/shared/hooks';
import React, { useEffect, useState } from 'react';
import {
  LeadSourceSelect,
  UserSelect,
  CountrySelect,
  CompanySelect
} from '@/features/reference';
import { LeadListParams } from '@/entities/lead';
import { Button, Card, Col, Input, Row, Space, Tag } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';

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

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={[12, 12]}>
        <Col xs={24} md={10} lg={7}>
          <Input
            placeholder="По имени, телефону, email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            allowClear
            prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
          />
        </Col>
        <Col xs={24} md={7} lg={4}>
          <LeadSourceSelect
            placeholder="Источник"
            value={filters.leadSource}
            onChange={(val) => handleFilterChange('leadSource', val)}
            allowClear
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} md={7} lg={4}>
          <UserSelect
            placeholder="Ответственный"
            value={filters.owner}
            onChange={(val) => handleFilterChange('owner', val)}
            allowClear
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} md={7} lg={4}>
          <CountrySelect
            placeholder="Страна"
            value={filters.country}
            onChange={(val) => handleFilterChange('country', val)}
            allowClear
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} md={7} lg={4}>
          <CompanySelect
            placeholder="Компания"
            value={filters.company}
            onChange={(val) => handleFilterChange('company', val)}
            allowClear
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} lg={1}>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading} />
        </Col>
      </Row>

      <Space size={[8, 8]} wrap style={{ marginTop: 12 }}>
        {filters.search ? (
          <Tag closable onClose={() => onChange({ ...filters, search: undefined, page: 1 })}>
            Поиск: {String(filters.search)}
          </Tag>
        ) : null}
        {filters.leadSource ? (
          <Tag closable onClose={() => handleFilterChange('leadSource', undefined)}>
            Источник
          </Tag>
        ) : null}
        {filters.owner ? (
          <Tag closable onClose={() => handleFilterChange('owner', undefined)}>
            Ответственный
          </Tag>
        ) : null}
        {filters.country ? (
          <Tag closable onClose={() => handleFilterChange('country', undefined)}>
            Страна
          </Tag>
        ) : null}
        {filters.company ? (
          <Tag closable onClose={() => handleFilterChange('company', undefined)}>
            Компания
          </Tag>
        ) : null}
        <Button type="link" onClick={() => onChange({ page: 1 })}>Сбросить</Button>
      </Space>
    </Card>
  );
};
