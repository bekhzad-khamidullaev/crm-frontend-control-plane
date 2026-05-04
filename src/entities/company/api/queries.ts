/**
 * Company entity React Query hooks
 * GET operations for fetching companies
 */

import { useQuery } from '@tanstack/react-query';
import { CompaniesService } from '@/shared/api/generated/services/CompaniesService';
import { ContactsService } from '@/shared/api/generated/services/ContactsService';
import { DealsService } from '@/shared/api/generated/services/DealsService';
// import { CallLogsService } from '@/shared/api/generated/services/CallLogsService';
import { companyKeys } from './keys';

export interface CompanyListParams {
  country?: number;
  department?: number;
  disqualified?: boolean;
  leadSource?: number;
  ordering?: string;
  owner?: number;
  page?: number;
  search?: string;
  type?: number;
  [key: string]: unknown;
}

/**
 * Fetch paginated list of companies
 */
export const useCompanies = (params: CompanyListParams = {}) => {
  return useQuery({
    queryKey: companyKeys.list(params),
    queryFn: () => CompaniesService.companiesList(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch single company by ID
 */
export const useCompany = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => CompaniesService.companiesRetrieve({ id }),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch contacts for a company
 */
export const useCompanyContacts = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['companies', id, 'contacts'],
    queryFn: () => ContactsService.contactsList({ company: id, page: 1, pageSize: 1000 }),
    enabled: enabled && !!id,
  });
};

/**
 * Fetch deals for a company
 */
export const useCompanyDeals = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['companies', id, 'deals'],
    queryFn: () => DealsService.dealsList({ company: id, page: 1, pageSize: 1000 }),
    enabled: enabled && !!id,
  });
};

// Placeholder for Call Logs until API is clarified
/*
export const useCompanyCallLogs = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['companies', id, 'calls'],
    queryFn: () => CallLogsService.callLogsList({ search: String(id) }), // Hacky
    enabled: enabled && !!id,
  });
};
*/
