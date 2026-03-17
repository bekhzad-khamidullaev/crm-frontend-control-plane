import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Row,
  Select,
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
import {
  approveCpRuntimeRequest,
  assignCpDeploymentLicense,
  getCpCustomerDetail,
  getCpCustomers,
  getCpDeployments,
  getCpRuntimeUnlicensedRequests,
  getCpSubscriptions,
  getCpUnlicensedDeployments,
} from '../lib/api/licenseControl.js';
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

function normalizeCollection(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
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
  const [cpLoading, setCpLoading] = useState(false);
  const [licenseResponse, setLicenseResponse] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [events, setEvents] = useState([]);
  const [cpAvailable, setCpAvailable] = useState(false);
  const [cpCustomers, setCpCustomers] = useState([]);
  const [cpDeployments, setCpDeployments] = useState([]);
  const [cpSubscriptions, setCpSubscriptions] = useState([]);
  const [cpUnlicensedDeployments, setCpUnlicensedDeployments] = useState([]);
  const [cpUnlicensedRequests, setCpUnlicensedRequests] = useState([]);
  const [rowSubscriptionMap, setRowSubscriptionMap] = useState({});
  const [rowAssignLoading, setRowAssignLoading] = useState({});
  const [requestDeploymentMap, setRequestDeploymentMap] = useState({});
  const [requestSubscriptionMap, setRequestSubscriptionMap] = useState({});
  const [requestActionLoading, setRequestActionLoading] = useState({});
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [customerDrawerLoading, setCustomerDrawerLoading] = useState(false);
  const [customerDetail, setCustomerDetail] = useState(null);
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

  const loadControlPlaneData = async () => {
    setCpLoading(true);
    try {
      const [
        customersResponse,
        deploymentsResponse,
        subscriptionsResponse,
        unlicensedDeploymentsResponse,
        unlicensedRequestsResponse,
      ] = await Promise.all([
        getCpCustomers({ page_size: 500 }),
        getCpDeployments({ page_size: 500 }),
        getCpSubscriptions({ page_size: 500 }),
        getCpUnlicensedDeployments(),
        getCpRuntimeUnlicensedRequests(),
      ]);
      setCpCustomers(normalizeCollection(customersResponse));
      setCpDeployments(normalizeCollection(deploymentsResponse));
      setCpSubscriptions(normalizeCollection(subscriptionsResponse));
      setCpUnlicensedDeployments(normalizeCollection(unlicensedDeploymentsResponse));
      setCpUnlicensedRequests(normalizeCollection(unlicensedRequestsResponse));
      setCpAvailable(true);
    } catch (error) {
      setCpAvailable(false);
      setCpCustomers([]);
      setCpDeployments([]);
      setCpSubscriptions([]);
      setCpUnlicensedDeployments([]);
      setCpUnlicensedRequests([]);
      if (activeTab === 'control-plane') {
        message.error(tr('licensingPage.messages.controlPlaneLoadError', 'Failed to load control-plane license queue'));
      }
    } finally {
      setCpLoading(false);
    }
  };

  const handleAssignDeploymentLicense = async (deploymentId) => {
    const subscriptionId = rowSubscriptionMap[deploymentId];
    if (!subscriptionId) {
      message.warning(tr('licensingPage.messages.selectSubscriptionFirst', 'Select subscription first'));
      return;
    }
    setRowAssignLoading((prev) => ({ ...prev, [deploymentId]: true }));
    try {
      await assignCpDeploymentLicense(deploymentId, subscriptionId);
      message.success(tr('licensingPage.messages.licenseAssigned', 'License assigned successfully'));
      await loadControlPlaneData();
    } catch {
      message.error(tr('licensingPage.messages.licenseAssignError', 'Failed to assign license'));
    } finally {
      setRowAssignLoading((prev) => ({ ...prev, [deploymentId]: false }));
    }
  };

  const handleApproveRuntimeRequest = async (requestId) => {
    const deploymentId = requestDeploymentMap[requestId];
    const subscriptionId = requestSubscriptionMap[requestId];
    if (!deploymentId || !subscriptionId) {
      message.warning(tr('licensingPage.messages.selectDeploymentAndSubscription', 'Select deployment and subscription'));
      return;
    }
    setRequestActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      await approveCpRuntimeRequest(requestId, {
        deployment_id: deploymentId,
        subscription_id: subscriptionId,
        review_note: 'Approved from unlicensed queue',
      });
      message.success(tr('licensingPage.messages.requestApproved', 'Runtime request approved'));
      await loadControlPlaneData();
    } catch {
      message.error(tr('licensingPage.messages.requestApproveError', 'Failed to approve runtime request'));
    } finally {
      setRequestActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const openCustomerDetail = async (customerId) => {
    if (!customerId) return;
    setCustomerDrawerOpen(true);
    setCustomerDrawerLoading(true);
    try {
      const payload = await getCpCustomerDetail(customerId);
      setCustomerDetail(payload || null);
    } catch {
      setCustomerDetail(null);
      message.error(tr('licensingPage.messages.customerDetailError', 'Failed to load customer detail'));
    } finally {
      setCustomerDrawerLoading(false);
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
    loadControlPlaneData();
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

  const deploymentOptions = useMemo(
    () => cpDeployments.map((dep) => ({ label: `${dep.instance_id} (${dep.environment})`, value: dep.id })),
    [cpDeployments],
  );

  const unlicensedDeploymentColumns = [
    {
      title: tr('licensingPage.control.unlicensed.columns.customer', 'Customer'),
      key: 'customer',
      width: 260,
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <Button type="link" style={{ padding: 0, height: 'auto' }} onClick={() => openCustomerDetail(row?.customer?.id)}>
            {row?.customer?.legal_name || '-'}
          </Button>
          <Text type="secondary">{row?.customer?.code || '-'}</Text>
          <Text type="secondary">{row?.customer?.contact_email || '-'}</Text>
        </Space>
      ),
    },
    {
      title: tr('licensingPage.control.unlicensed.columns.instance', 'Instance'),
      dataIndex: 'instance_id',
      key: 'instance_id',
      width: 220,
      render: (value, row) => (
        <Space direction="vertical" size={2}>
          <Text code>{value || '-'}</Text>
          <Text type="secondary">{String(row?.environment || '').toUpperCase()}</Text>
        </Space>
      ),
    },
    {
      title: tr('licensingPage.control.unlicensed.columns.lastRequest', 'Last runtime request'),
      key: 'latest_runtime_request',
      width: 220,
      render: (_, row) => {
        const req = row?.latest_runtime_request;
        if (!req) return <Text type="secondary">-</Text>;
        return (
          <Space direction="vertical" size={2}>
            <Tag color="warning">{req.status}</Tag>
            <Text type="secondary">{formatDate(req.created_at)}</Text>
          </Space>
        );
      },
    },
    {
      title: tr('licensingPage.control.unlicensed.columns.assign', 'Assign license'),
      key: 'assign',
      width: 360,
      render: (_, row) => {
        const options = cpSubscriptions
          .filter((sub) => sub.customer === row?.customer?.id)
          .map((sub) => ({
            label: `${sub.plan_code || sub.plan} • ${sub.status} • ${formatDate(sub.valid_to)}`,
            value: sub.id,
          }));
        return (
          <Space>
            <Select
              showSearch
              placeholder={tr('licensingPage.control.placeholders.selectSubscription', 'Select subscription')}
              style={{ width: 220 }}
              options={options}
              value={rowSubscriptionMap[row.id]}
              onChange={(value) => setRowSubscriptionMap((prev) => ({ ...prev, [row.id]: value }))}
            />
            <Button
              type="primary"
              onClick={() => handleAssignDeploymentLicense(row.id)}
              loading={Boolean(rowAssignLoading[row.id])}
            >
              {tr('licensingPage.control.actions.assignLicense', 'Assign')}
            </Button>
          </Space>
        );
      },
    },
  ];

  const unlicensedRequestColumns = [
    {
      title: tr('licensingPage.control.requests.columns.instance', 'Instance'),
      dataIndex: 'instance_id',
      key: 'instance_id',
      width: 230,
      render: (value) => <Text code>{value || '-'}</Text>,
    },
    {
      title: tr('licensingPage.control.requests.columns.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value) => <Tag color="processing">{value}</Tag>,
    },
    {
      title: tr('licensingPage.control.requests.columns.fingerprint', 'Fingerprint'),
      key: 'fingerprint',
      width: 220,
      render: (_, row) => <Text type="secondary">{row?.request_payload?.fingerprint || '-'}</Text>,
    },
    {
      title: tr('licensingPage.control.requests.columns.createdAt', 'Created at'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (value) => formatDate(value),
    },
    {
      title: tr('licensingPage.control.requests.columns.inlineApprove', 'Inline assignment'),
      key: 'approve',
      width: 500,
      render: (_, row) => {
        const selectedDeploymentId = requestDeploymentMap[row.id];
        const selectedDeployment = cpDeployments.find((dep) => dep.id === selectedDeploymentId);
        const subscriptions = cpSubscriptions
          .filter((sub) => !selectedDeployment || sub.customer === selectedDeployment.customer)
          .map((sub) => ({
            label: `${sub.plan_code || sub.plan} • ${sub.status} • ${formatDate(sub.valid_to)}`,
            value: sub.id,
          }));
        return (
          <Space wrap>
            <Select
              showSearch
              style={{ width: 210 }}
              placeholder={tr('licensingPage.control.placeholders.selectDeployment', 'Select deployment')}
              options={deploymentOptions}
              value={selectedDeploymentId}
              onChange={(value) => {
                setRequestDeploymentMap((prev) => ({ ...prev, [row.id]: value }));
                setRequestSubscriptionMap((prev) => ({ ...prev, [row.id]: undefined }));
              }}
            />
            <Select
              showSearch
              style={{ width: 220 }}
              placeholder={tr('licensingPage.control.placeholders.selectSubscription', 'Select subscription')}
              options={subscriptions}
              value={requestSubscriptionMap[row.id]}
              onChange={(value) => setRequestSubscriptionMap((prev) => ({ ...prev, [row.id]: value }))}
            />
            <Button
              type="primary"
              onClick={() => handleApproveRuntimeRequest(row.id)}
              loading={Boolean(requestActionLoading[row.id])}
            >
              {tr('licensingPage.control.actions.approveRequest', 'Approve')}
            </Button>
          </Space>
        );
      },
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
      key: 'control-plane',
      label: tr('licensingPage.tabs.controlPlane', 'Control-plane queue'),
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {!cpAvailable ? (
            <Alert
              type="info"
              showIcon
              message={tr('licensingPage.control.unavailableTitle', 'Control-plane API unavailable')}
              description={tr('licensingPage.control.unavailableDescription', 'This environment does not expose cp/* endpoints or current user has no access.')}
            />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Card>
                    <Statistic
                      title={tr('licensingPage.control.cards.customers', 'Customers')}
                      value={cpCustomers.length}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card>
                    <Statistic
                      title={tr('licensingPage.control.cards.unlicensedDeployments', 'Unlicensed deployments')}
                      value={cpUnlicensedDeployments.length}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card>
                    <Statistic
                      title={tr('licensingPage.control.cards.runtimeQueue', 'Runtime queue')}
                      value={cpUnlicensedRequests.length}
                    />
                  </Card>
                </Col>
              </Row>

              <Card title={tr('licensingPage.control.unlicensed.title', 'Installations without license')}>
                <Table
                  rowKey={(row) => row.id}
                  dataSource={cpUnlicensedDeployments}
                  columns={unlicensedDeploymentColumns}
                  loading={cpLoading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1300 }}
                  locale={{ emptyText: tr('licensingPage.control.unlicensed.empty', 'No unlicensed deployments') }}
                />
              </Card>

              <Card title={tr('licensingPage.control.requests.title', 'Runtime requests without issued license')}>
                <Table
                  rowKey={(row) => row.id}
                  dataSource={cpUnlicensedRequests}
                  columns={unlicensedRequestColumns}
                  loading={cpLoading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1500 }}
                  locale={{ emptyText: tr('licensingPage.control.requests.empty', 'No pending runtime requests') }}
                />
              </Card>
            </>
          )}
        </Space>
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
          <Button icon={<ReloadOutlined />} onClick={loadControlPlaneData} loading={cpLoading}>
            {tr('actions.refreshControl', 'Refresh control-plane')}
          </Button>
        </Space>
      </Card>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
      <Drawer
        title={tr('licensingPage.control.customerDetail.title', 'Customer details')}
        width={860}
        open={customerDrawerOpen}
        onClose={() => setCustomerDrawerOpen(false)}
      >
        {customerDrawerLoading ? (
          <Text type="secondary">{tr('common.loading', 'Loading...')}</Text>
        ) : !customerDetail ? (
          <Empty description={tr('licensingPage.control.customerDetail.empty', 'No customer details')} />
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card>
              <Descriptions column={1} size="small">
                <Descriptions.Item label={tr('licensingPage.info.customer', 'Customer')}>
                  {customerDetail?.customer?.legal_name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={tr('licensingPage.control.customerDetail.code', 'Customer code')}>
                  <Text code>{customerDetail?.customer?.code || '-'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={tr('licensingPage.control.customerDetail.email', 'Contact email')}>
                  {customerDetail?.customer?.contact_email || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title={tr('licensingPage.control.customerDetail.deployments', 'Deployments')}>
              <Table
                rowKey={(row) => row.id}
                dataSource={normalizeCollection(customerDetail?.deployments)}
                pagination={{ pageSize: 6 }}
                columns={[
                  { title: tr('licensingPage.control.customerDetail.instance', 'Instance'), dataIndex: 'instance_id', key: 'instance_id', render: (v) => <Text code>{v}</Text> },
                  { title: tr('licensingPage.control.customerDetail.environment', 'Environment'), dataIndex: 'environment', key: 'environment', render: (v) => String(v || '').toUpperCase() },
                  { title: tr('licensingPage.control.customerDetail.license', 'License'), key: 'license', render: (_, row) => row?.has_active_license ? <Tag color="success">ACTIVE</Tag> : <Tag color="warning">MISSING</Tag> },
                  { title: tr('licensingPage.control.customerDetail.lastIssued', 'Last issued'), key: 'last_license', render: (_, row) => formatDate(row?.last_license?.issued_at) },
                ]}
              />
            </Card>

            <Card title={tr('licensingPage.control.customerDetail.subscriptions', 'Subscriptions')}>
              <Table
                rowKey={(row) => row.id}
                dataSource={normalizeCollection(customerDetail?.subscriptions)}
                pagination={{ pageSize: 6 }}
                columns={[
                  { title: tr('licensingPage.info.plan', 'Plan'), dataIndex: 'plan_code', key: 'plan_code' },
                  { title: tr('licensingPage.control.customerDetail.subStatus', 'Status'), dataIndex: 'status', key: 'status', render: (v) => <Tag color={v === 'active' ? 'success' : 'default'}>{v}</Tag> },
                  { title: tr('licensingPage.info.validFrom', 'Valid from'), dataIndex: 'valid_from', key: 'valid_from', render: (v) => formatDate(v) },
                  { title: tr('licensingPage.info.expiresAt', 'Expires at'), dataIndex: 'valid_to', key: 'valid_to', render: (v) => formatDate(v) },
                ]}
              />
            </Card>
          </Space>
        )}
      </Drawer>
    </Space>
  );
}
