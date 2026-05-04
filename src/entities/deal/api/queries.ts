import { useQuery } from '@tanstack/react-query';
import { DealsService } from '@/shared/api/generated/services/DealsService';
import { dealKeys } from './keys';

export interface DealListParams {
  active?: boolean;
  coOwner?: number;
  company?: number;
  contact?: number;
  department?: number;
  lead?: number;
  ordering?: string;
  owner?: number;
  page?: number;
  relevant?: boolean;
  search?: string;
  stage?: number;
  [key: string]: unknown;
}

export const useDeals = (params: DealListParams = {}) => {
  return useQuery({
    queryKey: dealKeys.list(params),
    queryFn: () => DealsService.dealsList(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useDeal = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: () => DealsService.dealsRetrieve({ id }),
    enabled: !!id && enabled,
  });
};
