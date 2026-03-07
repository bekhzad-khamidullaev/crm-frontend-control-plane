import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Card,
  Row,
  Col,
  Switch,
  Modal,
} from 'antd';
import { navigate } from '@/router.js';
import {
  CountrySelect,
  CitySelect,
  DepartmentSelect,
  TagSelect,
  UserSelect,
  CompanySelect,
  LeadSourceSelect
} from '@/features/reference';
import { ContactFormData } from '@/entities/contact/model/schema';
import type { Contact } from '@/entities/contact/model/types';
import { EntityFormSection, EntityFormShell, PhoneInput } from '@/shared/ui';
const { TextArea } = Input;

export interface ContactFormProps {
  initialValues?: Contact;
  onSubmit: (values: ContactFormData) => Promise<void>;
  isLoading?: boolean;
  isEdit?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  initialValues,
  onSubmit,
  isLoading,
  isEdit,
}) => {
  const [form] = Form.useForm();
  const country = Form.useWatch('country', form);
  const formId = 'contact-form';

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleFinish = (values: any) => {
    onSubmit(values as ContactFormData);
  };

  const handleLeave = () => {
    if (!form.isFieldsTouched()) {
      navigate('/contacts');
      return;
    }

    Modal.confirm({
      title: 'Есть несохраненные изменения',
      content: 'Выйти без сохранения?',
      okText: 'Выйти',
      cancelText: 'Остаться',
      okButtonProps: { danger: true },
      onOk: () => navigate('/contacts'),
    });
  };

  return (
    <EntityFormShell
      title={isEdit ? 'Редактировать контакт' : 'Создать новый контакт'}
      subtitle={isEdit ? 'Уточните контактные данные и рабочий контекст.' : 'Добавьте контакт, чтобы привязать его к компании и ответственному.'}
      hint="Если компания уже существует в базе, выберите её вместо ручного ввода."
      formId={formId}
      submitText={isEdit ? 'Сохранить изменения' : 'Создать контакт'}
      isSubmitting={isLoading}
      onBack={handleLeave}
      onCancel={handleLeave}
    >
      <Card>
        <Form
          id={formId}
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off"
          disabled={isLoading}
        >
          <EntityFormSection
            title="Личные данные"
            description="Основные идентификаторы и контактные каналы."
          />
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Имя"
                name="first_name"
                rules={[{ required: true, message: 'Введите имя' }]}
              >
                <Input placeholder="Иван" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Отчество" name="middle_name">
                <Input placeholder="Иванович" />
              </Form.Item>
            </Col>
             <Col xs={24} md={8}>
              <Form.Item
                label="Фамилия"
                name="last_name"
                rules={[{ required: true, message: 'Введите фамилию' }]}
              >
                <Input placeholder="Петров" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { type: 'email', message: 'Некорректный email' },
                ]}
              >
                <Input placeholder="ivan@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Телефон" name="phone">
                <PhoneInput />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
             <Col xs={24} md={12}>
                <Form.Item label="Компания" name="company">
                  <CompanySelect style={{ width: '100%' }} />
                </Form.Item>
             </Col>
             <Col xs={24} md={12}>
                <Form.Item label="Должность" name="title">
                   <Input placeholder="Менеджер" />
                </Form.Item>
             </Col>
          </Row>

           <Row gutter={16}>
             <Col xs={24} md={12}>
                 <Form.Item label="Источник" name="lead_source">
                  <LeadSourceSelect style={{ width: '100%' }} />
                </Form.Item>
             </Col>
             <Col xs={24} md={12}>
                 <Form.Item label="Теги" name="tags">
                    <TagSelect style={{ width: '100%' }} />
                 </Form.Item>
             </Col>
           </Row>

          <EntityFormSection
            title="Локация"
            description="Адрес нужен только если он используется в продажах или доставке."
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Страна" name="country">
                <CountrySelect style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Город" name="city">
                <CitySelect countryId={country} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
           <Row gutter={16}>
             <Col xs={24} md={24}>
                <Form.Item label="Адрес" name="address">
                   <Input placeholder="Улица, дом, офис" />
                </Form.Item>
             </Col>
           </Row>

          <EntityFormSection
            title="Настройки"
            description="Ответственные и коммуникационные предпочтения по контакту."
          />
           <Row gutter={16}>
             <Col xs={24} md={12}>
                <Form.Item label="Ответственный" name="owner">
                   <UserSelect style={{ width: '100%' }} />
                </Form.Item>
             </Col>
             <Col xs={24} md={12}>
                <Form.Item label="Отдел" name="department">
                   <DepartmentSelect style={{ width: '100%' }} />
                </Form.Item>
             </Col>
           </Row>

           <Row gutter={16}>
              <Col xs={24} md={12}>
                 <Form.Item label="Массовая рассылка" name="massmail" valuePropName="checked">
                   <Switch />
                 </Form.Item>
              </Col>
           </Row>

          <Form.Item label="Описание" name="description" style={{ marginTop: 24 }}>
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Card>
    </EntityFormShell>
  );
};
