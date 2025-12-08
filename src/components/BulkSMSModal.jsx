/**
 * BulkSMSModal Component
 * Modal for sending bulk SMS to multiple recipients
 */

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, App, Typography, Alert, Table, Progress } from 'antd';
import { MessageOutlined, SendOutlined } from '@ant-design/icons';
import { sendBulkSMS, getSMSTemplates } from '../lib/api/sms';

const { TextArea } = Input;
const { Text } = Typography;

export default function BulkSMSModal({
  visible,
  onClose,
  recipients = [], // Array of { id, name, phone }
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [charCount, setCharCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (visible) {
      loadTemplates();
    }
  }, [visible]);

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
      form.setFieldsValue({ message: template.content });
      setCharCount(template.content.length);
    }
  };

  const handleSend = async (values) => {
    setSending(true);
    setLoading(true);
    setProgress(0);

    try {
      const phoneNumbers = recipients.map(r => r.phone);
      
      await sendBulkSMS({
        phone_numbers: phoneNumbers,
        message: values.message,
        template_id: values.template_id,
      });

      message.success(`SMS отправлено ${phoneNumbers.length} получателям`);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      message.error(error?.message || 'Ошибка массовой отправки SMS');
    } finally {
      setSending(false);
      setLoading(false);
      setProgress(0);
    }
  };

  const columns = [
    { title: 'Имя', dataIndex: 'name', key: 'name' },
    { title: 'Телефон', dataIndex: 'phone', key: 'phone' },
  ];

  return (
    <Modal
      title={
        <Space>
          <MessageOutlined />
          <span>Массовая отправка SMS</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Alert
        message={`Будет отправлено ${recipients.length} SMS`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Table
        columns={columns}
        dataSource={recipients}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        size="small"
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical" onFinish={handleSend}>
        <Form.Item label="Шаблон" name="template_id">
          <Select
            placeholder="Выберите шаблон"
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
          label={`Текст сообщения (${charCount} символов)`}
          name="message"
          rules={[{ required: true, message: 'Введите текст' }]}
        >
          <TextArea
            rows={4}
            onChange={(e) => setCharCount(e.target.value.length)}
            showCount
            maxLength={1000}
          />
        </Form.Item>

        {sending && (
          <Progress percent={progress} status="active" style={{ marginBottom: 16 }} />
        )}

        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>Отмена</Button>
            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading}>
              Отправить всем
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
