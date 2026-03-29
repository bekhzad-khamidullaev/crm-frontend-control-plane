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
    marginBottom: 12,
    padding: isMobile ? 12 : 14,
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgElevated,
    boxShadow: token.boxShadowSecondary,
  };
  const chipStyle: React.CSSProperties = {
    marginInlineEnd: 0,
    borderRadius: token.borderRadiusSM,
    borderColor: token.colorBorderSecondary,
    background: token.colorFillAlter,
    color: token.colorTextSecondary,
    fontWeight: 500,
  };
  const actionButtonStyle: React.CSSProperties = {
    borderRadius: token.borderRadiusLG,
  };

  return (
    <div style={surfaceStyle}>
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Flex
          justify="space-between"
          align={isMobile ? 'stretch' : 'flex-start'}
          gap={10}
          vertical={isMobile}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space wrap size={8} style={{ width: '100%' }}>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onPressEnter={(event) =>
                    onSearchChange?.((event.target as HTMLInputElement).value)
                  }
                  onChange={(event) => onSearchChange?.(event.target.value)}
                  style={{
                    width: isMobile ? '100%' : 300,
                    maxWidth: '100%',
                    borderRadius: token.borderRadiusLG,
                    borderColor: token.colorBorderSecondary,
                    background: token.colorBgContainer,
                  }}
                />
                {filters}
              </Space>

              {hasActiveFilters ? (
                <Flex wrap gap={8}>
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
                </Flex>
              ) : null}
            </Space>
          </div>

          <Space
            wrap
            size={8}
            style={{
              justifyContent: isMobile ? 'space-between' : 'flex-end',
              width: isMobile ? '100%' : 'auto',
              flexShrink: 0,
            }}
          >
            {resultSummary ? (
              <Tag
                bordered={false}
                style={{
                  ...chipStyle,
                  paddingInline: 12,
                  minHeight: 28,
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: token.colorBgContainer,
                  color: token.colorTextBase,
                }}
              >
                {resultSummary}
              </Tag>
            ) : null}
            {onRefresh ? (
              <Tooltip title="Обновить список">
                <Button
                  aria-label="Обновить список"
                  icon={<ReloadOutlined />}
                  size="small"
                  loading={loading}
                  onClick={onRefresh}
                  style={actionButtonStyle}
                />
              </Tooltip>
            ) : null}
            {hasActiveFilters && onReset ? (
              <Button
                icon={<ClearOutlined />}
                size="small"
                onClick={onReset}
                style={actionButtonStyle}
              >
                Сбросить
              </Button>
            ) : null}
          </Space>
        </Flex>
      </Space>
    </div>
  );
};
