import { useDebounce } from '@/shared/hooks';
import React, { useEffect, useState } from 'react';
import {
  LeadSourceSelect,
  UserSelect,
  CountrySelect,
  CompanySelect
} from '@/features/reference';
import { LeadListParams } from '@/entities/lead';
import { Button, Card, Col, Flex, Input, Row, Space, Tag, theme } from 'antd';
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
  const { token } = theme.useToken();
  const isActiveSearch = Boolean(String(filters.search || '').trim());
  const hasActiveFilters = Boolean(
    isActiveSearch || filters.leadSource || filters.owner || filters.country || filters.company,
  );
  const surfaceStyle: React.CSSProperties = {
    marginBottom: 12,
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgElevated,
    boxShadow: token.boxShadowSecondary,
  };
  const chipStyle: React.CSSProperties = {
    marginInlineEnd: 0,
    borderRadius: token.borderRadiusSM,
    borderColor: token.colorBorderSecondary,
    background: token.colorFillQuaternary,
    color: token.colorTextSecondary,
  };

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
    <Card
      variant="borderless"
      style={surfaceStyle}
      styles={{
        body: {
          padding: 12,
        },
      }}
    >
      <Flex vertical gap={8}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} md={10} lg={6}>
            <Input
              placeholder="По имени, телефону, email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              allowClear
              prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
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
          <Col xs={24} lg={2}>
            <Button
              block
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
              size="small"
              aria-label="Обновить список"
            />
          </Col>
        </Row>

        <Space size={[8, 8]} wrap>
          {isActiveSearch ? (
            <Tag
              closable
              style={chipStyle}
              onClose={() => onChange({ ...filters, search: undefined, page: 1 })}
            >
              Поиск: {String(filters.search)}
            </Tag>
          ) : null}
          {filters.leadSource ? (
            <Tag
              closable
              style={chipStyle}
              onClose={() => handleFilterChange('leadSource', undefined)}
            >
              Источник
            </Tag>
          ) : null}
          {filters.owner ? (
            <Tag
              closable
              style={chipStyle}
              onClose={() => handleFilterChange('owner', undefined)}
            >
              Ответственный
            </Tag>
          ) : null}
          {filters.country ? (
            <Tag
              closable
              style={chipStyle}
              onClose={() => handleFilterChange('country', undefined)}
            >
              Страна
            </Tag>
          ) : null}
          {filters.company ? (
            <Tag
              closable
              style={chipStyle}
              onClose={() => handleFilterChange('company', undefined)}
            >
              Компания
            </Tag>
          ) : null}
          {hasActiveFilters ? (
            <Button
              type="text"
              onClick={() =>
                onChange({
                  page: 1,
                  search: undefined,
                  leadSource: undefined,
                  owner: undefined,
                  country: undefined,
                  company: undefined,
                })
              }
            >
              Сбросить
            </Button>
          ) : null}
        </Space>
      </Flex>
    </Card>
  );
};
