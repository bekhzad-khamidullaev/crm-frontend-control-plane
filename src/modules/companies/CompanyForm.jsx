import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  message,
  Typography,
  Spin,
  Row,
  Col,
  InputNumber,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { navigate } from '../../router';
import { getCompany, createCompany, updateCompany } from '../../lib/api/client';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

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
      form.setFieldsValue(company);
    } catch (error) {
      message.error('Ошибка загрузки данных компании');
      // Mock data for demo
      form.setFieldsValue({
        name: 'ООО "ТехноПром"',
        email: 'info@technoprom.ru',
        phone: '+7 495 123-45-67',
        website: 'https://technoprom.ru',
        industry: 'Производство',
        employees_count: 150,
        annual_revenue: 50000000,
        type: 'client',
        address: 'г. Москва, Промышленная ул., д. 10',
        description: 'Крупный производитель промышленного оборудования',
      });
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      if (isEdit) {
        await updateCompany(id, values);
        message.success('Компания обновлена');
      } else {
        await createCompany(values);
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
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
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
                label="Отрасль"
                name="industry"
                rules={[{ required: true, message: 'Введите отрасль' }]}
              >
                <Select placeholder="Выберите отрасль">
                  <Option value="IT">IT и технологии</Option>
                  <Option value="Производство">Производство</Option>
                  <Option value="Торговля">Торговля</Option>
                  <Option value="Услуги">Услуги</Option>
                  <Option value="Финансы">Финансы</Option>
                  <Option value="Строительство">Строительство</Option>
                  <Option value="Образование">Образование</Option>
                  <Option value="Здравоохранение">Здравоохранение</Option>
                  <Option value="Другое">Другое</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Контактная информация
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
                <Input placeholder="info@company.ru" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Телефон"
                name="phone"
                rules={[{ required: true, message: 'Введите телефон' }]}
              >
                <Input placeholder="+7 495 123-45-67" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Веб-сайт" name="website">
                <Input placeholder="https://company.ru" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Тип"
                name="type"
                rules={[{ required: true, message: 'Выберите тип' }]}
                initialValue="client"
              >
                <Select placeholder="Выберите тип">
                  <Option value="client">Клиент</Option>
                  <Option value="partner">Партнер</Option>
                  <Option value="supplier">Поставщик</Option>
                  <Option value="competitor">Конкурент</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Адрес" name="address">
            <Input placeholder="г. Москва, ул. Ленина, д. 1" />
          </Form.Item>

          <Title level={4} style={{ marginTop: 24 }}>
            Финансовая информация
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Количество сотрудников" name="employees_count">
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="150"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Годовой доход (₽)" name="annual_revenue">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="50000000"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
                  }
                  parser={(value) => value.replace(/\s/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Title level={4} style={{ marginTop: 24 }}>
            Дополнительная информация
          </Title>

          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Краткое описание компании" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
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
