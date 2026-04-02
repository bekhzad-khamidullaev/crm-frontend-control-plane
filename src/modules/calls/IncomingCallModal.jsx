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
import { navigate } from '../../router.js';
import { VoIpColdCallsService } from '../../shared/api/generated/services/VoIpColdCallsService.ts';
import { TELEPHONY_MODAL_PROPS } from '../../shared/ui/telephonyModal.js';
import ChannelBrandIcon from '../../components/channel/ChannelBrandIcon.jsx';

const { Text, Title } = Typography;

function normalizeOptionValue(value, options = []) {
  const matched = options.find((option) => String(option?.value) === String(value));
  return matched ? matched.value : value;
}

function asEntityDisplay(entity) {
  if (!entity) return { title: 'Неизвестный', subtitle: '' };

  if (entity.type === 'company') {
    return {
      title: entity.data?.full_name || entity.data?.name || 'Компания',
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

  const [leadSources, setLeadSources] = useState([]);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [leadForm] = Form.useForm();

  const searchedPhoneRef = useRef('');

  const phoneNumber = String(callData?.phoneNumber || '');

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
    () => leadSources.map((source) => ({ value: source.id, label: source.name || 'Источник' })),
    [leadSources],
  );

  const loadLeadSources = async () => {
    try {
      const response = await api.get('/api/lead-sources/', { params: { page_size: 200 } });
      const rows = Array.isArray(response?.results) ? response.results : [];
      setLeadSources(rows);

      const phoneSource = rows.find((row) => /phone|call|звон/i.test(String(row?.name || '')));
      if (phoneSource?.id) {
        leadForm.setFieldValue('lead_source', phoneSource.id);
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

      if (!context?.matched_entity) {
        setLeadModalOpen(true);
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
    if (!visible) {
      searchedPhoneRef.current = '';
      setMatchedEntity(null);
      setRecentItems([]);
      setExistingOpenLead(null);
      setLeadModalOpen(false);
      leadForm.resetFields();
    }
  }, [visible, leadForm]);

  const openMatchedEntityCard = (pathOverride) => {
    const path = pathOverride || buildEntityPath(matchedEntity);
    if (!path) return;
    onDismiss?.(callData);
    navigate(path);
  };

  const handleAnswer = () => {
    onAnswer?.(callData);
    const audioElement = document.getElementById('incoming-call-audio');
    if (audioElement) {
      sipClient.answerCall(audioElement);
    }

    if (matchedEntity) {
      openMatchedEntityCard();
    }
  };

  const handleReject = async () => {
    onReject?.(callData);

    const hasSipSession = Boolean(sipClient.callSession);
    if (hasSipSession) {
      sipClient.rejectCall();
      return;
    }

    const sessionId = String(callData?.sessionId || callData?.callId || '').trim();
    if (!sessionId) return;

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
        first_name: values.first_name || undefined,
        last_name: values.last_name || undefined,
        description: values.description || `Входящий звонок${callData?.callId ? ` (CallID: ${callData.callId})` : ''}`,
        status: values.status || 'new',
      };

      const created = await api.post('/api/leads/', { body: payload });
      message.success('Лид создан по входящему звонку');
      setLeadModalOpen(false);
      onAnswer?.(callData);
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
    <>
      <Modal {...TELEPHONY_MODAL_PROPS} open={visible} footer={null} closable={false} width={720}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space>
            <PhoneTwoTone twoToneColor="#52c41a" style={{ fontSize: 20 }} />
            <Title level={4} style={{ margin: 0 }}>Входящий звонок</Title>
          </Space>

          <Alert
            type="info"
            showIcon
            message={callData.callerName || 'Неизвестный абонент'}
            description={`Номер: ${phoneNumber || '-'}`}
          />

          {searchingContact ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : matchedEntity ? (
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
                  {matchedEntity.data?.phone || matchedEntity.data?.mobile || matchedEntity.data?.other_phone || phoneNumber || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Email">{matchedEntity.data?.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="Компания">
                  {matchedEntity.data?.company_name || matchedEntity.data?.company || matchedEntity.data?.full_name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Описание">{matchedEntity.data?.description || '-'}</Descriptions.Item>
              </Descriptions>

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
              {existingOpenLead ? (
                <Alert
                  type="warning"
                  showIcon
                  message="Найден активный лид по номеру"
                  description={
                    <Button type="link" style={{ paddingInline: 0 }} onClick={() => openMatchedEntityCard(existingOpenLead.path)}>
                      Открыть {existingOpenLead.title}
                    </Button>
                  }
                />
              ) : null}
            </>
          ) : (
            <Alert
              type="warning"
              showIcon
              message="Номер не найден в базе"
              description="Откроется модалка создания нового лида с автозаполнением"
            />
          )}

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button danger onClick={handleReject}>Отклонить</Button>
            <Button type="primary" icon={<ChannelBrandIcon channel="telephony" size={14} />} onClick={handleAnswer}>Ответить</Button>
          </Space>

          <audio id="incoming-call-audio" autoPlay />
        </Space>
      </Modal>

      <Modal
        {...TELEPHONY_MODAL_PROPS}
        title="Создание лида по входящему звонку"
        open={leadModalOpen && visible && !matchedEntity}
        onCancel={() => setLeadModalOpen(false)}
        onOk={handleCreateLead}
        okText="Создать лид"
        confirmLoading={creatingLead}
      >
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
            label="Источник лида"
            getValueProps={(value) => ({ value: normalizeOptionValue(value, leadSourceOptions) })}
          >
            <Select
              allowClear
              placeholder="Источник"
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
      </Modal>
    </>
  );
}

export default IncomingCallModal;
