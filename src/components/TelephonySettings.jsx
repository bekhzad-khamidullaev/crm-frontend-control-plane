/**
 * TelephonySettings Component
 * Component for configuring VoIP connections
 */

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  App,
  Alert,
  Switch,
  Divider,
  Table,
  Modal,
  Tag,
  Popconfirm,
  Card,
  InputNumber,
  Typography,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { 
  getVoIPConnections, 
  createVoIPConnection, 
  updateVoIPConnection,
  deleteVoIPConnection,
  patchVoIPConnection,
  getRoutingRules,
  createRoutingRule,
  updateRoutingRule,
  deleteRoutingRule,
  getInternalNumbers,
  getNumberGroups,
  getVoipSystemSettings,
  updateVoipSystemSettings,
} from '../lib/api/telephony';
import { t } from '../lib/i18n';
import { canWrite } from '../lib/rbac.js';
import {
  CONNECTION_TYPE_OPTIONS,
  DEFAULT_STUN_SERVERS,
  DEFAULT_TELEPHONY_PROVIDER,
  DEFAULT_TELEPHONY_ROUTE_MODE,
  TELEPHONY_PROVIDER_OPTIONS,
  TELEPHONY_PROVIDER_TAG_COLORS,
  TELEPHONY_ROUTE_MODE_OPTIONS,
} from '../lib/telephony/constants.js';

const ROUTING_ACTION_OPTIONS = [
  { value: 'route_to_number', label: 'route_to_number' },
  { value: 'route_to_group', label: 'route_to_group' },
  { value: 'route_to_queue', label: 'route_to_queue' },
  { value: 'forward_external', label: 'forward_external' },
  { value: 'route_to_voicemail', label: 'route_to_voicemail' },
  { value: 'play_announcement', label: 'play_announcement' },
  { value: 'hangup', label: 'hangup' },
];

const CALLED_PATTERN_PRESETS = [
  { value: '^\\d{3}$', label: 'Внутренний номер (3 цифры)' },
  { value: '^\\d{4}$', label: 'Внутренний номер (4 цифры)' },
  { value: '^\\+998\\d{9}$', label: 'UZ внешний номер (+998...)' },
  { value: '^\\+?\\d{10,15}$', label: 'Международный E.164' },
  { value: '^8800\\d+$', label: '8-800 сервисные номера' },
];

const CALLER_PATTERN_PRESETS = [
  { value: '^\\+998', label: 'Входящие из Узбекистана (+998...)' },
  { value: '^998', label: 'Входящие из Узбекистана (998...)' },
  { value: '^\\+?\\d{10,15}$', label: 'Любой международный номер' },
  { value: '^$', label: 'Пустой caller id' },
];

const buildEmptyRoutingRule = () => ({
  id: undefined,
  name: '',
  description: '',
  called_number_pattern: '',
  caller_id_pattern: '',
  time_condition: '',
  action: 'route_to_number',
  target_number: undefined,
  target_group: undefined,
  target_external: '',
  announcement_text: '',
  priority: 100,
  active: true,
});

const regexValidator = (label) => (_, value) => {
  if (!value) return Promise.resolve();
  try {
    // Validate regexp pattern entered by user.
    // eslint-disable-next-line no-new
    new RegExp(value);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(new Error(t('telephonySettings.validation.invalidRegexp', { label }) === 'telephonySettings.validation.invalidRegexp' ? `${label}: invalid RegExp` : t('telephonySettings.validation.invalidRegexp', { label })));
  }
};

