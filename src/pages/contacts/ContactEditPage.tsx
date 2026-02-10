import React from 'react';
import { ContactForm } from '@/widgets/contact-form';
import { useContact } from '@/entities/contact/api/queries';
import { useUpdateContact } from '@/entities/contact/api/mutations';
import { ContactFormData } from '@/entities/contact/model/schema';
import { navigate } from '@/router.js';
import { message, Spin } from 'antd';

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
    } catch (error) {
       // Handled
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
