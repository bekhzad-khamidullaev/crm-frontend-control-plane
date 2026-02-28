import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Row,
  Col,
  Grid,
  Switch,
  Typography,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
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

const { Title } = Typography;
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
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

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

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/contacts')} block={isMobile}>
          Назад
        </Button>
      </Space>

      <Title level={isMobile ? 3 : 2}>
        {isEdit ? 'Редактировать контакт' : 'Создать новый контакт'}
      </Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off"
          disabled={isLoading}
        >
          <Title level={4}>Личные данные</Title>
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
                  { required: true, message: 'Введите email' },
                  { type: 'email', message: 'Некорректный email' },
                ]}
              >
                <Input placeholder="ivan@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Телефон" name="phone">
                <Input placeholder="+7 999 123-45-67" />
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

          <Title level={4} style={{ marginTop: 24 }}>
            Локация
          </Title>
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

          <Title level={4} style={{ marginTop: 24 }}>
            Настройки
          </Title>
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
                 <Form.Item label="Активен" name="is_active" valuePropName="checked">
                   <Switch />
                 </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                 <Form.Item label="Массовая рассылка" name="massmail" valuePropName="checked">
                   <Switch />
                 </Form.Item>
              </Col>
           </Row>

          <Form.Item label="Описание" name="description" style={{ marginTop: 24 }}>
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Space wrap style={{ width: '100%' }}>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isLoading} block={isMobile}>
                {isEdit ? 'Обновить' : 'Создать'}
              </Button>
              <Button onClick={() => navigate('/contacts')} block={isMobile}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
