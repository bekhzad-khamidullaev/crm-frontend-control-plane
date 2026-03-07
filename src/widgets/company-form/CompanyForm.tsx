import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Card,
  Row,
  Col,
  Switch,
  DatePicker,
  Modal,
} from 'antd';
import dayjs from 'dayjs';
import { navigate } from '@/router.js';
import {
  IndustrySelect,
  ClientTypeSelect,
  LeadSourceSelect,
  CountrySelect,
  CitySelect,
  DepartmentSelect,
  TagSelect,
  UserSelect
} from '@/features/reference';
import { CompanyFormData } from '@/entities/company/model/schema';
import type { Company } from '@/entities/company/model/types';
import { EntityFormSection, EntityFormShell, PhoneInput } from '@/shared/ui';
const { TextArea } = Input;

export interface CompanyFormProps {
  initialValues?: Company;
  onSubmit: (values: CompanyFormData) => Promise<void>;
  isLoading?: boolean;
  isEdit?: boolean;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({
  initialValues,
  onSubmit,
  isLoading,
  isEdit,
}) => {
  const [form] = Form.useForm();
  const country = Form.useWatch('country', form);
  const formId = 'company-form';

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        was_in_touch: initialValues.was_in_touch ? dayjs(initialValues.was_in_touch) : null,
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleFinish = (values: any) => {
    // Transform values before submit if needed
    const payload: CompanyFormData = {
      ...values,
      was_in_touch: values.was_in_touch ? values.was_in_touch.format('YYYY-MM-DD') : null,
    };
    onSubmit(payload);
  };

  const handleLeave = () => {
    if (!form.isFieldsTouched()) {
      navigate('/companies');
      return;
    }

    Modal.confirm({
      title: 'Есть несохраненные изменения',
      content: 'Выйти без сохранения?',
      okText: 'Выйти',
      cancelText: 'Остаться',
      okButtonProps: { danger: true },
      onOk: () => navigate('/companies'),
    });
  };

  return (
    <EntityFormShell
      title={isEdit ? 'Редактировать компанию' : 'Создать новую компанию'}
      subtitle={isEdit ? 'Обновите ключевые данные компании и ответственных.' : 'Заполните основные данные компании, чтобы добавить ее в CRM.'}
      hint="Сначала внесите ключевые поля. Детализация статуса и локации идет ниже."
      formId={formId}
      submitText={isEdit ? 'Сохранить изменения' : 'Создать компанию'}
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
            title="Основная информация"
            description="Название, основные контакты и тип клиента."
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Название компании"
                name="name"
                rules={[{ required: true, message: 'Введите название' }]}
              >
                <Input placeholder="ООО «ТехноПром»" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { type: 'email', message: 'Некорректный email' },
                ]}
              >
                <Input placeholder="info@company.ru" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Альтернативные названия" name="alternative_names">
                <Input placeholder="Альфа, Альфа-Тех" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Регистрационный номер" name="registration_number">
                <Input placeholder="1234567890" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Телефон" name="phone">
                <PhoneInput />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Веб-сайт" name="website">
                <Input placeholder="https://company.ru" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Тип" name="type">
                <ClientTypeSelect style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Источник" name="lead_source">
                <LeadSourceSelect style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Отрасли" name="industry">
                <IndustrySelect mode="multiple" style={{ width: '100%' }} />
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
            description="Заполните только те поля адреса, которые действительно нужны в работе."
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
            <Col xs={24} md={12}>
              <Form.Item label="Город (строкой)" name="city_name">
                <Input placeholder="Ташкент" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Регион/область" name="region">
                <Input placeholder="Ташкентская область" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Район" name="district">
                <Input placeholder="Юнусабадский район" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Адрес" name="address">
                <Input placeholder="ул. Примерная, д. 1" />
              </Form.Item>
            </Col>
          </Row>

          <EntityFormSection
            title="Управление и статус"
            description="Статус, ответственные и коммуникационные настройки компании."
          />
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Активна" name="active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Дисквалифицирована" name="disqualified" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Массовая рассылка" name="massmail" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Последний контакт" name="was_in_touch">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
            {isEdit && (
              <Col xs={24} md={12}>
                <Form.Item label="Токен" name="token">
                  <Input placeholder="Авто" readOnly />
                </Form.Item>
              </Col>
            )}
          </Row>

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

          <EntityFormSection
            title="Описание"
            description="Короткий рабочий контекст для команды продаж и аккаунтинга."
          />
          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Краткое описание компании" />
          </Form.Item>
        </Form>
      </Card>
    </EntityFormShell>
  );
};
