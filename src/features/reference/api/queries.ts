import { useQuery } from '@tanstack/react-query';
import { CrmReferenceService } from '@/shared/api/generated/services/CrmReferenceService';
import { CrmTagsService } from '@/shared/api/generated/services/CrmTagsService';
import { DepartmentsService } from '@/shared/api/generated/services/DepartmentsService';
import { UsersService } from '@/shared/api/generated/services/UsersService';
import { StagesService } from '@/shared/api/generated/services/StagesService';
import { referenceKeys } from './keys';

export const useIndustries = () => {
  return useQuery({
    queryKey: referenceKeys.industries.lists(),
    queryFn: () => CrmReferenceService.industriesList({ page: 1, pageSize: 500 }),
    staleTime: 60 * 60 * 1000, // 1 hour - reference data changes rarely
  });
};

export const useClientTypes = () => {
  return useQuery({
    queryKey: referenceKeys.clientTypes.lists(),
    queryFn: () => CrmReferenceService.clientTypesList({ page: 1, pageSize: 500 }),
    staleTime: 60 * 60 * 1000,
  });
};

export const useLeadSources = () => {
  return useQuery({
    queryKey: referenceKeys.leadSources.lists(),
    queryFn: () => CrmReferenceService.leadSourcesList({ page: 1, pageSize: 500 }),
    staleTime: 60 * 60 * 1000,
  });
};

export const useCountries = () => {
  return useQuery({
    queryKey: referenceKeys.countries.lists(),
    queryFn: () => CrmReferenceService.countriesList({ page: 1, pageSize: 500 }),
    staleTime: 24 * 60 * 60 * 1000, // Very stable
  });
};

export const useCities = (countryId?: number) => {
  return useQuery({
    queryKey: referenceKeys.cities.list({ country: countryId }),
    queryFn: () => CrmReferenceService.citiesList({ country: countryId, page: 1, pageSize: 500 }),
    enabled: !!countryId,
    staleTime: 60 * 60 * 1000,
  });
};

export const useDepartments = () => {
  return useQuery({
    queryKey: referenceKeys.departments.lists(),
    queryFn: () => DepartmentsService.departmentsList({ page: 1, pageSize: 500 }),
    staleTime: 60 * 60 * 1000,
  });
};

export const useTags = () => {
  return useQuery({
    queryKey: referenceKeys.tags.lists(),
    queryFn: () => CrmTagsService.crmTagsList({ page: 1, pageSize: 500 }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: referenceKeys.users.lists(),
    queryFn: () => UsersService.usersList({ page: 1, pageSize: 500 }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useStages = () => {
  return useQuery({
    queryKey: referenceKeys.stages.lists(),
    queryFn: () => StagesService.stagesList({ page: 1, pageSize: 500 }),
    staleTime: 60 * 60 * 1000,
  });
};

export const useCurrencies = () => {
  return useQuery({
    queryKey: referenceKeys.currencies.lists(),
    queryFn: () => CrmReferenceService.currenciesList({ page: 1, pageSize: 500 }),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useClosingReasons = () => {
  return useQuery({
    queryKey: referenceKeys.closingReasons.lists(),
    queryFn: () => CrmReferenceService.closingReasonsList({ page: 1, pageSize: 500 }),
    staleTime: 60 * 60 * 1000,
  });
};
