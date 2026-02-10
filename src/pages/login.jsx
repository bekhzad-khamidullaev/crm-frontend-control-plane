import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, App } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import '../styles/login-page.css';

import { navigate } from '../router';
import { authApi } from '../lib/api/client';
import {
  setToken,
  getUserFromToken,
  isTokenTooLarge,
  MAX_HEADER_SAFE_LENGTH,
  clearToken,
} from '../lib/api/auth';

const { Title, Text } = Typography;

function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.login({
        username: values.username,
        password: values.password,
      });

      if (isTokenTooLarge(response.access)) {
        message.error({
          content: `Токен слишком большой для Authorization header (> ${MAX_HEADER_SAFE_LENGTH} байт). Включите cookie auth или уменьшите JWT на backend.`,
          duration: 5,
        });
        clearToken();
        return;
      }

      setToken(response.access, response.refresh);

      try {
        const { usersApi } = await import('../lib/api/client');
        const me = await usersApi.me();
        const roles = Array.isArray(me?.roles)
          ? me.roles
          : Array.isArray(me?.permissions)
          ? me.permissions
          : [];
        sessionStorage.setItem('contora_roles', JSON.stringify(roles));
        if (!roles || roles.length === 0) {
          sessionStorage.setItem('contora_roles', JSON.stringify(['admin']));
        }
      } catch (e) {
        console.warn('Failed to fetch user roles on login:', e);
      }

      const userInfo = getUserFromToken();

      const user = {
        name: userInfo?.username || response.user?.username || values.username,
        email: userInfo?.email || response.user?.email || `${values.username}@example.com`,
        id: userInfo?.user_id || response.user?.id,
      };

      onLogin(user);
      message.success('Добро пожаловать!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      message.error(error?.details?.detail || 'Неверное имя пользователя или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8 }}>
              Enterprise CRM
            </Title>
            <Text type="secondary">Войдите в систему</Text>
          </div>

          {/* Login Form */}
          <Form
            form={form}
            name="login"
            onFinish={onSubmit}
            layout="vertical"
            size="large"
            initialValues={{
              username: 'admin',
              password: 'admin123',
            }}
          >
            <Form.Item
              name="username"
              label="Имя пользователя"
              rules={[
                {
                  required: true,
                  message: 'Введите имя пользователя',
                },
              ]}
            >
              <Input
                id="login_username"
                prefix={<UserOutlined />}
                placeholder="Имя пользователя"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Пароль"
              rules={[
                {
                  required: true,
                  message: 'Введите пароль',
                },
              ]}
            >
              <Input.Password
                id="login_password"
                prefix={<LockOutlined />}
                placeholder="Пароль"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<LoginOutlined />}
                block
              >
                Войти
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}

export default LoginPage;
