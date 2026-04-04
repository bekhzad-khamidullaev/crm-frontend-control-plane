import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Typography,
  theme as antdTheme,
} from 'antd';
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
import { getLicenseEntitlements } from '../lib/api/license.js';
import { clearStoredLicenseState, persistLicenseState } from '../lib/api/licenseState.js';
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

function normalizeFeatures(rawFeatures = []) {
  if (!Array.isArray(rawFeatures)) return [];
  const normalized = new Set();
  rawFeatures.forEach((feature) => {
    const value = String(feature || '').trim().toLowerCase();
    if (!value) return;
    normalized.add(value);
  });
  return Array.from(normalized);
}

function persistLicenseFeatures(rawFeatures = []) {
  const features = normalizeFeatures(rawFeatures);
  const serialized = JSON.stringify(features);
  sessionStorage.setItem('enterprise_crm_license_features', serialized);
  localStorage.removeItem('enterprise_crm_license_features');
}

function getErrorText(error, fallbackText) {
  return error?.details?.detail || error?.details?.message || error?.message || fallbackText;
}

function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  const [form] = Form.useForm();
  const [twoFAForm] = Form.useForm();
  const [resetRequestForm] = Form.useForm();
  const [resetConfirmForm] = Form.useForm();

  const [twoFAChallenge, setTwoFAChallenge] = useState(null);
  const [credentialSnapshot, setCredentialSnapshot] = useState(null);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState('request');
  const [resetChallenge, setResetChallenge] = useState(null);

  const { message } = App.useApp();
  const { token } = antdTheme.useToken();
  const { theme } = useTheme();

  const finalizeLogin = async (response, fallbackIdentifier) => {
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

    try {
      const license = await getLicenseEntitlements();
      persistLicenseState(license);
      persistLicenseFeatures(license?.features || []);
    } catch (e) {
      console.warn('Failed to preload license entitlements on login:', e);
      clearStoredLicenseState();
      sessionStorage.removeItem('enterprise_crm_license_features');
    }

    const userInfo = getUserFromToken();
    const user = {
      name: userInfo?.username || response.user?.username || fallbackIdentifier,
      email: userInfo?.email || response.user?.email || `${fallbackIdentifier}@example.com`,
      id: userInfo?.user_id || response.user?.id,
      is_staff: Boolean(userInfo?.is_staff || response.user?.is_staff),
      is_superuser: Boolean(userInfo?.is_superuser || response.user?.is_superuser),
    };

    onLogin(user);
    message.success(t('loginPage.messages.welcome'));
    navigate('/dashboard');
  };

  const handleSubmitCredentials = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.login({
        identifier: values.identifier,
        password: values.password,
      });

      if (response?.requires_2fa) {
        setCredentialSnapshot({ identifier: values.identifier, password: values.password });
        setTwoFAChallenge(response);
        twoFAForm.resetFields();
        message.info(
          t(
            'loginPage.messages.twoFaSent',
            `Код подтверждения отправлен (${response.method || 'email'} ${response.masked_target || ''})`
          )
        );
        return;
      }

      await finalizeLogin(response, values.identifier);
    } catch (error) {
      message.error(getErrorText(error, t('loginPage.errors.invalidCredentials')));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTwoFA = async (values) => {
    if (!twoFAChallenge?.challenge_token) return;

    setTwoFALoading(true);
    try {
      const response = await authApi.verify2FA({
        challenge_token: twoFAChallenge.challenge_token,
        code: values.code,
      });
      await finalizeLogin(response, credentialSnapshot?.identifier || 'user');
    } catch (error) {
      message.error(getErrorText(error, t('loginPage.errors.invalidTwoFaCode', 'Неверный код подтверждения')));
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleResendTwoFA = async () => {
    if (!twoFAChallenge?.challenge_token) return;

    setTwoFALoading(true);
    try {
      const response = await authApi.resend2FA({ challenge_token: twoFAChallenge.challenge_token });
      setTwoFAChallenge(response);
      message.success(t('loginPage.messages.twoFaResent', 'Код отправлен повторно'));
      if (response?.debug_code) {
        message.info(`debug code: ${response.debug_code}`);
      }
    } catch (error) {
      message.error(getErrorText(error, t('loginPage.errors.twoFaResendFailed', 'Не удалось отправить код повторно')));
    } finally {
      setTwoFALoading(false);
    }
  };

  const closePasswordResetModal = () => {
    setResetModalOpen(false);
    setResetStep('request');
    setResetChallenge(null);
    resetRequestForm.resetFields();
    resetConfirmForm.resetFields();
  };

  const handlePasswordResetRequest = async (values) => {
    setPasswordResetLoading(true);
    try {
      const response = await authApi.requestPasswordReset({
        identifier: values.identifier,
        channel: values.channel,
      });
      setResetChallenge(response);
      setResetStep('confirm');
      resetConfirmForm.setFieldValue('challenge_token', response.challenge_token);
      message.success(t('loginPage.messages.passwordResetCodeSent', 'Код для сброса пароля отправлен'));
      if (response?.debug_code) {
        message.info(`debug code: ${response.debug_code}`);
      }
    } catch (error) {
      message.error(
        getErrorText(error, t('loginPage.errors.passwordResetRequestFailed', 'Не удалось запросить сброс пароля'))
      );
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handlePasswordResetConfirm = async (values) => {
    if (values.new_password !== values.confirm_password) {
      message.error(t('loginPage.errors.passwordsMismatch', 'Пароли не совпадают'));
      return;
    }

    setPasswordResetLoading(true);
    try {
      await authApi.confirmPasswordReset({
        challenge_token: values.challenge_token,
        code: values.code,
        new_password: values.new_password,
      });
      message.success(t('loginPage.messages.passwordResetDone', 'Пароль успешно изменён'));
      closePasswordResetModal();
    } catch (error) {
      message.error(
        getErrorText(error, t('loginPage.errors.passwordResetConfirmFailed', 'Не удалось изменить пароль'))
      );
    } finally {
      setPasswordResetLoading(false);
    }
  };

  return (
    <>
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

            {!twoFAChallenge ? (
              <Form form={form} name="login" onFinish={handleSubmitCredentials} layout="vertical" size="large">
                <Form.Item
                  name="identifier"
                  label={t('loginPage.fields.identifier.label', 'Логин / Email / Телефон')}
                  rules={[
                    {
                      required: true,
                      message: t('loginPage.fields.identifier.required', 'Введите логин, email или телефон'),
                    },
                  ]}
                >
                  <Input
                    id="login_identifier"
                    placeholder={t('loginPage.fields.identifier.placeholder', 'username / email / +998...')}
                    autoComplete="username"
                  />
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
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      {t('loginPage.submit')}
                    </Button>
                    <Button type="link" onClick={() => setResetModalOpen(true)} style={{ paddingInline: 0 }}>
                      {t('loginPage.forgotPassword', 'Забыли пароль?')}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : (
              <>
                <Alert
                  type="info"
                  showIcon
                  message={t('loginPage.twoFa.title', 'Требуется подтверждение входа')}
                  description={t(
                    'loginPage.twoFa.description',
                    `Введите код, отправленный через ${twoFAChallenge.method || 'email'} на ${twoFAChallenge.masked_target || ''}`
                  )}
                />

                <Form form={twoFAForm} layout="vertical" size="large" onFinish={handleVerifyTwoFA}>
                  <Form.Item
                    name="code"
                    label={t('loginPage.twoFa.codeLabel', 'Код подтверждения')}
                    rules={[
                      {
                        required: true,
                        message: t('loginPage.twoFa.codeRequired', 'Введите код подтверждения'),
                      },
                    ]}
                  >
                    <Input autoFocus maxLength={12} placeholder="123456" />
                  </Form.Item>

                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Button type="primary" htmlType="submit" loading={twoFALoading} block>
                      {t('loginPage.twoFa.verify', 'Подтвердить')}
                    </Button>
                    <Button onClick={handleResendTwoFA} loading={twoFALoading} block>
                      {t('loginPage.twoFa.resend', 'Отправить код повторно')}
                    </Button>
                    <Button
                      type="link"
                      onClick={() => {
                        setTwoFAChallenge(null);
                        setCredentialSnapshot(null);
                        twoFAForm.resetFields();
                      }}
                      style={{ paddingInline: 0 }}
                    >
                      {t('loginPage.twoFa.back', 'Назад к вводу логина и пароля')}
                    </Button>
                  </Space>
                </Form>
              </>
            )}
          </Space>
        </Card>
      </div>

      <Modal
        title={t('loginPage.passwordReset.title', 'Сброс пароля')}
        open={resetModalOpen}
        onCancel={closePasswordResetModal}
        footer={null}
        destroyOnClose
      >
        {resetStep === 'request' ? (
          <Form
            form={resetRequestForm}
            layout="vertical"
            initialValues={{ channel: 'email' }}
            onFinish={handlePasswordResetRequest}
          >
            <Form.Item
              name="identifier"
              label={t('loginPage.passwordReset.identifier', 'Логин / Email / Телефон')}
              rules={[{ required: true, message: t('loginPage.passwordReset.identifierRequired', 'Введите идентификатор') }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="channel"
              label={t('loginPage.passwordReset.channel', 'Канал подтверждения')}
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'email', label: t('loginPage.passwordReset.channelEmail', 'Email') },
                  { value: 'sms', label: t('loginPage.passwordReset.channelSms', 'SMS') },
                ]}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={passwordResetLoading}>
              {t('loginPage.passwordReset.requestCode', 'Запросить код')}
            </Button>
          </Form>
        ) : (
          <>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={t('loginPage.passwordReset.codeSentTitle', 'Код отправлен')}
              description={t(
                'loginPage.passwordReset.codeSentDescription',
                `Канал: ${resetChallenge?.method || '-'}, получатель: ${resetChallenge?.masked_target || '-'}`
              )}
            />
            <Form form={resetConfirmForm} layout="vertical" onFinish={handlePasswordResetConfirm}>
              <Form.Item name="challenge_token" hidden>
                <Input />
              </Form.Item>
              <Form.Item
                name="code"
                label={t('loginPage.passwordReset.code', 'Код подтверждения')}
                rules={[{ required: true, message: t('loginPage.passwordReset.codeRequired', 'Введите код') }]}
              >
                <Input maxLength={12} />
              </Form.Item>
              <Form.Item
                name="new_password"
                label={t('loginPage.passwordReset.newPassword', 'Новый пароль')}
                rules={[
                  { required: true, message: t('loginPage.passwordReset.newPasswordRequired', 'Введите новый пароль') },
                  { min: 8, message: t('loginPage.passwordReset.newPasswordMin', 'Минимум 8 символов') },
                ]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Form.Item
                name="confirm_password"
                label={t('loginPage.passwordReset.confirmPassword', 'Подтвердите пароль')}
                rules={[
                  {
                    required: true,
                    message: t('loginPage.passwordReset.confirmPasswordRequired', 'Подтвердите пароль'),
                  },
                ]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Button type="primary" htmlType="submit" block loading={passwordResetLoading}>
                  {t('loginPage.passwordReset.confirm', 'Сменить пароль')}
                </Button>
                <Button
                  onClick={() => {
                    setResetStep('request');
                    resetConfirmForm.resetFields();
                  }}
                  block
                >
                  {t('loginPage.passwordReset.back', 'Назад')}
                </Button>
              </Space>
            </Form>
          </>
        )}
      </Modal>
    </>
  );
}

export default LoginPage;
