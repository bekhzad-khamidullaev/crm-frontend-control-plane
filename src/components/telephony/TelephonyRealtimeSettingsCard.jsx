import React, { useEffect, useState } from 'react';
import { Alert, App, Button, Card, Descriptions, Form, Input, InputNumber, Space, Switch } from 'antd';

import {
  getVoipRealtimeSettings,
  testVoipRealtimeSettings,
  updateVoipRealtimeSettings,
} from '../../lib/api/telephony.js';

export default function TelephonyRealtimeSettingsCard({ canManage = false, onSuccess }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const payload = await getVoipRealtimeSettings();
      form.setFieldsValue({
        ws_enabled: payload?.ws_enabled !== false,
        ws_url: payload?.ws_url || '',
        ws_auth_mode: payload?.ws_auth_mode || 'token',
        ws_token: payload?.ws_token || '',
        ws_reconnect_enabled: payload?.ws_reconnect_enabled !== false,
        ws_reconnect_max_attempts: Number(payload?.ws_reconnect_max_attempts || 15),
        ws_reconnect_base_delay_ms: Number(payload?.ws_reconnect_base_delay_ms || 1000),
        ws_reconnect_max_delay_ms: Number(payload?.ws_reconnect_max_delay_ms || 15000),
        ws_heartbeat_interval_sec: Number(payload?.ws_heartbeat_interval_sec || 20),
        ws_heartbeat_timeout_sec: Number(payload?.ws_heartbeat_timeout_sec || 10),
        polling_fallback_enabled: payload?.polling_fallback_enabled !== false,
        incoming_enabled: payload?.incoming_enabled !== false,
        incoming_poll_interval_ms: Number(payload?.incoming_poll_interval_ms || 4000),
        incoming_popup_ttl_ms: Number(payload?.incoming_popup_ttl_ms || 20000),
      });
    } catch (error) {
      message.error('Не удалось загрузить realtime-настройки');
      console.error('Failed to load realtime settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await updateVoipRealtimeSettings(values);
      message.success('Realtime-настройки сохранены');
      onSuccess?.();
    } catch (error) {
      message.error('Не удалось сохранить realtime-настройки');
      console.error('Failed to save realtime settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      const result = await testVoipRealtimeSettings(values);
      setTestResult(result || null);
      if (result?.ok) {
        message.success('Проверка realtime-настроек успешна');
      } else {
        message.warning('Проверка завершилась с предупреждением');
      }
    } catch (error) {
      const details = error?.details || {};
      const text = details?.message || error?.message || 'Ошибка проверки realtime-настроек';
      setTestResult({ ok: false, status: 'error', message: text });
      message.error(text);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card
      title="WebSocket и realtime"
      loading={loading}
      style={{ marginBottom: 24 }}
      extra={
        <Space>
          <Button onClick={loadSettings}>Обновить</Button>
          <Button onClick={handleTest} loading={testing}>
            Проверить WebSocket
          </Button>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Настройки realtime транспорта"
        description="Этот блок отвечает за WebSocket-подключение для live-событий звонков и fallback polling."
      />

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item label="Включить realtime WebSocket" name="ws_enabled" valuePropName="checked">
          <Switch disabled={!canManage} />
        </Form.Item>

        <Form.Item
          label="WebSocket URL"
          name="ws_url"
          rules={[{ required: true, message: 'Укажите ws:// или wss:// URL' }]}
        >
          <Input placeholder="wss://pbx.example.com/ws/calls/" disabled={!canManage} />
        </Form.Item>

        <Form.Item label="Режим авторизации" name="ws_auth_mode" rules={[{ required: true }]}>
          <Input disabled={!canManage} placeholder="token | query_token | none" />
        </Form.Item>

        <Form.Item label="Токен" name="ws_token">
          <Input.Password disabled={!canManage} />
        </Form.Item>

        <Form.Item label="Разрешить reconnect" name="ws_reconnect_enabled" valuePropName="checked">
          <Switch disabled={!canManage} />
        </Form.Item>

        <Form.Item label="Max reconnect attempts" name="ws_reconnect_max_attempts">
          <InputNumber min={0} max={100} style={{ width: '100%' }} disabled={!canManage} />
        </Form.Item>

        <Form.Item label="Reconnect base delay (ms)" name="ws_reconnect_base_delay_ms">
          <InputNumber min={100} max={60000} style={{ width: '100%' }} disabled={!canManage} />
        </Form.Item>

        <Form.Item label="Reconnect max delay (ms)" name="ws_reconnect_max_delay_ms">
          <InputNumber min={100} max={120000} style={{ width: '100%' }} disabled={!canManage} />
        </Form.Item>

        <Form.Item label="Heartbeat interval (sec)" name="ws_heartbeat_interval_sec">
          <InputNumber min={5} max={120} style={{ width: '100%' }} disabled={!canManage} />
        </Form.Item>

        <Form.Item label="Heartbeat timeout (sec)" name="ws_heartbeat_timeout_sec">
          <InputNumber min={5} max={120} style={{ width: '100%' }} disabled={!canManage} />
        </Form.Item>

        <Form.Item label="Включить polling fallback" name="polling_fallback_enabled" valuePropName="checked">
          <Switch disabled={!canManage} />
        </Form.Item>

        <Form.Item label="Включить incoming popup" name="incoming_enabled" valuePropName="checked">
          <Switch disabled={!canManage} />
        </Form.Item>

        <Form.Item label="Incoming polling interval (ms)" name="incoming_poll_interval_ms">
          <InputNumber min={500} max={60000} style={{ width: '100%' }} disabled={!canManage} />
        </Form.Item>

        <Form.Item label="Incoming popup TTL (ms)" name="incoming_popup_ttl_ms">
          <InputNumber min={1000} max={120000} style={{ width: '100%' }} disabled={!canManage} />
        </Form.Item>

        {canManage ? (
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Сохранить realtime-настройки
            </Button>
          </Form.Item>
        ) : null}
      </Form>

      {testResult ? (
        <Descriptions bordered size="small" title="Результат проверки" style={{ marginTop: 8 }} column={1}>
          <Descriptions.Item label="OK">{String(Boolean(testResult?.ok))}</Descriptions.Item>
          <Descriptions.Item label="Status">{testResult?.status || '-'}</Descriptions.Item>
          <Descriptions.Item label="Latency (ms)">{testResult?.latency_ms ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Message">{testResult?.message || '-'}</Descriptions.Item>
          <Descriptions.Item label="Checked at">{testResult?.checked_at || '-'}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Card>
  );
}
