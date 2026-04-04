import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Collapse,
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
  Steps,
  Upload,
  Select,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  CopyOutlined,
  HistoryOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getLicenseChallenge,
  getLicenseEntitlements,
  getLicenseEvents,
  getLicenseUxSummary,
  installLicenseBundle,
  installLicenseArtifact,
  requestLicenseFromControlPlane,
  verifyLicenseArtifact,
} from '../lib/api/license.js';
import { persistLicenseState } from '../lib/api/licenseState.js';
import { persistLicenseFeatures } from '../lib/api/licenseFeatures.js';
import { useLicenseRequestFlow } from '../lib/hooks/useLicenseRequestFlow.js';
import { useTheme } from '../lib/hooks/useTheme.js';
import { t } from '../lib/i18n/index.js';
import LicenseActionCenter from '../components/licensing/LicenseActionCenter.jsx';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function tr(key, fallback, vars = {}) {
  const localized = t(key, vars);
  if (localized !== key) return localized;
  let result = String(fallback || '');
  for (const [name, value] of Object.entries(vars || {})) {
    result = result.replaceAll(`{${name}}`, String(value));
  }
  return result;
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

function isJsonObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function extractArtifactEnvelope(value) {
  if (!isJsonObject(value) || !isJsonObject(value.payload)) return null;
  const signature = String(value.signature || '').trim();
  if (!signature) return null;
  return {
    payload: value.payload,
    signature,
  };
}

function buildArtifactFingerprint(payload, signature) {
  if (!isJsonObject(payload)) return '';
  const normalizedSignature = String(signature || '').trim();
  if (!normalizedSignature) return '';
  return `${JSON.stringify(payload)}::${normalizedSignature}`;
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

export default function LicenseWorkspacePage() {
  const { message } = App.useApp();
  const [artifactForm] = Form.useForm();
  const [requestForm] = Form.useForm();
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
  const [uxSummary, setUxSummary] = useState(null);
  const [uxSummaryLoading, setUxSummaryLoading] = useState(false);
  const [bundleFile, setBundleFile] = useState(null);
  const [bundleInstalling, setBundleInstalling] = useState(false);
  const [activationStatus, setActivationStatus] = useState({
    type: 'info',
    message: tr('licenseTechPage.modal.activationHelperTitle', 'Expected clipboard format'),
    description: tr(
      'licenseTechPage.modal.activationHelperDescription',
      'Paste an object like {"payload": {...}, "signature": "..."} or fill the fields manually.',
    ),
  });
  const [verifiedFingerprint, setVerifiedFingerprint] = useState('');
  const { theme } = useTheme();
  const wizardCardRef = useRef(null);
  const isDark = theme === 'dark';
  const payloadJsonValue = Form.useWatch('payload_json', artifactForm);
  const signatureValue = Form.useWatch('signature', artifactForm);

  const parsedPayloadValue = useMemo(() => safeJsonParse(payloadJsonValue), [payloadJsonValue]);
  const signatureTrimmed = useMemo(() => String(signatureValue || '').trim(), [signatureValue]);
  const parsedArtifactEnvelope = useMemo(
    () => extractArtifactEnvelope(parsedPayloadValue),
    [parsedPayloadValue],
  );
  const effectivePayloadValue = parsedArtifactEnvelope?.payload || parsedPayloadValue;
  const effectiveSignatureValue = signatureTrimmed || parsedArtifactEnvelope?.signature || '';
  const currentArtifactFingerprint = useMemo(
    () => buildArtifactFingerprint(effectivePayloadValue, effectiveSignatureValue),
    [effectivePayloadValue, effectiveSignatureValue],
  );
  const canInstall = useMemo(
    () => Boolean(verifiedFingerprint) && currentArtifactFingerprint === verifiedFingerprint,
    [currentArtifactFingerprint, verifiedFingerprint],
  );

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

  const syncLicenseSessionState = useCallback((response) => {
    persistLicenseState(response || {});
    persistLicenseFeatures(response?.features || []);
  }, []);

  const loadUxSummary = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setUxSummaryLoading(true);
    try {
      const response = await getLicenseUxSummary();
      setUxSummary(response || null);
      return response || null;
    } catch {
      if (!silent) setUxSummary(null);
      return null;
    } finally {
      if (!silent) setUxSummaryLoading(false);
    }
  }, []);

  const loadEntitlements = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const response = await getLicenseEntitlements();
      setEntitlements(response || null);
      syncLicenseSessionState(response || {});
      loadUxSummary({ silent: true });
      return response || null;
    } catch (err) {
      if (!silent) {
        setError(readApiError(err, tr('licenseTechPage.errors.loadFailed', 'Failed to load license details.')));
      }
      return null;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [loadUxSummary, syncLicenseSessionState]);

  const {
    pendingRequest,
    rejectedRequest,
    requestLoading: onlineRequestLoading,
    polling: pendingPolling,
    requestOnline,
    pollNow,
    resumePolling,
    pausePolling,
    clearRequestState,
  } = useLicenseRequestFlow({
    requestLicense: requestLicenseFromControlPlane,
    reloadEntitlements: () => loadEntitlements({ silent: true }),
    isInstalled: Boolean(entitlements?.installed),
    onPollingLimitReached: () => {
      message.warning(
        tr(
          'licenseTechPage.messages.onlinePollingStopped',
          'Automatic status checks paused. Continue from "Check now".',
        ),
      );
    },
  });

  const canManageLicense = uxSummary?.permissions?.can_manage_license ?? true;
  const recommendedFlow = uxSummary?.recommended_flow || null;
  const blockingReasons = Array.isArray(uxSummary?.blocking_reasons) ? uxSummary.blocking_reasons : [];
  const autoRequestHost = String(uxSummary?.auto_request?.control_plane_host || '').trim();

  const showRejectedMessage = useCallback((state) => {
    message.error(
      String(state?.message || '').trim()
      || tr(
        'licenseTechPage.messages.onlineRejected',
        'Control-plane rejected the request. Review deployment binding and submit again.',
      ),
    );
  }, [message, tr]);

  const pollPendingOnlineRequest = useCallback(async ({ manual = false } = {}) => {
    const result = await pollNow({ manual });
    if (result.type === 'installed') {
      message.success(
        tr('licenseTechPage.messages.onlineInstallDone', 'License approved and installed from control-plane.'),
      );
      return result;
    }
    if (result.type === 'pending' && manual) {
      message.info(
        tr(
          'licenseTechPage.messages.onlineStillPending',
          'Request is still pending control-plane approval.',
        ),
      );
      return result;
    }
    if (result.type === 'rejected') {
      showRejectedMessage(result.state);
      return result;
    }
    if (result.type === 'error' && manual) {
      message.error(
        readApiError(
          result.error,
          tr('licenseTechPage.errors.onlinePollFailed', 'Failed to check control-plane request status.'),
        ),
      );
    }
    return result;
  }, [message, pollNow, showRejectedMessage, tr]);

  const startPendingPolling = useCallback((seedPending = null) => {
    if (seedPending) {
      resumePolling(seedPending);
      return;
    }
    resumePolling();
  }, [resumePolling]);

  const stopPendingPolling = useCallback(({ keepPending = true } = {}) => {
    if (keepPending) {
      pausePolling();
      return;
    }
    clearRequestState();
  }, [clearRequestState, pausePolling]);

  const handleOnlineRequest = useCallback(async (requestPayload = {}) => {
    const result = await requestOnline(requestPayload);
    if (result.type === 'installed') {
      message.success(
        tr('licenseTechPage.messages.onlineInstallDone', 'License approved and installed from control-plane.'),
      );
      return;
    }
    if (result.type === 'pending') {
      message.warning(
        tr('licenseTechPage.messages.onlinePending', 'Request sent and waiting for control-plane approval.'),
      );
      return;
    }
    if (result.type === 'rejected') {
      showRejectedMessage(result.state);
      return;
    }
    if (result.type === 'error') {
      message.error(
        readApiError(
          result.error,
          tr('licenseTechPage.errors.onlineRequestFailed', 'Failed to request license from control-plane.'),
        ),
      );
    }
  }, [message, requestOnline, showRejectedMessage, tr]);

  const handleWizardRequestSubmit = useCallback(async () => {
    try {
      const values = await requestForm.validateFields();
      await handleOnlineRequest({
        requested_plan_code: values.requested_plan_code || '',
        contact_name: values.contact_name || '',
        contact_email: values.contact_email || '',
        contact_phone: values.contact_phone || '',
        business_note: values.business_note || '',
      });
    } catch (err) {
      if (!err?.errorFields) {
        message.error(
          readApiError(
            err,
            tr('licenseTechPage.errors.onlineRequestFailed', 'Failed to request license from control-plane.'),
          ),
        );
      }
    }
  }, [handleOnlineRequest, message, requestForm, tr]);

  const handleInstallBundle = useCallback(async () => {
    if (!bundleFile) {
      message.warning(
        tr('licenseTechPage.bundle.selectFirst', 'Сначала выберите файл лицензии (.licb).'),
      );
      return;
    }
    try {
      setBundleInstalling(true);
      const response = await installLicenseBundle(bundleFile);
      message.success(
        response?.license_id
          ? tr('licenseTechPage.messages.installSuccessWithId', 'License installed: {id}', { id: response.license_id })
          : tr('licenseTechPage.messages.installSuccess', 'License installed successfully.'),
      );
      setBundleFile(null);
      await loadEntitlements();
    } catch (err) {
      message.error(
        readApiError(
          err,
          tr('licenseTechPage.bundle.installFailed', 'Не удалось установить bundle файл лицензии.'),
        ),
      );
    } finally {
      setBundleInstalling(false);
    }
  }, [bundleFile, loadEntitlements, message, tr]);

  useEffect(() => {
    loadEntitlements();
  }, [loadEntitlements]);

  useEffect(() => {
    loadUxSummary();
  }, [loadUxSummary]);

  useEffect(() => {
    if (!activationOpen) return;
    if (!parsedArtifactEnvelope) return;

    artifactForm.setFieldsValue({
      payload_json: formatJson(parsedArtifactEnvelope.payload),
      signature: parsedArtifactEnvelope.signature,
    });
    setActivationStatus({
      type: 'info',
      message: tr('licenseTechPage.messages.clipboardParsed', 'Artifact pasted from clipboard.'),
      description: tr(
        'licenseTechPage.messages.clipboardParsedDescription',
        'Run verification to enable installation for this artifact.',
      ),
    });
    setVerifiedFingerprint('');
    message.success(
      tr('licenseTechPage.messages.autoExtractedSignature', 'Signature was auto-filled from artifact JSON.'),
    );
  }, [activationOpen, artifactForm, message, parsedArtifactEnvelope]);

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
    setActivationStatus({
      type: 'info',
      message: tr('licenseTechPage.modal.activationHelperTitle', 'Expected clipboard format'),
      description: tr(
        'licenseTechPage.modal.activationHelperDescription',
        'Paste an object like {"payload": {...}, "signature": "..."} or fill the fields manually.',
      ),
    });
    setVerifiedFingerprint('');
    setActivationOpen(true);
  };

  const openWizardSection = () => {
    if (!wizardCardRef.current) return;
    wizardCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const parsedPayload = safeJsonParse(values.payload_json);
    const envelope = extractArtifactEnvelope(parsedPayload);
    const payload = envelope?.payload || parsedPayload;
    const signature = String(values.signature || '').trim() || envelope?.signature || '';

    if (!isJsonObject(payload)) {
      throw new Error(tr('licenseTechPage.errors.payloadInvalid', 'Payload must be a valid JSON object.'));
    }
    if (!signature) {
      throw new Error(tr('licenseTechPage.validation.signatureRequired', 'Paste the artifact signature.'));
    }
    return {
      payload,
      signature,
    };
  };

  const handleVerify = async () => {
    try {
      const { payload, signature } = await readArtifactForm();
      setVerifying(true);
      const response = await verifyLicenseArtifact(payload, signature);
      if (response?.valid_signature) {
        setVerifiedFingerprint(buildArtifactFingerprint(payload, signature));
        setActivationStatus({
          type: 'success',
          message: tr('licenseTechPage.messages.verifySuccess', 'License artifact signature is valid.'),
          description: tr(
            'licenseTechPage.messages.verifySuccessDescription',
            'Signature matches payload. You can install this artifact now.',
          ),
        });
        message.success(tr('licenseTechPage.messages.verifySuccess', 'License artifact signature is valid.'));
      } else {
        setVerifiedFingerprint('');
        setActivationStatus({
          type: 'error',
          message: tr('licenseTechPage.messages.verifyInvalid', 'License signature is invalid.'),
          description: response?.error
            || tr(
              'licenseTechPage.messages.verifyInvalidDescription',
              'Signature does not match payload. Paste the full artifact from control-plane and verify again.',
            ),
        });
        message.warning(tr('licenseTechPage.messages.verifyInvalid', 'License signature is invalid.'));
      }
    } catch (err) {
      const errorMessage = readApiError(err, tr('licenseTechPage.errors.verifyFailed', 'License verification failed.'));
      setVerifiedFingerprint('');
      setActivationStatus({
        type: 'error',
        message: tr('licenseTechPage.errors.verifyFailed', 'License verification failed.'),
        description: errorMessage,
      });
      message.error(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleInstall = async () => {
    if (!canInstall) {
      message.warning(
        tr(
          'licenseTechPage.messages.installRequiresVerified',
          'Verify the current artifact successfully before install.',
        ),
      );
      return;
    }

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
      setVerifiedFingerprint('');
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
      if (isJsonObject(parsed) && isJsonObject(parsed.payload) && parsed.signature) {
        artifactForm.setFieldsValue({
          payload_json: formatJson(parsed.payload),
          signature: String(parsed.signature || ''),
        });
        setActivationStatus({
          type: 'info',
          message: tr('licenseTechPage.messages.clipboardParsed', 'Artifact pasted from clipboard.'),
          description: tr(
            'licenseTechPage.messages.clipboardParsedDescription',
            'Run verification to enable installation for this artifact.',
          ),
        });
        setVerifiedFingerprint('');
        message.success(tr('licenseTechPage.messages.clipboardParsed', 'Artifact pasted from clipboard.'));
        return;
      }
      setActivationStatus({
        type: 'warning',
        message: tr('licenseTechPage.messages.clipboardUnsupported', 'Clipboard format is not supported.'),
        description: tr(
          'licenseTechPage.messages.clipboardUnsupportedDescription',
          'Expected JSON object with "payload" and "signature" fields.',
        ),
      });
      setVerifiedFingerprint('');
      message.warning(tr('licenseTechPage.messages.clipboardUnsupported', 'Clipboard content does not contain payload and signature.'));
    } catch {
      setActivationStatus({
        type: 'error',
        message: tr('licenseTechPage.errors.clipboardFailed', 'Failed to read clipboard.'),
        description: tr(
          'licenseTechPage.errors.clipboardFailedDescription',
          'Browser blocked clipboard access or clipboard is unavailable.',
        ),
      });
      setVerifiedFingerprint('');
      message.error(tr('licenseTechPage.errors.clipboardFailed', 'Failed to read clipboard.'));
    }
  };

  useEffect(() => {
    if (!verifiedFingerprint) return;
    if (currentArtifactFingerprint && currentArtifactFingerprint === verifiedFingerprint) return;
    setVerifiedFingerprint('');
    setActivationStatus({
      type: 'warning',
      message: tr(
        'licenseTechPage.messages.verifyStale',
        'Artifact changed. Re-verify before install.',
      ),
      description: tr(
        'licenseTechPage.messages.verifyStaleDescription',
        'Payload or signature was edited after successful verification.',
      ),
    });
  }, [currentArtifactFingerprint, verifiedFingerprint]);

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
        <LicenseActionCenter
          summary={uxSummary}
          loading={uxSummaryLoading}
          onRequestLicense={handleOnlineRequest}
          onOpenActivation={openActivationModal}
        />
        {!canManageLicense ? (
          <Alert
            type="info"
            showIcon
            message={tr('licenseTechPage.permissions.title', 'Лицензией управляет администратор')}
            description={tr(
              'licenseTechPage.permissions.description',
              'У вас только просмотр статуса лицензии. Для продления обратитесь к администратору CRM.',
            )}
          />
        ) : null}
        <Card variant="borderless">
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Title level={3} style={{ margin: 0 }}>
              {tr('licenseTechPage.title', 'Лицензия компании')}
            </Title>
            <Text type="secondary">
              {tr(
                'licenseTechPage.subtitle',
                'Проверьте статус лицензии и продлите ее в несколько шагов.',
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
                    'Если нужна помощь, откройте историю действий и отправьте детали в поддержку.',
                  )}
                </div>
              </Space>
            )}
            action={(
              <Space wrap>
                <Button
                  type="primary"
                  onClick={handleOnlineRequest}
                  loading={onlineRequestLoading}
                >
                  {tr('licenseTechPage.actions.onlineRequest', 'Продлить автоматически')}
                </Button>
                <Button
                  type={actionState.renewType}
                  disabled={actionState.renewDisabled}
                  onClick={openWizardSection}
                >
                  {tr('licenseTechPage.actions.openWizard', 'Открыть мастер лицензирования')}
                </Button>
                <Button icon={<HistoryOutlined />} onClick={openEventsDrawer}>
                  {tr('licenseTechPage.actions.openEvents', 'История действий')}
                </Button>
              </Space>
            )}
            style={{ background: 'transparent', border: 'none' }}
          />
        </div>

        {pendingRequest ? (
          <Alert
            type="warning"
            showIcon
            message={tr('licenseTechPage.online.pendingTitle', 'Заявка на продление отправлена')}
            description={pendingRequest?.message || tr(
              'licenseTechPage.online.pendingHint',
              'Ожидаем подтверждение. Можно проверить статус вручную.',
            )}
            action={(
              <Space wrap>
                <Button onClick={() => pollPendingOnlineRequest({ manual: true })}>
                  {tr('licenseTechPage.actions.checkNow', 'Проверить статус')}
                </Button>
                {pendingPolling ? (
                  <Button onClick={() => stopPendingPolling({ keepPending: true })}>
                    {tr('licenseTechPage.actions.pausePolling', 'Остановить авто-проверку')}
                  </Button>
                ) : (
                  <Button onClick={() => startPendingPolling(pendingRequest)}>
                    {tr('licenseTechPage.actions.resumePolling', 'Включить авто-проверку')}
                  </Button>
                )}
              </Space>
            )}
          />
        ) : null}

        {rejectedRequest ? (
          <Alert
            type="error"
            showIcon
            message={tr('licenseTechPage.online.rejectedTitle', 'Заявка отклонена')}
            description={rejectedRequest.message || tr(
              'licenseTechPage.online.rejectedHint',
              'Проверьте данные компании и попробуйте снова.',
            )}
            action={(
              <Button size="small" type="primary" onClick={handleOnlineRequest} loading={onlineRequestLoading}>
                {tr('licenseTechPage.actions.resubmitRequest', 'Отправить повторно')}
              </Button>
            )}
          />
        ) : null}

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card variant="borderless">
              <Space direction="vertical" size={4}>
                <Text type="secondary">{tr('licenseTechPage.fields.status', 'Статус лицензии')}</Text>
                <Tag color={statusTag.color}>{statusTag.text}</Tag>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card variant="borderless">
              <Space direction="vertical" size={4}>
                <Text type="secondary">{tr('licenseTechPage.fields.remainingDays', 'Дней до окончания')}</Text>
                <Title level={3} style={{ margin: 0 }}>
                  {remainingDays === null ? '—' : remainingDays}
                </Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card variant="borderless">
              <Space direction="vertical" size={4}>
                <Text type="secondary">{tr('licenseTechPage.fields.planCode', 'Тариф')}</Text>
                <Title level={4} style={{ margin: 0 }}>{entitlements?.plan_code || '—'}</Title>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card variant="borderless" title={tr('licenseTechPage.sections.workflow', 'Как продлить лицензию')}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Steps
              direction="vertical"
              size="small"
              items={[
                {
                  title: tr('licenseTechPage.workflow.simpleStep1', '1. Нажмите «Продлить автоматически»'),
                  description: tr(
                    'licenseTechPage.workflow.simpleStep1Description',
                    'Это самый простой путь. Система сама запросит и установит лицензию после подтверждения.',
                  ),
                },
                {
                  title: tr('licenseTechPage.workflow.simpleStep2', '2. Если авто-режим не подходит, используйте файл'),
                  description: tr(
                    'licenseTechPage.workflow.simpleStep2Description',
                    'Скачайте подписанный .licb файл в control-plane и установите его в мастере ниже.',
                  ),
                },
                {
                  title: tr('licenseTechPage.workflow.simpleStep3', '3. При ошибке откройте историю'),
                  description: tr(
                    'licenseTechPage.workflow.simpleStep3Description',
                    'История покажет причину и поможет поддержке быстрее решить вопрос.',
                  ),
                },
              ]}
            />
            <Space wrap>
              <Button onClick={loadChallenge} loading={challengeLoading} icon={<ReloadOutlined />}>
                {tr('licenseTechPage.actions.generateChallenge', 'Сформировать код запроса')}
              </Button>
              <Button
                icon={<CopyOutlined />}
                disabled={!challengePayload}
                onClick={() => handleCopy(challengeText, tr('licenseTechPage.messages.challengeCopied', 'Код запроса скопирован.'))}
              >
                {tr('licenseTechPage.actions.copyChallenge', 'Скопировать код')}
              </Button>
                <Button
                  type="primary"
                  icon={<SafetyCertificateOutlined />}
                  onClick={openWizardSection}
                >
                  {tr('licenseTechPage.actions.openWizard', 'Открыть мастер лицензирования')}
                </Button>
            </Space>
            {recommendedFlow ? (
              <Alert
                type={recommendedFlow.mode === 'auto' ? 'success' : 'info'}
                showIcon
                message={recommendedFlow.title}
                description={recommendedFlow.description}
              />
            ) : null}
            {blockingReasons.length ? (
              <Alert
                type="warning"
                showIcon
                message={tr('licenseTechPage.actions.blockingReasonsTitle', 'Почему автопродление может быть недоступно')}
                description={blockingReasons.map((row) => row.message).join(' ')}
              />
            ) : null}
            {autoRequestHost ? (
              <Text type="secondary">
                {tr('licenseTechPage.actions.controlPlaneHint', 'Control-plane: {host}', { host: autoRequestHost })}
              </Text>
            ) : null}
            {actionState.renewHint ? (
              <Text type="secondary" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                {actionState.renewHint}
              </Text>
            ) : null}

            <div ref={wizardCardRef}>
              <Card
                size="small"
                title={tr('licenseTechPage.wizard.title', 'Мастер лицензирования инстанса')}
              >
              <Steps
                direction="vertical"
                size="small"
                items={[
                  {
                    title: tr('licenseTechPage.wizard.step1', 'Шаг 1. Выберите тариф и отправьте заявку'),
                    description: tr(
                      'licenseTechPage.wizard.step1Description',
                      'Укажите желаемый план. Заявка уйдет в control-plane для назначения тарифа.',
                    ),
                  },
                  {
                    title: tr('licenseTechPage.wizard.step2', 'Шаг 2. Получите bundle файл'),
                    description: tr(
                      'licenseTechPage.wizard.step2Description',
                      'После согласования скачайте подписанный .licb файл лицензии.',
                    ),
                  },
                  {
                    title: tr('licenseTechPage.wizard.step3', 'Шаг 3. Установите файл на инстансе'),
                    description: tr(
                      'licenseTechPage.wizard.step3Description',
                      'Загрузите bundle и завершите установку без ввода JSON.',
                    ),
                  },
                ]}
              />
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Form form={requestForm} layout="vertical">
                    <Form.Item
                      name="requested_plan_code"
                      label={tr('licenseTechPage.wizard.plan', 'Желаемый тариф')}
                    >
                      <Select
                        allowClear
                        placeholder={tr('licenseTechPage.wizard.planPlaceholder', 'Например: STARTER / PRO / ENTERPRISE')}
                        options={[
                          { value: 'starter', label: 'STARTER' },
                          { value: 'pro', label: 'PRO' },
                          { value: 'enterprise', label: 'ENTERPRISE' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item name="contact_name" label={tr('licenseTechPage.wizard.contactName', 'Контактное лицо')}>
                      <Input placeholder={tr('licenseTechPage.wizard.contactNamePlaceholder', 'Имя и фамилия')} />
                    </Form.Item>
                    <Form.Item name="contact_email" label={tr('licenseTechPage.wizard.contactEmail', 'Email')}>
                      <Input placeholder="name@company.com" />
                    </Form.Item>
                    <Form.Item name="contact_phone" label={tr('licenseTechPage.wizard.contactPhone', 'Телефон')}>
                      <Input placeholder="+998 ..." />
                    </Form.Item>
                    <Form.Item name="business_note" label={tr('licenseTechPage.wizard.note', 'Комментарий')}>
                      <TextArea rows={3} placeholder={tr('licenseTechPage.wizard.notePlaceholder', 'Нужные модули, сроки, детали согласования')} />
                    </Form.Item>
                    <Button type="primary" onClick={handleWizardRequestSubmit} loading={onlineRequestLoading}>
                      {tr('licenseTechPage.wizard.sendRequest', 'Отправить заявку на тариф')}
                    </Button>
                  </Form>
                </Col>
                <Col xs={24} lg={12}>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Upload
                      beforeUpload={(file) => {
                        const lowerName = String(file?.name || '').toLowerCase();
                        if (!lowerName.endsWith('.licb')) {
                          message.warning(
                            tr('licenseTechPage.bundle.onlyLicb', 'Поддерживаются только подписанные .licb файлы.'),
                          );
                          return Upload.LIST_IGNORE;
                        }
                        setBundleFile(file);
                        return false;
                      }}
                      onRemove={() => {
                        setBundleFile(null);
                      }}
                      maxCount={1}
                      accept=".licb"
                      fileList={bundleFile ? [bundleFile] : []}
                    >
                      <Button icon={<UploadOutlined />}>
                        {tr('licenseTechPage.bundle.select', 'Выбрать bundle файл лицензии')}
                      </Button>
                    </Upload>
                    <Text type="secondary">
                      {tr(
                        'licenseTechPage.bundle.hint',
                        'Поддерживаются подписанные файлы .licb из control-plane.',
                      )}
                    </Text>
                    <Button
                      type="primary"
                      onClick={handleInstallBundle}
                      loading={bundleInstalling}
                      disabled={!bundleFile}
                    >
                      {tr('licenseTechPage.bundle.install', 'Установить bundle файл')}
                    </Button>
                  </Space>
                </Col>
              </Row>
              </Card>
            </div>
          </Space>
        </Card>

        <Collapse
          items={[
            {
              key: 'advanced',
              label: tr('licenseTechPage.sections.advanced', 'Расширенные детали (для поддержки)'),
              children: (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Alert
                    type="info"
                    showIcon
                    message={tr('licenseTechPage.support.manualInstallTitle', 'Ручной режим для техподдержки')}
                    description={tr(
                      'licenseTechPage.support.manualInstallDescription',
                      'Если bundle-установка недоступна, поддержка может открыть ручной режим проверки подписи.',
                    )}
                    action={(
                      <Button onClick={openActivationModal}>
                        {tr('licenseTechPage.support.manualInstallAction', 'Открыть ручной режим')}
                      </Button>
                    )}
                  />
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={14}>
                      <Card variant="borderless" title={tr('licenseTechPage.sections.details', 'Технические детали лицензии')}>
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
                      <Card variant="borderless" title={tr('licenseTechPage.sections.seats', 'Подробно по местам')}>
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
                  <Card
                    variant="borderless"
                    title={tr('licenseTechPage.sections.challenge', 'Код запроса (challenge)')}
                    extra={(
                      <Space>
                        <Button icon={<ReloadOutlined />} onClick={loadChallenge} loading={challengeLoading}>
                          {tr('licenseTechPage.actions.refreshChallenge', 'Обновить')}
                        </Button>
                        <Button
                          icon={<CopyOutlined />}
                          disabled={!challengePayload}
                          onClick={() => handleCopy(challengeText, tr('licenseTechPage.messages.challengeCopied', 'Код запроса скопирован.'))}
                        >
                          {tr('licenseTechPage.actions.copyChallenge', 'Скопировать')}
                        </Button>
                      </Space>
                    )}
                  >
                    {challengePayload ? (
                      <TextArea value={challengeText} rows={8} readOnly />
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={tr('licenseTechPage.challenge.empty', 'Сначала сформируйте код запроса.')}
                      />
                    )}
                  </Card>
                </Space>
              ),
            },
          ]}
        />
      </Space>

      <Modal
        title={tr('licenseTechPage.modal.activationTitle', 'Verify and install signed artifact')}
        open={activationOpen}
        onCancel={() => setActivationOpen(false)}
        width={860}
        destroyOnHidden
        getContainer={false}
        footer={(
          <Space wrap>
            <Button onClick={handleArtifactPaste}>
              {tr('licenseTechPage.actions.pasteArtifact', 'Paste artifact from clipboard')}
            </Button>
            <Button onClick={handleVerify} loading={verifying} disabled={installing}>
              {tr('licenseTechPage.actions.verifyArtifact', 'Verify')}
            </Button>
            <Button type="primary" onClick={handleInstall} loading={installing} disabled={!canInstall || verifying}>
              {tr('licenseTechPage.actions.installArtifact', 'Install')}
            </Button>
          </Space>
        )}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type={activationStatus.type}
            showIcon
            message={activationStatus.message}
            description={activationStatus.description}
          />
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
              extra={tr(
                'licenseTechPage.form.signatureHelper',
                'Use the original Base64 signature from control-plane without modifications.',
              )}
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
