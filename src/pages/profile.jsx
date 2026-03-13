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
  uploadAvatar,
  deleteAvatar,
  changePassword,
  getPreferences,
  updatePreferences,
  getUserStats,
  getUserActivity,
} from '../lib/api/user';
import { getCallHistory } from '../lib/api/telephony';

const getAvatarUrl = (data) => data?.avatar_url || data?.avatar || null;

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
      const payload = {
        pbx_number: values.pbx_number,
        jssip_ws_uri: values.jssip_ws_uri,
        jssip_sip_uri: values.jssip_sip_uri,
        jssip_sip_password: values.jssip_sip_password,
        jssip_display_name: values.jssip_display_name,
      };
      await updateProfile(payload);
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
        setAvatarUrl(getAvatarUrl(response));
        message.success('Аватар успешно обновлен');
      } catch (error) {
        console.error('Error uploading avatar:', error);
        message.error('Ошибка загрузки аватара');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAvatarDelete = async () => {
    setLoading(true);
    try {
      await deleteAvatar();
      setAvatarUrl(null);
      message.success('Аватар удален');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      message.error('Ошибка удаления аватара');
    } finally {
      setLoading(false);
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
      // Call history endpoint may not be available - silently fail
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
              <Space direction="vertical" style={{ width: '100%' }}>
                <Upload
                  showUploadList={false}
                  onChange={handleAvatarChange}
                  beforeUpload={() => false}
                >
                  <Button icon={<CameraOutlined />} block>
                    Изменить фото
                  </Button>
                </Upload>
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  block
                  disabled={!avatarUrl}
                  onClick={handleAvatarDelete}
                >
                  Удалить фото
                </Button>
              </Space>

              {stats && (
                <div style={{ marginTop: 24 }}>
                  <Statistic
                    title="Всего лидов"
                    value={stats.total_leads || 0}
                  />
                  <Statistic
                    title="Всего сделок"
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
                    label="Полное имя"
                    name="full_name"
                  >
                    <Input prefix={<UserOutlined />} disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Username"
                    name="username"
                  >
                    <Input prefix={<UserOutlined />} disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Введите email' },
                  { type: 'email', message: 'Введите корректный email' },
                ]}
              >
                <Input prefix={<MailOutlined />} disabled />
              </Form.Item>

              <Divider>Настройки телефонии</Divider>

              <Form.Item 
                label="Внутренний номер (PBX)" 
                name="pbx_number"
                tooltip="Ваш внутренний телефонный номер в системе"
              >
                <Input prefix={<PhoneOutlined />} placeholder="1001" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    label="WebSocket URI (JsSIP)" 
                    name="jssip_ws_uri"
                    tooltip="Пример: wss://sip.example.com:7443"
                  >
                    <Input placeholder="wss://sip.example.com:7443" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label="SIP URI (JsSIP)" 
                    name="jssip_sip_uri"
                    tooltip="Пример: sip:1001@sip.example.com"
                  >
                    <Input placeholder="sip:1001@sip.example.com" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    label="Пароль SIP (JsSIP)" 
                    name="jssip_sip_password"
                    tooltip="Будет использоваться веб-клиентом для звонков"
                  >
                    <Input.Password placeholder="••••••••" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label="Отображаемое имя" 
                    name="jssip_display_name"
                    tooltip="Имя, которое увидит собеседник при звонке"
                  >
                    <Input placeholder="Иван Иванов" />
                  </Form.Item>
                </Col>
              </Row>

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
          Изменить пароль
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
                { min: 8, message: 'Пароль должен быть не менее 8 символов' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              label="Подтвердите новый пароль"
              name="confirm_password"
              rules={[
                { required: true, message: 'Подтвердите новый пароль' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Изменить пароль
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
          Настройки
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
            <Divider>Региональные настройки</Divider>

            <Form.Item label="Язык" name="language_code">
              <Select>
                <Select.Option value="ru">Русский</Select.Option>
                <Select.Option value="en">English</Select.Option>
                <Select.Option value="uz">O'zbekcha</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Часовой пояс" name="utc_timezone">
              <Select showSearch>
                <Select.Option value="Europe/Moscow">Москва (UTC+3)</Select.Option>
                <Select.Option value="Asia/Tashkent">Ташкент (UTC+5)</Select.Option>
                <Select.Option value="Asia/Almaty">Алматы (UTC+6)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Использовать этот часовой пояс"
              name="activate_timezone"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} icon={<BellOutlined />}>
                Сохранить настройки
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
          Активность
        </span>
      ),
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Statistic 
                title="Всего действий" 
                value={activity.length} 
                prefix={<LineChartOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Звонков сегодня" 
                value={callHistory.filter(c => {
                  const today = new Date().toDateString();
                  return new Date(c.timestamp || c.started_at).toDateString() === today;
                }).length} 
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Конверсия лидов" 
                value={stats?.conversion_rate || 0}
                suffix="%"
              />
            </Col>
          </Row>

          <Divider>Последние действия</Divider>
          
          <Timeline
            items={activity.slice(0, 10).map(item => ({
              children: (
                <div>
                  <strong>{item.action}</strong>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                    {new Date(item.timestamp).toLocaleString('ru')}
                  </div>
                </div>
              ),
            }))}
          />

          <Divider>История звонков</Divider>
          
          <Table
            dataSource={callHistory}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: 'Номер',
                dataIndex: 'phone_number',
                key: 'phone_number',
                render: (value, record) => value || record.number || '-',
              },
              {
                title: 'Тип',
                dataIndex: 'call_type',
                key: 'call_type',
                render: (type, record) => {
                  const direction = type || record.direction;
                  return (
                    <Tag color={direction === 'incoming' || direction === 'inbound' ? 'green' : 'blue'}>
                      {direction === 'incoming' || direction === 'inbound' ? 'Входящий' : 'Исходящий'}
                    </Tag>
                  );
                },
              },
              {
                title: 'Длительность',
                dataIndex: 'duration',
                key: 'duration',
                render: (duration) => `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
              },
              {
                title: 'Время',
                dataIndex: 'timestamp',
                key: 'timestamp',
                render: (date, record) => new Date(date || record.started_at).toLocaleString('ru'),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="Профиль пользователя">
        <Tabs defaultActiveKey="profile" items={tabItems} />
      </Card>
    </div>
  );
}

export default ProfilePage;
