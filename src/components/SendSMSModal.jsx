/**
 * SendSMSModal Component
 * Modal for sending SMS with template selection and preview
 */

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, App, Typography, Alert, Divider } from 'antd';
import { MessageOutlined, SendOutlined, EyeOutlined } from '@ant-design/icons';
// SMS API not available in Django-CRM API.yaml
const sendSMS = async () => { throw new Error('SMS API requires backend implementation'); };
const getSMSTemplates = async () => { return []; };

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

export default function SendSMSModal({
  visible,
  onClose,
  phoneNumber = '',
  contactName = '',
  entityType = 'contact',
  entityId = null,
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [preview, setPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (visible) {
      loadTemplates();
      form.setFieldsValue({ phone_number: phoneNumber });
    }
  }, [visible, phoneNumber]);

  const loadTemplates = async () => {
    try {
      const data = await getSMSTemplates();
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading SMS templates:', error);
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const message = replaceVariables(template.content);
      form.setFieldsValue({ message });
      setPreview(message);
      setCharCount(message.length);
    }
  };

  const replaceVariables = (text) => {
    return text
      .replace(/\{name\}/g, contactName || '[Имя]')
      .replace(/\{phone\}/g, phoneNumber || '[Телефон]')
      .replace(/\{date\}/g, new Date().toLocaleDateString('ru'))
      .replace(/\{time\}/g, new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }));
  };

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setCharCount(value.length);
    setPreview(value);
  };

  const handleSend = async (values) => {
    setLoading(true);
    try {
      await sendSMS({
        phone_number: values.phone_number,
        message: values.message,
        entity_type: entityType,
        entity_id: entityId,
      });
      
      message.success(`SMS отправлено на номер ${values.phone_number}`);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Error sending SMS:', error);
      message.error(error?.message || 'Ошибка отправки SMS');
    } finally {
      setLoading(false);
    }
  };

  const getSMSCount = () => {
    if (charCount === 0) return 0;
    if (charCount <= 160) return 1;
    return Math.ceil(charCount / 153);
  };

  return (
    <Modal
      title={
        <Space>
          <MessageOutlined />
          <span>Отправить SMS</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSend}
        initialValues={{
          phone_number: phoneNumber,
        }}
      >
        <Form.Item
          label="Номер телефона"
          name="phone_number"
          rules={[
            { required: true, message: 'Введите номер телефона' },
            { pattern: /^\+?[\d\s\-\(\)]+$/, message: 'Неверный формат номера' },
          ]}
        >
          <Input
            placeholder="+7 (999) 123-45-67"
            disabled={!!phoneNumber}
          />
        </Form.Item>

        {contactName && (
          <Alert
            message={`Получатель: ${contactName}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item
          label="Выбрать шаблон"
          name="template_id"
        >
          <Select
            placeholder="Выберите шаблон (опционально)"
            allowClear
            onChange={handleTemplateSelect}
          >
            {templates.map(template => (
              <Select.Option key={template.id} value={template.id}>
                {template.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <span>Текст сообщения</span>
              <Text type="secondary">
                ({charCount} символов, {getSMSCount()} SMS)
              </Text>
            </Space>
          }
          name="message"
          rules={[
            { required: true, message: 'Введите текст сообщения' },
            { max: 1000, message: 'Максимум 1000 символов' },
          ]}
        >
          <TextArea
            rows={6}
            placeholder="Введите текст SMS..."
            onChange={handleMessageChange}
            showCount
            maxLength={1000}
          />
        </Form.Item>

        {charCount > 160 && (
          <Alert
            message={`Сообщение будет разбито на ${getSMSCount()} SMS`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {showPreview && preview && (
          <>
            <Divider>Предпросмотр</Divider>
            <div
              style={{
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 4,
                marginBottom: 16,
              }}
            >
              <Text>{preview}</Text>
            </div>
          </>
        )}

        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button
              icon={<EyeOutlined />}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Скрыть предпросмотр' : 'Предпросмотр'}
            </Button>
            <Space>
              <Button onClick={onClose}>
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={loading}
              >
                Отправить SMS
              </Button>
            </Space>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
