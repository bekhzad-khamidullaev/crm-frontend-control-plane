export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (filters: any) => [...dealKeys.lists(), { ...filters }] as const,
  details: () => [...dealKeys.all, 'detail'] as const,
  detail: (id: number) => [...dealKeys.details(), id] as const,
};
