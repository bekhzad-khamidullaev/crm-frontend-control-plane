import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  message,
  Typography,
  Spin,
  Row,
  Col,
  Switch,
  DatePicker,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { navigate } from '../../router';
import { getCompany, createCompany, updateCompany, getUsers, getUser } from '../../lib/api/client';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import EntitySelect from '../../components/EntitySelect';
import { PhoneInput } from '@/shared/ui';

const { Title } = Typography;
const { TextArea } = Input;

function CompanyForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadCompany();
    }
  }, [id]);

  const loadCompany = async () => {
    setLoading(true);
    try {
      const company = await getCompany(id);
      form.setFieldsValue({
        ...company,
        was_in_touch: company.was_in_touch ? dayjs(company.was_in_touch) : null,
      });
    } catch (error) {
      message.error('Ошибка загрузки данных компании');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        was_in_touch: values.was_in_touch ? values.was_in_touch.format('YYYY-MM-DD') : null,
      };

      if (isEdit) {
        await updateCompany(id, payload);
        message.success('Компания обновлена');
      } else {
        await createCompany(payload);
        message.success('Компания создана');
      }
      navigate('/companies');
    } catch (error) {
      message.error(`Ошибка ${isEdit ? 'обновления' : 'создания'} компании`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

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
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Title level={4}>Основная информация</Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Название компании"
                name="full_name"
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
                <ReferenceSelect type="client-types" placeholder="Выберите тип" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Источник" name="lead_source">
                <ReferenceSelect type="lead-sources" placeholder="Выберите источник" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Отрасли" name="industry">
                <ReferenceSelect
                  type="industries"
                  placeholder="Выберите отрасли"
                  mode="multiple"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Теги" name="tags">
                <ReferenceSelect
                  type="crm-tags"
                  placeholder="Выберите теги"
                  mode="multiple"
                  allowClear
                />
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
                <ReferenceSelect id="country" type="countries" placeholder="Выберите страну" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Город" name="city">
                <ReferenceSelect type="cities" placeholder="Выберите город" allowClear />
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
                <EntitySelect
                  placeholder="Выберите пользователя"
                  fetchOptions={getUsers}
                  fetchById={getUser}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Отдел" name="department">
                <ReferenceSelect type="departments" placeholder="Выберите отдел" allowClear />
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
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                {isEdit ? 'Обновить' : 'Создать'}
              </Button>
              <Button onClick={() => navigate('/companies')}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default CompanyForm;
