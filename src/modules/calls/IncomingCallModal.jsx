import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  App,
  Avatar,
  Badge,
  Button,
  Descriptions,
  Form,
  Input,
  List,
  Modal,
  Select,
  Skeleton,
  Space,
  Typography,
} from 'antd';
import {
  DatabaseOutlined,
  PhoneTwoTone,
  UserOutlined,
} from '@ant-design/icons';

import { api } from '../../lib/api/client.js';
import { rejectActiveCall } from '../../lib/api/telephony.js';
import sipClient from '../../lib/telephony/SIPClient.js';
import telephonyManager from '../../lib/telephony/TelephonyManager.js';
import { loadTelephonyRuntimeConfig } from '../../lib/telephony/runtimeConfig.js';
import { getCompanyDisplayName } from '../../lib/utils/company-display.js';
import { getLocale, t } from '../../lib/i18n';
import { navigate } from '../../router.js';
import { VoIpColdCallsService } from '../../shared/api/generated/services/VoIpColdCallsService.ts';
import { TELEPHONY_MODAL_PROPS } from '../../shared/ui/telephonyModal.js';
import ChannelBrandIcon from '../../components/channel/ChannelBrandIcon.jsx';
import { getLeadSourceLabel } from '../../features/reference/lib/leadSourceLabel';

const { Text, Title } = Typography;

function normalizeOptionValue(value, options = []) {
  const matched = options.find((option) => String(option?.value) === String(value));
  return matched ? matched.value : value;
}

function asEntityDisplay(entity) {
  if (!entity) return { title: 'Неизвестный', subtitle: '' };

  if (entity.type === 'company') {
    return {
      title: getCompanyDisplayName(entity.data) || 'Компания',
      subtitle: 'Компания',
    };
  }

  const fullName =
    entity.data?.full_name ||
    [entity.data?.first_name, entity.data?.middle_name, entity.data?.last_name].filter(Boolean).join(' ').trim();

  return {
    title: fullName || entity.data?.phone || 'Клиент',
    subtitle: entity.type === 'lead' ? 'Лид' : 'Контакт',
  };
}

function buildEntityPath(entity) {
  if (entity?.path) return entity.path;
  if (!entity?.id && !entity?.data?.id) return null;
  const entityId = entity.id || entity.data?.id;
  if (entity.type === 'company') return `/companies/${entityId}`;
  if (entity.type === 'lead') return `/leads/${entityId}`;
  return `/contacts/${entityId}`;
}