export default function TelephonySettings({ onSuccess }) {
  const { message } = App.useApp();
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
  const canManage = canWrite('voip.change_connection');
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [routingForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [routingTableLoading, setRoutingTableLoading] = useState(false);
  const [initialRoutingRuleIds, setInitialRoutingRuleIds] = useState([]);
  const [internalNumbers, setInternalNumbers] = useState([]);
  const [numberGroups, setNumberGroups] = useState([]);

  useEffect(() => {
    loadProfileSettings();
    loadConnections();
    loadRoutingSettings();
    loadRoutingTargets();
  }, []);

  const loadProfileSettings = async () => {
    setSettingsLoading(true);
    try {
      const profile = await getVoipSystemSettings();
      settingsForm.setFieldsValue({
        telephony_route_mode: profile.telephony_route_mode || DEFAULT_TELEPHONY_ROUTE_MODE,
        telephony_provider: profile.telephony_provider || DEFAULT_TELEPHONY_PROVIDER,
        webrtc_stun_servers: profile.webrtc_stun_servers || DEFAULT_STUN_SERVERS,
        webrtc_turn_enabled: !!profile.webrtc_turn_enabled,
        webrtc_turn_server: profile.webrtc_turn_server || '',
        webrtc_turn_username: profile.webrtc_turn_username || '',
        webrtc_turn_password: profile.webrtc_turn_password || '',
      });
    } catch (error) {
      console.error('Error loading telephony profile settings:', error);
      message.error(tr('telephonySettings.messages.loadSettingsError', 'Ошибка загрузки настроек телефонии'));
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadRoutingSettings = async () => {
    setRoutingTableLoading(true);
    try {
      const response = await getRoutingRules({ page_size: 200 });
      const list = Array.isArray(response?.results) ? response.results : Array.isArray(response) ? response : [];
      routingForm.setFieldsValue({ routing_rules: list });
      setInitialRoutingRuleIds(list.map((rule) => rule.id).filter(Boolean));
    } catch (error) {
      console.error('Error loading routing rules:', error);
      message.error(tr('telephonySettings.messages.routingLoadError', 'Не удалось загрузить правила маршрутизации'));
      routingForm.setFieldsValue({ routing_rules: [] });
      setInitialRoutingRuleIds([]);
    } finally {
      setRoutingTableLoading(false);
    }
  };

  const loadRoutingTargets = async () => {
    try {
      const [numbersResponse, groupsResponse] = await Promise.all([
        getInternalNumbers({ page_size: 200 }),
        getNumberGroups({ page_size: 200 }),
      ]);
      const numbersList = Array.isArray(numbersResponse?.results)
        ? numbersResponse.results
        : Array.isArray(numbersResponse)
          ? numbersResponse
          : [];
      const groupsList = Array.isArray(groupsResponse?.results)
        ? groupsResponse.results
        : Array.isArray(groupsResponse)
          ? groupsResponse
          : [];
      setInternalNumbers(numbersList);
      setNumberGroups(groupsList);
    } catch (error) {
      console.error('Error loading routing targets:', error);
      message.error(tr('telephonySettings.messages.routingTargetsLoadError', 'Не удалось загрузить номера и группы для маршрутизации'));
    }
  };

  const loadConnections = async () => {
    setTableLoading(true);
    try {
      const response = await getVoIPConnections();
      setConnections(response.results || []);
    } catch (error) {
      console.error('Error loading VoIP connections:', error);
      message.error(tr('telephonySettings.messages.loadConnectionsError', 'Ошибка загрузки подключений'));
    } finally {
      setTableLoading(false);
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const connectionData = {
        provider: values.provider,
        type: values.type,
        number: values.number,
        callerid: values.callerid,
        active: values.active !== undefined ? values.active : true,
      };

      if (editingConnection) {
        // Update existing connection
        await updateVoIPConnection(editingConnection.id, connectionData);
        message.success(tr('telephonySettings.messages.connectionUpdated', 'Подключение обновлено'));
      } else {
        // Create new connection
        await createVoIPConnection(connectionData);
        message.success(tr('telephonySettings.messages.connectionCreated', 'Подключение создано'));
      }
      
      setModalVisible(false);
      form.resetFields();
      setEditingConnection(null);
      await loadConnections();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving VoIP connection:', error);
      message.error(tr('telephonySettings.messages.saveConnectionError', 'Ошибка сохранения подключения'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (connection) => {
    setEditingConnection(connection);
    form.setFieldsValue(connection);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteVoIPConnection(id);
      message.success(tr('telephonySettings.messages.connectionDeleted', 'Подключение удалено'));
      await loadConnections();
    } catch (error) {
      console.error('Error deleting connection:', error);
      message.error(tr('telephonySettings.messages.deleteConnectionError', 'Ошибка удаления подключения'));
    }
  };

  const handleToggleActive = async (connection) => {
    try {
      await patchVoIPConnection(connection.id, { active: !connection.active });
      message.success(connection.active ? tr('telephonySettings.messages.connectionDeactivated', 'Подключение деактивировано') : tr('telephonySettings.messages.connectionActivated', 'Подключение активировано'));
      await loadConnections();
    } catch (error) {
      console.error('Error toggling connection:', error);
      message.error(tr('telephonySettings.messages.toggleStatusError', 'Ошибка изменения статуса'));
    }
  };

  const handleSaveSettings = async (values) => {
    setSettingsLoading(true);
    try {
      await updateVoipSystemSettings({
        telephony_route_mode: values.telephony_route_mode || DEFAULT_TELEPHONY_ROUTE_MODE,
        telephony_provider: values.telephony_provider || DEFAULT_TELEPHONY_PROVIDER,
        webrtc_stun_servers: values.webrtc_stun_servers || '',
        webrtc_turn_enabled: !!values.webrtc_turn_enabled,
        webrtc_turn_server: values.webrtc_turn_enabled ? (values.webrtc_turn_server || '') : '',
        webrtc_turn_username: values.webrtc_turn_enabled ? (values.webrtc_turn_username || '') : '',
        webrtc_turn_password: values.webrtc_turn_enabled ? (values.webrtc_turn_password || '') : '',
      });
      message.success(tr('telephonySettings.messages.settingsSaved', 'Настройки телефонии сохранены'));
      onSuccess?.();
    } catch (error) {
      console.error('Error saving telephony profile settings:', error);
      message.error(tr('telephonySettings.messages.saveSettingsError', 'Ошибка сохранения настроек телефонии'));
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveRoutingRules = async (values) => {
    setRoutingLoading(true);
    try {
      const normalizedRules = (values.routing_rules || []).map((rule) => ({
        id: rule.id,
        name: (rule.name || '').trim(),
        description: (rule.description || '').trim(),
        called_number_pattern: (rule.called_number_pattern || '').trim(),
        caller_id_pattern: (rule.caller_id_pattern || '').trim(),
        time_condition: (rule.time_condition || '').trim(),
        action: rule.action || 'route_to_number',
        target_number: rule.target_number || null,
        target_group: rule.target_group || null,
        target_external: (rule.target_external || '').trim(),
        announcement_text: (rule.announcement_text || '').trim(),
        priority: Number(rule.priority || 100),
        active: rule.active !== false,
      }));

      const currentIds = normalizedRules.map((rule) => rule.id).filter(Boolean);
      const removedIds = initialRoutingRuleIds.filter((id) => !currentIds.includes(id));

      await Promise.all(removedIds.map((id) => deleteRoutingRule(id)));

      await Promise.all(
        normalizedRules.map((rule) => {
          const payload = {
            name: rule.name,
            description: rule.description,
            called_number_pattern: rule.called_number_pattern,
            caller_id_pattern: rule.caller_id_pattern,
            time_condition: rule.time_condition,
            action: rule.action,
            target_number: rule.target_number || null,
            target_group: rule.target_group || null,
            target_external: rule.target_external,
            announcement_text: rule.announcement_text,
            priority: rule.priority,
            active: rule.active,
          };
          return rule.id ? updateRoutingRule(rule.id, payload) : createRoutingRule(payload);
        })
      );

      await loadRoutingSettings();
      message.success(tr('telephonySettings.messages.routingSaved', 'Правила маршрутизации сохранены'));
      onSuccess?.();
    } catch (error) {
      console.error('Error saving routing rules:', error);
      message.error(tr('telephonySettings.messages.routingSaveError', 'Не удалось сохранить правила маршрутизации'));
    } finally {
      setRoutingLoading(false);
    }
  };


  const columns = [
    {
      title: tr('telephonySettings.table.provider', 'Провайдер'),
      dataIndex: 'provider',
      key: 'provider',
      render: (provider) => <Tag color={TELEPHONY_PROVIDER_TAG_COLORS[provider] || 'default'}>{provider}</Tag>,
    },
    {
      title: tr('telephonySettings.table.type', 'Тип'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colors = { pbx: 'green', sip: 'orange', voip: 'purple' };
        return <Tag color={colors[type]}>{type?.toUpperCase()}</Tag>;
      },
    },
    {
      title: tr('telephonySettings.table.number', 'Номер'),
      dataIndex: 'number',
      key: 'number',
    },
    {
      title: tr('telephonySettings.table.callerId', 'Номер отображения'),
      dataIndex: 'callerid',
      key: 'callerid',
    },
    {
      title: tr('telephonySettings.table.owner', 'Владелец'),
      dataIndex: 'owner_name',
      key: 'owner_name',
      render: (name) => name || '-',
    },
    {
      title: tr('telephonySettings.table.status', 'Статус'),
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? tr('telephonySettings.status.active', 'Активно') : tr('telephonySettings.status.inactive', 'Неактивно')}
        </Tag>
      ),
    },
    {
      title: tr('telephonySettings.table.actions', 'Действия'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          {canManage ? (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                {tr('actions.edit', 'Изменить')}
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => handleToggleActive(record)}
              >
                {record.active ? tr('telephonySettings.actions.deactivate', 'Деактивировать') : tr('telephonySettings.actions.activate', 'Активировать')}
              </Button>
              <Popconfirm
                title={tr('telephonySettings.confirm.areYouSure', 'Вы уверены?')}
                onConfirm={() => handleDelete(record.id)}
                okText={tr('common.yes', 'Да')}
                cancelText={tr('common.no', 'Нет')}
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  {tr('actions.delete', 'Удалить')}
                </Button>
              </Popconfirm>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  const routeModeDescription = {
    auto: tr('telephonySettings.routeModes.auto', 'CRM chooses route automatically: SIP/WebRTC first, then fallback.'),
    internal: tr('telephonySettings.routeModes.internal', 'Outgoing calls prioritize internal PBX numbers.'),
    external: tr('telephonySettings.routeModes.external', 'Calls are treated as external and use external route.'),
    provider: tr('telephonySettings.routeModes.provider', 'Outgoing calls are initiated via selected provider API.'),
    asterisk: tr('telephonySettings.routeModes.asterisk', 'Routing via Asterisk dialplan/AMI.'),
  };

  return (
    <div>
      <Alert
        message={tr('telephonySettings.header.title', 'Телефония: настройка подключений и правил маршрутизации')}
        description={tr('telephonySettings.header.description', 'Заполните поля по шагам: 1) базовая маршрутизация и WebRTC, 2) паттерны маршрутизации, 3) подключения операторов/номеров.')}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Divider orientation="left">{tr('telephonySettings.sections.base', '1. Базовая маршрутизация и WebRTC (STUN/TURN)')}</Divider>
      <Form
        form={settingsForm}
        layout="vertical"
        onFinish={handleSaveSettings}
        style={{ marginBottom: 24 }}
      >
        <Form.Item
          label={tr('telephonySettings.fields.routeMode', 'Call routing mode')}
          name="telephony_route_mode"
          rules={[{ required: true, message: tr('telephonySettings.validation.selectMode', 'Select mode') }]}
          extra={tr('telephonySettings.fields.routeModeExtra', 'Select the primary way to route outgoing calls from CRM.')}
        >
          <Select options={TELEPHONY_ROUTE_MODE_OPTIONS} />
        </Form.Item>

        <Form.Item noStyle dependencies={['telephony_route_mode']}>
          {({ getFieldValue }) => {
            const mode = getFieldValue('telephony_route_mode') || DEFAULT_TELEPHONY_ROUTE_MODE;
            return (
              <Alert
                style={{ marginBottom: 16 }}
                type="warning"
                showIcon
                message={tr('telephonySettings.mode.current', 'Current mode: {{mode}}', { mode })}
                description={routeModeDescription[mode]}
              />
            );
          }}
        </Form.Item>

        <Form.Item
          label={tr('telephonySettings.fields.preferredProvider', 'Preferred provider')}
          name="telephony_provider"
          rules={[{ required: true, message: tr('telephonySettings.validation.selectProvider', 'Select provider') }]}
          extra={tr('telephonySettings.fields.preferredProviderExtra', 'Used in Provider/API mode and as fallback in Auto mode.')}
        >
          <Select options={TELEPHONY_PROVIDER_OPTIONS} />
        </Form.Item>

        <Form.Item
          label={tr('telephonySettings.fields.stunServers', 'STUN servers')}
          name="webrtc_stun_servers"
          tooltip={tr('telephonySettings.fields.stunTooltip', 'One per line or comma-separated. Example: stun:stun.l.google.com:19302')}
          extra={tr('telephonySettings.fields.stunExtra', 'Needed to determine WebRTC client network route.')}
        >
          <Input.TextArea
            rows={3}
            placeholder={'stun:stun.l.google.com:19302\nstun:global.stun.twilio.com:3478'}
          />
        </Form.Item>

        <Form.Item
          label={tr('telephonySettings.fields.enableTurnRelay', 'Enable TURN relay')}
          name="webrtc_turn_enabled"
          valuePropName="checked"
          extra={tr('telephonySettings.fields.turnRelayExtra', 'Recommended for users behind NAT/CGNAT and corporate networks.')}
        >
          <Switch />
        </Form.Item>

        <Form.Item noStyle dependencies={['webrtc_turn_enabled']}>
          {({ getFieldValue }) => (
            <>
              {getFieldValue('webrtc_turn_enabled') ? (
                <>
                  <Form.Item
                    label={tr('telephonySettings.fields.turnServer', 'TURN server')}
                    name="webrtc_turn_server"
                    rules={[{ required: true, message: tr('telephonySettings.validation.enterTurnServer', 'Enter TURN server') }]}
                    extra={tr('telephonySettings.fields.turnServerExtra', 'turn: and turns: (TLS) schemes are supported.')}
                  >
                  <Input placeholder={tr('telephonySettings.placeholders.turnServer', 'turn:turn.company.com:3478?transport=udp')} />
                  </Form.Item>
                  <Form.Item
                    label={tr('telephonySettings.fields.turnUsername', 'TURN username')}
                    name="webrtc_turn_username"
                    rules={[{ required: true, message: tr('telephonySettings.validation.enterTurnUsername', 'Enter TURN username') }]}
                  >
                    <Input placeholder={tr('telephonySettings.placeholders.turnUsername', 'crm_turn_user')} />
                  </Form.Item>
                  <Form.Item
                    label={tr('telephonySettings.fields.turnPassword', 'TURN password')}
                    name="webrtc_turn_password"
                    rules={[{ required: true, message: tr('telephonySettings.validation.enterTurnPassword', 'Enter TURN password') }]}
                  >
                    <Input.Password placeholder={tr('telephonySettings.placeholders.turnPassword', '********')} />
                  </Form.Item>
                </>
              ) : null}
            </>
          )}
        </Form.Item>

        {canManage ? (
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={settingsLoading}>
              {tr('telephonySettings.actions.saveBase', 'Сохранить базовые настройки')}
            </Button>
          </Form.Item>
        ) : null}
      </Form>

      <Divider orientation="left">{tr('telephonySettings.sections.routing', '2. Pattern-based routing')}</Divider>
      <Card
        size="small"
        style={{ marginBottom: 24 }}
        bodyStyle={{ paddingBottom: 8 }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message={tr('telephonySettings.routing.infoTitle', 'Правила работают по приоритету: чем меньше число, тем раньше правило проверяется.')}
            description={tr('telephonySettings.routing.infoDescription', 'Паттерны задаются в формате RegExp и сохраняются в системе телефонии (БД).')}
          />

          <Typography.Text type="secondary">
            {tr('telephonySettings.routing.targetsHint', 'Цели маршрутизации берутся из справочников внутренних номеров и групп.')}
          </Typography.Text>

          <Form form={routingForm} layout="vertical" onFinish={handleSaveRoutingRules}>
            <Form.List name="routing_rules">
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {routingTableLoading ? (
                    <Alert
                      type="info"
                      showIcon
                      message={tr('telephonySettings.routing.loading', 'Загрузка правил маршрутизации...')}
                    />
                  ) : null}

                  {fields.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={tr('telephonySettings.routing.empty', 'Пока нет паттернов. Добавьте первое правило.')}
                    />
                  ) : null}

                  {fields.map((field) => (
                    <Card
                      key={field.key}
                      type="inner"
                      title={tr('telephonySettings.routing.ruleTitle', 'Rule #{{number}}', { number: field.name + 1 })}
                      extra={
                        <Button danger type="link" icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                          {tr('actions.delete', 'Delete')}
                        </Button>
                      }
                    >
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Form.Item name={[field.name, 'id']} hidden>
                          <Input />
                        </Form.Item>

                        <Form.Item
                          label={tr('telephonySettings.routing.fields.ruleName', 'Rule name')}
                          name={[field.name, 'name']}
                          rules={[{ required: true, message: tr('telephonySettings.validation.enterRuleName', 'Specify rule name') }]}
                        >
                          <Input placeholder={tr('telephonySettings.routing.placeholders.ruleName', 'Например: Внутренние 1xx -> PBX')} />
                        </Form.Item>

                        <Form.Item
                          label={tr('telephonySettings.routing.fields.description', 'Description (optional)')}
                          name={[field.name, 'description']}
                        >
                          <Input placeholder={tr('telephonySettings.routing.placeholders.description', 'Кратко опишите бизнес-цель правила')} />
                        </Form.Item>

                        <Form.Item
                          label={tr('telephonySettings.routing.fields.calledPattern', 'Called number pattern (required)')}
                          name={[field.name, 'called_number_pattern']}
                          rules={[
                            { required: true, message: tr('telephonySettings.validation.enterCalledPattern', 'Enter called number pattern') },
                            { validator: regexValidator(tr('telephonySettings.routing.fields.calledPatternLabel', 'Called number pattern')) },
                          ]}
                          extra={(
                            <Space direction="vertical" size={6} style={{ width: '100%' }}>
                              <Typography.Text type="secondary">
                                {tr('telephonySettings.routing.helpers.calledPatternPreset', 'Шаблон: выберите тип номера, чтобы не вводить RegExp вручную')}
                              </Typography.Text>
                              <Select
                                allowClear
                                placeholder={tr('telephonySettings.routing.helpers.selectCalledPreset', 'Выбрать шаблон called pattern')}
                                options={CALLED_PATTERN_PRESETS}
                                onChange={(value) => {
                                  if (value) routingForm.setFieldValue(['routing_rules', field.name, 'called_number_pattern'], value);
                                }}
                              />
                            </Space>
                          )}
                        >
                          <Input placeholder={tr('telephonySettings.routing.placeholders.calledPattern', 'Пример: ^1\\d{2}$ или ^\\+?\\d{10,15}$')} />
                        </Form.Item>

                        <Form.Item
                          label={tr('telephonySettings.routing.fields.callerPattern', 'Caller number pattern (optional)')}
                          name={[field.name, 'caller_id_pattern']}
                          rules={[{ validator: regexValidator(tr('telephonySettings.routing.fields.callerPatternLabel', 'Caller number pattern')) }]}
                          extra={(
                            <Space direction="vertical" size={6} style={{ width: '100%' }}>
                              <Typography.Text type="secondary">
                                {tr('telephonySettings.routing.helpers.callerPatternPreset', 'Шаблон caller id для быстрых сценариев фильтрации')}
                              </Typography.Text>
                              <Select
                                allowClear
                                placeholder={tr('telephonySettings.routing.helpers.selectCallerPreset', 'Выбрать шаблон caller pattern')}
                                options={CALLER_PATTERN_PRESETS}
                                onChange={(value) => {
                                  routingForm.setFieldValue(['routing_rules', field.name, 'caller_id_pattern'], value || '');
                                }}
                              />
                            </Space>
                          )}
                        >
                          <Input placeholder={tr('telephonySettings.routing.placeholders.callerPattern', 'Пример: ^\\+998 или ^8800')} />
                        </Form.Item>

                        <Form.Item
                          label={tr('telephonySettings.routing.fields.action', 'Routing action')}
                          name={[field.name, 'action']}
                          rules={[{ required: true, message: tr('telephonySettings.validation.selectAction', 'Select action') }]}
                        >
                          <Select options={ROUTING_ACTION_OPTIONS.map((item) => ({ ...item, label: tr(`telephonySettings.routing.actions.${item.value}`, item.value) }))} />
                        </Form.Item>

                        <Form.Item noStyle dependencies={[[field.name, 'action']]}>
                          {({ getFieldValue }) => {
                            const action = getFieldValue(['routing_rules', field.name, 'action']);
                            if (action === 'route_to_number') {
                              return (
                                <Form.Item
                                  label={tr('telephonySettings.routing.fields.targetInternalNumber', 'Target internal number')}
                                  name={[field.name, 'target_number']}
                                  rules={[{ required: true, message: tr('telephonySettings.validation.selectInternalNumber', 'Select internal number') }]}
                                >
                                  <Select
                                    showSearch
                                    optionFilterProp="label"
                                    options={internalNumbers.map((item) => ({
                                      value: item.id,
                                      label: `${item.number}${item.display_name ? ` - ${item.display_name}` : ''}`,
                                    }))}
                                    placeholder={tr('telephonySettings.placeholders.selectInternalNumber', 'Select internal number')}
                                  />
                                </Form.Item>
                              );
                            }
                            return null;
                          }}
                        </Form.Item>

                        <Form.Item noStyle dependencies={[[field.name, 'action']]}>
                          {({ getFieldValue }) => {
                            const action = getFieldValue(['routing_rules', field.name, 'action']);
                            if (action === 'route_to_group' || action === 'route_to_queue') {
                              return (
                                <Form.Item
                                  label={action === 'route_to_queue' ? tr('telephonySettings.routing.fields.targetQueueGroup', 'Target queue group') : tr('telephonySettings.routing.fields.targetGroup', 'Target group')}
                                  name={[field.name, 'target_group']}
                                  rules={[{ required: true, message: tr('telephonySettings.validation.selectGroup', 'Select group') }]}
                                >
                                  <Select
                                    showSearch
                                    optionFilterProp="label"
                                    options={numberGroups.map((item) => ({
                                      value: item.id,
                                      label: `${item.name}${item.member_count ? ` (${item.member_count})` : ''}`,
                                    }))}
                                    placeholder={tr('telephonySettings.placeholders.selectGroup', 'Select group')}
                                  />
                                </Form.Item>
                              );
                            }
                            if (action === 'forward_external') {
                              return (
                                <Form.Item
                                  label={tr('telephonySettings.routing.fields.externalNumber', 'External number')}
                                  name={[field.name, 'target_external']}
                                  rules={[
                                    { required: true, message: tr('telephonySettings.validation.enterExternalNumber', 'Enter external number') },
                                    {
                                      pattern: /^\+?[0-9]{7,15}$/,
                                      message: tr('telephonySettings.validation.externalNumberFormat', 'Use international format, for example +998901234567'),
                                    },
                                  ]}
                                >
                                  <Input placeholder={tr('telephonySettings.placeholders.externalNumber', '+998901234567')} />
                                </Form.Item>
                              );
                            }
                            if (action === 'play_announcement') {
                              return (
                                <Form.Item
                                  label={tr('telephonySettings.routing.fields.announcementText', 'Announcement text')}
                                  name={[field.name, 'announcement_text']}
                                  rules={[{ required: true, message: tr('telephonySettings.validation.enterAnnouncementText', 'Enter announcement text') }]}
                                >
                                  <Input.TextArea rows={3} placeholder={tr('telephonySettings.placeholders.announcementText', 'Text that caller will hear')} />
                                </Form.Item>
                              );
                            }
                            return null;
                          }}
                        </Form.Item>

                        <Form.Item
                          label={tr('telephonySettings.routing.fields.timeCondition', 'Time condition (optional)')}
                          name={[field.name, 'time_condition']}
                          extra={tr('telephonySettings.routing.fields.timeConditionExtra', 'For example: weekdays 09:00-18:00')}
                        >
                          <Input placeholder={tr('telephonySettings.placeholders.timeCondition', 'weekdays 09:00-18:00')} />
                        </Form.Item>

                        <Form.Item
                          label={tr('telephonySettings.routing.fields.priority', 'Priority (lower = higher)')}
                          name={[field.name, 'priority']}
                          initialValue={100}
                        >
                          <InputNumber min={1} max={10000} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                          label={tr('telephonySettings.fields.active', 'Active')}
                          name={[field.name, 'active']}
                          valuePropName="checked"
                          initialValue={true}
                        >
                          <Switch />
                        </Form.Item>
                      </Space>
                    </Card>
                  ))}

                  <Space wrap>
                    <Button
                      icon={<PlusCircleOutlined />}
                      onClick={() => add(buildEmptyRoutingRule())}
                    >
                      {tr('telephonySettings.routing.actions.addRule', 'Add rule')}
                    </Button>
                    {canManage ? (
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={routingLoading}
                      >
                        {tr('telephonySettings.routing.actions.savePatternRouting', 'Save pattern routing')}
                      </Button>
                    ) : null}
                  </Space>
                </Space>
              )}
            </Form.List>
          </Form>
        </Space>
      </Card>

      <Divider orientation="left">{tr('telephonySettings.sections.voip', '3. VoIP подключения')}</Divider>
      <div style={{ marginBottom: 16 }}>
        {canManage ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingConnection(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            {tr('telephonySettings.actions.addConnection', 'Добавить подключение')}
          </Button>
        ) : null}
      </div>

      <Table
        columns={columns}
        dataSource={connections}
        rowKey="id"
        loading={tableLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingConnection ? tr('telephonySettings.modal.editConnection', 'Edit connection') : tr('telephonySettings.modal.newConnection', 'New connection')}
        open={modalVisible}
        forceRender
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingConnection(null);
        }}
        footer={null}
        width={600}
      >
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message={tr('telephonySettings.connectionHelp.title', 'Что заполнять?')}
          description={tr('telephonySettings.connectionHelp.description', 'Provider = ваш оператор/АТС. Тип = формат подключения. Номер = внутренний/внешний номер для исходящего вызова. Caller ID = номер, который увидит клиент.')}
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ active: true, type: 'pbx', provider: DEFAULT_TELEPHONY_PROVIDER }}
        >
          <Form.Item
            label={tr('telephonySettings.fields.provider', 'Provider')}
            name="provider"
            rules={[{ required: true, message: tr('telephonySettings.validation.selectProvider', 'Select provider') }]}
            extra={tr('telephonySettings.fields.providerExtra', 'Select platform CRM will use to initiate calls.')}
          >
            <Select placeholder={tr('telephonySettings.placeholders.provider', 'Например: Asterisk / OnlinePBX / Zadarma')} options={TELEPHONY_PROVIDER_OPTIONS} />
          </Form.Item>

          <Form.Item
            label={tr('telephonySettings.fields.connectionType', 'Connection type')}
            name="type"
            rules={[{ required: true, message: tr('telephonySettings.validation.selectType', 'Select type') }]}
            extra={tr('telephonySettings.fields.connectionTypeExtra', 'PBX: internal extension. SIP: SIP account. VoIP: virtual external number.')}
          >
            <Select placeholder={tr('telephonySettings.placeholders.connectionType', 'Выберите тип')}>
              {CONNECTION_TYPE_OPTIONS.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label === 'PBX' ? tr('telephonySettings.options.typePbx', 'PBX extension (internal)') : option.label === 'SIP' ? tr('telephonySettings.options.typeSip', 'SIP account') : tr('telephonySettings.options.typeVoip', 'Virtual external number')}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item noStyle dependencies={['type']}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              const labelByType = {
                pbx: tr('telephonySettings.fields.numberByType.pbx', 'Internal number (extension)'),
                sip: tr('telephonySettings.fields.numberByType.sip', 'SIP number/login'),
                voip: tr('telephonySettings.fields.numberByType.voip', 'External number'),
              };
              const placeholderByType = {
                pbx: tr('telephonySettings.placeholders.numberByType.pbx', 'For example: 101'),
                sip: tr('telephonySettings.placeholders.numberByType.sip', 'For example: 1001 or sip_user_1001'),
                voip: tr('telephonySettings.placeholders.numberByType.voip', 'For example: +998901234567'),
              };

              return (
                <Form.Item
                  label={labelByType[type] || tr('telephonySettings.fields.number', 'Number')}
                  name="number"
                  rules={[
                    { required: true, message: tr('telephonySettings.validation.enterNumber', 'Enter number') },
                    ({ getFieldValue: getFormValue }) => ({
                      validator(_, value) {
                        if (!value) return Promise.resolve();
                        const selectedType = getFormValue('type');
                        const val = String(value).trim();
                        if (selectedType === 'pbx' && !/^[0-9*#]{2,10}$/.test(val)) {
                          return Promise.reject(new Error(tr('telephonySettings.validation.pbxNumberFormat', 'For PBX use extension (2-10 symbols: digits, *, #)')));
                        }
                        if (selectedType === 'voip' && !/^\+?[0-9]{7,15}$/.test(val)) {
                          return Promise.reject(new Error(tr('telephonySettings.validation.voipNumberFormat', 'For external number use international format, e.g. +998901234567')));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Input placeholder={placeholderByType[type] || tr('telephonySettings.placeholders.enterNumber', 'Enter number')} />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item
            label={tr('telephonySettings.fields.callerId', 'Caller ID')}
            name="callerid"
            rules={[{ required: true, message: tr('telephonySettings.validation.enterCallerId', 'Enter caller ID') }]}
            tooltip={tr('telephonySettings.fields.callerIdTooltip', 'Number shown on outgoing calls')}
            extra={tr('telephonySettings.fields.callerIdExtra', 'Usually matches your company external number.')}
          >
            <Input placeholder={tr('telephonySettings.placeholders.callerId', 'Например: +998712001122')} />
          </Form.Item>

          <Form.Item label={tr('telephonySettings.fields.active', 'Active')} name="active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingConnection ? tr('actions.update', 'Update') : tr('actions.create', 'Create')}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setEditingConnection(null);
                }}
              >
                {tr('actions.cancel', 'Cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
