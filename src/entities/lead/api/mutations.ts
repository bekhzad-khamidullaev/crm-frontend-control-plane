import { LeadsService } from '@/shared/api/generated/services/LeadsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leadKeys } from './keys';
import type {
  LeadAssignRequest,
  LeadAssignResponse,
  LeadConvertRequest,
  LeadConvertResponse,
  LeadDisqualifyRequest,
  LeadDisqualifyResponse,
  LeadWrite,
  LeadWritePayload,
  PatchedLead,
} from '../model/types';

const toLeadWrite = (data: LeadWritePayload): LeadWrite => ({
  ...data,
  secondary_email: data.secondary_email ?? undefined,
  website: data.website ?? undefined,
  company_email: data.company_email ?? undefined,
});

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeadWritePayload) => LeadsService.leadsCreate({ requestBody: toLeadWrite(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LeadWritePayload }) =>
      LeadsService.leadsUpdate({ id, requestBody: toLeadWrite(data) }),
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

  return useMutation<LeadConvertResponse, unknown, { id: number; data: LeadConvertRequest }>({
    mutationFn: ({ id, data }) => LeadsService.leadsConvertCreate({ id, requestBody: data }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(variables.id) });
    },
  });
};

export const useDisqualifyLead = () => {
  const queryClient = useQueryClient();
  return useMutation<LeadDisqualifyResponse, unknown, { id: number; data: LeadDisqualifyRequest }>({
    mutationFn: ({ id, data }) => LeadsService.leadsDisqualifyCreate({ id, requestBody: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(data.id) });
    },
  });
};

export const useAssignLead = () => {
  const queryClient = useQueryClient();
  return useMutation<LeadAssignResponse, unknown, { id: number; data: LeadAssignRequest }>({
    mutationFn: ({ id, data }) => LeadsService.leadsAssignCreate({ id, requestBody: data }),
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
