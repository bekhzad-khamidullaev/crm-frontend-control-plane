/**
 * TelephonySettings Component
 * Component for configuring VoIP connections
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Space, App, Alert, Switch, Divider, Table, Modal, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { 
  getVoIPConnections, 
  createVoIPConnection, 
  updateVoIPConnection,
  deleteVoIPConnection,
  patchVoIPConnection
} from '../lib/api/telephony';
import { getProfile, updateProfile } from '../lib/api/user';

export default function TelephonySettings({ onSuccess }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    loadProfileSettings();
    loadConnections();
  }, []);

  const loadProfileSettings = async () => {
    setSettingsLoading(true);
    try {
      const profile = await getProfile();
      settingsForm.setFieldsValue({
        telephony_route_mode: profile.telephony_route_mode || 'auto',
        telephony_provider: profile.telephony_provider || 'Asterisk',
        webrtc_stun_servers: profile.webrtc_stun_servers || 'stun:stun.l.google.com:19302',
        webrtc_turn_enabled: !!profile.webrtc_turn_enabled,
        webrtc_turn_server: profile.webrtc_turn_server || '',
        webrtc_turn_username: profile.webrtc_turn_username || '',
        webrtc_turn_password: profile.webrtc_turn_password || '',
      });
    } catch (error) {
      console.error('Error loading telephony profile settings:', error);
      message.error('Ошибка загрузки настроек телефонии');
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadConnections = async () => {
    setTableLoading(true);
    try {
      const response = await getVoIPConnections();
      setConnections(response.results || []);
    } catch (error) {
      console.error('Error loading VoIP connections:', error);
      message.error('Ошибка загрузки подключений');
    } finally {
      setTableLoading(false);
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const connectionData = {
        provider: values.provider,
        type: values.type,
        number: values.number,
        callerid: values.callerid,
        active: values.active !== undefined ? values.active : true,
      };

      if (editingConnection) {
        // Update existing connection
        await updateVoIPConnection(editingConnection.id, connectionData);
        message.success('Подключение обновлено');
      } else {
        // Create new connection
        await createVoIPConnection(connectionData);
        message.success('Подключение создано');
      }
      
      setModalVisible(false);
      form.resetFields();
      setEditingConnection(null);
      await loadConnections();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving VoIP connection:', error);
      message.error('Ошибка сохранения подключения');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (connection) => {
    setEditingConnection(connection);
    form.setFieldsValue(connection);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteVoIPConnection(id);
      message.success('Подключение удалено');
      await loadConnections();
    } catch (error) {
      console.error('Error deleting connection:', error);
      message.error('Ошибка удаления подключения');
    }
  };

  const handleToggleActive = async (connection) => {
    try {
      await patchVoIPConnection(connection.id, { active: !connection.active });
      message.success(connection.active ? 'Подключение деактивировано' : 'Подключение активировано');
      await loadConnections();
    } catch (error) {
      console.error('Error toggling connection:', error);
      message.error('Ошибка изменения статуса');
    }
  };

  const handleSaveSettings = async (values) => {
    setSettingsLoading(true);
    try {
      await updateProfile({
        telephony_route_mode: values.telephony_route_mode || 'auto',
        telephony_provider: values.telephony_provider || 'Asterisk',
        webrtc_stun_servers: values.webrtc_stun_servers || '',
        webrtc_turn_enabled: !!values.webrtc_turn_enabled,
        webrtc_turn_server: values.webrtc_turn_enabled ? (values.webrtc_turn_server || '') : '',
        webrtc_turn_username: values.webrtc_turn_enabled ? (values.webrtc_turn_username || '') : '',
        webrtc_turn_password: values.webrtc_turn_enabled ? (values.webrtc_turn_password || '') : '',
      });
      message.success('Настройки телефонии сохранены');
      onSuccess?.();
    } catch (error) {
      console.error('Error saving telephony profile settings:', error);
      message.error('Ошибка сохранения настроек телефонии');
    } finally {
      setSettingsLoading(false);
    }
  };


  const columns = [
    {
      title: 'Провайдер',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider) => <Tag color="blue">{provider}</Tag>,
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colors = { pbx: 'green', sip: 'orange', voip: 'purple' };
        return <Tag color={colors[type]}>{type?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Номер',
      dataIndex: 'number',
      key: 'number',
    },
    {
      title: 'Номер отображения',
      dataIndex: 'callerid',
      key: 'callerid',
    },
    {
      title: 'Владелец',
      dataIndex: 'owner_name',
      key: 'owner_name',
      render: (name) => name || '-',
    },
    {
      title: 'Статус',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'Активно' : 'Неактивно'}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Изменить
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleActive(record)}
          >
            {record.active ? 'Деактивировать' : 'Активировать'}
          </Button>
          <Popconfirm
            title="Вы уверены?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Alert
        message="Настройка телефонии"
        description="Управление VoIP подключениями для совершения звонков прямо из CRM"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Divider orientation="left">Маршрутизация и WebRTC (STUN/TURN)</Divider>
      <Form
        form={settingsForm}
        layout="vertical"
        onFinish={handleSaveSettings}
        style={{ marginBottom: 24 }}
      >
        <Form.Item
          label="Режим маршрутизации звонков"
          name="telephony_route_mode"
          rules={[{ required: true, message: 'Выберите режим' }]}
        >
          <Select
            options={[
              { value: 'auto', label: 'Auto (SIP + fallback)' },
              { value: 'internal', label: 'Внутренние номера' },
              { value: 'external', label: 'Внешние номера' },
              { value: 'provider', label: 'Через API провайдера' },
              { value: 'asterisk', label: 'Через Asterisk сервер' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Предпочитаемый провайдер"
          name="telephony_provider"
          rules={[{ required: true, message: 'Выберите провайдера' }]}
        >
          <Select
            options={[
              { value: 'Asterisk', label: 'Asterisk' },
              { value: 'OnlinePBX', label: 'OnlinePBX' },
              { value: 'Zadarma', label: 'Zadarma' },
              { value: 'FreeSWITCH', label: 'FreeSWITCH' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="STUN серверы (по одному в строке или через запятую)"
          name="webrtc_stun_servers"
          tooltip="Пример: stun:stun.l.google.com:19302"
        >
          <Input.TextArea rows={3} placeholder="stun:stun.l.google.com:19302" />
        </Form.Item>

        <Form.Item label="Включить TURN" name="webrtc_turn_enabled" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item noStyle dependencies={['webrtc_turn_enabled']}>
          {({ getFieldValue }) => (
            <>
              {getFieldValue('webrtc_turn_enabled') ? (
                <>
                  <Form.Item
                    label="TURN сервер"
                    name="webrtc_turn_server"
                    rules={[{ required: true, message: 'Введите TURN сервер' }]}
                  >
                    <Input placeholder="turn:turn.example.com:3478?transport=udp" />
                  </Form.Item>
                  <Form.Item
                    label="TURN username"
                    name="webrtc_turn_username"
                    rules={[{ required: true, message: 'Введите TURN username' }]}
                  >
                    <Input placeholder="turn-user" />
                  </Form.Item>
                  <Form.Item
                    label="TURN password"
                    name="webrtc_turn_password"
                    rules={[{ required: true, message: 'Введите TURN password' }]}
                  >
                    <Input.Password placeholder="********" />
                  </Form.Item>
                </>
              ) : null}
            </>
          )}
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={settingsLoading}>
            Сохранить маршрутизацию и ICE
          </Button>
        </Form.Item>
      </Form>

      <Divider orientation="left">VoIP подключения</Divider>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingConnection(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Добавить подключение
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={connections}
        rowKey="id"
        loading={tableLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingConnection ? 'Редактировать подключение' : 'Новое подключение'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingConnection(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            label="Провайдер"
            name="provider"
            rules={[{ required: true, message: 'Выберите провайдера' }]}
          >
            <Select placeholder="Выберите провайдера">
              <Select.Option value="OnlinePBX">OnlinePBX</Select.Option>
              <Select.Option value="Zadarma">Zadarma</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Тип подключения"
            name="type"
            rules={[{ required: true, message: 'Выберите тип' }]}
          >
            <Select placeholder="Выберите тип">
              <Select.Option value="pbx">PBX extension</Select.Option>
              <Select.Option value="sip">SIP connection</Select.Option>
              <Select.Option value="voip">Virtual phone number</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Номер телефона"
            name="number"
            rules={[{ required: true, message: 'Введите номер' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Номер отображения"
            name="callerid"
            rules={[{ required: true, message: 'Введите номер отображения' }]}
            tooltip="Номер, который будет отображаться при исходящих звонках"
          >
            <Input />
          </Form.Item>

          <Form.Item label="Активно" name="active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingConnection ? 'Обновить' : 'Создать'}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setEditingConnection(null);
                }}
              >
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
