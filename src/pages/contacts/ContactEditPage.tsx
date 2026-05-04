import { useUpdateContact } from '@/entities/contact/api/mutations';
import { useContact } from '@/entities/contact/api/queries';
import { ContactFormData } from '@/entities/contact/model/schema';
import { BusinessScreenState } from '@/components/business/BusinessScreenState';
import { getApiErrorMessage } from '@/lib/api/error-utils';
import { navigate } from '@/router.js';
import { ContactForm } from '@/widgets/contact-form';
import { message } from 'antd';
import React from 'react';

export interface ContactEditPageProps {
  id?: number;
}

export const ContactEditPage: React.FC<ContactEditPageProps> = ({ id }) => {
  const { data: contact, isLoading: isLoadingContact } = useContact(id!);
  const updateMutation = useUpdateContact();

  const handleSubmit = async (values: ContactFormData) => {
    if (!id) return;
    try {
      // @ts-ignore
      await updateMutation.mutateAsync({ id, data: values });
      message.success('Контакт обновлен');
      navigate('/contacts');
    } catch (error: any) {
      message.error(getApiErrorMessage(error, 'Ошибка обновления контакта'));
    }
  };

  if (isLoadingContact) {
    return (
      <BusinessScreenState
        variant="loading"
        title="Загрузка контакта"
        description="Подготавливаем данные контакта для редактирования."
      />
    );
  }

  if (!contact) {
    return (
      <BusinessScreenState
        variant="notFound"
        title="Контакт не найден"
        actionLabel="К контактам"
        onAction={() => navigate('/contacts')}
      />
    );
  }

  return (
    <ContactForm
      // @ts-ignore
      initialValues={contact}
      onSubmit={handleSubmit}
      isLoading={updateMutation.isPending}
      isEdit
    />
  );
};

export default ContactEditPage;
