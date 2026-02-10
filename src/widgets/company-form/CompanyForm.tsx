import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Row,
  Col,
  Switch,
  DatePicker,
  Typography,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
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

const { Title } = Typography;
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

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/companies')}>
          Назад
        </Button>
      </Space>

      <Title level={2}>
        {isEdit ? 'Редактировать компанию' : 'Создать новую компанию'}
      </Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off"
          disabled={isLoading}
        >
          <Title level={4}>Основная информация</Title>
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
                  { required: true, message: 'Введите email' },
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
                <Input placeholder="+7 495 123-45-67" />
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

          <Title level={4} style={{ marginTop: 24 }}>
            Локация
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Страна"
                name="country"
                rules={[{ required: true, message: 'Выберите страну' }]}
              >
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

          <Title level={4} style={{ marginTop: 24 }}>
            Управление и статус
          </Title>
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
            <Col xs={24} md={12}>
              <Form.Item label="Токен" name="token">
                <Input placeholder="Авто" />
              </Form.Item>
            </Col>
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

          <Title level={4} style={{ marginTop: 24 }}>
            Описание
          </Title>
          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Краткое описание компании" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isLoading}>
                {isEdit ? 'Обновить' : 'Создать'}
              </Button>
              <Button onClick={() => navigate('/companies')}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
