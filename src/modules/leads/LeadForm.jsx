import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  message,
  Typography,
  Spin,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { navigate } from '../../router';
import { getLead, createLead, updateLead } from '../../lib/api/client';
import ReferenceSelect from '../../components/ui-ReferenceSelect';

const { Title } = Typography;
const { TextArea } = Input;

function LeadForm({ id }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadLead();
    }
  }, [id]);

  const loadLead = async () => {
    setLoading(true);
    try {
      const lead = await getLead(id);
      form.setFieldsValue(lead);
    } catch (error) {
      message.error('Ошибка загрузки данных лида');
      console.error('Error loading lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      if (isEdit) {
        await updateLead(id, values);
        message.success('Лид обновлен');
      } else {
        await createLead(values);
        message.success('Лид создан');
      }
      navigate('/leads');
    } catch (error) {
      message.error(`Ошибка ${isEdit ? 'обновления' : 'создания'} лида`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Загрузка данных..." spinning={true}>
          <Card style={{ minHeight: '200px' }}></Card>
        </Spin>
      </div>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/leads')}>
          Назад
        </Button>
      </Space>

      <Title level={2}>{isEdit ? 'Редактировать лид' : 'Создать новый лид'}</Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Имя"
            name="first_name"
            rules={[{ required: true, message: 'Введите имя' }]}
          >
            <Input placeholder="Иван" />
          </Form.Item>

          <Form.Item
            label="Фамилия"
            name="last_name"
            rules={[{ required: true, message: 'Введите фамилию' }]}
          >
            <Input placeholder="Иванов" />
          </Form.Item>

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

          <Form.Item
            label="Телефон"
            name="phone"
            rules={[{ required: true, message: 'Введите телефон' }]}
          >
            <Input placeholder="+7 999 123-45-67" />
          </Form.Item>

          <Form.Item label="Компания" name="company">
            <Input placeholder="ООО «Технологии»" />
          </Form.Item>

          <Form.Item label="Должность" name="position">
            <Input placeholder="Директор" />
          </Form.Item>

          <Form.Item
            label="Этап"
            name="stage"
            rules={[{ required: true, message: 'Выберите этап' }]}
          >
            <ReferenceSelect type="stages" placeholder="Выберите этап" />
          </Form.Item>

          <Form.Item
            label="Источник"
            name="source"
            rules={[{ required: true, message: 'Выберите источник' }]}
          >
            <ReferenceSelect type="lead-sources" placeholder="Выберите источник" />
          </Form.Item>

          <Form.Item label="Описание" name="description">
            <TextArea rows={4} placeholder="Дополнительная информация о лиде" />
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
              <Button onClick={() => navigate('/leads')}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default LeadForm;
