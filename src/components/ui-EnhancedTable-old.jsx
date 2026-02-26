import React from 'react';
import { Inbox } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table.jsx';
import { Button } from './ui/button.jsx';
import { cn } from '../lib/utils/cn.js';

/**
 * EnhancedTable - Универсальный компонент таблицы с расширенными возможностями
 */
export default function EnhancedTable({
  columns = [],
  dataSource = [],
  loading = false,
  pagination = {},
  onChange,
  rowSelection,
  onRow,
  rowKey = 'id',
  scroll,
  size = 'middle',
  bordered = false,
  emptyText = 'Нет данных',
  emptyDescription = 'Попробуйте изменить параметры поиска или создать новую запись',
  showTotal = true,
  showSizeChanger = true,
  showQuickJumper = true,
  pageSizeOptions = ['10', '20', '50', '100'],
  rowClassName,
  title,
  footer,
  ...restProps
}) {
  const pageSize = pagination?.pageSize || 10;
  const total = pagination?.total || dataSource.length;
  const current = pagination?.current || 1;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (current - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const visibleRows = dataSource.slice(startIndex, endIndex);

  const handlePageChange = (nextPage) => {
    if (onChange) {
      onChange({ ...pagination, current: nextPage, pageSize }, {}, {}, {});
    }
  };

  const handlePageSizeChange = (event) => {
    const nextPageSize = Number(event.target.value);
    if (onChange) {
      onChange({ ...pagination, current: 1, pageSize: nextPageSize }, {}, {}, {});
    }
  };

  const handleSort = (column) => {
    if (!onChange || !column.sorter) return;
    const sorter = {
      field: column.dataIndex,
      order: 'ascend',
    };
    onChange({ ...pagination, current, pageSize }, {}, sorter, {});
  };

  const renderCell = (column, record) => {
    if (column.render) {
      return column.render(record[column.dataIndex], record);
    }
    return record[column.dataIndex];
  };

  return (
    <div className={cn('space-y-4', restProps.className)}>
      {title && <div className="text-lg font-semibold">{title()}</div>}
      <div className={cn('rounded-md border border-border', bordered && 'border-2')}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key || column.dataIndex} className={column.className}>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-left"
                    onClick={() => handleSort(column)}
                  >
                    {column.title}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10">
                  <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                    <Inbox className="h-10 w-10" />
                    <div className="font-semibold text-foreground">{emptyText}</div>
                    <div className="text-xs text-muted-foreground">{emptyDescription}</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((record, rowIndex) => (
                <TableRow
                  key={record[rowKey] || rowIndex}
                  className={rowClassName ? rowClassName(record, rowIndex) : undefined}
                  onClick={() => onRow?.(record)?.onClick?.()}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key || column.dataIndex} className={column.className}>
                      {renderCell(column, record)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination !== false && (
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          {showTotal && (
            <span>
              Показаны {startIndex + 1}-{Math.min(endIndex, total)} из {total}
            </span>
          )}
          <div className="flex items-center gap-2">
            {showSizeChanger && (
              <select
                className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handlePageChange(Math.max(1, current - 1))}>
                Назад
              </Button>
              <span>
                {current} / {totalPages}
              </span>
              <Button size="sm" variant="outline" onClick={() => handlePageChange(Math.min(totalPages, current + 1))}>
                Вперёд
              </Button>
            </div>
          </div>
        </div>
      )}

      {footer && <div>{footer()}</div>}
    </div>
  );
}

export function createActionsColumn(config = {}) {
  const { component: ActionsComponent, width = 80, fixed = 'right', ...restConfig } = config;

  return {
    title: 'Действия',
    key: 'actions',
    width,
    fixed,
    align: 'center',
    render: (_, record) => (ActionsComponent ? <ActionsComponent record={record} /> : null),
    ...restConfig,
  };
}

export function createTagColumn(config = {}) {
  const { dataIndex, title, colors = {}, ...restConfig } = config;

  return {
    title,
    dataIndex,
    key: dataIndex,
    render: (value) => {
      if (!value) return '-';
      const color = colors[value] || 'default';
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
            color === 'success'
              ? 'bg-emerald-100 text-emerald-700'
              : color === 'warning'
              ? 'bg-amber-100 text-amber-700'
              : color === 'error'
              ? 'bg-rose-100 text-rose-700'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {value}
        </span>
      );
    },
    ...restConfig,
  };
}

export function createAvatarColumn(config = {}) {
  const { dataIndex, title, nameKey = 'name', avatarKey = 'avatar', ...restConfig } = config;

  return {
    title,
    dataIndex,
    key: dataIndex || nameKey,
    render: (_, record) => (
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-muted" />
        <span>{record[nameKey] || '-'}</span>
      </div>
    ),
    ...restConfig,
  };
}

export function createDateColumn(config = {}) {
  const { dataIndex, title, format = 'DD.MM.YYYY HH:mm', ...restConfig } = config;

  return {
    title,
    dataIndex,
    key: dataIndex,
    render: (value) => {
      if (!value) return '-';
      const dayjs = require('dayjs');
      return dayjs(value).format(format);
    },
    ...restConfig,
  };
}
