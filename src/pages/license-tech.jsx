import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  CopyOutlined,
  HistoryOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  getLicenseChallenge,
  getLicenseEntitlements,
  getLicenseEvents,
  installLicenseArtifact,
  verifyLicenseArtifact,
} from '../lib/api/license.js';
import { persistLicenseState } from '../lib/api/licenseState.js';
import { useTheme } from '../lib/hooks/useTheme.js';
import { t } from '../lib/i18n/index.js';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const LICENSE_FEATURE_STORAGE_KEY = 'enterprise_crm_license_features';

function tr(key, fallback, vars = {}) {
  const localized = t(key, vars);
  return localized === key ? fallback : localized;
}

function formatDate(value) {
  if (!value) return '—';
  const parsed = dayjs(value);
  if (!parsed.isValid()) return '—';
  return parsed.format('DD.MM.YYYY HH:mm');
}

function formatRemainingDays(validTo) {
  if (!validTo) return null;
  const parsed = dayjs(validTo);
  if (!parsed.isValid()) return null;
  return parsed.endOf('day').diff(dayjs(), 'day');
}

function getStatusTag(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') return { color: 'success', text: tr('licenseTechPage.status.active', 'Active') };
  if (normalized === 'grace') return { color: 'warning', text: tr('licenseTechPage.status.grace', 'Grace period') };
  if (normalized === 'expired') return { color: 'error', text: tr('licenseTechPage.status.expired', 'Expired') };
  if (normalized === 'revoked') return { color: 'error', text: tr('licenseTechPage.status.revoked', 'Revoked') };
  if (normalized === 'invalid') return { color: 'error', text: tr('licenseTechPage.status.invalid', 'Invalid') };
  if (normalized === 'missing') return { color: 'default', text: tr('licenseTechPage.status.missing', 'Not installed') };
  return { color: 'default', text: normalized || tr('licenseTechPage.status.unknown', 'Unknown') };
}

function getStatusAlert(entitlements, remainingDays) {
  const status = String(entitlements?.status || '').toLowerCase();

  if (status === 'grace') {
    return {
      type: 'warning',
      message: tr('licenseTechPage.alert.graceTitle', 'License is in grace period'),
      description: tr(
        'licenseTechPage.alert.graceDescription',
        'Core operations remain available temporarily. Renew license to avoid interruption.',
      ),
    };
  }

  if (status === 'expired') {
    return {
      type: 'error',
      message: tr('licenseTechPage.alert.expiredTitle', 'License has expired'),
      description: tr(
        'licenseTechPage.alert.expiredDescription',
        'Some functions may be unavailable. Renew the license to restore full access.',
      ),
    };
  }

  if (status === 'revoked') {
    return {
      type: 'error',
      message: tr('licenseTechPage.alert.revokedTitle', 'License has been revoked'),
      description: tr(
        'licenseTechPage.alert.revokedDescription',
        'Current artifact is invalid. Issue a new signed artifact from control-plane.',
      ),
    };
  }

  if (status === 'invalid') {
    return {
      type: 'error',
      message: tr('licenseTechPage.alert.invalidTitle', 'License validation failed'),
      description: tr(
        'licenseTechPage.alert.invalidDescription',
        'Signature, binding, or heartbeat checks failed. Reinstall a valid artifact and confirm runtime identity.',
      ),
    };
  }

  if (!entitlements?.installed || status === 'missing') {
    return {
      type: 'info',
      message: tr('licenseTechPage.alert.missingTitle', 'License is not installed'),
      description: tr(
        'licenseTechPage.alert.missingDescription',
        'Generate a challenge, get a signed artifact from control-plane, verify it here, then install it.',
      ),
    };
  }

  if (remainingDays !== null && remainingDays <= 30) {
    return {
      type: 'warning',
      message: tr('licenseTechPage.alert.expiringTitle', 'License expires soon'),
      description: tr(
        'licenseTechPage.alert.expiringDescription',
        'Recommended: renew in advance to avoid downtime.',
      ),
    };
  }

  return {
    type: 'success',
    message: tr('licenseTechPage.alert.activeTitle', 'License is active'),
    description: tr('licenseTechPage.alert.activeDescription', 'No blocking restrictions detected.'),
  };
}

