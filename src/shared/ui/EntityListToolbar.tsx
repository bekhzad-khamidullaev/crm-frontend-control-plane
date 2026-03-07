import {
  ClearOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Grid,
  Input,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React from 'react';

const { Text } = Typography;

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
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 16,
        border: '1px solid #f0f0f0',
        borderRadius: 12,
        background: '#fff',
      }}
    >
      <Space
        direction="vertical"
        size={12}
        style={{ width: '100%' }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 12,
            alignItems: isMobile ? 'stretch' : 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Space
            wrap
            size={12}
            style={{ flex: 1, width: '100%' }}
          >
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              style={{ width: isMobile ? '100%' : 320 }}
            />
            {filters}
          </Space>

          <Space
            wrap
            style={{
              justifyContent: isMobile ? 'space-between' : 'flex-end',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            {resultSummary ? <Text type="secondary">{resultSummary}</Text> : null}
            {onRefresh ? (
              <Tooltip title="Обновить список">
                <Button icon={<ReloadOutlined />} loading={loading} onClick={onRefresh} />
              </Tooltip>
            ) : null}
            {hasActiveFilters && onReset ? (
              <Button icon={<ClearOutlined />} onClick={onReset}>
                Сбросить
              </Button>
            ) : null}
          </Space>
        </div>

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
                style={{ marginInlineEnd: 0 }}
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
