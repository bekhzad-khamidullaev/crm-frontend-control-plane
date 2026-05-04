import { useCompanies } from '@/entities/company/api/queries';
import { useDebounce } from '@/shared/hooks';
import { CountrySelect, UserSelect } from '@/features/reference';
import { getCompanyDisplayName } from '@/lib/utils/company-display.js';
import { SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Input, Row, Select, Space, Tag, theme } from 'antd';
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
  const { token } = theme.useToken();
  const { data: companies } = useCompanies({ page: 1, pageSize: 1000 });
  const companyOptions = React.useMemo(
    () =>
      (companies?.results || []).map((company: any) => ({
        value: company.id,
        label: getCompanyDisplayName(company) || 'Компания',
      })),
    [companies],
  );
  const normalizedCompanyValue = React.useMemo(
    () => normalizeOptionValue(filters?.company, companyOptions),
    [filters?.company, companyOptions],
  );
  const hasActiveFilters = Boolean(
    String(filters?.search || '').trim() || filters?.company || filters?.owner || filters?.country,
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
    setSearch(String(filters?.search || ''));
  }, [filters?.search]);

  useEffect(() => {
    const nextValue = debouncedSearch.trim();
    if (nextValue === lastSearchRef.current) return;
    lastSearchRef.current = nextValue;
    onFilterChange({ search: nextValue || undefined });
  }, [debouncedSearch, onFilterChange]);

  const handleReset = () => {
    setSearch('');
    lastSearchRef.current = '';
    onFilterChange({ search: undefined, company: undefined, owner: undefined, country: undefined });
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
          <Col xs={24} sm={12} lg={6}>
            <Input
              placeholder="Поиск..."
              prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
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

        <Space size={[8, 8]} wrap>
          {String(filters?.search || '').trim() ? (
            <Tag
              closable
              style={chipStyle}
              onClose={() => {
                setSearch('');
                onFilterChange({ search: undefined });
              }}
            >
              Поиск: {String(filters?.search)}
            </Tag>
          ) : null}
          {filters?.company ? (
            <Tag
              closable
              style={chipStyle}
              onClose={() => onFilterChange({ company: undefined })}
            >
              Компания
            </Tag>
          ) : null}
          {filters?.owner ? (
            <Tag
              closable
              style={chipStyle}
              onClose={() => onFilterChange({ owner: undefined })}
            >
              Ответственный
            </Tag>
          ) : null}
          {filters?.country ? (
            <Tag
              closable
              style={chipStyle}
              onClose={() => onFilterChange({ country: undefined })}
            >
              Страна
            </Tag>
          ) : null}
          {hasActiveFilters ? (
            <Button type="text" onClick={handleReset}>
              Сбросить
            </Button>
          ) : null}
        </Space>
      </Flex>
    </Card>
  );
};
