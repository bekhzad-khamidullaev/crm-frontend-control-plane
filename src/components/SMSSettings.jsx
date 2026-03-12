/**
 * SMSSettings Component
 * Configure and test SMS providers available in the backend
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, App, Button, Card, Col, Descriptions, Empty, Form, Input, Row, Select, Space, Statistic, Table, Tag } from 'antd';
import { MessageOutlined, ReloadOutlined } from '@ant-design/icons';
import smsApi from '../lib/api/sms.js';

const { TextArea } = Input;

export default function SMSSettings({ onSuccess }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [providers, setProviders] = useState([]);
  const [status, setStatus] = useState(null);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadProviders();
    loadStatus();
  }, []);

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const response = await smsApi.providers();
      const list = response?.results || response || [];
      setProviders(Array.isArray(list) ? list : []);
      if (!form.getFieldValue('channel_id') && list.length > 0) {
        const firstId = list[0].channel_id || list[0].id;
        if (firstId !== undefined) {
          form.setFieldsValue({ channel_id: firstId });
        }
      }
    } catch (error) {
      console.error('Error loading SMS providers:', error);
      message.error('Не удалось загрузить список SMS провайдеров');
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const response = await smsApi.status();
      setStatus(response || null);
    } catch (error) {
      console.error('Error loading SMS status:', error);
      message.error('Не удалось загрузить статус SMS');
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  const providerOptions = useMemo(
    () =>
      providers.map((provider) => ({
        value: provider.channel_id || provider.id,
        label: provider.name || provider.provider || provider.title || 'Канал',
      })),
    [providers]
  );

  const providerColumns = [
    {
      title: 'Канал',
      dataIndex: 'channel_id',
      key: 'channel_id',
      render: (value) => value || '-',
    },
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => value || record.provider || record.title || '-',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (value) => value || '-',
    },
  ];

  const statusEntries = useMemo(() => {
    if (!status) return [];
    if (Array.isArray(status)) {
      return status.map((item, index) => [`Статус ${index + 1}`, item]);
    }
    return Object.entries(status);
  }, [status]);

  const handleSendTest = async (values) => {
    setSending(true);
    try {
      await smsApi.send({
        channel_id: values.channel_id,
        to: values.to,
        text: values.text,
        async: true,
      });
      message.success('Тестовое SMS отправлено');
      onSuccess?.();
    } catch (error) {
      console.error('Error sending test SMS:', error);
      message.error('Не удалось отправить SMS');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <Alert
        message="SMS провайдеры"
        description="Список каналов задается на стороне сервера. Здесь можно проверить доступность и отправить тест."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card
        title="Доступные провайдеры"
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadProviders} loading={loadingProviders}>
            Обновить
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={providerColumns}
          dataSource={providers}
          rowKey={(record) => record.channel_id || record.id}
          pagination={{ pageSize: 5 }}
          loading={loadingProviders}
        />
      </Card>

      <Card
        title="Статус сервиса"
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadStatus} loading={loadingStatus}>
            Обновить
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        {statusEntries.length === 0 ? (
          <Empty description="Нет данных" />
        ) : (
          <Row gutter={[16, 16]}>
            {statusEntries.map(([key, value]) => (
              <Col xs={24} md={12} key={key}>
                <Card size="small">
                  {typeof value === 'number' ? (
                    <Statistic title={key} value={value} />
                  ) : typeof value === 'boolean' ? (
                    <>
                      <div style={{ marginBottom: 8, color: '#71717a' }}>{key}</div>
                      <Tag color={value ? 'green' : 'default'}>{value ? 'Да' : 'Нет'}</Tag>
                    </>
                  ) : value && typeof value === 'object' ? (
                    <Descriptions column={1} size="small" bordered>
                      {Object.entries(value).map(([nestedKey, nestedValue]) => (
                        <Descriptions.Item key={nestedKey} label={nestedKey}>
                          {String(nestedValue ?? '-')}
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  ) : (
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label={key}>{String(value ?? '-')}</Descriptions.Item>
                    </Descriptions>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Card title="Тестовая отправка">
        <Form form={form} layout="vertical" onFinish={handleSendTest}>
          <Form.Item
            label="Канал отправки"
            name="channel_id"
            rules={[{ required: true, message: 'Выберите канал' }]}
          >
            <Select options={providerOptions} placeholder="Выберите провайдера" />
          </Form.Item>

          <Form.Item
            label="Номер получателя"
            name="to"
            rules={[
              { required: true, message: 'Введите номер' },
              { pattern: /^\+?[\d\s\-\(\)]+$/, message: 'Неверный формат номера' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Текст сообщения"
            name="text"
            rules={[{ required: true, message: 'Введите текст сообщения' }]}
          >
            <TextArea rows={4} maxLength={1000} showCount />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<MessageOutlined />} loading={sending}>
                Отправить тест
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
