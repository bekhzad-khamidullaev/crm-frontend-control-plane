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
} from '../lib/api/user';
import { getCallHistory } from '../lib/api/telephony';

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
                    <Input prefix={<UserOutlined />} />
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
                <Input prefix={<MailOutlined />} />
              </Form.Item>

              <Form.Item label="Телефон" name="phone">
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>

              <Form.Item label="Должность" name="position">
                <Input />
              </Form.Item>

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
          Изменить пароль
        </span>
      ),
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
      children: (
        <div style={{ maxWidth: 600 }}>
          <Form
            form={preferencesForm}
            layout="vertical"
            onFinish={handlePreferencesUpdate}
          >
            <Divider>Уведомления</Divider>
            
            <Form.Item
              label="Email уведомления"
              name="email_notifications"
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

            <Divider>Региональные настройки</Divider>

            <Form.Item label="Язык" name="language">
              <Select>
                <Select.Option value="ru">Русский</Select.Option>
                <Select.Option value="en">English</Select.Option>
                <Select.Option value="uz">O'zbekcha</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Часовой пояс" name="timezone">
              <Select showSearch>
                <Select.Option value="Europe/Moscow">Москва (UTC+3)</Select.Option>
                <Select.Option value="Asia/Tashkent">Ташкент (UTC+5)</Select.Option>
                <Select.Option value="Asia/Almaty">Алматы (UTC+6)</Select.Option>
              </Select>
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
                  return new Date(c.timestamp).toDateString() === today;
                }).length} 
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Конверсия лидов" 
                value={stats?.lead_conversion_rate || 0}
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
              },
              {
                title: 'Тип',
                dataIndex: 'call_type',
                key: 'call_type',
                render: (type) => (
                  <Tag color={type === 'incoming' ? 'green' : 'blue'}>
                    {type === 'incoming' ? 'Входящий' : 'Исходящий'}
                  </Tag>
                ),
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
                render: (date) => new Date(date).toLocaleString('ru'),
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
