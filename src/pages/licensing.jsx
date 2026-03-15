import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getLicenseChallenge,
  getLicenseEntitlements,
  getLicenseEvents,
  installLicenseArtifact,
  verifyLicenseArtifact,
} from '../lib/api/license.js';
import { t } from '../lib/i18n/index.js';
import resolveFeatureName from '../lib/api/licenseFeatureName';

const { Text } = Typography;

function tr(key, fallback, vars = {}) {
  const localized = t(key, vars);
  return localized === key ? fallback : localized;
}

function formatDate(value) {
  if (!value) return '-';
  const parsed = dayjs(value);
  if (!parsed.isValid()) return String(value);
  return parsed.format('YYYY-MM-DD HH:mm');
}

function persistLicenseFeatures(features = []) {
  const normalized = Array.from(
    new Set(
      (Array.isArray(features) ? features : [])
        .map((item) => String(item || '').trim().toLowerCase())
        .filter(Boolean),
    ),
  );
  sessionStorage.setItem('enterprise_crm_license_features', JSON.stringify(normalized));
  localStorage.removeItem('enterprise_crm_license_features');
}

function normalizeLicenseContract(response) {
  if (!response || typeof response !== 'object') return null;

  const seatUsageRaw = response.seat_usage || {};
  const limit = seatUsageRaw.limit === null || seatUsageRaw.limit === undefined
    ? null
    : Number(seatUsageRaw.limit);

  return {
    installed: Boolean(response.installed),
    status: String(response.status || 'unknown').toLowerCase(),
    healthReason: String(response.health_reason || ''),
    licenseId: response.license_id || '-',
    customerName: response.customer_name || '-',
    planCode: response.plan_code || '-',
    instanceId: response.instance_id || '-',
    keyId: response.key_id || '-',
    installedAt: response.installed_at || null,
    validFrom: response.valid_from || null,
    validTo: response.valid_to || null,
    graceUntil: response.grace_until || null,
    features: Array.isArray(response.features) ? response.features : [],
    seatUsage: {
      used: Number(seatUsageRaw.used || 0),
      limit,
      available: seatUsageRaw.available === null || seatUsageRaw.available === undefined
        ? null
        : Number(seatUsageRaw.available),
      overLimit: Boolean(seatUsageRaw.over_limit),
      utilizationPercent: seatUsageRaw.utilization_percent === null || seatUsageRaw.utilization_percent === undefined
        ? null
        : Number(seatUsageRaw.utilization_percent),
    },
  };
}

function normalizeEvents(response) {
  const list = Array.isArray(response) ? response : (Array.isArray(response?.results) ? response.results : []);
  return list.map((event, index) => ({
    key: event.id || `${event.event_type || 'event'}-${event.created_at || index}`,
    id: event.id || index + 1,
    eventType: event.event_type || 'unknown',
    severity: event.severity || '-',
    createdAt: event.created_at || null,
    details: event.details || {},
  }));
}

function getStatusMeta(status) {
  if (status === 'active') {
    return {
      alertType: 'success',
      tagColor: 'success',
      icon: <CheckCircleOutlined />,
      text: tr('licensingPage.status.active', 'Active'),
    };
  }
  if (status === 'grace') {
    return {
      alertType: 'warning',
      tagColor: 'warning',
      icon: <ClockCircleOutlined />,
      text: tr('licensingPage.status.grace', 'Grace period'),
    };
  }
  if (status === 'expired') {
    return {
      alertType: 'error',
      tagColor: 'error',
      icon: <WarningOutlined />,
      text: tr('licensingPage.status.expired', 'Expired'),
    };
  }
  if (status === 'revoked') {
    return {
      alertType: 'error',
      tagColor: 'volcano',
      icon: <CloseCircleOutlined />,
      text: tr('licensingPage.status.revoked', 'Revoked'),
    };
  }
  if (status === 'invalid') {
    return {
      alertType: 'error',
      tagColor: 'magenta',
      icon: <CloseCircleOutlined />,
      text: tr('licensingPage.status.invalid', 'Invalid'),
    };
  }

  return {
    alertType: 'info',
    tagColor: 'default',
    icon: <WarningOutlined />,
    text: tr('licensingPage.status.unknown', 'Unknown'),
  };
}

