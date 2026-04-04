import React from 'react';
import { Input, Button, Space, Dropdown, Badge, Tooltip, Typography, Segmented } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  DownloadOutlined,
  SettingOutlined,
  ClearOutlined,
  PlusOutlined,
  AppstoreOutlined,
  BarsOutlined,
} from '@ant-design/icons';
import { canWrite as canWriteByRole } from '../lib/rbac.js';

const { Search } = Input;
const { Title, Text } = Typography;

export default function TableToolbar({
  title,
  total,
  searchValue = '',
  onSearch, // Changed from onSearchChange to match LeadsList usage (check this!) - LeadsList uses onSearch={handleSearch} which takes value
  onSearchChange, // Keeping both for compatibility
  onRefresh,
  onCreate,
  createButtonText = 'Создать',
  onExport,
  onFilterClick,
  activeFiltersCount = 0,
  loading = false,
  showSearch = true,
  showRefresh = true,
  showExport = true,
  showFilters = true,
  showSettings = false,
  showCreate = true,
  canCreate,
  createPermission,
  showViewModeSwitch = false,
  viewMode = 'table', // 'table' | 'kanban'
  onViewModeChange,
  onSettingsClick,
  extra,
  placeholder = 'Поиск...',
  children,
}) {
  // Handle search value change for both patterns
  const handleSearch = (val) => {
    if (onSearch) onSearch(val);
    if (onSearchChange) onSearchChange(val);
  };
  const allowCreate = showCreate && onCreate && (canCreate ?? (createPermission ? canWriteByRole(createPermission) : canWriteByRole()));

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        {/* Left Side: Title & Total */}
        <Space align="center">
          {title && <Title level={4} style={{ margin: 0 }}>{title}</Title>}
          {total !== undefined && <Text type="secondary">({total})</Text>}
        </Space>

        {/* Right Side: Actions (Create & View Mode) */}
        <Space>
           {showViewModeSwitch && onViewModeChange && (
            <Segmented
              value={viewMode}
              onChange={onViewModeChange}
              options={[
                { value: 'table', icon: <BarsOutlined /> },
                { value: 'kanban', icon: <AppstoreOutlined /> },
              ]}
            />
          )}

          {children}

          {allowCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onCreate}
            >
              {createButtonText}
            </Button>
          )}
        </Space>
      </div>

      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          {showSearch && (
            <Search
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 300 }}
              allowClear
            />
          )}

          {showFilters && onFilterClick && (
            <Badge count={activeFiltersCount} offset={[10, 0]}>
              <Button
                icon={<FilterOutlined />}
                onClick={onFilterClick}
              >
                Фильтры
              </Button>
            </Badge>
          )}

          {activeFiltersCount > 0 && (
            <Tooltip title="Очистить фильтры">
              <Button
                icon={<ClearOutlined />}
                onClick={() => onFilterClick?.('clear')}
              />
            </Tooltip>
          )}
        </Space>

        <Space wrap>
          {extra}

          {showRefresh && (
            <Tooltip title="Обновить">
              <Button
                icon={<ReloadOutlined />}
                aria-label="Обновить таблицу"
                onClick={onRefresh}
                loading={loading}
              />
            </Tooltip>
          )}

          {showExport && (
            <Tooltip title="Экспорт">
              <Dropdown
                 menu={{
                   items: [
                     { key: 'csv', label: 'CSV Export', onClick: () => onExport && onExport('csv') },
                     { key: 'excel', label: 'Excel Export', onClick: () => onExport && onExport('excel') }
                   ]
                 }}
              >
                <Button icon={<DownloadOutlined />} aria-label="Экспорт данных" />
              </Dropdown>
            </Tooltip>
          )}

          {showSettings && (
            <Tooltip title="Настройки">
              <Button
                icon={<SettingOutlined />}
                aria-label="Открыть настройки таблицы"
                onClick={onSettingsClick}
              />
            </Tooltip>
          )}
        </Space>
      </Space>
    </div>
  );
}
