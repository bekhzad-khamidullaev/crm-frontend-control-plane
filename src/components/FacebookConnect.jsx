/**
 * FacebookConnect Component
 * Component for connecting Facebook Messenger
 */

import React, { useState } from 'react';
import { Form, Input, Button, Space, Alert, Typography, Card, Select } from 'antd';
import { FacebookOutlined } from '@ant-design/icons';
import { connectFacebook } from '../lib/api/integrations/facebook';

const { Text, Link, Paragraph } = Typography;

export default function FacebookConnect({ onSuccess, onCancel }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleConnect = async (values) => {
    setLoading(true);
    try {
      const result = await connectFacebook(values);
      onSuccess?.(result);
    } catch (error) {
      console.error('Error connecting Facebook:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert
        message="Подключение Facebook Messenger"
        description="Для подключения вам потребуется Facebook страница и токен доступа с правами manage_pages и pages_messaging"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title="Инструкция по подключению" style={{ marginBottom: 24 }}>
        <Typography>
          <Paragraph>
            <strong>1. Создайте приложение Facebook</strong>
          </Paragraph>
          <Paragraph>
            • Перейдите на{' '}
            <Link href="https://developers.facebook.com/apps" target="_blank">
              developers.facebook.com/apps
            </Link>
          </Paragraph>
          <Paragraph>
            • Создайте новое приложение типа "Business"
          </Paragraph>
          <Paragraph>
            • Добавьте продукт "Messenger"
          </Paragraph>

          <Paragraph style={{ marginTop: 16 }}>
            <strong>2. Получите токен доступа</strong>
          </Paragraph>
          <Paragraph>
            • В разделе "Messenger" → "Settings" найдите "Access Tokens"
          </Paragraph>
          <Paragraph>
            • Выберите вашу Facebook страницу и получите токен
          </Paragraph>
          <Paragraph>
            • Токен должен иметь права: pages_messaging, pages_manage_metadata
          </Paragraph>

          <Paragraph style={{ marginTop: 16 }}>
            <strong>3. Получите ID страницы</strong>
          </Paragraph>
          <Paragraph>
            • Откройте вашу Facebook страницу
          </Paragraph>
          <Paragraph>
            • ID страницы находится в URL: facebook.com/[PAGE_ID]
          </Paragraph>
        </Typography>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleConnect}
      >
        <Form.Item
          label="Page Access Token"
          name="access_token"
          rules={[
            { required: true, message: 'Введите токен доступа страницы' },
            { min: 20, message: 'Токен слишком короткий' },
          ]}
          extra="Долгосрочный токен доступа вашей Facebook страницы"
        >
          <Input.Password
            prefix={<FacebookOutlined />}
            placeholder="EAAxxxxxxxxxxxxx"
          />
        </Form.Item>

        <Form.Item
          label="Facebook Page ID"
          name="page_id"
          rules={[
            { required: true, message: 'Введите ID страницы' },
          ]}
          extra="ID вашей Facebook страницы (можно найти в настройках страницы)"
        >
          <Input
            placeholder="123456789012345"
          />
        </Form.Item>

        <Alert
          message="Проверка прав доступа"
          description={
            <div>
              Убедитесь, что токен имеет следующие права:
              <ul>
                <li>pages_messaging - для отправки и получения сообщений</li>
                <li>pages_manage_metadata - для управления настройками</li>
                <li>pages_read_engagement - для чтения взаимодействий</li>
              </ul>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} icon={<FacebookOutlined />}>
              Подключить Facebook Messenger
            </Button>
            {onCancel && (
              <Button onClick={onCancel}>
                Отмена
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
