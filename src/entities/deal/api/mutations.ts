import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DealsService } from '@/shared/api/generated/services/DealsService';
import type { Deal } from '@/shared/api/generated/models/Deal';
import type { PatchedDeal } from '@/shared/api/generated/models/PatchedDeal';
import { dealKeys } from './keys';

export const useCreateDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Deal) => DealsService.dealsCreate({ requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
};

export const useUpdateDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Deal }) =>
      DealsService.dealsUpdate({ id, requestBody: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(data.id) });
    },
  });
};

export const usePatchDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PatchedDeal }) =>
      DealsService.dealsPartialUpdate({ id, requestBody: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(data.id) });
    },
  });
};

export const useDeleteDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => DealsService.dealsDestroy({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
};
