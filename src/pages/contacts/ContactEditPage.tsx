import { useUpdateContact } from '@/entities/contact/api/mutations';
import { useContact } from '@/entities/contact/api/queries';
import { ContactFormData } from '@/entities/contact/model/schema';
import { navigate } from '@/router.js';
import { ContactForm } from '@/widgets/contact-form';
import { message, Spin } from 'antd';
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
      const details = error?.body?.details;
      const firstDetail = details && typeof details === 'object'
        ? Object.values(details)[0]
        : null;
      const detailText = Array.isArray(firstDetail) ? firstDetail[0] : firstDetail;
      message.error(
        detailText || error?.body?.message || 'Ошибка обновления контакта'
      );
    }
  };

  if (isLoadingContact) {
      return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
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
