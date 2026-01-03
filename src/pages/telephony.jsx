import React, { useEffect, useState } from 'react';
import { Tabs, Card, Button, Form, Input, InputNumber, Switch, Table, message, Space, Modal, Spin } from 'antd';
import CrudPage from '../components/CrudPage.jsx';
import {
  getVoIPConnections,
  getVoIPConnection,
  createVoIPConnection,
  updateVoIPConnection,
  deleteVoIPConnection,
  getCallQueue,
  getIncomingCalls,
  getIncomingCall,
  initiateCall,
  scheduleColdCall,
  bulkColdCall,
} from '../lib/api/telephony.js';
import { getUsers, getUser } from '../lib/api/client.js';

const providerOptions = [
  { label: 'Zadarma', value: 'Zadarma' },
  { label: 'OnlinePBX', value: 'OnlinePBX' },
];

const typeOptions = [
  { label: 'PBX', value: 'pbx' },
  { label: 'SIP', value: 'sip' },
  { label: 'VoIP', value: 'voip' },
];

function CallQueueTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCallQueue();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Card title="Очередь звонков" extra={<Button onClick={load}>Обновить</Button>}>
      {loading ? 'Загрузка...' : <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>}
    </Card>
  );
}

function IncomingCallsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, loading: false, data: null });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getIncomingCalls({ page_size: 50 });
      setData(res?.results || res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDetails = async (record) => {
    setDetailModal({ open: true, loading: true, data: null });
    try {
      const details = await getIncomingCall(record.id);
      setDetailModal({ open: true, loading: false, data: details });
    } catch (error) {
      message.error('Не удалось загрузить детали звонка');
      setDetailModal({ open: true, loading: false, data: null });
    }
  };

  return (
    <Card title="Входящие звонки" extra={<Button onClick={load}>Обновить</Button>}>
      <Table
        dataSource={data}
        rowKey="id"
        loading={loading}
        columns={[
          { title: 'Caller ID', dataIndex: 'caller_id', key: 'caller_id', width: 140 },
          { title: 'Клиент', dataIndex: 'client_name', key: 'client_name' },
          { title: 'Тип', dataIndex: 'client_type', key: 'client_type', width: 120 },
          { title: 'Пользователь', dataIndex: 'user_name', key: 'user_name' },
          { title: 'Показано', dataIndex: 'is_consumed', key: 'is_consumed', render: (value) => value ? 'Да' : 'Нет' },
          { title: 'Создано', dataIndex: 'created_at', key: 'created_at', width: 180 },
          {
            title: 'Действия',
            key: 'actions',
            width: 120,
            render: (_, record) => (
              <Button type="link" onClick={() => openDetails(record)}>
                Детали
              </Button>
            ),
          },
        ]}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Детали входящего звонка"
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, loading: false, data: null })}
        footer={null}
      >
        {detailModal.loading ? (
          <Spin />
        ) : (
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {detailModal.data ? JSON.stringify(detailModal.data, null, 2) : 'Нет данных'}
          </pre>
        )}
      </Modal>
    </Card>
  );
}

