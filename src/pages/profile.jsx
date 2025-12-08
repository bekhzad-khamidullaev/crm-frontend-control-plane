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
  message,
  Tabs,
  Switch,
  Select,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Alert,
  Modal,
  Timeline,
  Progress,
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
  SafetyOutlined,
  LineChartOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  getPreferences,
  updatePreferences,
  getUserStats,
  getUserActivity,
  getTwoFactorStatus,
  enableTwoFactor,
  disableTwoFactor,
  getUserSessions,
  revokeSession,
} from '../lib/api/user';
import { getCallHistory } from '../lib/api/telephony';
import { getSMSHistory } from '../lib/api/sms';

const { TextArea } = Input;

function ProfilePage() {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [activity, setActivity] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [smsHistory, setSmsHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [twoFactorStatus, setTwoFactorStatus] = useState(null);
  const [enable2FAModalVisible, setEnable2FAModalVisible] = useState(false);

  useEffect(() => {
    loadProfile();
    loadStats();
    loadPreferences();
    loadActivity();
    loadCallHistory();
    loadSMSHistory();
    loadSessions();
    load2FAStatus();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setAvatarUrl(data.avatar);
      form.setFieldsValue(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      message.error('Ошибка загрузки профиля');
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
      await updateProfile(values);
      message.success('Профиль успешно обновлен');
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    
    if (info.file.originFileObj) {
      try {
        const response = await uploadAvatar(info.file.originFileObj);
        setAvatarUrl(response.avatar);
        message.success('Аватар успешно обновлен');
      } catch (error) {
        console.error('Error uploading avatar:', error);
        message.error('Ошибка загрузки аватара');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePasswordChange = async (values) => {
    if (values.new_password !== values.confirm_password) {
      message.error('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      await changePassword(values);
      message.success('Пароль успешно изменен');
      passwordForm.resetFields();
    } catch (error) {
      console.error('Error changing password:', error);
      message.error(error?.details?.detail || 'Ошибка изменения пароля');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (values) => {
    setLoading(true);
    try {
      await updatePreferences(values);
      message.success('Настройки успешно сохранены');
    } catch (error) {
      console.error('Error updating preferences:', error);
      message.error('Ошибка сохранения настроек');
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
      console.error('Error loading call history:', error);
    }
  };

  const loadSMSHistory = async () => {
    try {
      const data = await getSMSHistory({ page_size: 10 });
      setSmsHistory(data.results || []);
    } catch (error) {
      console.error('Error loading SMS history:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await getUserSessions();
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const load2FAStatus = async () => {
    try {
      const data = await getTwoFactorStatus();
      setTwoFactorStatus(data);
    } catch (error) {
      console.error('Error loading 2FA status:', error);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      await enableTwoFactor({ method: 'totp' });
      message.success('Двухфакторная аутентификация включена');
      setEnable2FAModalVisible(false);
      load2FAStatus();
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      message.error('Ошибка включения 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    try {
      await disableTwoFactor({ password: '' });
      message.success('Двухфакторная аутентификация отключена');
      load2FAStatus();
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      message.error('Ошибка отключения 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeSession(sessionId);
      message.success('Сессия завершена');
      loadSessions();
    } catch (error) {
      message.error('Ошибка завершения сессии');
    }
  };

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          Основная информация
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
                    style={{ marginBottom: 16 }}
                  />
                  <Upload
                    showUploadList={false}
                    onChange={handleAvatarChange}
                    beforeUpload={() => false}
                  >
                    <Button icon={<CameraOutlined />} block>
                      Изменить фото
                    </Button>
                  </Upload>

                  {stats && (
                    <div style={{ marginTop: 24 }}>
                      <Statistic
                        title="Активных лидов"
                        value={stats.active_leads || 0}
                      />
                      <Statistic
                        title="Звонков за месяц"
                        value={stats.calls_this_month || 0}
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
                        label="Имя"
                        name="first_name"
                        rules={[{ required: true, message: 'Введите имя' }]}
                      >
                        <Input prefix={<UserOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Фамилия"
                        name="last_name"
                        rules={[{ required: true, message: 'Введите фамилию' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          { required: true, message: 'Введите email' },
                          { type: 'email', message: 'Некорректный email' },
                        ]}
                      >
                        <Input prefix={<MailOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Телефон" name="phone">
                        <Input prefix={<PhoneOutlined />} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Должность" name="position">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Департамент" name="department">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="О себе" name="bio">
                    <TextArea rows={4} />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Сохранить изменения
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
          Безопасность
        </span>
      ),
      children: (
            <Card title="Изменить пароль" style={{ maxWidth: 600 }}>
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handlePasswordChange}
              >
                <Form.Item
                  label="Текущий пароль"
                  name="old_password"
                  rules={[{ required: true, message: 'Введите текущий пароль' }]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>

                <Form.Item
                  label="Новый пароль"
                  name="new_password"
                  rules={[
                    { required: true, message: 'Введите новый пароль' },
                    { min: 8, message: 'Минимум 8 символов' },
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>

                <Form.Item
                  label="Подтвердите пароль"
                  name="confirm_password"
                  rules={[{ required: true, message: 'Подтвердите пароль' }]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Изменить пароль
                  </Button>
                </Form.Item>
              </Form>
            </Card>
      ),
    },
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined />
          Уведомления
        </span>
      ),
      children: (
            <Card title="Настройки уведомлений" style={{ maxWidth: 600 }}>
              <Form
                form={preferencesForm}
                layout="vertical"
                onFinish={handlePreferencesUpdate}
              >
                <Form.Item
                  label="Email уведомления"
                  name="email_notifications"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  label="SMS уведомления"
                  name="sms_notifications"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  label="Push уведомления"
                  name="push_notifications"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Divider />

                <Form.Item label="Язык" name="language">
                  <Select>
                    <Select.Option value="ru">Русский</Select.Option>
                    <Select.Option value="en">English</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Часовой пояс" name="timezone">
                  <Select>
                    <Select.Option value="Europe/Moscow">Москва (UTC+3)</Select.Option>
                    <Select.Option value="Europe/Kiev">Киев (UTC+2)</Select.Option>
                    <Select.Option value="Asia/Almaty">Алматы (UTC+6)</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Сохранить настройки
                  </Button>
                </Form.Item>
              </Form>
            </Card>
      ),
    },
    {
      key: 'activity',
      label: (
        <span>
          <LineChartOutlined />
          Активность
        </span>
      ),
      children: (
            <Card title="Моя активность" style={{ maxWidth: 1200 }}>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Statistic title="Всего действий" value={activity.length} />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="Звонков сегодня" 
                    value={callHistory.filter(c => {
                      const today = new Date().toDateString();
                      return new Date(c.timestamp).toDateString() === today;
                    }).length} 
                  />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="SMS за неделю" 
                    value={smsHistory.length} 
                  />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="Конверсия лидов" 
                    value={stats?.lead_conversion_rate || 0}
                    suffix="%"
                  />
                </Col>
              </Row>

              <Divider />

              <Timeline
                items={activity.slice(0, 10).map(item => ({
                  children: (
                    <div>
                      <div><strong>{item.action}</strong></div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {new Date(item.timestamp).toLocaleString('ru')}
                      </div>
                    </div>
                  ),
                }))}
              />
            </Card>
      ),
    },
    {
      key: 'calls',
      label: (
        <span>
          <PhoneOutlined />
          История звонков
        </span>
      ),
      children: (
            <Table
              dataSource={callHistory}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: 'Тип',
                  dataIndex: 'direction',
                  key: 'direction',
                  render: (dir) => (
                    <Tag color={dir === 'incoming' ? 'green' : 'blue'}>
                      {dir === 'incoming' ? 'Входящий' : 'Исходящий'}
                    </Tag>
                  ),
                },
                {
                  title: 'Номер',
                  dataIndex: 'number',
                  key: 'number',
                },
                {
                  title: 'Длительность',
                  dataIndex: 'duration',
                  key: 'duration',
                  render: (sec) => {
                    const mins = Math.floor(sec / 60);
                    const secs = sec % 60;
                    return `${mins}:${secs.toString().padStart(2, '0')}`;
                  },
                },
                {
                  title: 'Время',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  render: (date) => new Date(date).toLocaleString('ru'),
                },
              ]}
            />
      ),
    },
    {
      key: 'sms',
      label: (
        <span>
          <MessageOutlined />
          История SMS
        </span>
      ),
      children: (
            <Table
              dataSource={smsHistory}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: 'Получатель',
                  dataIndex: 'phone_number',
                  key: 'phone_number',
                },
                {
                  title: 'Сообщение',
                  dataIndex: 'message',
                  key: 'message',
                  ellipsis: true,
                },
                {
                  title: 'Статус',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <Tag color={status === 'sent' ? 'green' : status === 'failed' ? 'red' : 'orange'}>
                      {status}
                    </Tag>
                  ),
                },
                {
                  title: 'Время',
                  dataIndex: 'created_at',
                  key: 'created_at',
                  render: (date) => new Date(date).toLocaleString('ru'),
                },
              ]}
            />
      ),
    },
    {
      key: 'security-sessions',
      label: (
        <span>
          <SafetyOutlined />
          Безопасность и сессии
        </span>
      ),
      children: (
            <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 800 }}>
              <Card title="Двухфакторная аутентификация">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {twoFactorStatus?.enabled ? (
                    <>
                      <Alert
                        message="2FA включена"
                        description="Ваш аккаунт защищен двухфакторной аутентификацией"
                        type="success"
                        showIcon
                      />
                      <Button danger onClick={handleDisable2FA} loading={loading}>
                        Отключить 2FA
                      </Button>
                    </>
                  ) : (
                    <>
                      <Alert
                        message="2FA отключена"
                        description="Рекомендуем включить двухфакторную аутентификацию для защиты аккаунта"
                        type="warning"
                        showIcon
                      />
                      <Button type="primary" onClick={() => setEnable2FAModalVisible(true)}>
                        Включить 2FA
                      </Button>
                    </>
                  )}
                </Space>
              </Card>

              <Card title="Активные сессии">
                <Table
                  dataSource={sessions}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: 'Устройство',
                      dataIndex: 'device',
                      key: 'device',
                    },
                    {
                      title: 'IP адрес',
                      dataIndex: 'ip_address',
                      key: 'ip_address',
                    },
                    {
                      title: 'Последняя активность',
                      dataIndex: 'last_activity',
                      key: 'last_activity',
                      render: (date) => new Date(date).toLocaleString('ru'),
                    },
                    {
                      title: 'Действия',
                      key: 'actions',
                      render: (_, record) => (
                        <Button
                          size="small"
                          danger
                          onClick={() => handleRevokeSession(record.id)}
                        >
                          Завершить
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="Профиль пользователя">
        <Tabs defaultActiveKey="profile" items={tabItems} />
      </Card>

      <Modal
        title="Включить двухфакторную аутентификацию"
        open={enable2FAModalVisible}
        onCancel={() => setEnable2FAModalVisible(false)}
        onOk={handleEnable2FA}
        okText="Включить"
        cancelText="Отмена"
        confirmLoading={loading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Что такое 2FA?"
            description="Двухфакторная аутентификация добавляет дополнительный уровень безопасности. При входе вам потребуется ввести код из мобильного приложения."
            type="info"
            showIcon
          />
          <p>
            1. Установите приложение Google Authenticator или Authy на ваш телефон
          </p>
          <p>
            2. После включения отсканируйте QR-код в приложении
          </p>
          <p>
            3. Введите код из приложения для подтверждения
          </p>
        </Space>
      </Modal>
    </div>
  );
}

export default ProfilePage;
