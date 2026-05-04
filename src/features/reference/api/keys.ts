import { createQueryKeys } from '@/shared/api/query-client';

export const referenceKeys = {
  industries: createQueryKeys('industries'),
  clientTypes: createQueryKeys('clientTypes'),
  leadSources: createQueryKeys('leadSources'),
  countries: createQueryKeys('countries'),
  cities: createQueryKeys('cities'),
  departments: createQueryKeys('departments'),
  tags: createQueryKeys('tags'),
  users: createQueryKeys('users'),
  stages: createQueryKeys('stages'),
  currencies: createQueryKeys('currencies'),
  closingReasons: createQueryKeys('closingReasons'),
};
