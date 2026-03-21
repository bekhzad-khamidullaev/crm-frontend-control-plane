import { useDebounce } from '@/shared/hooks';
import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Flex, Input, Row, Space, Tag, theme } from 'antd';
import { StageSelect, UserSelect, CompanySelect } from '@/features/reference';
import { DealListParams } from '@/entities/deal';
import { SearchOutlined } from '@ant-design/icons';

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
  const { token } = theme.useToken();
  const hasActiveFilters = Boolean(
    String(filters.search || '').trim() || filters.stage || filters.owner || filters.company,
  );
  const surfaceStyle: React.CSSProperties = {
    marginBottom: 16,
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgElevated,
    boxShadow: token.boxShadowTertiary,
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
    onFilterChange('search', nextValue || undefined);
  }, [debouncedSearch, filters.search, onFilterChange]);

  const handleChange = (key: keyof DealListParams, value: any) => {
    onFilterChange(String(key), value || undefined);
  };

  return (
    <Card
      variant="borderless"
      style={surfaceStyle}
      styles={{
        body: {
          padding: 16,
        },
      }}
    >
      <Flex vertical gap={12}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} lg={6}>
            <Input
              placeholder="Поиск по названию..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              allowClear
              prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
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

        <Space size={[8, 8]} wrap>
          {String(filters.search || '').trim() ? (
            <Tag
              closable
              style={chipStyle}
              onClose={() => {
                setSearch('');
                onFilterChange('search', undefined);
              }}
            >
              Поиск: {String(filters.search)}
            </Tag>
          ) : null}
          {filters.stage ? (
            <Tag closable style={chipStyle} onClose={() => handleChange('stage', undefined)}>
              Стадия
            </Tag>
          ) : null}
          {filters.owner ? (
            <Tag closable style={chipStyle} onClose={() => handleChange('owner', undefined)}>
              Ответственный
            </Tag>
          ) : null}
          {filters.company ? (
            <Tag closable style={chipStyle} onClose={() => handleChange('company', undefined)}>
              Компания
            </Tag>
          ) : null}
          {hasActiveFilters ? (
            <Button
              type="text"
              onClick={() => {
                setSearch('');
                onFilterChange('search', undefined);
                onFilterChange('stage', undefined);
                onFilterChange('owner', undefined);
                onFilterChange('company', undefined);
              }}
            >
              Сбросить
            </Button>
          ) : null}
        </Space>
      </Flex>
    </Card>
  );
};
