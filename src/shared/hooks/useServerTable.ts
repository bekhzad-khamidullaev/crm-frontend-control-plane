/**
 * Generic hook for server-side tables with pagination, sorting, and filtering
 * Works with DRF-style paginated responses
 *
 * @example
 * ```tsx
 * const { data, isLoading, pagination, handleTableChange } = useServerTable({
 *   queryKey: ['companies'],
 *   queryFn: (params) => CompaniesService.companiesList(params),
 * });
 * ```
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TablePaginationConfig } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';

export interface PaginatedResponse<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export interface TableParams {
  page?: number;
  page_size?: number;
  ordering?: string;
  search?: string;
  [key: string]: unknown;
}

export interface UseServerTableOptions<T> {
  queryKey: unknown[];
  queryFn: (params: TableParams) => Promise<PaginatedResponse<T>>;
  initialPageSize?: number;
  enableSearch?: boolean;
  defaultFilters?: Record<string, unknown>;
}

export function useServerTable<T extends { id: number | string }>({
  queryKey,
  queryFn,
  initialPageSize = 20,
  enableSearch = true,
  defaultFilters = {},
}: UseServerTableOptions<T>) {
  const [params, setParams] = useState<TableParams>({
    page: 1,
    page_size: initialPageSize,
    ...defaultFilters,
  });

  // Fetch data with React Query
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => queryFn(params),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page (v5 API)
  });

  // Handle table changes (pagination, filters, sorting)
  const handleTableChange = useCallback(
    (
      pagination: TablePaginationConfig,
      filters: Record<string, FilterValue | null>,
      sorter: SorterResult<T> | SorterResult<T>[]
    ) => {
      const newParams: TableParams = {
        page: pagination.current || 1,
        page_size: pagination.pageSize || initialPageSize,
      };

      // Handle sorting
      if (!Array.isArray(sorter) && sorter.field) {
        const orderField = String(sorter.field);
        newParams.ordering = sorter.order === 'descend' ? `-${orderField}` : orderField;
      }

      // Handle filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.length > 0) {
          newParams[key] = Array.isArray(value) ? value.join(',') : value[0];
        }
      });

      // Preserve existing filters not changed
      Object.entries(params).forEach(([key, value]) => {
        if (!['page', 'page_size', 'ordering'].includes(key) && !(key in filters)) {
          newParams[key] = value;
        }
      });

      setParams(newParams);
    },
    [params, initialPageSize]
  );

  // Handle search (debounced in component)
  const handleSearch = useCallback((searchValue: string) => {
    setParams((prev) => ({
      ...prev,
      page: 1, // Reset to first page on search
      search: searchValue || undefined,
    }));
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey: string, filterValue: unknown) => {
    setParams((prev) => ({
      ...prev,
      page: 1, // Reset to first page on filter change
      [filterKey]: filterValue,
    }));
  }, []);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setParams({
      page: 1,
      page_size: initialPageSize,
      ...defaultFilters,
    });
  }, [initialPageSize, defaultFilters]);

  // Pagination config for Ant Design Table
  const pagination: TablePaginationConfig = {
    current: params.page || 1,
    pageSize: params.page_size || initialPageSize,
    total: data?.count || 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} из ${total}`,
    pageSizeOptions: ['10', '20', '50', '100'],
  };

  return {
    data: data?.results ?? [],
    total: data?.count ?? 0,
    isLoading,
    isFetching,
    error,
    pagination,
    params,
    handleTableChange,
    handleSearch: enableSearch ? handleSearch : undefined,
    handleFilterChange,
    handleResetFilters,
  };
}