function StateActions({ status, onOpenInstall, onOpenOffline, onOpenEvents }) {
  if (status === 'grace') {
    return (
      <Space>
        <Button type="primary" onClick={onOpenInstall} icon={<UploadOutlined />}>
          {tr('licensingPage.state.gracePrimary', 'Install renewal')}
        </Button>
        <Button onClick={onOpenOffline}>
          {tr('licensingPage.state.graceSecondary', 'Offline challenge')}
        </Button>
      </Space>
    );
  }

  if (status === 'expired') {
    return (
      <Space>
        <Button type="primary" danger onClick={onOpenInstall} icon={<UploadOutlined />}>
          {tr('licensingPage.state.expiredPrimary', 'Install new license')}
        </Button>
        <Button onClick={onOpenOffline}>
          {tr('licensingPage.state.expiredSecondary', 'Generate challenge')}
        </Button>
      </Space>
    );
  }

  if (status === 'revoked') {
    return (
      <Space>
        <Button type="primary" danger onClick={onOpenOffline}>
          {tr('licensingPage.state.revokedPrimary', 'Offline reactivation')}
        </Button>
        <Button onClick={onOpenEvents}>
          {tr('licensingPage.state.revokedSecondary', 'Open audit events')}
        </Button>
      </Space>
    );
  }

  if (status === 'invalid') {
    return (
      <Space>
        <Button type="primary" danger onClick={onOpenOffline}>
          {tr('licensingPage.state.invalidPrimary', 'Regenerate challenge')}
        </Button>
        <Button onClick={onOpenEvents}>
          {tr('licensingPage.state.invalidSecondary', 'Inspect audit events')}
        </Button>
      </Space>
    );
  }

  return (
    <Space>
      <Button type="primary" onClick={onOpenInstall} icon={<SafetyCertificateOutlined />}>
        {tr('licensingPage.state.activePrimary', 'Verify artifact')}
      </Button>
      <Button onClick={onOpenEvents}>{tr('licensingPage.state.activeSecondary', 'View events')}</Button>
    </Space>
  );
}

