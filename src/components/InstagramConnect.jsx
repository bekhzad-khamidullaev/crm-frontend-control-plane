/**
 * InstagramConnect Component
 * Component for connecting Instagram Business API
 */

import React, { useState } from 'react';
import { Form, Input, Button, Space, Alert, Typography, Steps, Card, App } from 'antd';
import { InstagramOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { connectInstagram } from '../lib/api/integrations/instagram';

const { Link, Paragraph } = Typography;
const { Step } = Steps;

export default function InstagramConnect({ onSuccess, onCancel }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleConnect = async (values) => {
    setLoading(true);
    try {
      const result = await connectInstagram(values);
      message.success('Instagram подключен');
      onSuccess?.(result);
    } catch (error) {
      console.error('Error connecting Instagram:', error);
      message.error(error?.message || 'Ошибка подключения Instagram');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert
        message="Подключение Instagram Business"
        description="Для подключения вам потребуется Instagram Business аккаунт и токен доступа от Facebook Developers"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="Создание приложения" description="Facebook Developers" />
        <Step title="Получение токена" description="Access Token" />
        <Step title="Подключение" description="Ввод данных" />
      </Steps>

      {currentStep === 0 && (
        <Card>
          <Typography>
            <Paragraph>
              <strong>Шаг 1: Создайте приложение в Facebook Developers</strong>
            </Paragraph>
            <Paragraph>
              1. Перейдите на{' '}
              <Link href="https://developers.facebook.com" target="_blank">
                developers.facebook.com
              </Link>
            </Paragraph>
            <Paragraph>
              2. Создайте новое приложение и выберите тип "Business"
            </Paragraph>
            <Paragraph>
              3. Добавьте продукт "Instagram Basic Display" или "Instagram Graph API"
            </Paragraph>
            <Paragraph>
              4. Настройте права доступа: instagram_basic, instagram_manage_messages
            </Paragraph>
          </Typography>
          <Button type="primary" onClick={() => setCurrentStep(1)}>
            Далее
          </Button>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <Typography>
            <Paragraph>
              <strong>Шаг 2: Получите токен доступа</strong>
            </Paragraph>
            <Paragraph>
              1. В настройках приложения перейдите в раздел "Instagram Basic Display" или "Instagram Graph API"
            </Paragraph>
            <Paragraph>
              2. Создайте токен доступа с необходимыми правами
            </Paragraph>
            <Paragraph>
              3. Сохраните токен и ID вашего Instagram Business аккаунта
            </Paragraph>
          </Typography>
          <Space>
            <Button onClick={() => setCurrentStep(0)}>Назад</Button>
            <Button type="primary" onClick={() => setCurrentStep(2)}>
              Далее
            </Button>
          </Space>
        </Card>
      )}

      {currentStep === 2 && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleConnect}
        >
          <Form.Item
            label="Access Token"
            name="access_token"
            rules={[
              { required: true, message: 'Введите токен доступа' },
              { min: 20, message: 'Токен слишком короткий' },
            ]}
            extra="Токен доступа от Facebook для Instagram Business API"
          >
            <Input.Password
              prefix={<InstagramOutlined />}
              placeholder="EAAxxxxxxxxxxxxx"
            />
          </Form.Item>

          <Form.Item
            label="Instagram Business Account ID"
            name="instagram_user_id"
            rules={[
              { required: true, message: 'Введите ID аккаунта' },
              { pattern: /^\d+$/, message: 'ID должен содержать только цифры' },
            ]}
            extra="Числовой ID вашего Instagram Business аккаунта"
          >
            <Input
              placeholder="17841400008460056"
            />
          </Form.Item>

          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: 'Введите username' },
            ]}
            extra="Username Instagram Business аккаунта"
          >
            <Input placeholder="your_business" />
          </Form.Item>

          <Alert
            message="Важно"
            description="Убедитесь, что ваш Instagram аккаунт является Business аккаунтом и подключен к Facebook странице"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item>
            <Space>
              <Button onClick={() => setCurrentStep(1)}>
                Назад
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Подключить Instagram
              </Button>
              {onCancel && (
                <Button onClick={onCancel}>
                  Отмена
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      )}
    </div>
  );
}
