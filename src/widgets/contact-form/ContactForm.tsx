import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Card,
  Row,
  Col,
  Switch,
  Modal,
  Typography,
  Divider,
} from 'antd';
import { BusinessFormHeader } from '@/components/business/BusinessFormHeader';
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

const { TextArea } = Input;
const { Title, Text } = Typography;

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
    <div>
      <BusinessFormHeader
        formId={formId}
        title={isEdit ? 'Редактировать контакт' : 'Создать новый контакт'}
        subtitle={
          isEdit
            ? 'Уточните контактные данные и рабочий контекст.'
            : 'Добавьте контакт, чтобы привязать его к компании и ответственному.'
        }
        submitLabel={isEdit ? 'Сохранить изменения' : 'Создать контакт'}
        isSubmitting={isLoading}
        onBack={handleLeave}
      />

      <Card style={{ marginTop: 16 }}>
        <Form
          id={formId}
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off"
          disabled={isLoading}
        >
          <Title level={4}>Личные данные</Title>
          <Text type="secondary">Основные идентификаторы и контактные каналы.</Text>
          <Divider style={{ margin: '12px 0 16px' }} />

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
                rules={[{ type: 'email', message: 'Некорректный email' }]}
              >
                <Input placeholder="ivan@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Телефон" name="phone">
                <Input placeholder="+998 90 123 45 67" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Мобильный" name="mobile">
                <Input placeholder="+998 90 123 45 67" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Доп. телефон" name="other_phone">
                <Input placeholder="+998 90 123 45 67" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Telegram username" name="telegram_username">
                <Input placeholder="username (без @)" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Telegram chat_id" name="telegram_chat_id">
                <Input placeholder="например 123456789 или -1001234567890" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Instagram username" name="instagram_username">
                <Input placeholder="username (без @)" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Instagram recipient_id" name="instagram_recipient_id">
                <Input placeholder="например 1784..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Facebook PSID" name="facebook_psid">
                <Input placeholder="например 1234567890123456" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Компания"
                name="company"
                rules={[{ required: true, message: 'Выберите компанию' }]}
              >
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

          <Title level={4} style={{ marginTop: 24 }}>Локация</Title>
          <Text type="secondary">Адрес нужен только если он используется в продажах или доставке.</Text>
          <Divider style={{ margin: '12px 0 16px' }} />

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
            <Col span={24}>
              <Form.Item label="Адрес" name="address">
                <Input placeholder="Улица, дом, офис" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>Настройки</Title>
          <Text type="secondary">Ответственные и коммуникационные предпочтения по контакту.</Text>
          <Divider style={{ margin: '12px 0 16px' }} />

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

          <Form.Item label="Описание" name="description">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
