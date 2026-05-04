import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DealsService } from '@/shared/api/generated/services/DealsService';
import { dealKeys } from './keys';
import type { DealWrite, DealWritePayload, PatchedDeal } from '../model/types';

const toDealWrite = (data: DealWritePayload): DealWrite => {
  if (!data.next_step_date) {
    throw new Error('next_step_date is required');
  }

  return {
    ...data,
    next_step_date: String(data.next_step_date),
    amount:
      data.amount === undefined || data.amount === null || data.amount === ''
        ? null
        : String(data.amount),
  };
};

export const useCreateDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DealWritePayload) => DealsService.dealsCreate({ requestBody: toDealWrite(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
};

export const useUpdateDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DealWritePayload }) =>
      DealsService.dealsUpdate({ id, requestBody: toDealWrite(data) }),
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