function IncomingCallModal({ visible, callData, onAnswer, onReject, onDismiss }) {
  const { message } = App.useApp();
  const [searchingContact, setSearchingContact] = useState(false);
  const [matchedEntity, setMatchedEntity] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [existingOpenLead, setExistingOpenLead] = useState(null);
  const [routeMode, setRouteMode] = useState('embedded');

  const [leadSources, setLeadSources] = useState([]);
  const [incomingCallLeadSourceId, setIncomingCallLeadSourceId] = useState(null);
  const [creatingLead, setCreatingLead] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [hasSipSession, setHasSipSession] = useState(() => Boolean(sipClient.callSession));
  const [answerPending, setAnswerPending] = useState(false);
  const [leadForm] = Form.useForm();
  const locale = getLocale();

  const searchedPhoneRef = useRef('');

  const phoneNumber = String(callData?.phoneNumber || '');
  const isAmiMode = routeMode === 'ami' && !hasSipSession;
  const amiTargetLabel =
    callData?.queue ||
    callData?.routeTargetLabel ||
    callData?.agentExtension ||
    callData?.extension ||
    '';

  const leadDefaults = useMemo(() => {
    const caller = String(callData?.callerName || '').trim();
    const [firstName = '', ...rest] = caller.split(/\s+/).filter(Boolean);
    const lastName = rest.join(' ');

    return {
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      phone: phoneNumber || undefined,
      status: 'new',
      description: `Входящий звонок${callData?.callId ? ` (CallID: ${callData.callId})` : ''}`,
    };
  }, [callData?.callId, callData?.callerName, phoneNumber]);
  const leadSourceOptions = useMemo(
    () => leadSources.map((source) => ({
      value: source.id,
      label: getLeadSourceLabel(
        source.name || t('incomingCallModal.fields.leadSourceFallback', 'Источник'),
        locale,
      ),
    })),
    [leadSources, locale],
  );

  const loadLeadSources = async () => {
    try {
      const response = await api.get('/api/lead-sources/', { params: { page_size: 200 } });
      const rows = Array.isArray(response?.results) ? response.results : [];
      setLeadSources(rows);

      const incomingCallSource =
        rows.find((row) => /incoming\s*call|входящий\s*звонок|kiruvchi\s*qo'?ng'?iroq/i.test(String(row?.name || '').trim())) ||
        rows.find((row) => /phone|call|звон|qo'?ng'?iroq/i.test(String(row?.name || '')));

      if (incomingCallSource?.id) {
        setIncomingCallLeadSourceId(incomingCallSource.id);
        leadForm.setFieldValue('lead_source', incomingCallSource.id);
      }
    } catch (error) {
      console.error('Failed to load lead sources:', error);
    }
  };

  const searchByPhone = async (incomingPhone) => {
    if (!incomingPhone) return;

    setSearchingContact(true);
    setMatchedEntity(null);
    setRecentItems([]);
    setExistingOpenLead(null);

    try {
      const context = await VoIpColdCallsService.voipIncomingContext({
        phone: incomingPhone,
        callerName: callData?.callerName || '',
        callId: callData?.callId || '',
      });

      setMatchedEntity(context?.matched_entity || null);
      setRecentItems(Array.isArray(context?.recent_interactions) ? context.recent_interactions : []);
      setExistingOpenLead(context?.existing_open_lead || null);

      if (context?.lead_defaults) {
        leadForm.setFieldsValue({ ...leadDefaults, ...context.lead_defaults });
      }

    } catch (error) {
      console.error('Error searching by phone:', error);
    } finally {
      setSearchingContact(false);
    }
  };

  useEffect(() => {
    if (!visible || !phoneNumber) return;

    if (searchedPhoneRef.current === phoneNumber) return;
    searchedPhoneRef.current = phoneNumber;

    loadLeadSources();
    leadForm.setFieldsValue(leadDefaults);
    searchByPhone(phoneNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, phoneNumber]);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    loadTelephonyRuntimeConfig({ includeSystemSettings: true })
      .then((runtime) => {
        if (cancelled) return;
        setRouteMode(String(runtime?.sipConfig?.routeMode || 'embedded').toLowerCase());
      })
      .catch(() => {
        if (cancelled) return;
        setRouteMode('embedded');
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      searchedPhoneRef.current = '';
      setMatchedEntity(null);
      setRecentItems([]);
      setExistingOpenLead(null);
      setRouteMode('embedded');
      setIncomingCallLeadSourceId(null);
      setAnswered(false);
      setAnswerPending(false);
      setHasSipSession(Boolean(sipClient.callSession));
      leadForm.resetFields();
    }
  }, [visible, leadForm]);

  useEffect(() => {
    if (!visible) return;
    if (typeof sipClient?.on !== 'function' || typeof sipClient?.off !== 'function') {
      setHasSipSession(Boolean(sipClient?.callSession));
      return;
    }

    const syncSip = () => {
      setHasSipSession(Boolean(sipClient.callSession));
    };

    // When WS opens the modal before SIP INVITE arrives, we still need to re-render
    // once JsSIP creates the session so Answer/Reject paths behave correctly.
    sipClient.on('incomingCall', syncSip);
    sipClient.on('callEnded', syncSip);
    sipClient.on('callFailed', syncSip);
    sipClient.on('unregistered', syncSip);

    // Initial sync
    syncSip();

    return () => {
      sipClient.off('incomingCall', syncSip);
      sipClient.off('callEnded', syncSip);
      sipClient.off('callFailed', syncSip);
      sipClient.off('unregistered', syncSip);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (!answerPending) return;
    if (isAmiMode) return;
    if (!hasSipSession) return;

    const sipDigits = String(sipClient.currentCall?.phoneNumber || '').replace(/\D/g, '');
    const wsDigits = String(callData?.phoneNumber || '').replace(/\D/g, '');
    if (sipDigits && wsDigits) {
      const matches = sipDigits.endsWith(wsDigits) || wsDigits.endsWith(sipDigits);
      if (!matches) {
        setAnswerPending(false);
        message.warning('SIP-сессия не совпадает с входящим звонком, приём отменён');
        return;
      }
    }

    const audioElement =
      document.getElementById('telephony-remote-audio') ||
      document.getElementById('incoming-call-audio');

    if (audioElement) {
      sipClient.answerCall(audioElement);
    } else {
      sipClient.answerCall();
    }

    telephonyManager.notifyCallConnected(callData);
    setAnswered(true);
    setAnswerPending(false);
  }, [answerPending, callData, hasSipSession, isAmiMode, message, visible]);

  const openMatchedEntityCard = (pathOverride) => {
    const path = pathOverride || buildEntityPath(matchedEntity);
    if (!path) return;
    onDismiss?.(callData);
    navigate(path);
  };

  const handleAnswer = () => {
    if (isAmiMode) {
      onAnswer?.(callData);
      setAnswered(true);
      return;
    }

    if (!hasSipSession) {
      setAnswerPending(true);
      message.info('Ожидаю SIP-сессию... попробую принять автоматически');
      return;
    }

    const sipDigits = String(sipClient.currentCall?.phoneNumber || '').replace(/\D/g, '');
    const wsDigits = String(callData?.phoneNumber || '').replace(/\D/g, '');
    if (sipDigits && wsDigits) {
      const matches = sipDigits.endsWith(wsDigits) || wsDigits.endsWith(sipDigits);
      if (!matches) {
        message.warning('SIP-сессия не совпадает с входящим звонком');
        return;
      }
    }

    onAnswer?.(callData);
    const audioElement =
      document.getElementById('telephony-remote-audio') ||
      document.getElementById('incoming-call-audio');
    if (audioElement) {
      sipClient.answerCall(audioElement);
    } else {
      sipClient.answerCall();
    }

    telephonyManager.notifyCallConnected(callData);
    setAnswered(true);
  };

  const handleReject = async () => {
    // Stop deferred answer path if operator changed decision to reject.
    setAnswerPending(false);
    onReject?.(callData);
    if (hasSipSession) {
      sipClient.rejectCall();
    }

    const sessionId = String(callData?.sessionId || callData?.callId || '').trim();
    if (!sessionId) return;
    if (hasSipSession) return;

    try {
      await rejectActiveCall(sessionId);
    } catch (error) {
      console.error('Failed to reject call via backend call-control:', error);
      message.error('Не удалось отклонить звонок на стороне PBX');
    }
  };

  const handleCreateLead = async () => {
    try {
      const values = await leadForm.validateFields();
      setCreatingLead(true);

      const payload = {
        ...values,
        phone: values.phone || phoneNumber,
        lead_source: values.lead_source ?? incomingCallLeadSourceId ?? undefined,
        first_name: values.first_name || undefined,
        last_name: values.last_name || undefined,
        description: values.description || `Входящий звонок${callData?.callId ? ` (CallID: ${callData.callId})` : ''}`,
        status: values.status || 'new',
      };

      const created = await api.post('/api/leads/', { body: payload });
      message.success(
        isAmiMode
          ? 'Лид создан. Звонок продолжает обрабатываться в FreePBX.'
          : 'Лид создан по входящему звонку'
      );
      onDismiss?.(callData);
      if (created?.id) {
        navigate(`/leads/${created.id}`);
      } else {
        navigate('/leads');
      }
    } catch (error) {
      if (!error?.errorFields) {
        console.error('Failed to create lead:', error);
        message.error('Не удалось создать лид');
      }
    } finally {
      setCreatingLead(false);
    }
  };

  if (!callData) return null;

  const display = asEntityDisplay(matchedEntity);

  return (
    <Modal {...TELEPHONY_MODAL_PROPS} open={visible} footer={null} closable={false} width={720}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space>
          <PhoneTwoTone twoToneColor="#52c41a" style={{ fontSize: 20 }} />
          <Title level={4} style={{ margin: 0 }}>
            {answered ? 'Обработка звонка' : 'Входящий звонок'}
          </Title>
        </Space>

        <Alert
          type="info"
          showIcon
          message={callData.callerName || 'Неизвестный абонент'}
          description={`Номер: ${phoneNumber || '-'}`}
        />

        {isAmiMode ? (
          <Alert
            type="warning"
            showIcon
            message="PBX AMI mode"
            description={
              amiTargetLabel
                ? `Ответ выполняется на стороне FreePBX (${amiTargetLabel}). CRM откроет карточку и дождётся realtime-статуса.`
                : 'Ответ выполняется на стороне FreePBX. CRM не подтверждает answer локально, а ждёт realtime-статус.'
            }
          />
        ) : null}

        {!answered ? (
          <>
            {searchingContact ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : matchedEntity || existingOpenLead ? (
              <Alert
                type="success"
                showIcon
                message="Найден клиент в CRM"
                description="После ответа откроется карточка клиента."
              />
            ) : (
              <Alert
                type="warning"
                showIcon
                message="Номер не найден в базе"
                description="После ответа откроется форма создания лида с автозаполнением."
              />
            )}

            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button danger onClick={handleReject}>
                {isAmiMode ? 'Отклонить на PBX' : 'Отклонить'}
              </Button>
              <Button
                type="primary"
                icon={<ChannelBrandIcon channel="telephony" size={14} />}
                onClick={handleAnswer}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                Ответить
              </Button>
            </Space>
          </>
        ) : searchingContact ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : matchedEntity || existingOpenLead ? (
          <>
            {matchedEntity ? (
              <>
                <Space align="start" style={{ width: '100%' }}>
                  <Avatar icon={<UserOutlined />} />
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <Text strong>{display.title}</Text>
                    <Badge color="blue" text={display.subtitle} />
                  </Space>
                  <Button type="primary" icon={<DatabaseOutlined />} onClick={openMatchedEntityCard}>
                    Открыть карточку
                  </Button>
                </Space>

                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="Телефон">
                    {matchedEntity.data?.phone ||
                      matchedEntity.data?.mobile ||
                      matchedEntity.data?.other_phone ||
                      phoneNumber ||
                      '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">{matchedEntity.data?.email || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Компания">
                    {getCompanyDisplayName(matchedEntity.data) || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Описание">{matchedEntity.data?.description || '-'}</Descriptions.Item>
                </Descriptions>
              </>
            ) : null}

            {existingOpenLead ? (
              <Alert
                type="warning"
                showIcon
                message="Найден активный лид по номеру"
                description={
                  <Button
                    type="link"
                    style={{ paddingInline: 0 }}
                    onClick={() => openMatchedEntityCard(existingOpenLead.path)}
                  >
                    Открыть {existingOpenLead.title}
                  </Button>
                }
              />
            ) : null}

            <div>
              <Text strong>Последние обращения</Text>
              <List
                size="small"
                style={{ marginTop: 8 }}
                locale={{ emptyText: 'Нет обращений по этому номеру' }}
                dataSource={recentItems}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button key="open" type="link" onClick={() => openMatchedEntityCard(item.path || '/operations')}>
                        Открыть
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<ChannelBrandIcon channel="telephony" size={14} />}
                      title={item.title}
                      description={item.description}
                    />
                  </List.Item>
                )}
              />
            </div>

            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={() => onDismiss?.(callData)}>Закрыть</Button>
              <Button
                type="primary"
                icon={<DatabaseOutlined />}
                onClick={() => {
                  if (existingOpenLead?.path) {
                    onDismiss?.(callData);
                    navigate(existingOpenLead.path);
                    return;
                  }
                  openMatchedEntityCard();
                }}
              >
                Открыть карточку
              </Button>
            </Space>
          </>
        ) : (
          <>
            <Form layout="vertical" form={leadForm} initialValues={leadDefaults}>
              <Form.Item name="first_name" label="Имя">
                <Input placeholder="Имя" />
              </Form.Item>
              <Form.Item name="last_name" label="Фамилия">
                <Input placeholder="Фамилия" />
              </Form.Item>
              <Form.Item
                name="phone"
                label="Телефон"
                rules={[{ required: true, message: 'Укажите номер телефона' }]}
              >
                <Input placeholder="+998..." />
              </Form.Item>
              <Form.Item
                name="lead_source"
                label={t('incomingCallModal.fields.leadSource', 'Источник лида')}
                getValueProps={(value) => ({ value: normalizeOptionValue(value, leadSourceOptions) })}
              >
                <Select
                  allowClear
                  placeholder={t('incomingCallModal.fields.leadSourcePlaceholder', 'Источник')}
                  options={leadSourceOptions}
                />
              </Form.Item>
              <Form.Item name="status" label="Статус">
                <Select
                  options={[
                    { value: 'new', label: 'Новый' },
                    { value: 'contacted', label: 'Связались' },
                    { value: 'qualified', label: 'Квалифицирован' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="description" label="Комментарий">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Form>

            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={() => onDismiss?.(callData)}>Закрыть</Button>
              <Button type="primary" loading={creatingLead} onClick={handleCreateLead}>
                Создать лид
              </Button>
            </Space>
          </>
        )}

        <audio id="incoming-call-audio" autoPlay />
        <audio id="telephony-remote-audio" autoPlay style={{ display: 'none' }} />
      </Space>
    </Modal>
  );
}

export default IncomingCallModal;
