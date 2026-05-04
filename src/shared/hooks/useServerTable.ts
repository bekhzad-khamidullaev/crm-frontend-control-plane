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

import { useQuery } from '@tanstack/react-query';
import type { TablePaginationConfig } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { useCallback, useEffect, useState } from 'react';

export interface PaginatedResponse<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export interface TableParams {
  page?: number;
  pageSize?: number;
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
  syncWithUrl?: boolean;
}

export function useServerTable<T extends { id: number | string }>({
  queryKey,
  queryFn,
  initialPageSize = 20,
  enableSearch = true,
  defaultFilters = {},
  syncWithUrl = true,
}: UseServerTableOptions<T>) {
  const readHashParams = useCallback((): TableParams => {
    if (typeof window === 'undefined') return {};
    const rawHash = (window.location.hash || '').replace(/^#/, '');
    const [, rawQuery = ''] = rawHash.split('?');
    const searchParams = new URLSearchParams(rawQuery);
    const parsed: TableParams = {};

    searchParams.forEach((value, key) => {
      if (!value) return;
      if (key === 'page' || key === 'pageSize') {
        const num = Number(value);
        if (Number.isFinite(num) && num > 0) {
          parsed[key] = num;
        }
        return;
      }
      parsed[key] = value;
    });

    return parsed;
  }, []);

  const [params, setParams] = useState<TableParams>(() => ({
    page: 1,
    pageSize: initialPageSize,
    ...defaultFilters,
    ...(syncWithUrl ? readHashParams() : {}),
  }));

  // Fetch data with React Query
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => queryFn(params),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page (v5 API)
  });

  useEffect(() => {
    if (!syncWithUrl || typeof window === 'undefined') return;

    const rawHash = (window.location.hash || '').replace(/^#/, '');
    const [rawPath = ''] = rawHash.split('?');
    const path = rawPath || '/';
    const nextQuery = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      nextQuery.set(key, String(value));
    });

    const nextHash = nextQuery.toString() ? `#${path}?${nextQuery.toString()}` : `#${path}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  }, [params, syncWithUrl]);

  useEffect(() => {
    if (!syncWithUrl || typeof window === 'undefined') return;

    const handleHashChange = () => {
      setParams({
        page: 1,
        pageSize: initialPageSize,
        ...defaultFilters,
        ...readHashParams(),
      });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [defaultFilters, initialPageSize, readHashParams, syncWithUrl]);

  // Handle table changes (pagination, filters, sorting)
  const handleTableChange = useCallback(
    (
      pagination: TablePaginationConfig,
      filters: Record<string, FilterValue | null>,
      sorter: SorterResult<T> | SorterResult<T>[]
    ) => {
      const newParams: TableParams = {
        page: pagination.current || 1,
        pageSize: pagination.pageSize || initialPageSize,
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
        if (!['page', 'pageSize', 'ordering'].includes(key) && !(key in filters)) {
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

  const applyFilters = useCallback((filters: Record<string, unknown>) => {
    const nextParams: TableParams = {
      page: 1,
      pageSize: params.pageSize || initialPageSize,
      ...defaultFilters,
    };

    if (params.ordering) {
      nextParams.ordering = params.ordering;
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (['page', 'pageSize', 'ordering'].includes(key)) return;
      if (value === undefined || value === null || value === '') return;
      nextParams[key] = value;
    });

    setParams(nextParams);
  }, [defaultFilters, initialPageSize, params.ordering, params.pageSize]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setParams({
      page: 1,
      pageSize: initialPageSize,
      ...defaultFilters,
    });
  }, [initialPageSize, defaultFilters]);

  // Pagination config for Ant Design Table
  const pagination: TablePaginationConfig = {
    current: params.page || 1,
    pageSize: params.pageSize || initialPageSize,
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
    errorMessage: undefined,
    errorDescription: undefined,
    pagination,
    params,
    handleTableChange,
    handleSearch: enableSearch ? handleSearch : undefined,
    handleFilterChange,
    applyFilters,
    handleResetFilters,
    refetch,
  };
}
