import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Card,
  App,
  Row,
  Col,
  Select,
  Switch,
  DatePicker,
  Spin,
  Modal,
  Button,
  Space,
  Typography,
  Divider,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCreateLead, useUpdateLead } from '@/entities/lead/api/mutations';
import { useLead as useLeadQuery } from '@/entities/lead/api/queries';
// @ts-ignore
import { navigate } from '@/router.js';

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

const { TextArea } = Input;
const { Title, Text } = Typography;

interface LeadFormProps {
  id?: number;
}

const normalizeSexValue = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'M' || normalized === 'F' || normalized === 'O') return normalized;
  return value;
};

export const LeadForm: React.FC<LeadFormProps> = ({ id }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!id;
  const formId = 'lead-form';
  const country = Form.useWatch('country', form);

  const { data: lead, isLoading: isLoadingLead } = useLeadQuery(id!, !!id);
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();

  useEffect(() => {
    if (lead) {
      form.setFieldsValue({
        ...lead,
        sex: normalizeSexValue(lead.sex),
        birth_date: lead.birth_date ? dayjs(lead.birth_date) : null,
        was_in_touch: lead.was_in_touch ? dayjs(lead.was_in_touch) : null,
      });
    }
  }, [lead, form]);

  const onFinish = async (values: any) => {
    try {
      const payload: any = {
        ...values,
        sex: normalizeSexValue(values.sex),
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
        const fields = Object.entries(error.body.details).map(([name, errors]: [string, any]) => ({
          name,
          errors: Array.isArray(errors) ? errors : [errors],
        }));
        form.setFields(fields);
      }
      message.error(isEdit ? 'Ошибка обновления' : 'Ошибка создания');
    }
  };

  const handleLeave = () => {
    if (!form.isFieldsTouched()) {
      navigate('/leads');
      return;
    }

    Modal.confirm({
      title: 'Есть несохраненные изменения',
      content: 'Выйти без сохранения?',
      okText: 'Выйти',
      cancelText: 'Остаться',
      okButtonProps: { danger: true },
      onOk: () => navigate('/leads'),
    });
  };

  if (isEdit && isLoadingLead) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

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
          loading={createMutation.isPending || updateMutation.isPending}
        >
          {isEdit ? 'Сохранить изменения' : 'Создать лид'}
        </Button>
      </Space>

      <Title level={2} style={{ marginBottom: 4 }}>
        {isEdit ? 'Редактировать лид' : 'Создать новый лид'}
      </Title>
      <Text type="secondary">
        {isEdit
          ? 'Обновите данные лида и подготовьте его к следующему шагу воронки.'
          : 'Соберите минимум данных, чтобы не терять скорость входящей обработки.'}
      </Text>

      <Card style={{ marginTop: 16 }}>
        <Form
          id={formId}
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
          <Text type="secondary">Кто это, чем занимается и какие данные уже известны.</Text>
          <Divider style={{ margin: '12px 0 16px' }} />

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Имя" name="first_name">
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

          <Title level={4} style={{ marginTop: 24 }}>Контакты</Title>
          <Text type="secondary">Минимальный набор каналов связи для быстрого первого контакта.</Text>
          <Divider style={{ margin: '12px 0 16px' }} />

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
              <Form.Item label="Доп. Email" name="secondary_email">
                <Input placeholder="ivan.secondary@example.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Телефон" name="phone">
                <Input placeholder="+998 90 123 45 67" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Доп. телефон" name="other_phone">
                <Input placeholder="+998 90 765 43 21" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Мобильный" name="mobile">
                <Input placeholder="+998 90 000 00 00" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>Компания</Title>
          <Text type="secondary">Если компания уже есть в базе, лучше привязать её сразу.</Text>
          <Divider style={{ margin: '12px 0 16px' }} />

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
                <Input placeholder="+998 90 123 45 67" />
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

          <Title level={4} style={{ marginTop: 24 }}>Локация</Title>
          <Text type="secondary">Адресные поля нужны только если влияют на маршрутизацию, доставку или аналитику.</Text>
          <Divider style={{ margin: '12px 0 16px' }} />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Страна" name="country">
                <CountrySelect placeholder="Выберите страну" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Город" name="city">
                <CitySelect
                  countryId={country}
                  placeholder="Выберите город"
                  allowClear
                  disabled={!country}
                />
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

          <Title level={4} style={{ marginTop: 24 }}>Управление</Title>
          <Text type="secondary">Источник, ответственный и статус обработки лида.</Text>
          <Divider style={{ margin: '12px 0 16px' }} />

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

          <Title level={4} style={{ marginTop: 24 }}>Дополнительно</Title>
          <Text type="secondary">Любая информация, которая поможет следующему касанию.</Text>
          <Divider style={{ margin: '12px 0 16px' }} />
          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Дополнительная информация о лиде" />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
