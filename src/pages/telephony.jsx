import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Tabs,
  Card,
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Table,
  App,
  Space,
  Modal,
  Spin,
  Row,
  Col,
  Statistic,
  Descriptions,
  Tag,
  DatePicker,
  Empty,
  theme,
} from 'antd';
import EntitySelect from '../components/EntitySelect.jsx';
import { t } from '../lib/i18n/index.js';
import { canAccessRoute } from '../lib/rbac.js';
import { getSettingsWorkspaceTabPath } from '../lib/settingsWorkspaceNavigation.js';
import {
  getCallQueue,
  getIncomingCalls,
  getIncomingCall,
  initiateCall,
  scheduleColdCall,
  bulkColdCall,
} from '../lib/api/telephony.js';
import {
  getContacts,
  getContact,
  getLead,
  getLeads,
} from '../lib/api/client.js';
import { getCampaign, getCampaigns } from '../lib/api/marketing.js';
import { navigate } from '../router.js';

const FREEPBX_MAIN_QUEUE_NUMBER = '0553636';
const FREEPBX_AGENT_EXTENSION_REGEX = /^2(?:0\d|1\d)$/;

function isFreePbxAgentExtension(value) {
  return FREEPBX_AGENT_EXTENSION_REGEX.test(String(value || '').trim());
}

function validateBridgeDestination(_, value) {
  const normalized = String(value || '').trim();
  if (!normalized) return Promise.resolve();
  if (normalized === FREEPBX_MAIN_QUEUE_NUMBER) return Promise.resolve();
  if (isFreePbxAgentExtension(normalized)) return Promise.resolve();
  if (/^(?:\+?[0-9]{7,15}|0[0-9]{6,15})$/.test(normalized)) return Promise.resolve();
  return Promise.reject(
    new Error(`Используйте extension 200-219, очередь ${FREEPBX_MAIN_QUEUE_NUMBER} или внешний номер в цифровом формате.`)
  );
}

function validateBridgeSource(_, value) {
  const normalized = String(value || '').trim();
  if (!normalized) return Promise.resolve();
  if (normalized === FREEPBX_MAIN_QUEUE_NUMBER) return Promise.resolve();
  if (isFreePbxAgentExtension(normalized)) return Promise.resolve();
  return Promise.reject(
    new Error(`Для source number используйте extension 200-219 или основной DID/queue ${FREEPBX_MAIN_QUEUE_NUMBER}.`)
  );
}

const formatLabel = (value) =>
  value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDetailValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  if (typeof value === 'object') return t('telephonyPage.common.complexValue');
  return String(value);
};

