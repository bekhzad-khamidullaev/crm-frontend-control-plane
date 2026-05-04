import { QueryClient } from '@tanstack/react-query';

/**
 * Global React Query client configuration
 * Used throughout the app for data fetching and caching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for this duration
      gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time (formerly cacheTime)
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus (performance)
      refetchOnMount: true, // Refetch when component mounts
      refetchOnReconnect: true, // Refetch when connection is restored
    },
    mutations: {
      retry: 0, // Don't retry mutations
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

/**
 * Query key factory helper
 * Used to create consistent, type-safe query keys
 *
 * Example:
 * ```ts
 * const companyKeys = {
 *   all: ['companies'] as const,
 *   lists: () => [...companyKeys.all, 'list'] as const,
 *   list: (filters: string) => [...companyKeys.lists(), { filters }] as const,
 *   details: () => [...companyKeys.all, 'detail'] as const,
 *   detail: (id: number) => [...companyKeys.details(), id] as const,
 * };
 * ```
 */
export type QueryKeyFactory<T extends string> = {
  all: readonly [T];
  lists: () => readonly [T, 'list'];
  list: (params: Record<string, unknown>) => readonly [T, 'list', Record<string, unknown>];
  details: () => readonly [T, 'detail'];
  detail: (id: number | string) => readonly [T, 'detail', number | string];
};

/**
 * Helper to create query key factory for an entity
 */
export const createQueryKeys = <T extends string>(entity: T): QueryKeyFactory<T> => ({
  all: [entity] as const,
  lists: () => [entity, 'list'] as const,
  list: (params: Record<string, unknown>) => [entity, 'list', params] as const,
  details: () => [entity, 'detail'] as const,
  detail: (id: number | string) => [entity, 'detail', id] as const,
});
