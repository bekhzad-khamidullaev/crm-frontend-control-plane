import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { navigate } from '../router';
import { authApi } from '../lib/api/client';
import { setToken, getUserFromToken, isTokenTooLarge, MAX_HEADER_SAFE_LENGTH, clearToken } from '../lib/api/auth';

const { Title } = Typography;

function LoginPage({ onLogin }) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // JWT Authentication with custom claims
      const response = await authApi.login({
        username: values.username,
        password: values.password,
      });

      if (isTokenTooLarge(response.access)) {
        message.error(
          `Полученный токен слишком большой для Authorization header (> ${MAX_HEADER_SAFE_LENGTH} байт). Включите cookie auth (VITE_AUTH_MODE=session или VITE_API_SEND_COOKIES=true) или уменьшите JWT на backend.`
        );
        clearToken();
        return;
      }
      
      // Save JWT tokens (access + refresh)
      setToken(response.access, response.refresh);
      
      // Get user info from JWT token
      const userInfo = getUserFromToken();
      
      const user = {
        name: userInfo?.username || response.user?.username || values.username,
        email: userInfo?.email || response.user?.email || `${values.username}@example.com`,
        id: userInfo?.user_id || response.user?.id,
      };
      
      onLogin(user);
      message.success('Успешный вход!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      message.error(error?.details?.detail || 'Неверное имя пользователя или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>Enterprise CRM</Title>
          <Typography.Text type="secondary">Войдите в систему</Typography.Text>
        </div>

        <Form
          name="login"
          initialValues={{ username: 'admin', password: 'admin123' }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Введите имя пользователя!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Имя пользователя" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Введите пароль!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Пароль" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Войти
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default LoginPage;