function getActionState(entitlements, remainingDays) {
  const status = String(entitlements?.status || '').toLowerCase();
  const expiringSoon = remainingDays !== null && remainingDays <= 30;

  if (status === 'revoked' || status === 'invalid') {
    return {
      renewDisabled: false,
      renewType: 'primary',
      renewHint: tr(
        'licenseTechPage.actions.reinstallHint',
        'Install a newly signed artifact after verifying runtime binding and control-plane issuance.',
      ),
      upgradeType: 'default',
    };
  }

  if (status === 'expired' || status === 'grace' || status === 'missing' || !entitlements?.installed) {
    return {
      renewDisabled: false,
      renewType: 'primary',
      renewHint: '',
      upgradeType: 'default',
    };
  }

  return {
    renewDisabled: !expiringSoon,
    renewType: expiringSoon ? 'primary' : 'default',
    renewHint: expiringSoon
      ? ''
      : tr('licenseTechPage.actions.renewEarlyHint', 'Renewal opens 30 days before expiration.'),
    upgradeType: 'default',
  };
}

function normalizeFeatures(rawFeatures = []) {
  if (!Array.isArray(rawFeatures)) return [];
  const normalized = new Set();
  rawFeatures.forEach((feature) => {
    const value = String(feature || '').trim().toLowerCase();
    if (!value) return;
    normalized.add(value);
  });
  return Array.from(normalized);
}

function persistLicenseFeatures(rawFeatures = []) {
  const serialized = JSON.stringify(normalizeFeatures(rawFeatures));
  sessionStorage.setItem(LICENSE_FEATURE_STORAGE_KEY, serialized);
  localStorage.removeItem(LICENSE_FEATURE_STORAGE_KEY);
}

