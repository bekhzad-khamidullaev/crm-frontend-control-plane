import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Tabs, Card, Button, Form, Input, InputNumber, Switch, Table, App, Space, Modal, Spin, Row, Col, Statistic, Descriptions, Tag, DatePicker, Empty } from 'antd';
import CrudPage from '../components/CrudPage.jsx';
import { PhoneInput } from '@/shared/ui';
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

const formatLabel = (value) =>
  value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDetailValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  if (typeof value === 'object') return '[сложное значение]';
  return String(value);
};

const renderStatusTag = (status) => {
  if (!status) return '-';
  const normalized = String(status).toLowerCase();
  let color = 'default';
  if (['waiting', 'queued', 'pending'].some((key) => normalized.includes(key))) color = 'warning';
  if (['active', 'in_progress', 'connected'].some((key) => normalized.includes(key))) color = 'processing';
  if (['completed', 'done', 'answered'].some((key) => normalized.includes(key))) color = 'success';
  if (['failed', 'missed', 'error', 'canceled'].some((key) => normalized.includes(key))) color = 'error';
  return <Tag color={color}>{status}</Tag>;
};

function CallQueueTab() {
  const { message } = App.useApp();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, record: null });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCallQueue();
      const items =
        Array.isArray(res) ? res : res?.results || res?.queue || res?.items || res?.calls || [];
      setData(items);
      setSummary(Array.isArray(res) ? null : res);
    } catch (error) {
      message.error('Не удалось загрузить очередь звонков');
      setData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    if (!summary || typeof summary !== 'object') return null;
    return {
      total: summary.total || summary.count || data.length,
      waiting: summary.waiting || summary.waiting_calls || summary.pending,
      active: summary.active || summary.active_calls,
      failed: summary.failed || summary.failed_calls || summary.errors,
    };
  }, [summary, data.length]);

  const columns = useMemo(
    () => [
      {
        title: 'Номер',
        key: 'phone',
        width: 160,
        render: (_, record) =>
          record.phone_number || record.to_number || record.number || record.caller_id || '-',
      },
      {
        title: 'Клиент',
        key: 'client',
        render: (_, record) =>
          record.client_name || record.contact_name || record.lead_name || record.name || '-',
      },
      {
        title: 'Статус',
        key: 'status',
        width: 140,
        render: (_, record) => renderStatusTag(record.status || record.state || record.queue_status),
      },
      {
        title: 'Приоритет',
        dataIndex: 'priority',
        key: 'priority',
        width: 110,
        render: (value) => (value === null || value === undefined ? '-' : value),
      },
      {
        title: 'Оператор',
        key: 'agent',
        render: (_, record) =>
          record.user_name || record.owner_name || record.agent_name || record.assignee || '-',
      },
      {
        title: 'Создано',
        key: 'created_at',
        width: 180,
        render: (_, record) =>
          record.created_at || record.created || record.created_date || record.timestamp || '-',
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Button type="link" onClick={() => setDetailModal({ open: true, record })}>
            Детали
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <Card title="Очередь звонков" extra={<Button onClick={load}>Обновить</Button>}>
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Всего" value={stats.total ?? data.length} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Ожидание" value={stats.waiting ?? 0} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="В работе" value={stats.active ?? 0} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Ошибки" value={stats.failed ?? 0} />
          </Col>
        </Row>
      )}

      <Table
        dataSource={data}
        rowKey={(record, index) =>
          record.id || record.call_id || record.uuid || `${record.phone_number || 'call'}-${index}`
        }
        loading={loading}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Детали очереди"
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, record: null })}
        footer={null}
      >
        {detailModal.record ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Descriptions size="small" column={1}>
              {Object.entries(detailModal.record)
                .filter(([, value]) => !value || typeof value !== 'object' || Array.isArray(value))
                .map(([key, value]) => (
                  <Descriptions.Item key={key} label={formatLabel(key)}>
                    {formatDetailValue(value)}
                  </Descriptions.Item>
                ))}
            </Descriptions>
            {Object.entries(detailModal.record)
              .filter(([, value]) => value && typeof value === 'object' && !Array.isArray(value))
              .map(([key, value]) => (
                <Card key={key} size="small" title={formatLabel(key)}>
                  <Descriptions size="small" column={1}>
                    {Object.entries(value || {}).map(([childKey, childValue]) => (
                      <Descriptions.Item key={childKey} label={formatLabel(childKey)}>
                        {formatDetailValue(childValue)}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </Card>
              ))}
          </Space>
        ) : (
          <Spin />
        )}
      </Modal>
    </Card>
  );
}

function IncomingCallsTab() {
  const { message } = App.useApp();
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
          { title: 'Номер отображения', dataIndex: 'caller_id', key: 'caller_id', width: 160 },
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
        ) : detailModal.data ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Descriptions size="small" column={1}>
              {Object.entries(detailModal.data)
                .filter(([, value]) => !value || typeof value !== 'object' || Array.isArray(value))
                .map(([key, value]) => (
                  <Descriptions.Item key={key} label={formatLabel(key)}>
                    {formatDetailValue(value)}
                  </Descriptions.Item>
                ))}
            </Descriptions>
            {Object.entries(detailModal.data)
              .filter(([, value]) => value && typeof value === 'object' && !Array.isArray(value))
              .map(([key, value]) => (
                <Card key={key} size="small" title={formatLabel(key)}>
                  <Descriptions size="small" column={1}>
                    {Object.entries(value || {}).map(([childKey, childValue]) => (
                      <Descriptions.Item key={childKey} label={formatLabel(childKey)}>
                        {formatDetailValue(childValue)}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </Card>
              ))}
          </Space>
        ) : (
          <Empty description="Нет данных" />
        )}
      </Modal>
    </Card>
  );
}

function ColdCallTab() {
  const { message } = App.useApp();
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
        scheduled_time: values.scheduled_time ? dayjs(values.scheduled_time).toISOString() : null,
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
            <PhoneInput />
          </Form.Item>
          <Form.Item label="From number" name="from_number">
            <PhoneInput />
          </Form.Item>
          <Form.Item label="Лид" name="lead_id">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Контакт" name="contact_id">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Кампания" name="campaign_id">
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
            <PhoneInput />
          </Form.Item>
          <Form.Item label="From number" name="from_number">
            <PhoneInput />
          </Form.Item>
          <Form.Item label="Дата и время" name="scheduled_time">
            <DatePicker
              showTime
              format="DD.MM.YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder="Выберите дату и время"
            />
          </Form.Item>
          <Form.Item label="Лид" name="lead_id">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Контакт" name="contact_id">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Кампания" name="campaign_id">
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
            <PhoneInput />
          </Form.Item>
          <Form.Item label="Кампания" name="campaign_id">
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
            { title: 'Номер отображения', dataIndex: 'callerid', key: 'callerid' },
            { title: 'Активно', dataIndex: 'active', key: 'active', render: (value) => value ? 'Да' : 'Нет' },
          ]}
          fields={[
            { name: 'provider', label: 'Провайдер', type: 'select', options: providerOptions, required: true },
            { name: 'type', label: 'Тип', type: 'select', options: typeOptions, required: true },
            { name: 'number', label: 'Номер', type: 'text', required: true },
            { name: 'callerid', label: 'Номер отображения', type: 'text', required: true },
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
