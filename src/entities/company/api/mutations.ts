/**
 * Company entity mutations
 * CREATE, UPDATE, DELETE operations for companies
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { CompaniesService } from '@/shared/api/generated/services/CompaniesService';
import { companyKeys } from './keys';
import type { Company } from '@/shared/api/generated/models/Company';
import type { PatchedCompany } from '@/shared/api/generated/models/PatchedCompany';

/**
 * Create new company
 */
export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Company) => CompaniesService.companiesCreate({ requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      message.success('Компания успешно создана');
    },
    onError: (error: any) => {
      message.error(error?.body?.message || 'Ошибка при создании компании');
    },
  });
};

/**
 * Update existing company (full update)
 */
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Company }) =>
      CompaniesService.companiesUpdate({ id, requestBody: data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      message.success('Компания успешно обновлена');
    },
    onError: (error: any) => {
      message.error(error?.body?.message || 'Ошибка при обновлении компании');
    },
  });
};

/**
 * Partial update for company
 */
export const usePatchCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PatchedCompany }) =>
      CompaniesService.companiesPartialUpdate({ id, requestBody: data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      message.success('Компания успешно обновлена');
    },
    onError: (error: any) => {
      message.error(error?.body?.message || 'Ошибка при обновлении компании');
    },
  });
};

/**
 * Delete company
 */
export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => CompaniesService.companiesDestroy({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      message.success('Компания успешно удалена');
    },
    onError: (error: any) => {
      message.error(error?.body?.message || 'Ошибка при удалении компании');
    },
  });
};
