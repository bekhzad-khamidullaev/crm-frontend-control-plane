import { useCreateContact } from '@/entities/contact/api/mutations';
import { ContactFormData } from '@/entities/contact/model/schema';
import { getApiErrorMessage } from '@/lib/api/error-utils';
import { navigate } from '@/router.js';
import { ContactForm } from '@/widgets/contact-form';
import { message } from 'antd';
import React from 'react';

export const ContactCreatePage: React.FC = () => {
  const createMutation = useCreateContact();

  const handleSubmit = async (values: ContactFormData) => {
    try {
      // @ts-ignore
      await createMutation.mutateAsync(values);
      message.success('Контакт создан');
      navigate('/contacts');
    } catch (error: any) {
      message.error(getApiErrorMessage(error, 'Ошибка создания контакта'));
    }
  };

  return <ContactForm onSubmit={handleSubmit} isLoading={createMutation.isPending} isEdit={false} />;
};

export default ContactCreatePage;