const renderStatusTag = (status) => {
  if (!status) return '-';
  const normalized = String(status).toLowerCase();
  let color = 'default';
  if (['waiting', 'queued', 'pending'].some((key) => normalized.includes(key))) color = 'warning';
  if (['active', 'in_progress', 'connected'].some((key) => normalized.includes(key)))
    color = 'processing';
  if (['transferred', 'forwarded', 'voicemail'].some((key) => normalized.includes(key)))
    color = 'purple';
  if (['completed', 'done', 'answered'].some((key) => normalized.includes(key))) color = 'success';
  if (['failed', 'missed', 'error', 'canceled', 'abandoned'].some((key) => normalized.includes(key)))
    color = 'error';
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
      const items = Array.isArray(res)
        ? res
        : res?.results || res?.queue || res?.items || res?.calls || [];
      setData(items);
      setSummary(Array.isArray(res) ? null : res);
    } catch (error) {
      message.error(t('telephonyPage.messages.queueLoadError'));
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
        title: t('telephonyPage.queue.columns.number'),
        key: 'phone',
        width: 160,
        render: (_, record) =>
          record.phone_number || record.to_number || record.number || record.caller_id || '-',
      },
      {
        title: t('telephonyPage.queue.columns.client'),
        key: 'client',
        render: (_, record) =>
          record.client_name || record.contact_name || record.lead_name || record.name || '-',
      },
      {
        title: t('telephonyPage.queue.columns.status'),
        key: 'status',
        width: 140,
        render: (_, record) =>
          renderStatusTag(record.status || record.state || record.queue_status),
      },
      {
        title: t('telephonyPage.queue.columns.priority'),
        dataIndex: 'priority',
        key: 'priority',
        width: 110,
        render: (value) => (value === null || value === undefined ? '-' : value),
      },
      {
        title: t('telephonyPage.queue.columns.operator'),
        key: 'agent',
        render: (_, record) =>
          record.user_name || record.owner_name || record.agent_name || record.assignee || '-',
      },
      {
        title: t('telephonyPage.queue.columns.createdAt'),
        key: 'created_at',
        width: 180,
        render: (_, record) =>
          record.created_at || record.created || record.created_date || record.timestamp || '-',
      },
      {
        title: t('telephonyPage.queue.columns.actions'),
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Button type="link" onClick={() => setDetailModal({ open: true, record })}>
            {t('telephonyPage.common.details')}
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <Card
      title={t('telephonyPage.queue.title')}
      extra={<Button onClick={load}>{t('telephonyPage.common.refresh')}</Button>}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="FreePBX queue monitor"
        description={`Основной inbound поток ожидается через очередь/DID ${FREEPBX_MAIN_QUEUE_NUMBER}. Экран read-only: он показывает состояние bridge-очереди, но не раскрывает PBX secret material.`}
      />

      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title={t('telephonyPage.queue.stats.total')}
              value={stats.total ?? data.length}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title={t('telephonyPage.queue.stats.waiting')} value={stats.waiting ?? 0} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title={t('telephonyPage.queue.stats.active')} value={stats.active ?? 0} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title={t('telephonyPage.queue.stats.errors')} value={stats.failed ?? 0} />
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
        title={t('telephonyPage.queue.detailTitle')}
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
      const res = await getIncomingCalls({ limit: 50 });
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
      message.error(t('telephonyPage.messages.callDetailsError'));
      setDetailModal({ open: true, loading: false, data: null });
    }
  };

  return (
    <Card
      title={t('telephonyPage.incoming.title')}
      extra={<Button onClick={load}>{t('telephonyPage.common.refresh')}</Button>}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Bridge-first incoming feed"
        description={`Ожидайте вызовы, пришедшие через queue ${FREEPBX_MAIN_QUEUE_NUMBER} и затем распределённые по operator extensions 200-219.`}
      />

      <Table
        dataSource={data}
        rowKey="id"
        loading={loading}
        columns={[
          {
            title: t('telephonyPage.incoming.columns.callerId'),
            dataIndex: 'caller_id',
            key: 'caller_id',
            width: 160,
          },
          {
            title: t('telephonyPage.incoming.columns.client'),
            dataIndex: 'client_name',
            key: 'client_name',
          },
          {
            title: t('telephonyPage.incoming.columns.type'),
            dataIndex: 'client_type',
            key: 'client_type',
            width: 120,
          },
          {
            title: t('telephonyPage.incoming.columns.user'),
            dataIndex: 'user_name',
            key: 'user_name',
          },
          {
            title: t('telephonyPage.incoming.columns.shown'),
            dataIndex: 'is_consumed',
            key: 'is_consumed',
            render: (value) =>
              value ? t('telephonyPage.common.yes') : t('telephonyPage.common.no'),
          },
          {
            title: t('telephonyPage.incoming.columns.createdAt'),
            dataIndex: 'created_at',
            key: 'created_at',
            width: 180,
          },
          {
            title: t('telephonyPage.incoming.columns.actions'),
            key: 'actions',
            width: 120,
            render: (_, record) => (
              <Button type="link" onClick={() => openDetails(record)}>
                {t('telephonyPage.common.details')}
              </Button>
            ),
          },
        ]}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title={t('telephonyPage.incoming.detailTitle')}
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
          <Empty description={t('telephonyPage.common.noData')} />
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
      message.success(t('telephonyPage.messages.callInitiated'));
      form.resetFields();
    } catch (error) {
      message.error(t('telephonyPage.messages.callInitiateError'));
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
      message.success(t('telephonyPage.messages.callScheduled'));
      scheduleForm.resetFields();
    } catch (error) {
      message.error(t('telephonyPage.messages.callScheduleError'));
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
      message.success(t('telephonyPage.messages.bulkSent'));
      bulkForm.resetFields();
    } catch (error) {
      message.error(t('telephonyPage.messages.bulkError'));
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert
        type="warning"
        showIcon
        message="FreePBX bridge originate"
        description={`Для ручного originate используйте agent extensions 200-219. Номер ${FREEPBX_MAIN_QUEUE_NUMBER} трактуется как основной queue/DID и не должен использоваться как персональный операторский extension.`}
      />

      <Card title={t('telephonyPage.cold.initiateTitle')}>
        <Form form={form} layout="vertical" onFinish={submitImmediate}>
          <Form.Item
            label={t('telephonyPage.cold.toNumber')}
            name="to_number"
            rules={[
              { required: true, message: t('telephonyPage.cold.validation.enterNumber') },
              { validator: validateBridgeDestination },
            ]}
          >
            <Input placeholder={`200-219, ${FREEPBX_MAIN_QUEUE_NUMBER} или +998...`} />
          </Form.Item>
          <Form.Item
            label={t('telephonyPage.cold.fromNumber')}
            name="from_number"
            rules={[{ validator: validateBridgeSource }]}
            extra={`Если поле заполнено, используйте extension 200-219 или основной DID ${FREEPBX_MAIN_QUEUE_NUMBER}.`}
          >
            <Input placeholder={`Например: 200 или ${FREEPBX_MAIN_QUEUE_NUMBER}`} />
          </Form.Item>
          <Form.Item label={t('telephonyPage.cold.lead')} name="lead_id">
            <EntitySelect
              placeholder={t('telephonyPage.placeholders.selectLead')}
              fetchList={getLeads}
              fetchById={getLead}
              allowClear
            />
          </Form.Item>
          <Form.Item label={t('telephonyPage.cold.contact')} name="contact_id">
            <EntitySelect
              placeholder={t('telephonyPage.placeholders.selectContact')}
              fetchList={getContacts}
              fetchById={getContact}
              allowClear
            />
          </Form.Item>
          <Form.Item label={t('telephonyPage.cold.campaign')} name="campaign_id">
            <EntitySelect
              placeholder={t('telephonyPage.placeholders.selectCampaign')}
              fetchList={getCampaigns}
              fetchById={getCampaign}
              allowClear
            />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            {t('telephonyPage.cold.callNow')}
          </Button>
        </Form>
      </Card>

      <Card title={t('telephonyPage.cold.scheduleTitle')}>
        <Form form={scheduleForm} layout="vertical" onFinish={submitSchedule}>
          <Form.Item
            label={t('telephonyPage.cold.toNumber')}
            name="to_number"
            rules={[{ validator: validateBridgeDestination }]}
          >
            <Input placeholder={`200-219, ${FREEPBX_MAIN_QUEUE_NUMBER} или +998...`} />
          </Form.Item>
          <Form.Item
            label={t('telephonyPage.cold.fromNumber')}
            name="from_number"
            rules={[{ validator: validateBridgeSource }]}
          >
            <Input placeholder={`Например: 201 или ${FREEPBX_MAIN_QUEUE_NUMBER}`} />
          </Form.Item>
          <Form.Item label={t('telephonyPage.cold.dateTime')} name="scheduled_time">
            <DatePicker
              showTime
              format="DD.MM.YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder={t('telephonyPage.cold.selectDateTime')}
            />
          </Form.Item>
          <Form.Item label={t('telephonyPage.cold.lead')} name="lead_id">
            <EntitySelect
              placeholder={t('telephonyPage.placeholders.selectLead')}
              fetchList={getLeads}
              fetchById={getLead}
              allowClear
            />
          </Form.Item>
          <Form.Item label={t('telephonyPage.cold.contact')} name="contact_id">
            <EntitySelect
              placeholder={t('telephonyPage.placeholders.selectContact')}
              fetchList={getContacts}
              fetchById={getContact}
              allowClear
            />
          </Form.Item>
          <Form.Item label={t('telephonyPage.cold.campaign')} name="campaign_id">
            <EntitySelect
              placeholder={t('telephonyPage.placeholders.selectCampaign')}
              fetchList={getCampaigns}
              fetchById={getCampaign}
              allowClear
            />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            {t('telephonyPage.cold.schedule')}
          </Button>
        </Form>
      </Card>

      <Card title={t('telephonyPage.cold.bulkTitle')}>
        <Form form={bulkForm} layout="vertical" onFinish={submitBulk}>
          <Form.Item
            label={t('telephonyPage.cold.phoneNumbers')}
            name="phone_numbers"
            rules={[{ required: true, message: t('telephonyPage.cold.validation.enterNumbers') }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            label={t('telephonyPage.cold.fromNumber')}
            name="from_number"
            rules={[{ validator: validateBridgeSource }]}
          >
            <Input placeholder={`Например: 202 или ${FREEPBX_MAIN_QUEUE_NUMBER}`} />
          </Form.Item>
          <Form.Item label={t('telephonyPage.cold.campaign')} name="campaign_id">
            <EntitySelect
              placeholder={t('telephonyPage.placeholders.selectCampaign')}
              fetchList={getCampaigns}
              fetchById={getCampaign}
              allowClear
            />
          </Form.Item>
          <Form.Item label={t('telephonyPage.cold.delayBetweenCalls')} name="delay_between_calls">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            {t('telephonyPage.cold.runBulk')}
          </Button>
        </Form>
      </Card>
    </Space>
  );
}

export default function TelephonyPage() {
  const { token } = theme.useToken();
  const integrationsWorkspacePath = getSettingsWorkspaceTabPath(canAccessRoute, 'integrations');
  const [activeTab, setActiveTab] = useState('incoming');
  const tabs = [
    { key: 'incoming', label: t('telephonyPage.tabs.incoming'), children: <IncomingCallsTab /> },
    { key: 'queue', label: t('telephonyPage.tabs.queue'), children: <CallQueueTab /> },
    { key: 'cold-calls', label: t('telephonyPage.tabs.coldCalls'), children: <ColdCallTab /> },
  ];

  return (
    <Card
      style={{
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgElevated,
        boxShadow: token.boxShadowTertiary,
      }}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Admin telephony overview for FreePBX Bridge"
        description={`Этот маршрут теперь содержит только runtime-операции (входящие, очередь, cold calls). Настройка подключений вынесена в Интеграции > Телефония.`}
        action={(
          <Button type="primary" onClick={() => navigate(integrationsWorkspacePath)}>
            Открыть Интеграции {'>'} Телефония
          </Button>
        )}
      />
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
    </Card>
  );
}
