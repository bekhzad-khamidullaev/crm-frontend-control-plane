import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  Space,
  Divider,
  Alert,
  message,
  Tabs,
  Switch,
  Select,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Timeline,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CameraOutlined,
  LockOutlined,
  BellOutlined,
  SettingOutlined,
  HistoryOutlined,
  LineChartOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  getProfile,
  updateProfile,
  getTelephonyCredentials,
  updateTelephonyCredentials,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  getPreferences,
  updatePreferences,
  getUserStats,
  getUserActivity,
} from '../lib/api/user';
import { apiConfig } from '../lib/api/client';
import { getCallHistory } from '../lib/api/telephony';
import { t } from '../lib/i18n';
import { formatDate } from '../lib/utils/format';

const toAbsoluteAvatarUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  const rawUrl = value.trim();
  if (!rawUrl) return null;

  if (rawUrl.startsWith('data:')) return rawUrl;

  try {
    if (/^https?:\/\//i.test(rawUrl)) {
      const parsed = new URL(rawUrl);
      // Prevent mixed-content images when backend is behind a proxy.
      if (window.location.protocol === 'https:' && parsed.protocol === 'http:') {
        parsed.protocol = 'https:';
      }
      return parsed.toString();
    }

    if (rawUrl.startsWith('//')) {
      return `${window.location.protocol}${rawUrl}`;
    }

    if (rawUrl.startsWith('/')) {
      const apiOrigin = new URL(apiConfig.baseUrl || window.location.origin, window.location.origin).origin;
      return `${apiOrigin}${rawUrl}`;
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
};

const getAvatarUrl = (data) =>
  toAbsoluteAvatarUrl(data?.avatar_url || data?.avatar || data?.avatarUrl || data?.url || null);

function ProfilePage() {
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [activity, setActivity] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [telephonyCredentials, setTelephonyCredentials] = useState(null);

  useEffect(() => {
    loadProfile();
    loadStats();
    loadPreferences();
    loadActivity();
    loadCallHistory();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setAvatarUrl(getAvatarUrl(data));
      form.setFieldsValue({ ...data });
      try {
        const creds = await getTelephonyCredentials();
        setTelephonyCredentials(creds);
        form.setFieldsValue({
          telephony_extension: creds?.extension || '',
          telephony_login: creds?.login || '',
          telephony_password: creds?.password || '',
        });
      } catch (telephonyError) {
        setTelephonyCredentials(null);
        form.setFieldsValue({
          telephony_extension: '',
          telephony_login: '',
          telephony_password: '',
        });
        console.warn('User SIP credentials are not configured yet:', telephonyError);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      message.error(tr('profilePage.messages.loadError', 'Failed to load profile'));
    }
  };

  const loadStats = async () => {
    try {
      const data = await getUserStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const data = await getPreferences();
      preferencesForm.setFieldsValue(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleProfileUpdate = async (values) => {
    setLoading(true);
    try {
      const profilePayload = {
        full_name: String(values.full_name || '').trim(),
        email: String(values.email || '').trim(),
        jssip_display_name: values.jssip_display_name,
      };
      await updateProfile(profilePayload);
      const nextExtension = String(values.telephony_extension || '').trim();
      const nextLogin = String(values.telephony_login || '').trim();
      const nextPassword = String(values.telephony_password || '').trim();
      const prevExtension = String(telephonyCredentials?.extension || '').trim();
      const prevLogin = String(telephonyCredentials?.login || '').trim();
      const prevPassword = String(telephonyCredentials?.password || '').trim();
      const telephonyPayload = {};
      if (nextExtension && (nextExtension !== prevExtension || !telephonyCredentials)) {
        telephonyPayload.extension = nextExtension;
      }
      if (nextLogin && (nextLogin !== prevLogin || !telephonyCredentials)) {
        telephonyPayload.login = nextLogin;
      }
      if (nextPassword && (nextPassword !== prevPassword || !telephonyCredentials)) {
        telephonyPayload.password = nextPassword;
      }
      if (Object.keys(telephonyPayload).length > 0) {
        await updateTelephonyCredentials(telephonyPayload);
      }
      message.success(tr('profilePage.messages.profileUpdated', 'Profile updated'));
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error(tr('profilePage.messages.profileUpdateError', 'Failed to update profile'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    setLoading(true);
    try {
      const response = await uploadAvatar(file);
      const nextAvatarUrl = getAvatarUrl(response);
      setAvatarUrl(nextAvatarUrl);
      setProfile((prev) => (prev ? { ...prev, avatar_url: nextAvatarUrl, avatar: nextAvatarUrl } : prev));
      message.success(tr('profilePage.messages.avatarUpdated', 'Avatar updated'));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      message.error(tr('profilePage.messages.avatarUploadError', 'Failed to upload avatar'));
    } finally {
      setLoading(false);
    }
    return false;
  };

  const handleAvatarDelete = async () => {
    setLoading(true);
    try {
      await deleteAvatar();
      setAvatarUrl(null);
      message.success(tr('profilePage.messages.avatarDeleted', 'Avatar removed'));
    } catch (error) {
      console.error('Error deleting avatar:', error);
      message.error(tr('profilePage.messages.avatarDeleteError', 'Failed to remove avatar'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    if (values.new_password !== values.confirm_password) {
      message.error(tr('profilePage.messages.passwordMismatch', 'Passwords do not match'));
      return;
    }

    setLoading(true);
    try {
      await changePassword(values);
      message.success(tr('profilePage.messages.passwordUpdated', 'Password updated'));
      passwordForm.resetFields();
    } catch (error) {
      console.error('Error changing password:', error);
      message.error(error?.details?.detail || tr('profilePage.messages.passwordUpdateError', 'Failed to update password'));
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (values) => {
    setLoading(true);
    try {
      await updatePreferences(values);
      message.success(tr('profilePage.messages.preferencesSaved', 'Settings saved'));
      if (values?.language_code) {
        const normalized = String(values.language_code).toLowerCase().startsWith('en')
          ? 'en'
          : String(values.language_code).toLowerCase().startsWith('uz')
            ? 'uz'
            : 'ru';
        localStorage.setItem('enterprise_crm_locale', normalized);
        localStorage.setItem('locale', normalized);
        window.dispatchEvent(new CustomEvent('enterprise_crm:locale-change', { detail: normalized }));
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      message.error(tr('profilePage.messages.preferencesSaveError', 'Failed to save settings'));
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      const data = await getUserActivity();
      setActivity(data.results || []);
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  };

  const loadCallHistory = async () => {
    try {
      const data = await getCallHistory({ page_size: 10 });
      setCallHistory(data.results || []);
    } catch (error) {
      // Call history endpoint may not be available - silently fail
    }
  };

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          {tr('profilePage.tabs.mainInfo', 'Main information')}
        </span>
      ),
      children: (
        <Row gutter={24}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={128}
                icon={<UserOutlined />}
                src={avatarUrl}
                onError={() => {
                  setAvatarUrl(null);
                  return true;
                }}
                style={{ marginBottom: 16 }}
              />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Upload
                  showUploadList={false}
                  accept="image/*"
                  beforeUpload={handleAvatarUpload}
                >
                  <Button icon={<CameraOutlined />} block>
                    {tr('profilePage.actions.changePhoto', 'Change photo')}
                  </Button>
                </Upload>
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  block
                  disabled={!avatarUrl}
                  onClick={handleAvatarDelete}
                >
                  {tr('profilePage.actions.deletePhoto', 'Delete photo')}
                </Button>
              </Space>

              {stats && (
                <div style={{ marginTop: 24 }}>
                  <Statistic
                    title={tr('profilePage.stats.totalLeads', 'Total leads')}
                    value={stats.total_leads || 0}
                  />
                  <Statistic
                    title={tr('profilePage.stats.totalDeals', 'Total deals')}
                    value={stats.total_deals || 0}
                    style={{ marginTop: 16 }}
                  />
                </div>
              )}
            </div>
          </Col>

          <Col span={18}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleProfileUpdate}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={tr('profilePage.fields.fullName', 'Full name')}
                    name="full_name"
                    rules={[
                      { required: true, message: tr('profilePage.validation.enterFullName', 'Enter full name') },
                    ]}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={tr('profilePage.fields.username', 'Username')}
                    name="username"
                  >
                    <Input prefix={<UserOutlined />} disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={tr('profilePage.fields.email', 'Email')}
                name="email"
                rules={[
                  { required: true, message: tr('profilePage.validation.enterEmail', 'Enter email') },
                  { type: 'email', message: tr('profilePage.validation.validEmail', 'Enter valid email') },
                ]}
              >
                <Input prefix={<MailOutlined />} />
              </Form.Item>

              <Divider>{tr('profilePage.telephony.title', 'Telephony settings')}</Divider>

              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message={tr('profilePage.telephony.agentSettingsTitle', 'Personal agent settings')}
                description={tr('profilePage.telephony.agentSettingsDescription', 'Here you can use your internal number, SIP login and SIP password. All trunk/queue/routing/WebRTC settings are managed centrally by CRM admin in Integrations -> Telephony.')}
              />
              {!telephonyCredentials && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={tr('profilePage.telephony.notProvisionedTitle', 'Telephony credentials are not provisioned')}
                  description={tr('profilePage.telephony.notProvisionedDescription', 'Ask CRM administrator to create your internal extension in Telephony integration module.')}
                />
              )}

              <Form.Item 
                label={tr('profilePage.telephony.internalNumber', 'Internal number')}
                name="telephony_extension"
                extra={tr('profilePage.telephony.internalNumberExtra', 'Assigned by CRM admin and PBX integration module.')}
                rules={[
                  {
                    pattern: /^[0-9*#]{2,10}$/,
                    message: tr('profilePage.validation.extensionFormat', 'Use 2-10 symbols: digits, *, #'),
                  },
                ]}
              >
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>

              <Form.Item 
                label={tr('profilePage.telephony.login', 'SIP login')}
                name="telephony_login"
                extra={tr('profilePage.telephony.loginExtra', 'Usually equals internal extension for PBX auth.')}
                rules={[
                  {
                    pattern: /^[0-9*#]{2,10}$/,
                    message: tr('profilePage.validation.extensionFormat', 'Use 2-10 symbols: digits, *, #'),
                  },
                ]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>

              <Form.Item 
                label={tr('profilePage.telephony.password', 'SIP password')}
                name="telephony_password"
                tooltip={tr('profilePage.telephony.passwordTooltip', 'Used by CRM softphone (WSS/SIP registration)')}
                rules={[
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (String(value).length < 8) {
                        return Promise.reject(new Error(tr('profilePage.validation.passwordMin', 'Password must be at least 8 characters')));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>

              <Form.Item 
                label={tr('profilePage.telephony.displayName', 'Display name')} 
                name="jssip_display_name"
                tooltip={tr('profilePage.telephony.displayNameTooltip', 'Name shown to call recipient')}
                extra={tr('profilePage.telephony.displayNameExtra', 'Optional. If empty, profile name is used.')}
              >
                <Input placeholder={tr('profilePage.placeholders.displayName', 'John Doe')} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {tr('actions.saveChanges', 'Save changes')}
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      ),
    },
    {
      key: 'security-password',
      label: (
        <span>
          <LockOutlined />
          {tr('profilePage.tabs.changePassword', 'Change password')}
        </span>
      ),
      forceRender: true,
      children: (
        <div style={{ maxWidth: 600 }}>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
          >
            <Form.Item
              label={tr('profilePage.password.current', 'Current password')}
              name="old_password"
              rules={[{ required: true, message: tr('profilePage.validation.enterCurrentPassword', 'Enter current password') }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              label={tr('profilePage.password.new', 'New password')}
              name="new_password"
              rules={[
                { required: true, message: tr('profilePage.validation.enterNewPassword', 'Enter new password') },
                { min: 8, message: tr('profilePage.validation.passwordMin', 'Password must be at least 8 characters') },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              label={tr('profilePage.password.confirm', 'Confirm new password')}
              name="confirm_password"
              rules={[
                { required: true, message: tr('profilePage.validation.confirmNewPassword', 'Confirm new password') },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                {tr('profilePage.actions.changePassword', 'Change password')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'preferences',
      label: (
        <span>
          <SettingOutlined />
          {tr('profilePage.tabs.settings', 'Settings')}
        </span>
      ),
      forceRender: true,
      children: (
        <div style={{ maxWidth: 600 }}>
          <Form
            form={preferencesForm}
            layout="vertical"
            onFinish={handlePreferencesUpdate}
          >
            <Divider>{tr('profilePage.regional.title', 'Regional settings')}</Divider>

            <Form.Item label={tr('profilePage.regional.language', 'Language')} name="language_code">
              <Select>
                <Select.Option value="ru">{tr('profilePage.languages.ru', 'Russian')}</Select.Option>
                <Select.Option value="en">{tr('profilePage.languages.en', 'English')}</Select.Option>
                <Select.Option value="uz">{tr('profilePage.languages.uz', "Uzbek")}</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label={tr('profilePage.regional.timezone', 'Timezone')} name="utc_timezone">
              <Select showSearch>
                <Select.Option value="Europe/Moscow">{tr('profilePage.timezones.moscow', 'Moscow (UTC+3)')}</Select.Option>
                <Select.Option value="Asia/Tashkent">{tr('profilePage.timezones.tashkent', 'Tashkent (UTC+5)')}</Select.Option>
                <Select.Option value="Asia/Almaty">{tr('profilePage.timezones.almaty', 'Almaty (UTC+6)')}</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={tr('profilePage.regional.activateTimezone', 'Use this timezone')}
              name="activate_timezone"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} icon={<BellOutlined />}>
                {tr('profilePage.actions.saveSettings', 'Save settings')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'activity',
      label: (
        <span>
          <HistoryOutlined />
          {tr('profilePage.tabs.activity', 'Activity')}
        </span>
      ),
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Statistic 
                title={tr('profilePage.activity.totalActions', 'Total actions')} 
                value={activity.length} 
                prefix={<LineChartOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title={tr('profilePage.activity.callsToday', 'Calls today')} 
                value={callHistory.filter(c => {
                  const today = new Date().toDateString();
                  return new Date(c.timestamp || c.started_at).toDateString() === today;
                }).length} 
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title={tr('profilePage.activity.leadConversion', 'Lead conversion')} 
                value={stats?.conversion_rate || 0}
                suffix="%"
              />
            </Col>
          </Row>

          <Divider>{tr('profilePage.activity.recentActions', 'Recent actions')}</Divider>
          
          <Timeline
            items={activity.slice(0, 10).map(item => ({
              children: (
                <div>
                  <strong>{item.action}</strong>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                    {formatDate(item.timestamp, 'datetime')}
                  </div>
                </div>
              ),
            }))}
          />

          <Divider>{tr('profilePage.activity.callHistory', 'Call history')}</Divider>
          
          <Table
            dataSource={callHistory}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: tr('profilePage.callTable.number', 'Number'),
                dataIndex: 'phone_number',
                key: 'phone_number',
                render: (value, record) => value || record.number || '-',
              },
              {
                title: tr('profilePage.callTable.type', 'Type'),
                dataIndex: 'call_type',
                key: 'call_type',
                render: (type, record) => {
                  const direction = type || record.direction;
                  return (
                    <Tag color={direction === 'incoming' || direction === 'inbound' ? 'green' : 'blue'}>
                      {direction === 'incoming' || direction === 'inbound' ? tr('profilePage.callTable.inbound', 'Inbound') : tr('profilePage.callTable.outbound', 'Outbound')}
                    </Tag>
                  );
                },
              },
              {
                title: tr('profilePage.callTable.duration', 'Duration'),
                dataIndex: 'duration',
                key: 'duration',
                render: (duration) => `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
              },
              {
                title: tr('profilePage.callTable.time', 'Time'),
                dataIndex: 'timestamp',
                key: 'timestamp',
                render: (date, record) => formatDate(date || record.started_at, 'datetime'),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title={tr('profilePage.title', 'User profile')}>
        <Tabs defaultActiveKey="profile" items={tabItems} />
      </Card>
    </div>
  );
}

export default ProfilePage;