function safeJsonParse(rawValue) {
  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function readApiError(error, fallback) {
  const details = error?.details || error?.response?.data || error?.body || {};
  return (
    details?.message ||
    details?.detail ||
    details?.error ||
    error?.message ||
    fallback
  );
}

export default function LicenseTechPage() {
  const { message } = App.useApp();
  const [artifactForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entitlements, setEntitlements] = useState(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengePayload, setChallengePayload] = useState(null);
  const [activationOpen, setActivationOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [verifyResult, setVerifyResult] = useState(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const shell = isDark
    ? {
        border: 'rgba(245, 158, 11, 0.38)',
        background: 'linear-gradient(180deg, rgba(69, 43, 12, 0.96), rgba(33, 22, 8, 0.94))',
        title: '#fff7ed',
        text: '#fde68a',
        meta: '#fbbf24',
      }
    : {
        border: 'rgba(217, 119, 6, 0.26)',
        background: 'linear-gradient(180deg, rgba(255, 251, 235, 0.98), rgba(255, 247, 214, 0.94))',
        title: '#7c2d12',
        text: '#9a3412',
        meta: '#b45309',
      };

  const loadEntitlements = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getLicenseEntitlements();
      setEntitlements(response || null);
      persistLicenseState(response || {});
      persistLicenseFeatures(response?.features || []);
    } catch (err) {
      setError(readApiError(err, tr('licenseTechPage.errors.loadFailed', 'Failed to load license details.')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntitlements();
  }, []);

  const seatUsage = entitlements?.seat_usage || null;
  const remainingDays = useMemo(() => formatRemainingDays(entitlements?.valid_to), [entitlements?.valid_to]);
  const statusTag = useMemo(() => getStatusTag(entitlements?.status), [entitlements?.status]);
  const statusAlert = useMemo(() => getStatusAlert(entitlements, remainingDays), [entitlements, remainingDays]);
  const actionState = useMemo(() => getActionState(entitlements, remainingDays), [entitlements, remainingDays]);
  const challengeText = challengePayload ? formatJson(challengePayload) : '';

  const handleCopy = async (value, successText) => {
    try {
      await navigator.clipboard.writeText(String(value || ''));
      message.success(successText);
    } catch {
      message.error(tr('licenseTechPage.errors.copyFailed', 'Failed to copy value.'));
    }
  };

  const openActivationModal = () => {
    setVerifyResult(null);
    setActivationOpen(true);
  };

  const loadChallenge = async () => {
    setChallengeLoading(true);
    try {
      const response = await getLicenseChallenge();
      setChallengePayload(response || null);
      message.success(tr('licenseTechPage.messages.challengeLoaded', 'Activation challenge generated.'));
    } catch (err) {
      message.error(readApiError(err, tr('licenseTechPage.errors.challengeFailed', 'Failed to generate challenge.')));
    } finally {
      setChallengeLoading(false);
    }
  };

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const response = await getLicenseEvents();
      setEvents(Array.isArray(response) ? response : []);
    } catch (err) {
      message.error(readApiError(err, tr('licenseTechPage.errors.eventsFailed', 'Failed to load license audit events.')));
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const openEventsDrawer = async () => {
    setEventsOpen(true);
    await loadEvents();
  };

  const readArtifactForm = async () => {
    const values = await artifactForm.validateFields();
    const payload = safeJsonParse(values.payload_json);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error(tr('licenseTechPage.errors.payloadInvalid', 'Payload must be a valid JSON object.'));
    }
    return {
      payload,
      signature: String(values.signature || '').trim(),
    };
  };

  const handleVerify = async () => {
    setVerifyResult(null);
    try {
      const { payload, signature } = await readArtifactForm();
      setVerifying(true);
      const response = await verifyLicenseArtifact(payload, signature);
      setVerifyResult(response);
      if (response?.valid_signature) {
        message.success(tr('licenseTechPage.messages.verifySuccess', 'License artifact signature is valid.'));
      } else {
        message.warning(tr('licenseTechPage.messages.verifyInvalid', 'License signature is invalid.'));
      }
    } catch (err) {
      const errorMessage = readApiError(err, tr('licenseTechPage.errors.verifyFailed', 'License verification failed.'));
      setVerifyResult({ valid_signature: false, error: errorMessage });
      message.error(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleInstall = async () => {
    try {
      const { payload, signature } = await readArtifactForm();
      setInstalling(true);
      const response = await installLicenseArtifact(payload, signature);
      message.success(
        response?.license_id
          ? tr('licenseTechPage.messages.installSuccessWithId', 'License installed: {id}', { id: response.license_id })
          : tr('licenseTechPage.messages.installSuccess', 'License installed successfully.'),
      );
      setActivationOpen(false);
      setVerifyResult(null);
      await loadEntitlements();
    } catch (err) {
      message.error(readApiError(err, tr('licenseTechPage.errors.installFailed', 'Failed to install license artifact.')));
    } finally {
      setInstalling(false);
    }
  };

  const handleArtifactPaste = async () => {
    try {
      const raw = await navigator.clipboard.readText();
      const parsed = safeJsonParse(raw);
      if (parsed && typeof parsed === 'object' && parsed.payload && parsed.signature) {
        artifactForm.setFieldsValue({
          payload_json: formatJson(parsed.payload),
          signature: String(parsed.signature || ''),
        });
        message.success(tr('licenseTechPage.messages.clipboardParsed', 'Artifact pasted from clipboard.'));
        return;
      }
      message.warning(tr('licenseTechPage.messages.clipboardUnsupported', 'Clipboard content does not contain payload and signature.'));
    } catch {
      message.error(tr('licenseTechPage.errors.clipboardFailed', 'Failed to read clipboard.'));
    }
  };

  const eventColumns = [
    {
      title: tr('licenseTechPage.events.type', 'Event'),
      dataIndex: 'event_type',
      key: 'event_type',
      render: (value) => <Text code>{value || '—'}</Text>,
    },
    {
      title: tr('licenseTechPage.events.severity', 'Severity'),
      dataIndex: 'severity',
      key: 'severity',
      render: (value) => {
        const severity = String(value || '').toLowerCase();
        const color = severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'default';
        return <Tag color={color}>{severity || 'info'}</Tag>;
      },
    },
    {
      title: tr('licenseTechPage.events.createdAt', 'Created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value) => formatDate(value),
    },
    {
      title: tr('licenseTechPage.events.details', 'Details'),
      dataIndex: 'details',
      key: 'details',
      render: (value) => (
        <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap', maxWidth: 460 }}>
          {value && Object.keys(value).length ? formatJson(value) : '—'}
        </Paragraph>
      ),
    },
  ];

  if (loading) {
    return (
      <Card variant="borderless">
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="borderless">
        <Alert
          type="error"
          showIcon
          message={tr('licenseTechPage.errors.loadTitle', 'Failed to load license details')}
          description={error}
          action={(
            <Button type="primary" onClick={loadEntitlements}>
              {tr('actions.retry', 'Retry')}
            </Button>
          )}
          style={{
            borderRadius: 16,
            border: '1px solid rgba(255, 77, 79, 0.28)',
            background: isDark ? 'rgba(47, 18, 24, 0.92)' : '#fff1f0',
          }}
        />
      </Card>
    );
  }

  const utilizationPercent = typeof seatUsage?.utilization_percent === 'number' ? seatUsage.utilization_percent : null;
  const usageStrokeColor = seatUsage?.over_limit ? '#ff4d4f' : '#1677ff';

  return (
    <>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card variant="borderless">
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Title level={3} style={{ margin: 0 }}>
              {tr('licenseTechPage.title', 'License Technical Information')}
            </Title>
            <Text type="secondary">
              {tr(
                'licenseTechPage.subtitle',
                'Admin-only page. Displays current license, seat usage, challenge-response activation, and audit events.',
              )}
            </Text>
          </Space>
        </Card>

        <div
          style={{
            padding: 1,
            borderRadius: 16,
            border: `1px solid ${shell.border}`,
            background: shell.background,
            boxShadow: isDark ? '0 16px 32px rgba(0, 0, 0, 0.34)' : '0 14px 28px rgba(217, 119, 6, 0.12)',
          }}
        >
          <Alert
            type={statusAlert.type}
            showIcon
            message={<div style={{ color: shell.title, fontWeight: 700 }}>{statusAlert.message}</div>}
            description={(
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <div style={{ color: shell.text, lineHeight: 1.55 }}>{statusAlert.description}</div>
                <div style={{ color: shell.meta, fontSize: 12, lineHeight: 1.45 }}>
                  {tr(
                    'licenseTechPage.alert.helper',
                    'Seat and lifecycle states are surfaced here before they affect protected CRM modules.',
                  )}
                </div>
              </Space>
            )}
            action={(
              <Space wrap>
                <Button type={actionState.upgradeType} onClick={loadChallenge} loading={challengeLoading}>
                  {tr('licenseTechPage.actions.generateChallenge', 'Generate challenge')}
                </Button>
                <Button type={actionState.renewType} disabled={actionState.renewDisabled} onClick={openActivationModal}>
                  {tr('licenseTechPage.actions.installArtifact', 'Verify / install artifact')}
                </Button>
                <Button icon={<HistoryOutlined />} onClick={openEventsDrawer}>
                  {tr('licenseTechPage.actions.openEvents', 'Audit events')}
                </Button>
              </Space>
            )}
            style={{ background: 'transparent', border: 'none' }}
          />
        </div>

        {actionState.renewHint ? (
          <Text type="secondary" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
            {actionState.renewHint}
          </Text>
        ) : null}

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card variant="borderless">
              <Space direction="vertical" size={4}>
                <Text type="secondary">{tr('licenseTechPage.fields.status', 'Status')}</Text>
                <Tag color={statusTag.color}>{statusTag.text}</Tag>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card variant="borderless">
              <Space direction="vertical" size={4}>
                <Text type="secondary">{tr('licenseTechPage.fields.remainingDays', 'Days remaining')}</Text>
                <Title level={3} style={{ margin: 0 }}>
                  {remainingDays === null ? '—' : remainingDays}
                </Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card variant="borderless">
              <Space direction="vertical" size={4}>
                <Text type="secondary">{tr('licenseTechPage.fields.planCode', 'Plan')}</Text>
                <Title level={4} style={{ margin: 0 }}>{entitlements?.plan_code || '—'}</Title>
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card variant="borderless" title={tr('licenseTechPage.sections.details', 'License details')}>
              <Descriptions size="small" column={1} styles={{ label: { width: 210 } }}>
                <Descriptions.Item label={tr('licenseTechPage.fields.licenseId', 'License ID')}>
                  {entitlements?.license_id || '—'}
                </Descriptions.Item>
                <Descriptions.Item label={tr('licenseTechPage.fields.customer', 'Customer')}>
                  {entitlements?.customer_name || '—'}
                </Descriptions.Item>
                <Descriptions.Item label={tr('licenseTechPage.fields.instanceId', 'Instance ID')}>
                  <Space size={8} wrap>
                    <Text code>{entitlements?.instance_id || '—'}</Text>
                    {entitlements?.instance_id ? (
                      <Button
                        size="small"
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(entitlements.instance_id, tr('licenseTechPage.messages.instanceCopied', 'Instance ID copied.'))}
                      />
                    ) : null}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={tr('licenseTechPage.fields.validFrom', 'Valid from')}>
                  {formatDate(entitlements?.valid_from)}
                </Descriptions.Item>
                <Descriptions.Item label={tr('licenseTechPage.fields.validTo', 'Valid to')}>
                  {formatDate(entitlements?.valid_to)}
                </Descriptions.Item>
                <Descriptions.Item label={tr('licenseTechPage.fields.graceUntil', 'Grace until')}>
                  {formatDate(entitlements?.grace_until)}
                </Descriptions.Item>
                <Descriptions.Item label={tr('licenseTechPage.fields.lastValidationAt', 'Last validation')}>
                  {formatDate(entitlements?.last_validation_at)}
                </Descriptions.Item>
                <Descriptions.Item label={tr('licenseTechPage.fields.lastHeartbeatAt', 'Last heartbeat')}>
                  {formatDate(entitlements?.last_heartbeat_at)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card variant="borderless" title={tr('licenseTechPage.sections.seats', 'Seat usage')}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label={tr('licenseTechPage.fields.seatUsed', 'Used seats')}>
                    {seatUsage?.used ?? '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('licenseTechPage.fields.seatLimit', 'Seat limit')}>
                    {seatUsage?.limit ?? '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label={tr('licenseTechPage.fields.seatAvailable', 'Seats available')}>
                    {seatUsage?.available ?? '—'}
                  </Descriptions.Item>
                </Descriptions>
                <Progress
                  percent={utilizationPercent || 0}
                  status={seatUsage?.over_limit ? 'exception' : 'active'}
                  strokeColor={usageStrokeColor}
                  size={10}
                  format={() => (utilizationPercent === null ? '—' : `${utilizationPercent}%`)}
                />
                {seatUsage?.over_limit ? (
                  <Alert
                    type="error"
                    showIcon
                    message={tr('licenseTechPage.alert.overLimitTitle', 'Seat limit exceeded')}
                    description={tr(
                      'licenseTechPage.alert.overLimitDescription',
                      'Active users exceed your seat limit. Upgrade or reduce active accounts.',
                    )}
                  />
                ) : null}
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card
              variant="borderless"
              title={tr('licenseTechPage.sections.challenge', 'Activation challenge')}
              extra={(
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadChallenge}
                    loading={challengeLoading}
                  >
                    {tr('licenseTechPage.actions.refreshChallenge', 'Refresh')}
                  </Button>
                  <Button
                    icon={<CopyOutlined />}
                    disabled={!challengePayload}
                    onClick={() => handleCopy(challengeText, tr('licenseTechPage.messages.challengeCopied', 'Challenge copied.'))}
                  >
                    {tr('licenseTechPage.actions.copyChallenge', 'Copy')}
                  </Button>
                </Space>
              )}
            >
              {challengePayload ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Alert
                    type="info"
                    showIcon
                    message={tr('licenseTechPage.challenge.title', 'Send this challenge to control-plane')}
                    description={tr(
                      'licenseTechPage.challenge.description',
                      'The response should be a signed artifact with payload and signature for this exact runtime instance.',
                    )}
                  />
                  <TextArea value={challengeText} rows={10} readOnly />
                </Space>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={tr(
                    'licenseTechPage.challenge.empty',
                    'Generate a challenge to start offline activation for this CRM instance.',
                  )}
                >
                  <Button type="primary" onClick={loadChallenge} loading={challengeLoading}>
                    {tr('licenseTechPage.actions.generateChallenge', 'Generate challenge')}
                  </Button>
                </Empty>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card
              variant="borderless"
              title={tr('licenseTechPage.sections.workflow', 'Artifact workflow')}
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Alert
                  type="success"
                  showIcon
                  message={tr('licenseTechPage.workflow.step1', '1. Generate challenge')}
                  description={tr(
                    'licenseTechPage.workflow.step1Description',
                    'Use the current runtime instance ID and challenge JSON to request a signed artifact from control-plane.',
                  )}
                />
                <Alert
                  type="warning"
                  showIcon
                  message={tr('licenseTechPage.workflow.step2', '2. Verify artifact before install')}
                  description={tr(
                    'licenseTechPage.workflow.step2Description',
                    'Paste payload and signature into the activation dialog, verify signature first, then install.',
                  )}
                />
                <Alert
                  type="info"
                  showIcon
                  message={tr('licenseTechPage.workflow.step3', '3. Inspect audit events')}
                  description={tr(
                    'licenseTechPage.workflow.step3Description',
                    'Review install, validation, tamper, heartbeat, and overage events without leaving the CRM.',
                  )}
                />
                <Space wrap>
                  <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={openActivationModal}>
                    {tr('licenseTechPage.actions.openActivation', 'Open activation dialog')}
                  </Button>
                  <Button icon={<HistoryOutlined />} onClick={openEventsDrawer}>
                    {tr('licenseTechPage.actions.openEvents', 'Audit events')}
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>

      <Modal
        title={tr('licenseTechPage.modal.activationTitle', 'Verify and install signed artifact')}
        open={activationOpen}
        onCancel={() => setActivationOpen(false)}
        width={860}
        destroyOnHidden={false}
        getContainer={false}
        footer={(
          <Space wrap>
            <Button onClick={handleArtifactPaste}>
              {tr('licenseTechPage.actions.pasteArtifact', 'Paste artifact from clipboard')}
            </Button>
            <Button onClick={handleVerify} loading={verifying}>
              {tr('licenseTechPage.actions.verifyArtifact', 'Verify')}
            </Button>
            <Button type="primary" onClick={handleInstall} loading={installing}>
              {tr('licenseTechPage.actions.installArtifact', 'Install')}
            </Button>
          </Space>
        )}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message={tr('licenseTechPage.modal.activationHelperTitle', 'Expected clipboard format')}
            description={tr(
              'licenseTechPage.modal.activationHelperDescription',
              'You can paste an object like {"payload": {...}, "signature": "..."} or fill the fields manually.',
            )}
          />
          {verifyResult ? (
            <Alert
              type={verifyResult?.valid_signature ? 'success' : 'error'}
              showIcon
              message={
                verifyResult?.valid_signature
                  ? tr('licenseTechPage.messages.verifySuccess', 'License artifact signature is valid.')
                  : tr('licenseTechPage.messages.verifyInvalid', 'License signature is invalid.')
              }
              description={verifyResult?.error || null}
            />
          ) : null}
          <Form
            form={artifactForm}
            layout="vertical"
            initialValues={{ payload_json: '', signature: '' }}
          >
            <Form.Item
              name="payload_json"
              label={tr('licenseTechPage.form.payload', 'Payload JSON')}
              rules={[
                { required: true, message: tr('licenseTechPage.validation.payloadRequired', 'Paste payload JSON.') },
                {
                  validator: async (_, value) => {
                    const parsed = safeJsonParse(value);
                    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                      throw new Error(tr('licenseTechPage.validation.payloadObject', 'Payload must be a valid JSON object.'));
                    }
                  },
                },
              ]}
            >
              <TextArea rows={12} placeholder='{"license_id":"...","features":["platform.core"]}' />
            </Form.Item>
            <Form.Item
              name="signature"
              label={tr('licenseTechPage.form.signature', 'Signature')}
              rules={[{ required: true, message: tr('licenseTechPage.validation.signatureRequired', 'Paste the artifact signature.') }]}
            >
              <TextArea rows={4} placeholder={tr('licenseTechPage.form.signaturePlaceholder', 'Base64 signature from control-plane signer')} />
            </Form.Item>
          </Form>
        </Space>
      </Modal>

      <Drawer
        title={tr('licenseTechPage.drawer.eventsTitle', 'License audit events')}
        placement="right"
        width={760}
        open={eventsOpen}
        onClose={() => setEventsOpen(false)}
        getContainer={false}
        extra={(
          <Button icon={<ReloadOutlined />} onClick={loadEvents} loading={eventsLoading}>
            {tr('actions.refresh', 'Refresh')}
          </Button>
        )}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message={tr('licenseTechPage.events.helperTitle', 'Recent licensing timeline')}
            description={tr(
              'licenseTechPage.events.helperDescription',
              'Use these events to diagnose install failures, heartbeat drift, signature errors, or seat overages.',
            )}
          />
          <Table
            rowKey={(row) => row.id}
            columns={eventColumns}
            dataSource={events}
            loading={eventsLoading}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 720 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={tr('licenseTechPage.events.empty', 'No license events found.')}
                />
              ),
            }}
          />
        </Space>
      </Drawer>
    </>
  );
}
