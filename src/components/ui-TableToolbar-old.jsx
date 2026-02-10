import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  FileDown,
  Filter,
  RefreshCcw,
  LayoutList,
  LayoutGrid,
  Upload,
} from 'lucide-react';

import { Input } from './ui/input.jsx';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.jsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip.jsx';
import { cn } from '../lib/utils/cn.js';

/**
 * TableToolbar - Универсальная панель инструментов для таблиц
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
  const onSearchRef = useRef(onSearch);
  const hasTriggeredInitialSearch = useRef(false);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, searchDebounce);

    return () => clearTimeout(timer);
  }, [searchValue, searchDebounce]);

  useEffect(() => {
    if (!hasTriggeredInitialSearch.current) {
      hasTriggeredInitialSearch.current = true;
      if (!debouncedSearch) return;
    }

    if (onSearchRef.current) {
      onSearchRef.current(debouncedSearch);
    }
  }, [debouncedSearch]);

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  };

  const viewModeConfig = {
    table: { label: 'Таблица', icon: <LayoutList className="h-4 w-4" /> },
    kanban: { label: 'Канбан', icon: <LayoutGrid className="h-4 w-4" /> },
    grid: { label: 'Сетка', icon: <LayoutGrid className="h-4 w-4" /> },
  };

  const exportMenuItems = [];

  if (onExport) {
    exportMenuItems.push({
      key: 'export-excel',
      icon: <FileDown className="h-4 w-4" />,
      label: 'Экспорт в Excel',
      onClick: () => onExport('excel'),
    });
    exportMenuItems.push({
      key: 'export-csv',
      icon: <FileDown className="h-4 w-4" />,
      label: 'Экспорт в CSV',
      onClick: () => onExport('csv'),
    });
  }

  if (onImport) {
    exportMenuItems.push({ key: 'import-divider', divider: true });
    exportMenuItems.push({
      key: 'import',
      icon: <Upload className="h-4 w-4" />,
      label: 'Импорт',
      onClick: onImport,
    });
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {title && (
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">{title}</span>
              {total > 0 && <Badge variant="secondary">{total}</Badge>}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-center gap-3">
          {onSearch && (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={handleSearchChange}
                disabled={loading}
                className="pl-9"
              />
            </div>
          )}

          {filters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.map((filter, index) => (
                <select
                  key={filter.key || index}
                  value={filter.value ?? ''}
                  onChange={(event) => onFilterChange?.(filter.key, event.target.value)}
                  className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                >
                  <option value="">{filter.placeholder}</option>
                  {filter.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {extra}

          {showRefreshButton && onRefresh && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
                  <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Обновить</TooltipContent>
            </Tooltip>
          )}

          {(showExportButton || showImportButton) && exportMenuItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Экспорт
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {exportMenuItems.map((item, index) =>
                  item.divider ? (
                    <DropdownMenuSeparator key={`divider-${index}`} />
                  ) : (
                    <DropdownMenuItem key={item.key} onClick={item.onClick}>
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {showCreateButton && onCreate && (
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {createButtonText}
            </Button>
          )}

          {showViewModeSwitch && onViewModeChange && viewModes.length > 1 && (
            <div className="flex items-center rounded-md border border-border bg-background p-1">
              {viewModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onViewModeChange(mode)}
                  className={cn(
                    'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
                    viewMode === mode
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  {viewModeConfig[mode]?.icon}
                  <span>{viewModeConfig[mode]?.label || mode}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
