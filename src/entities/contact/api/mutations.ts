import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ContactsService } from '@/shared/api/generated/services/ContactsService';
import { contactKeys } from './keys';
import type { ContactWrite, ContactWritePayload, PatchedContact } from '../model/types';

const toContactWrite = (data: ContactWritePayload): ContactWrite => ({
  ...data,
  company: data.company ?? undefined,
});

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ContactWritePayload) => ContactsService.contactsCreate({ requestBody: toContactWrite(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContactWritePayload }) =>
      ContactsService.contactsUpdate({ id, requestBody: toContactWrite(data) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });
};

export const usePatchContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: PatchedContact }) =>
        ContactsService.contactsPartialUpdate({ id, requestBody: data }),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: contactKeys.detail(data.id) });
        queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      },
    });
  };

export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ContactsService.contactsDestroy({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });
};
