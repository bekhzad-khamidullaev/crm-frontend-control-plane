import {
  ClearOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Flex,
  Grid,
  Input,
  Space,
  Tag,
  theme,
  Tooltip,
} from 'antd';
import React from 'react';

export interface ActiveFilterChip {
  key: string;
  label: string;
  value?: React.ReactNode;
  onClear?: () => void;
}

export interface EntityListToolbarProps {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  filters?: React.ReactNode;
  activeFilters?: ActiveFilterChip[];
  onReset?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  resultSummary?: string;
}

export const EntityListToolbar: React.FC<EntityListToolbarProps> = ({
  searchValue = '',
  searchPlaceholder = 'Поиск...',
  onSearchChange,
  filters,
  activeFilters = [],
  onReset,
  onRefresh,
  loading,
  resultSummary,
}) => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const hasActiveFilters = activeFilters.length > 0;
  const surfaceStyle: React.CSSProperties = {
    marginBottom: 16,
    padding: isMobile ? 14 : 16,
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

  return (
    <div style={surfaceStyle}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Flex
          justify="space-between"
          align={isMobile ? 'stretch' : 'flex-start'}
          gap={12}
          vertical={isMobile}
        >
          <Space wrap size={12} style={{ flex: 1, width: '100%' }}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              style={{ width: isMobile ? '100%' : 340, maxWidth: '100%' }}
            />
            {filters}
          </Space>

          <Space wrap style={{ justifyContent: isMobile ? 'space-between' : 'flex-end', width: isMobile ? '100%' : 'auto' }}>
            {resultSummary ? (
              <Tag style={chipStyle}>
                {resultSummary}
              </Tag>
            ) : null}
            {onRefresh ? (
              <Tooltip title="Обновить список">
                <Button
                  aria-label="Обновить список"
                  icon={<ReloadOutlined />}
                  loading={loading}
                  onClick={onRefresh}
                />
              </Tooltip>
            ) : null}
            {hasActiveFilters && onReset ? (
              <Button icon={<ClearOutlined />} onClick={onReset}>
                Сбросить
              </Button>
            ) : null}
          </Space>
        </Flex>

        {hasActiveFilters ? (
          <Space wrap size={[8, 8]}>
            {activeFilters.map((filter) => (
              <Tag
                key={filter.key}
                closable={Boolean(filter.onClear)}
                onClose={(event) => {
                  event.preventDefault();
                  filter.onClear?.();
                }}
                style={chipStyle}
              >
                {filter.value ? `${filter.label}: ${filter.value}` : filter.label}
              </Tag>
            ))}
          </Space>
        ) : null}
      </Space>
    </div>
  );
};
