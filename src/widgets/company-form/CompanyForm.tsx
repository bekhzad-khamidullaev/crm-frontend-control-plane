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
  Button,
  Space,
  Typography,
  Divider,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
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

const { TextArea } = Input;
const { Title, Text } = Typography;

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
    <div>
      <Space wrap style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleLeave}>
          Назад
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          htmlType="submit"
          form={formId}
          loading={isLoading}
        >
          {isEdit ? 'Сохранить изменения' : 'Создать компанию'}
        </Button>
      </Space>

      <Title level={2} style={{ marginBottom: 4 }}>
        {isEdit ? 'Редактировать компанию' : 'Создать новую компанию'}
      </Title>
      <Text type="secondary">
        {isEdit
          ? 'Обновите ключевые данные компании и ответственных.'
          : 'Заполните основные данные компании, чтобы добавить ее в CRM.'}
      </Text>

      <Card style={{ marginTop: 16 }}>
        <Form
          id={formId}
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off"
          disabled={isLoading}
        >
          <Title level={4}>Основная информация</Title>
          <Text type="secondary">Название, основные контакты и тип клиента.</Text>
          <Divider style={{ margin: '12px 0 16px' }} />

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
                rules={[{ type: 'email', message: 'Некорректный email' }]}
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
                <Input placeholder="+998 90 123 45 67" />
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

          <Title level={4} style={{ marginTop: 24 }}>Локация</Title>
          <Text type="secondary">Заполните только те поля адреса, которые действительно нужны в работе.</Text>
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

          <Title level={4} style={{ marginTop: 24 }}>Управление и статус</Title>
          <Text type="secondary">Статус, ответственные и коммуникационные настройки компании.</Text>
          <Divider style={{ margin: '12px 0 16px' }} />

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
            {isEdit ? (
              <Col xs={24} md={12}>
                <Form.Item label="Токен" name="token">
                  <Input placeholder="Авто" readOnly />
                </Form.Item>
              </Col>
            ) : null}
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

          <Title level={4} style={{ marginTop: 24 }}>Описание</Title>
          <Text type="secondary">Короткий рабочий контекст для команды продаж и аккаунтинга.</Text>
          <Divider style={{ margin: '12px 0 16px' }} />
          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Краткое описание компании" />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
