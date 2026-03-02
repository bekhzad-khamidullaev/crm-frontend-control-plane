import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  App,
  Typography,
  Row,
  Col,
  Select,
  Switch,
  DatePicker,
  Grid,
  Spin,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCreateLead, useUpdateLead } from '@/entities/lead/api/mutations'; // Note: useLead is query, imported below
import { useLead as useLeadQuery } from '@/entities/lead/api/queries';

// Feature Selects
// @ts-ignore
import { navigate } from '@/router.js';

// Feature Selects
import {
  LeadSourceSelect,
  UserSelect,
  CountrySelect,
  CitySelect,
  IndustrySelect,
  ClientTypeSelect,
  DepartmentSelect,
  TagSelect,
  CompanySelect,
} from '@/features/reference';
import { PhoneInput } from '@/shared/ui';

const { Title } = Typography;
const { TextArea } = Input;

interface LeadFormProps {
  id?: number;
}

export const LeadForm: React.FC<LeadFormProps> = ({ id }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!id;
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const { data: lead, isLoading: isLoadingLead } = useLeadQuery(id!, !!id);
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();

  useEffect(() => {
    if (lead) {
      form.setFieldsValue({
        ...lead,
        birth_date: lead.birth_date ? dayjs(lead.birth_date) : null,
        was_in_touch: lead.was_in_touch ? dayjs(lead.was_in_touch) : null,
      });
    }
  }, [lead, form]);

  const onFinish = async (values: any) => {
    try {
      const payload: any = {
        ...values,
        birth_date: values.birth_date ? values.birth_date.format('YYYY-MM-DD') : null,
        was_in_touch: values.was_in_touch ? values.was_in_touch.format('YYYY-MM-DD') : null,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: id!, data: payload });
        message.success('Лид обновлен');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Лид создан');
      }
      navigate('/leads');
    } catch (error: any) {
      if (error?.body?.details) {
        // Handle Zod/DRF validation errors if structured
        const fields = Object.entries(error.body.details).map(([name, errors]: [string, any]) => ({
          name,
          errors: Array.isArray(errors) ? errors : [errors],
        }));
        form.setFields(fields);
      }
      message.error(isEdit ? 'Ошибка обновления' : 'Ошибка создания');
    }
  };

  if (isEdit && isLoadingLead) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/leads')} block={isMobile}>
          Назад
        </Button>
      </Space>

      <Title level={isMobile ? 3 : 2}>{isEdit ? 'Редактировать лид' : 'Создать новый лид'}</Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{
            sex: 'M',
            massmail: false,
            disqualified: false,
          }}
        >
          <Title level={4}>Основная информация</Title>
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
              <Form.Item label="Фамилия" name="last_name">
                <Input placeholder="Иванов" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Должность" name="title">
                <Input placeholder="Директор" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Пол" name="sex">
                <Select placeholder="Выберите пол" allowClear>
                  <Select.Option value="M">Мужской</Select.Option>
                  <Select.Option value="F">Женский</Select.Option>
                  <Select.Option value="O">Другое</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Дата рождения" name="birth_date">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Контакты
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Введите email' },
                  { type: 'email', message: 'Некорректный email' },
                ]}
              >
                <Input placeholder="ivan@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Доп. Email" name="secondary_email">
                <Input placeholder="ivan.secondary@example.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Телефон" name="phone">
                <PhoneInput />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Доп. телефон" name="other_phone">
                <PhoneInput />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Мобильный" name="mobile">
                <PhoneInput />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Компания
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Компания (из базы)" name="company">
                <CompanySelect placeholder="Выберите компанию" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Название компании" name="company_name">
                <Input placeholder="ООО «Технологии»" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Телефон компании" name="company_phone">
                <PhoneInput />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Email компании" name="company_email">
                <Input placeholder="info@company.ru" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Сайт" name="website">
                <Input placeholder="https://company.ru" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Адрес компании" name="company_address">
            <Input placeholder="г. Москва, ул. Ленина, д. 1" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Тип компании" name="type">
                <ClientTypeSelect placeholder="Выберите тип" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Отрасль" name="industry">
                <IndustrySelect placeholder="Выберите отрасли" mode="multiple" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Локация
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Страна" name="country">
                <CountrySelect placeholder="Выберите страну" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Город" name="city">
                {/* CitySelect usually requires countryId to filter, passing form dependency */}
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, current) => prev.country !== current.country}
                >
                  {({ getFieldValue }) => (
                    <CitySelect
                      countryId={getFieldValue('country')}
                      placeholder="Выберите город"
                      allowClear
                      disabled={!getFieldValue('country')}
                    />
                  )}
                </Form.Item>
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
                <Input placeholder="Улица, дом..." />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Управление
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Источник" name="lead_source">
                <LeadSourceSelect placeholder="Выберите источник" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Теги" name="tags">
                <TagSelect placeholder="Выберите теги" mode="multiple" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Ответственный" name="owner">
                <UserSelect placeholder="Выберите пользователя" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Отдел" name="department">
                <DepartmentSelect placeholder="Выберите отдел" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Массовая рассылка" name="massmail" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Дисквалифицирован" name="disqualified" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Последний контакт" name="was_in_touch">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Дополнительно
          </Title>
          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Дополнительная информация о лиде" />
          </Form.Item>

          <Form.Item>
            <Space wrap style={{ width: '100%' }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createMutation.isPending || updateMutation.isPending}
                block={isMobile}
              >
                {isEdit ? 'Обновить' : 'Создать'}
              </Button>
              <Button onClick={() => navigate('/leads')} block={isMobile}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
