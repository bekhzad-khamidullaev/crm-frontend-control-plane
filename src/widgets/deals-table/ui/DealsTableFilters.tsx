import { useBackgroundRefresh, useDebounce } from '@/shared/hooks';
import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Flex, Input, Row, Space, Tag, theme } from 'antd';
import { StageSelect, UserSelect, CompanySelect } from '@/features/reference';
import { DealListParams } from '@/entities/deal';
import { SearchOutlined } from '@ant-design/icons';
import { t } from '@/lib/i18n';

interface DealsTableFiltersProps {
  filters: DealListParams;
  onChange: (filters: DealListParams) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const DealsTableFilters: React.FC<DealsTableFiltersProps> = ({
  filters,
  onChange,
  onRefresh,
}) => {
  useBackgroundRefresh(onRefresh, { enabled: Boolean(onRefresh) });
  const [search, setSearch] = useState(filters.search || '');
  const debouncedSearch = useDebounce(search, 400);
  const { token } = theme.useToken();
  const hasActiveFilters = Boolean(
    String(filters.search || '').trim() || filters.stage || filters.owner || filters.company,
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

  const handleChange = (key: keyof DealListParams, value: any) => {
    onChange({
      ...filters,
      [key]: value || undefined,
      page: 1,
    });
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
              placeholder={t('dealsTable.filters.searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              allowClear
              prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <StageSelect
              placeholder={t('dealsCommon.fields.stage')}
              value={filters.stage}
              onChange={(val) => handleChange('stage', val)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <UserSelect
              placeholder={t('dealsCommon.fields.owner')}
              value={filters.owner}
              onChange={(val) => handleChange('owner', val)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <CompanySelect
              placeholder={t('dealsCommon.fields.company')}
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
                onChange({ ...filters, search: undefined, page: 1 });
              }}
            >
              {t('dealsTable.filters.searchTag')}: {String(filters.search)}
            </Tag>
          ) : null}
          {filters.stage ? (
            <Tag closable style={chipStyle} onClose={() => handleChange('stage', undefined)}>
              {t('dealsCommon.fields.stage')}
            </Tag>
          ) : null}
          {filters.owner ? (
            <Tag closable style={chipStyle} onClose={() => handleChange('owner', undefined)}>
              {t('dealsCommon.fields.owner')}
            </Tag>
          ) : null}
          {filters.company ? (
            <Tag closable style={chipStyle} onClose={() => handleChange('company', undefined)}>
              {t('dealsCommon.fields.company')}
            </Tag>
          ) : null}
          {hasActiveFilters ? (
            <Button
              type="text"
              onClick={() => {
                setSearch('');
                onChange({
                  page: 1,
                  search: undefined,
                  stage: undefined,
                  owner: undefined,
                  company: undefined,
                });
              }}
            >
              {t('actions.reset')}
            </Button>
          ) : null}
        </Space>
      </Flex>
    </Card>
  );
};
