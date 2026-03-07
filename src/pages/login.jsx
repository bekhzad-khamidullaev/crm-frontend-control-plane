import { App, Button, Card, Form, Input, Space, Typography } from 'antd';
import { useState } from 'react';
import brandLogo from '../assets/brand/logo.svg';
import '../styles/login-page.css';

import {
    clearToken,
    getUserFromToken,
    isTokenTooLarge,
    MAX_HEADER_SAFE_LENGTH,
    setToken,
} from '../lib/api/auth';
import { authApi } from '../lib/api/client';
import { mergeRoles, rolesFromProfile, rolesFromTokenPayload } from '../lib/roles';
import { navigate } from '../router';

const { Title, Text } = Typography;

function readStoredRoles() {
  try {
    const raw = sessionStorage.getItem('enterprise_crm_roles') || localStorage.getItem('enterprise_crm_roles');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.roles)) return parsed.roles;
  } catch {
    // ignore malformed role storage
  }
  return [];
}

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
        const roles = mergeRoles(
          readStoredRoles(),
          rolesFromProfile(me),
          rolesFromTokenPayload(getUserFromToken() || {}),
        );
        if (roles.length > 0) {
          const serializedRoles = JSON.stringify(roles);
          sessionStorage.setItem('enterprise_crm_roles', serializedRoles);
          localStorage.setItem('enterprise_crm_roles', serializedRoles);
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
      <Card className="login-card" variant="borderless">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <img src={brandLogo} alt="Enterprise CRM" className="login-logo" />
            <h1 className="login-title">Enterprise CRM</h1>
            <p className="login-subtitle">Введите свои данные для входа в систему</p>
          </div>

          {/* Login Form */}
          <Form
            form={form}
            name="login"
            onFinish={onSubmit}
            layout="vertical"
            size="large"
            className="radix-form"
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
                placeholder="admin"
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
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="radix-btn"
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
