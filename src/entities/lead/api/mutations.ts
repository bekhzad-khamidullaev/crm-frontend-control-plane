import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LeadsService } from '@/shared/api/generated/services/LeadsService';
import type { Lead } from '@/shared/api/generated/models/Lead';
import type { PatchedLead } from '@/shared/api/generated/models/PatchedLead';
import { leadKeys } from './keys';

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Lead) => LeadsService.leadsCreate({ requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Lead }) =>
      LeadsService.leadsUpdate({ id, requestBody: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(data.id) });
    },
  });
};

export const usePatchLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PatchedLead }) =>
      LeadsService.leadsPartialUpdate({ id, requestBody: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(data.id) });
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => LeadsService.leadsDestroy({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
};

export const useConvertLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Lead }) =>
      LeadsService.leadsConvertCreate({ id, requestBody: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(data.id) });
    },
  });
};

export const useDisqualifyLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Lead }) =>
      LeadsService.leadsDisqualifyCreate({ id, requestBody: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(data.id) });
    },
  });
};

export const useAssignLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Lead }) =>
      LeadsService.leadsAssignCreate({ id, requestBody: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(data.id) });
    },
  });
};

export const useBulkTagLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: any) => LeadsService.leadsBulkTagCreate({ requestBody: data }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      },
    });
  };
