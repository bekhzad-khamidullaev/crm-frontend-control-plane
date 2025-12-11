import React, { useState, useEffect } from 'react';
import {
  Space,
  Input,
  Button,
  Segmented,
  Badge,
  Dropdown,
  Select,
  Tooltip,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ExportOutlined,
  FilterOutlined,
  ReloadOutlined,
  TableOutlined,
  AppstoreOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';

const { Search } = Input;

/**
 * TableToolbar - Универсальная панель инструментов для таблиц
 * @param {Object} props
 * @param {string} props.title - Заголовок
 * @param {number} props.total - Общее количество записей
 * @param {boolean} props.loading - Состояние загрузки
 * @param {string} props.searchPlaceholder - Placeholder для поиска
 * @param {Function} props.onSearch - Callback для поиска (с debounce)
 * @param {Function} props.onCreate - Callback для создания новой записи
 * @param {Function} props.onExport - Callback для экспорта
 * @param {Function} props.onImport - Callback для импорта
 * @param {Function} props.onRefresh - Callback для обновления данных
 * @param {Array} props.filters - Массив фильтров для отображения
 * @param {Function} props.onFilterChange - Callback для изменения фильтров
 * @param {string} props.viewMode - Режим отображения ('table' | 'kanban' | 'grid')
 * @param {Function} props.onViewModeChange - Callback для смены режима
 * @param {Array} props.viewModes - Доступные режимы отображения
 * @param {React.ReactNode} props.extra - Дополнительные элементы
 * @param {string} props.createButtonText - Текст кнопки создания
 * @param {boolean} props.showCreateButton - Показывать ли кнопку создания
 * @param {boolean} props.showExportButton - Показывать ли кнопку экспорта
 * @param {boolean} props.showImportButton - Показывать ли кнопку импорта
 * @param {boolean} props.showRefreshButton - Показывать ли кнопку обновления
 * @param {boolean} props.showViewModeSwitch - Показывать ли переключатель режимов
 * @param {number} props.searchDebounce - Задержка debounce для поиска (мс)
 */
export default function TableToolbar({
  title,
  total = 0,
  loading = false,
  searchPlaceholder = 'Поиск...',
  onSearch,
  onCreate,
  onExport,
  onImport,
  onRefresh,
  filters = [],
  onFilterChange,
  viewMode = 'table',
  onViewModeChange,
  viewModes = ['table', 'kanban'],
  extra,
  createButtonText = 'Создать',
  showCreateButton = true,
  showExportButton = true,
  showImportButton = false,
  showRefreshButton = true,
  showViewModeSwitch = true,
  searchDebounce = 500,
}) {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, searchDebounce);

    return () => clearTimeout(timer);
  }, [searchValue, searchDebounce]);

  // Вызов callback при изменении debounced значения
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearch);
    }
  }, [debouncedSearch, onSearch]);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  // Конфигурация режимов отображения
  const viewModeConfig = {
    table: { label: 'Таблица', icon: <TableOutlined /> },
    kanban: { label: 'Канбан', icon: <AppstoreOutlined /> },
    grid: { label: 'Сетка', icon: <AppstoreOutlined /> },
  };

  // Опции для Segmented
  const viewModeOptions = viewModes.map((mode) => ({
    value: mode,
    icon: viewModeConfig[mode]?.icon,
    label: viewModeConfig[mode]?.label || mode,
  }));

  // Меню экспорта/импорта
  const exportMenuItems = [];
  
  if (onExport) {
    exportMenuItems.push({
      key: 'export-excel',
      icon: <DownloadOutlined />,
      label: 'Экспорт в Excel',
      onClick: () => onExport('excel'),
    });
    exportMenuItems.push({
      key: 'export-csv',
      icon: <DownloadOutlined />,
      label: 'Экспорт в CSV',
      onClick: () => onExport('csv'),
    });
  }

  if (onImport) {
    if (exportMenuItems.length > 0) {
      exportMenuItems.push({ type: 'divider' });
    }
    exportMenuItems.push({
      key: 'import',
      icon: <UploadOutlined />,
      label: 'Импорт',
      onClick: onImport,
    });
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 16,
      }}
    >
      {/* Левая часть: заголовок и счетчик */}
      <Space size="middle" style={{ flex: '0 0 auto' }}>
        {title && (
          <div>
            <span style={{ fontSize: 18, fontWeight: 600 }}>{title}</span>
            {total > 0 && (
              <Badge
                count={total}
                showZero
                style={{
                  marginLeft: 12,
                  backgroundColor: '#1890ff',
                }}
              />
            )}
          </div>
        )}
      </Space>

      {/* Центральная часть: поиск и фильтры */}
      <Space size="middle" style={{ flex: '1 1 auto', justifyContent: 'center' }}>
        {onSearch && (
          <Search
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearchChange}
            onSearch={(value) => onSearch && onSearch(value)}
            loading={loading}
            allowClear
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
        )}

        {filters.length > 0 && (
          <Space size="small">
            {filters.map((filter, index) => (
              <Select
                key={filter.key || index}
                placeholder={filter.placeholder}
                value={filter.value}
                onChange={(value) => onFilterChange && onFilterChange(filter.key, value)}
                style={{ width: filter.width || 150 }}
                allowClear
                options={filter.options}
              />
            ))}
          </Space>
        )}
      </Space>

      {/* Правая часть: действия и переключатель режимов */}
      <Space size="middle" style={{ flex: '0 0 auto' }}>
        {extra}

        {showRefreshButton && onRefresh && (
          <Tooltip title="Обновить">
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={onRefresh}
              disabled={loading}
            />
          </Tooltip>
        )}

        {(showExportButton || showImportButton) && exportMenuItems.length > 0 && (
          <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
            <Button icon={<ExportOutlined />}>
              Экспорт
            </Button>
          </Dropdown>
        )}

        {showCreateButton && onCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreate}
          >
            {createButtonText}
          </Button>
        )}

        {showViewModeSwitch && onViewModeChange && viewModes.length > 1 && (
          <Segmented
            options={viewModeOptions}
            value={viewMode}
            onChange={onViewModeChange}
          />
        )}
      </Space>
    </div>
  );
}
