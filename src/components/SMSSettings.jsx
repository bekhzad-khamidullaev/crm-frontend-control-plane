/**
 * SMSSettings Component
 * Component for configuring SMS provider
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Space, App, Card, Alert, Switch, Divider, Modal, Table } from 'antd';
import { MessageOutlined, CheckCircleOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { 
  getSMSProviderConfig, 
  updateSMSProviderConfig, 
  testSMSConnection,
  getSMSTemplates,
  createSMSTemplate,
  updateSMSTemplate,
  deleteSMSTemplate,
  getSMSBalance
} from '../lib/api/sms';

export default function SMSSettings({ onSuccess }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [templateForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [provider, setProvider] = useState('twilio');
  const [balance, setBalance] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  useEffect(() => {
    loadConfig();
    loadTemplates();
    loadBalance();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await getSMSProviderConfig();
      form.setFieldsValue(config);
      setProvider(config.provider || 'twilio');
    } catch (error) {
      console.error('Error loading SMS config:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await getSMSTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadBalance = async () => {
    try {
      const data = await getSMSBalance();
      setBalance(data);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await updateSMSProviderConfig(values);
      message.success('Настройки SMS сохранены');
      await loadBalance();
      onSuccess?.();
    } catch (error) {
      message.error('Ошибка сохранения настроек');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const values = form.getFieldsValue();
      if (!values.test_phone) {
        message.error('Введите номер телефона для теста');
        setTesting(false);
        return;
      }
      
      await testSMSConnection({ phone_number: values.test_phone });
      message.success('Тестовое SMS отправлено успешно');
    } catch (error) {
      message.error('Ошибка отправки тестового SMS');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveTemplate = async (values) => {
    setLoading(true);
    try {
      if (editingTemplate) {
        await updateSMSTemplate(editingTemplate.id, values);
        message.success('Шаблон обновлен');
      } else {
        await createSMSTemplate(values);
        message.success('Шаблон создан');
      }
      
      setTemplateModalVisible(false);
      setEditingTemplate(null);
      templateForm.resetFields();
      await loadTemplates();
    } catch (error) {
      message.error('Ошибка сохранения шаблона');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    try {
      await deleteSMSTemplate(id);
      message.success('Шаблон удален');
      await loadTemplates();
    } catch (error) {
      message.error('Ошибка удаления шаблона');
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    templateForm.setFieldsValue(template);
    setTemplateModalVisible(true);
  };

  const templateColumns = [
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { 
      title: 'Содержание', 
      dataIndex: 'content', 
      key: 'content',
      ellipsis: true,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleEditTemplate(record)}
          />
          <Button 
            size="small" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteTemplate(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Alert
        message="Настройка SMS провайдера"
        description="Подключите SMS провайдера для отправки SMS сообщений клиентам"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {balance && (
        <Card size="small" style={{ marginBottom: 24 }}>
          <Space size="large">
            <div>
              <strong>Баланс:</strong> {balance.balance} {balance.currency || 'USD'}
            </div>
            <div>
              <strong>Отправлено за месяц:</strong> {balance.sent_this_month || 0}
            </div>
          </Space>
        </Card>
      )}

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item label="Провайдер" name="provider">
          <Select onChange={setProvider}>
            <Select.Option value="twilio">Twilio</Select.Option>
            <Select.Option value="vonage">Vonage (Nexmo)</Select.Option>
            <Select.Option value="smsc">SMSC.ru</Select.Option>
            <Select.Option value="smsaero">SMS Aero</Select.Option>
            <Select.Option value="infobip">Infobip</Select.Option>
          </Select>
        </Form.Item>

        {provider === 'twilio' && (
          <>
            <Form.Item
              label="Account SID"
              name="api_key"
              rules={[{ required: true, message: 'Введите Account SID' }]}
            >
              <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
            </Form.Item>

            <Form.Item
              label="Auth Token"
              name="api_secret"
              rules={[{ required: true, message: 'Введите Auth Token' }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="Номер отправителя"
              name="sender"
              rules={[{ required: true, message: 'Введите номер Twilio' }]}
            >
              <Input placeholder="+1234567890" />
            </Form.Item>
          </>
        )}

        {provider === 'vonage' && (
          <>
            <Form.Item
              label="API Key"
              name="api_key"
              rules={[{ required: true, message: 'Введите API Key' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="API Secret"
              name="api_secret"
              rules={[{ required: true, message: 'Введите API Secret' }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="Имя отправителя"
              name="sender"
              rules={[{ required: true, message: 'Введите имя отправителя' }]}
            >
              <Input placeholder="YourCompany" maxLength={11} />
            </Form.Item>
          </>
        )}

        {(provider === 'smsc' || provider === 'smsaero') && (
          <>
            <Form.Item
              label="Логин"
              name="api_key"
              rules={[{ required: true, message: 'Введите логин' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Пароль / API ключ"
              name="api_secret"
              rules={[{ required: true, message: 'Введите пароль' }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="Имя отправителя"
              name="sender"
            >
              <Input placeholder="YourCompany" maxLength={11} />
            </Form.Item>
          </>
        )}

        {provider === 'infobip' && (
          <>
            <Form.Item
              label="API Key"
              name="api_key"
              rules={[{ required: true, message: 'Введите API Key' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Base URL"
              name="base_url"
            >
              <Input placeholder="https://api.infobip.com" />
            </Form.Item>

            <Form.Item
              label="Имя отправителя"
              name="sender"
              rules={[{ required: true, message: 'Введите имя отправителя' }]}
            >
              <Input />
            </Form.Item>
          </>
        )}

        <Divider />

        <Form.Item label="Тестовый номер телефона" name="test_phone">
          <Input placeholder="+79001234567" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Сохранить настройки
            </Button>
            <Button onClick={handleTest} loading={testing} icon={<MessageOutlined />}>
              Отправить тестовое SMS
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Divider />

      <Card 
        title="Шаблоны SMS" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingTemplate(null);
              templateForm.resetFields();
              setTemplateModalVisible(true);
            }}
          >
            Добавить шаблон
          </Button>
        }
      >
        <Table
          columns={templateColumns}
          dataSource={templates}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Modal
        title={editingTemplate ? 'Редактировать шаблон' : 'Новый шаблон'}
        open={templateModalVisible}
        onCancel={() => {
          setTemplateModalVisible(false);
          setEditingTemplate(null);
          templateForm.resetFields();
        }}
        footer={null}
      >
        <Form form={templateForm} layout="vertical" onFinish={handleSaveTemplate}>
          <Form.Item
            label="Название"
            name="name"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Текст сообщения"
            name="content"
            rules={[{ required: true, message: 'Введите текст' }]}
          >
            <Input.TextArea 
              rows={4} 
              showCount 
              maxLength={1000}
              placeholder="Используйте {{first_name}}, {{last_name}} для подстановки данных"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Сохранить
              </Button>
              <Button onClick={() => setTemplateModalVisible(false)}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