export default function LicensingPage() {
  const [loading, setLoading] = useState(false);
  const [licenseResponse, setLicenseResponse] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [events, setEvents] = useState([]);
  const [artifactForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const license = useMemo(() => normalizeLicenseContract(licenseResponse), [licenseResponse]);
  const status = getStatusMeta(license?.status);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [licenseData, eventsData] = await Promise.all([
        getLicenseEntitlements(),
        getLicenseEvents().catch(() => []),
      ]);
      setLicenseResponse(licenseData || {});
      persistLicenseFeatures(Array.isArray(licenseData?.features) ? licenseData.features : []);
      setEvents(normalizeEvents(eventsData));
    } catch {
      message.error(tr('licensingPage.messages.loadError', 'Failed to load license data'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      const values = await artifactForm.validateFields();
      setSubmitting(true);
      await verifyLicenseArtifact(values.payload, values.signature);
      message.success(tr('licensingPage.messages.verifySuccess', 'License artifact is valid'));
    } catch (error) {
      if (error?.errorFields) return;
      message.error(tr('licensingPage.messages.verifyError', 'License verification failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInstall = async () => {
    try {
      const values = await artifactForm.validateFields();
      setSubmitting(true);
      await installLicenseArtifact(values.payload, values.signature);
      message.success(tr('licensingPage.messages.installSuccess', 'License installed successfully'));
      await loadAll();
      setActiveTab('overview');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(tr('licensingPage.messages.installError', 'Failed to install license'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadChallenge = async () => {
    setLoading(true);
    try {
      const response = await getLicenseChallenge();
      setChallenge(response || {});
      message.success(tr('licensingPage.messages.challengeLoaded', 'Challenge loaded'));
    } catch {
      message.error(tr('licensingPage.messages.challengeError', 'Failed to load challenge'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyChallenge = async () => {
    if (!challenge) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(challenge, null, 2));
      message.success(tr('licensingPage.messages.challengeCopied', 'Challenge copied'));
    } catch {
      message.error(tr('licensingPage.messages.copyError', 'Failed to copy'));
    }
  };

  React.useEffect(() => {
    loadAll();
  }, []);

  const eventColumns = [
    {
      title: tr('licensingPage.events.columns.when', 'When'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (value) => formatDate(value),
    },
    {
      title: tr('licensingPage.events.columns.type', 'Type'),
      dataIndex: 'eventType',
      key: 'eventType',
      width: 180,
    },
    {
      title: tr('licensingPage.events.columns.severity', 'Severity'),
      dataIndex: 'severity',
      key: 'severity',
      width: 140,
      render: (value) => {
        const color = value === 'error' ? 'error' : (value === 'warning' ? 'warning' : 'blue');
        return <Tag color={color}>{String(value || '-').toUpperCase()}</Tag>;
      },
    },
    {
      title: tr('licensingPage.events.columns.details', 'Details'),
      dataIndex: 'details',
      key: 'details',
      render: (details) => (
        <Text code style={{ whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(details || {}, null, 2)}
        </Text>
      ),
    },
  ];

  const tabs = [
    {
      key: 'overview',
      label: tr('licensingPage.tabs.overview', 'Overview'),
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            type={status.alertType}
            showIcon
            icon={status.icon}
            message={tr('licensingPage.health.title', 'License health')}
            description={status.text}
          />

          {license ? (
            <Card>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text type="secondary">
                  {tr('licensingPage.state.hint', 'Recommended actions depend on current status.')}
                </Text>
                <StateActions
                  status={license.status}
                  onOpenInstall={() => setActiveTab('install')}
                  onOpenOffline={() => setActiveTab('offline')}
                  onOpenEvents={() => setActiveTab('events')}
                />
              </Space>
            </Card>
          ) : null}

          {!license ? (
            <Empty description={tr('licensingPage.empty', 'No license data')} />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Card>
                    <Statistic
                      title={tr('licensingPage.cards.seatsUsed', 'Seats used')}
                      value={license.seatUsage.used}
                      suffix={license.seatUsage.limit !== null ? `/ ${license.seatUsage.limit}` : undefined}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card>
                    <Statistic
                      title={tr('licensingPage.cards.seatsAvailable', 'Seats available')}
                      value={license.seatUsage.available !== null ? license.seatUsage.available : '-'}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card>
                    <Statistic
                      title={tr('licensingPage.cards.seatsUtilization', 'Seat utilization %')}
                      value={license.seatUsage.utilizationPercent !== null ? license.seatUsage.utilizationPercent : '-'}
                    />
                  </Card>
                </Col>
              </Row>

              <Card title={tr('licensingPage.info.title', 'License info')}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={tr('licensingPage.info.status', 'Status')}>
                    <Tag color={status.tagColor}>{status.text}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('licensingPage.info.plan', 'Plan')}>
                    {license.planCode}
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('licensingPage.info.customer', 'Customer')}>
                    {license.customerName}
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('licensingPage.info.instanceId', 'Instance ID')}>
                    {license.instanceId}
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('licensingPage.info.licenseId', 'License ID')}>
                    {license.licenseId}
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('licensingPage.info.installedAt', 'Installed at')}>
                    {formatDate(license.installedAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('licensingPage.info.validFrom', 'Valid from')}>
                    {formatDate(license.validFrom)}
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('licensingPage.info.expiresAt', 'Expires at')}>
                    {formatDate(license.validTo)}
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('licensingPage.info.graceUntil', 'Grace until')}>
                    {formatDate(license.graceUntil)}
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('licensingPage.info.healthReason', 'Health reason')}>
                    {license.healthReason || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title={tr('licensingPage.features.title', 'Entitled features')}>
                {license.features.length ? (
                  <Space wrap>
                    {license.features.map((feature) => (
                      <Tag key={feature} color="blue">
                        {resolveFeatureName(feature, t)}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Empty description={tr('licensingPage.features.empty', 'No entitled features')} />
                )}
              </Card>
            </>
          )}
        </Space>
      ),
    },
    {
      key: 'install',
      label: tr('licensingPage.tabs.install', 'Install & verify'),
      children: (
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message={tr('licensingPage.install.title', 'Install signed license artifact')}
              description={tr(
                'licensingPage.install.description',
                'Paste canonical payload and signature received from control-plane signer.',
              )}
            />

            <Form form={artifactForm} layout="vertical">
              <Form.Item
                name="payload"
                label={tr('licensingPage.install.payload', 'Payload')}
                rules={[{ required: true, message: tr('licensingPage.install.payloadRequired', 'Payload is required') }]}
              >
                <Input.TextArea rows={8} placeholder='{"license_id":"..."}' />
              </Form.Item>

              <Form.Item
                name="signature"
                label={tr('licensingPage.install.signature', 'Signature')}
                rules={[{ required: true, message: tr('licensingPage.install.signatureRequired', 'Signature is required') }]}
              >
                <Input.TextArea rows={4} placeholder="base64-signature" />
              </Form.Item>

              <Space>
                <Button loading={submitting} onClick={handleVerify} icon={<SafetyCertificateOutlined />}>
                  {tr('licensingPage.install.verify', 'Verify')}
                </Button>
                <Button type="primary" loading={submitting} onClick={handleInstall} icon={<UploadOutlined />}>
                  {tr('licensingPage.install.install', 'Install')}
                </Button>
              </Space>
            </Form>
          </Space>
        </Card>
      ),
    },
    {
      key: 'offline',
      label: tr('licensingPage.tabs.offline', 'Offline activation'),
      children: (
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              type="warning"
              showIcon
              message={tr('licensingPage.offline.title', 'Air-gapped challenge-response flow')}
              description={tr(
                'licensingPage.offline.description',
                'Generate challenge and transfer it to control-plane. Receive signed artifact and install it in this CRM instance.',
              )}
            />
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleLoadChallenge} loading={loading}>
                {tr('licensingPage.offline.generate', 'Generate challenge')}
              </Button>
              <Button icon={<CopyOutlined />} onClick={handleCopyChallenge} disabled={!challenge}>
                {tr('licensingPage.offline.copy', 'Copy challenge JSON')}
              </Button>
            </Space>

            {challenge ? (
              <Input.TextArea value={JSON.stringify(challenge, null, 2)} rows={14} readOnly />
            ) : (
              <Empty description={tr('licensingPage.offline.empty', 'Challenge is not generated yet')} />
            )}
          </Space>
        </Card>
      ),
    },
    {
      key: 'events',
      label: tr('licensingPage.tabs.events', 'Audit events'),
      children: (
        <Card>
          <Table
            dataSource={events}
            columns={eventColumns}
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 900 }}
            locale={{ emptyText: tr('licensingPage.events.empty', 'No events yet') }}
          />
        </Card>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <div>
            <Text strong>{tr('licensingPage.title', 'Licensing control')}</Text>
            <div>
              <Text type="secondary">
                {tr('licensingPage.subtitle', 'Manage license assignment, offline activation, and audit history for this instance.')}
              </Text>
            </div>
          </div>
          <Button icon={<ReloadOutlined />} onClick={loadAll} loading={loading}>
            {tr('actions.refresh', 'Refresh')}
          </Button>
        </Space>
      </Card>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
    </Space>
  );
}
