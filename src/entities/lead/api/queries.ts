import { useQuery } from '@tanstack/react-query';
import { LeadsService } from '@/shared/api/generated/services/LeadsService';
import { leadKeys } from './keys';

export interface LeadListParams {
  company?: number;
  country?: number;
  department?: number;
  disqualified?: boolean;
  leadSource?: number;
  ordering?: string;
  owner?: number;
  page?: number;
  search?: string;
  wasInTouch?: string;
  [key: string]: unknown;
}

export const useLeads = (params: LeadListParams = {}) => {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: () => LeadsService.leadsList(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useLead = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => LeadsService.leadsRetrieve({ id }),
    enabled: !!id && enabled,
  });
};