function ColdCallTab() {
  const [form] = Form.useForm();
  const [scheduleForm] = Form.useForm();
  const [bulkForm] = Form.useForm();

  const submitImmediate = async (values) => {
    try {
      await initiateCall(values);
      message.success('Звонок инициирован');
      form.resetFields();
    } catch (error) {
      message.error('Не удалось инициировать звонок');
    }
  };

  const submitSchedule = async (values) => {
    try {
      await scheduleColdCall({
        to_number: values.to_number,
        from_number: values.from_number,
        scheduled_time: values.scheduled_time,
        lead_id: values.lead_id,
        contact_id: values.contact_id,
        campaign_id: values.campaign_id,
      });
      message.success('Звонок запланирован');
      scheduleForm.resetFields();
    } catch (error) {
      message.error('Не удалось запланировать звонок');
    }
  };

  const submitBulk = async (values) => {
    try {
      const phoneNumbers = values.phone_numbers
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean);
      await bulkColdCall({
        phone_numbers: phoneNumbers,
        from_number: values.from_number,
        campaign_id: values.campaign_id,
        delay_between_calls: values.delay_between_calls,
      });
      message.success('Bulk расписание отправлено');
      bulkForm.resetFields();
    } catch (error) {
      message.error('Не удалось отправить bulk');
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card title="Инициировать звонок">
        <Form form={form} layout="vertical" onFinish={submitImmediate}>
          <Form.Item label="To number" name="to_number" rules={[{ required: true, message: 'Введите номер' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="From number" name="from_number">
            <Input />
          </Form.Item>
          <Form.Item label="Lead ID" name="lead_id">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Contact ID" name="contact_id">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Campaign ID" name="campaign_id">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Вызвать
          </Button>
        </Form>
      </Card>

      <Card title="Запланировать звонок">
        <Form form={scheduleForm} layout="vertical" onFinish={submitSchedule}>
          <Form.Item label="To number" name="to_number">
            <Input />
          </Form.Item>
          <Form.Item label="From number" name="from_number">
            <Input />
          </Form.Item>
          <Form.Item label="Scheduled time (ISO)" name="scheduled_time">
            <Input placeholder="2024-01-15T14:30:00Z" />
          </Form.Item>
          <Form.Item label="Lead ID" name="lead_id">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Contact ID" name="contact_id">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Campaign ID" name="campaign_id">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Запланировать
          </Button>
        </Form>
      </Card>

      <Card title="Bulk звонки">
        <Form form={bulkForm} layout="vertical" onFinish={submitBulk}>
          <Form.Item label="Phone numbers (по одному на строку)" name="phone_numbers" rules={[{ required: true, message: 'Введите номера' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="From number" name="from_number">
            <Input />
          </Form.Item>
          <Form.Item label="Campaign ID" name="campaign_id">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Delay between calls (сек)" name="delay_between_calls">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Запустить bulk
          </Button>
        </Form>
      </Card>
    </Space>
  );
}

export default function TelephonyPage() {
  const tabs = [
    {
      key: 'connections',
      label: 'Подключения',
      children: (
        <CrudPage
          title="VoIP подключения"
          api={{
            list: getVoIPConnections,
            retrieve: getVoIPConnection,
            create: createVoIPConnection,
            update: updateVoIPConnection,
            remove: deleteVoIPConnection,
          }}
          columns={[
            { title: 'Провайдер', dataIndex: 'provider', key: 'provider' },
            { title: 'Тип', dataIndex: 'type', key: 'type', width: 120 },
            { title: 'Номер', dataIndex: 'number', key: 'number' },
            { title: 'Caller ID', dataIndex: 'callerid', key: 'callerid' },
            { title: 'Активно', dataIndex: 'active', key: 'active', render: (value) => value ? 'Да' : 'Нет' },
          ]}
          fields={[
            { name: 'provider', label: 'Провайдер', type: 'select', options: providerOptions, required: true },
            { name: 'type', label: 'Тип', type: 'select', options: typeOptions, required: true },
            { name: 'number', label: 'Номер', type: 'text', required: true },
            { name: 'callerid', label: 'Caller ID', type: 'text', required: true },
            {
              name: 'owner',
              label: 'Владелец',
              type: 'entity',
              fetchList: getUsers,
              fetchById: getUser,
            },
            { name: 'active', label: 'Активно', type: 'switch' },
          ]}
        />
      ),
    },
    { key: 'incoming', label: 'Входящие', children: <IncomingCallsTab /> },
    { key: 'queue', label: 'Очередь', children: <CallQueueTab /> },
    { key: 'cold-calls', label: 'Cold Calls', children: <ColdCallTab /> },
  ];

  return <Tabs items={tabs} />;
}
