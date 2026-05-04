import { useQuery } from '@tanstack/react-query';
import { ContactsService } from '@/shared/api/generated/services/ContactsService';
import { contactKeys } from './keys';

export interface ContactListParams {
  company?: number;
  country?: number;
  department?: number;
  disqualified?: boolean;
  ordering?: string;
  owner?: number;
  page?: number;
  search?: string;
  [key: string]: unknown;
}

export const useContacts = (params: ContactListParams = {}) => {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: () => ContactsService.contactsList(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useContact = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: () => ContactsService.contactsRetrieve({ id }),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};
