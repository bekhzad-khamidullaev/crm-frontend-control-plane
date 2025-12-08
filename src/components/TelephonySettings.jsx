/**
 * TelephonySettings Component
 * Component for configuring telephony settings
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Space, App, Card, Alert, Switch, Divider } from 'antd';
import { PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { 
  getSIPConfig, 
  saveSIPConfig, 
  updateSIPConfig,
  testSIPConnection,
  updateTelephonySettings
} from '../lib/api/telephony';

export default function TelephonySettings({ onSuccess }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [provider, setProvider] = useState('sip');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await getSIPConfig();
      form.setFieldsValue(config);
      setProvider(config.provider || 'sip');
    } catch (error) {
      console.error('Error loading telephony config:', error);
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const config = await getSIPConfig();
      
      if (config.results && config.results.length > 0) {
        // Update existing connection
        await updateSIPConfig(config.results[0].id, {
          provider: values.provider === 'sip' ? 'OnlinePBX' : 'Zadarma',
          type: 'sip',
          number: values.sip_username,
          callerid: values.sip_username,
          active: true,
        });
      } else {
        // Create new connection
        await saveSIPConfig({
          provider: values.provider === 'sip' ? 'OnlinePBX' : 'Zadarma',
          type: 'sip',
          number: values.sip_username,
          callerid: values.sip_username,
          active: true,
        });
      }
      
      // Save additional settings
      await updateTelephonySettings({
        sip_server: values.sip_server,
        sip_username: values.sip_username,
        sip_password: values.sip_password,
        ws_url: values.ws_url,
        auto_record: values.auto_record,
        auto_log: values.auto_log,
        provider: values.provider,
      });
      
      message.success('Настройки телефонии сохранены');
      onSuccess?.();
    } catch (error) {
      console.error('Error saving telephony settings:', error);
      message.error('Ошибка сохранения настроек');
    } finally {
      setLoading(false);
    }
  };

  const handleTestCall = async () => {
    setTesting(true);
    try {
      const values = form.getFieldsValue();
      
      await testSIPConnection({
        sip_server: values.sip_server,
        sip_username: values.sip_username,
        sip_password: values.sip_password,
        ws_url: values.ws_url,
      });
      
      message.success('SIP подключение успешно проверено');
    } catch (error) {
      console.error('Error testing SIP connection:', error);
      message.error('Ошибка тестирования подключения');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <Alert
        message="Настройка телефонии"
        description="Подключите SIP/WebRTC провайдера для совершения звонков прямо из CRM"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item label="Провайдер" name="provider">
          <Select onChange={setProvider}>
            <Select.Option value="sip">SIP/VoIP</Select.Option>
            <Select.Option value="webrtc">WebRTC</Select.Option>
            <Select.Option value="twilio">Twilio</Select.Option>
            <Select.Option value="asterisk">Asterisk</Select.Option>
          </Select>
        </Form.Item>

        {provider === 'sip' && (
          <>
            <Form.Item
              label="SIP Server"
              name="sip_server"
              rules={[{ required: true, message: 'Введите адрес SIP сервера' }]}
            >
              <Input placeholder="sip.example.com" />
            </Form.Item>

            <Form.Item label="SIP Username" name="sip_username" rules={[{ required: true }]}>
              <Input placeholder="user@domain" />
            </Form.Item>

            <Form.Item label="SIP Password" name="sip_password" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>

            <Form.Item label="WebSocket URL" name="ws_url">
              <Input placeholder="wss://sip.example.com:443" />
            </Form.Item>
          </>
        )}

        <Divider />

        <Form.Item label="Автоматическая запись звонков" name="auto_record" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="Автоматическое создание логов" name="auto_log" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Сохранить настройки
            </Button>
            <Button onClick={handleTestCall} loading={testing} icon={<PhoneOutlined />}>
              Тестовый звонок
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
