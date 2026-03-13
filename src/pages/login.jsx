import { App, Button, Card, Form, Input, Space, Typography, theme as antdTheme } from 'antd';
import { useState } from 'react';
import brandLogo from '../assets/brand/logo.svg';
import brandLogoDark from '../assets/brand/logo-dark.svg';
import { useTheme } from '../lib/hooks/useTheme';

import {
    clearToken,
    getUserFromToken,
    isTokenTooLarge,
    MAX_HEADER_SAFE_LENGTH,
    setToken,
} from '../lib/api/auth';
import { authApi } from '../lib/api/client';
import { t } from '../lib/i18n/index.js';
import { mergeRoles, rolesFromProfile, rolesFromTokenPayload } from '../lib/roles';
import { navigate } from '../router';

const { Text } = Typography;

function readStoredRoles() {
  try {
    const raw = sessionStorage.getItem('enterprise_crm_roles');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.roles)) return parsed.roles;
  } catch {
    // ignore malformed role storage
  }
  return [];
}

function normalizePermissions(rawPermissions = []) {
  if (!Array.isArray(rawPermissions)) return [];
  const normalized = new Set();
  rawPermissions.forEach((permission) => {
    const value = String(permission || '').trim().toLowerCase();
    if (!value) return;
    normalized.add(value);
  });
  return Array.from(normalized);
}

function persistPermissions(rawPermissions = []) {
  const permissions = normalizePermissions(rawPermissions);
  const serialized = JSON.stringify(permissions);
  sessionStorage.setItem('enterprise_crm_permissions', serialized);
  localStorage.removeItem('enterprise_crm_permissions');
}

function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { token } = antdTheme.useToken();
  const { theme } = useTheme();

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.login({
        username: values.username,
        password: values.password,
      });

      if (isTokenTooLarge(response.access)) {
        message.error({
          content: t('loginPage.errors.tokenTooLarge', { limit: String(MAX_HEADER_SAFE_LENGTH) }),
          duration: 5,
        });
        clearToken();
        return;
      }

      setToken(response.access, response.refresh);
      persistPermissions(response.all_permissions || response.permissions || []);

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
          localStorage.removeItem('enterprise_crm_roles');
        }
        persistPermissions(me?.permissions || response.all_permissions || response.permissions || []);
      } catch (e) {
        console.warn('Failed to fetch user roles on login:', e);
      }

      const userInfo = getUserFromToken();

      const user = {
        name: userInfo?.username || response.user?.username || values.username,
        email: userInfo?.email || response.user?.email || `${values.username}@example.com`,
        id: userInfo?.user_id || response.user?.id,
        is_staff: Boolean(userInfo?.is_staff || response.user?.is_staff),
        is_superuser: Boolean(userInfo?.is_superuser || response.user?.is_superuser),
      };

      onLogin(user);
      message.success(t('loginPage.messages.welcome'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      message.error(error?.details?.detail || t('loginPage.errors.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: token.colorBgLayout,
      }}
    >
      <Card
        variant="borderless"
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: token.boxShadowTertiary,
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <img
              src={theme === 'dark' ? brandLogoDark : brandLogo}
              alt="Enterprise CRM"
              style={{
                width: 'min(280px, 100%)',
                height: 'auto',
                margin: '0 auto 8px',
                display: 'block',
              }}
            />
            <Text
              type="secondary"
              style={{
                display: 'block',
                textAlign: 'center',
                maxWidth: 320,
                margin: '0 auto',
              }}
            >
              {t('loginPage.subtitle')}
            </Text>
          </div>

          <Form form={form} name="login" onFinish={onSubmit} layout="vertical" size="large">
            <Form.Item
              name="username"
              label={t('loginPage.fields.username.label')}
              rules={[{ required: true, message: t('loginPage.fields.username.required') }]}
            >
              <Input id="login_username" placeholder="admin" autoComplete="username" />
            </Form.Item>

            <Form.Item
              name="password"
              label={t('loginPage.fields.password.label')}
              rules={[{ required: true, message: t('loginPage.fields.password.required') }]}
            >
              <Input.Password
                id="login_password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button type="primary" htmlType="submit" loading={loading} block>
                {t('loginPage.submit')}
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}

export default LoginPage;
