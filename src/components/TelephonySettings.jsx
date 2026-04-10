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
  Tabs,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import InternalNumbersAdminTable from './telephony/InternalNumbersAdminTable.jsx';
import TelephonyRealtimeSettingsCard from './telephony/TelephonyRealtimeSettingsCard.jsx';
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
  DEFAULT_TELEPHONY_EVENT_MODE,
  DEFAULT_TELEPHONY_PROVIDER,
  TELEPHONY_EVENT_MODE_OPTIONS,
  TELEPHONY_PROVIDER_OPTIONS,
  TELEPHONY_PROVIDER_TAG_COLORS,
  TELEPHONY_ROUTE_MODE_OPTIONS,
} from '../lib/telephony/constants.js';

const FREEPBX_MAIN_QUEUE_NUMBER = '0553636';
const FREEPBX_AGENT_EXTENSION_REGEX = /^2(?:0\d|1\d)$/;
const BRIDGE_ROUTE_MODE = 'bridge';

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
  { value: '^2(?:0\\d|1\\d)$', label: 'Операторы FreePBX (200-219)' },
  { value: `^${FREEPBX_MAIN_QUEUE_NUMBER}$`, label: `Основная очередь ${FREEPBX_MAIN_QUEUE_NUMBER}` },
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
  name: `Queue ${FREEPBX_MAIN_QUEUE_NUMBER}`,
  description: 'Основной inbound маршрут FreePBX Bridge',
  called_number_pattern: `^${FREEPBX_MAIN_QUEUE_NUMBER}$`,
  caller_id_pattern: '',
  time_condition: '',
  action: 'route_to_queue',
  target_number: undefined,
  target_group: undefined,
  target_external: '',
  announcement_text: '',
  priority: 10,
  active: true,
});

const BRIDGE_ROUTE_MODE_OPTIONS = TELEPHONY_ROUTE_MODE_OPTIONS.filter(
  (option) => String(option?.value || '').toLowerCase() === BRIDGE_ROUTE_MODE
);

function isPreferredFreePbxExtension(value) {
  return FREEPBX_AGENT_EXTENSION_REGEX.test(String(value || '').trim());
}

function getBridgeProviderOptions(currentProvider) {
  const primaryProvider = String(DEFAULT_TELEPHONY_PROVIDER || '').trim();
  const baseOptions = TELEPHONY_PROVIDER_OPTIONS.filter(
    (option) => String(option?.value || '').trim() === primaryProvider
  );

  if (!currentProvider || currentProvider === primaryProvider) return baseOptions;

  return [
    {
      value: currentProvider,
      label: `${currentProvider} (legacy)`,
      disabled: true,
    },
    ...baseOptions,
  ];
}

function getBridgeTypeOptions() {
  const bridgeOption = CONNECTION_TYPE_OPTIONS.find((option) => option.value === 'sip');
  return bridgeOption
    ? [{ ...bridgeOption, label: 'PBX Bridge (FreePBX external)' }]
    : [{ value: 'sip', label: 'PBX Bridge (FreePBX external)' }];
}

function getPreferredInternalNumbers(numbers = []) {
  const preferred = numbers.filter((item) => isPreferredFreePbxExtension(item?.number));
  return preferred.length > 0 ? preferred : numbers;
}

function getPrioritizedNumberGroups(groups = []) {
  return [...groups].sort((left, right) => {
    const leftScore = String(left?.name || '').includes(FREEPBX_MAIN_QUEUE_NUMBER) ? 1 : 0;
    const rightScore = String(right?.name || '').includes(FREEPBX_MAIN_QUEUE_NUMBER) ? 1 : 0;
    return rightScore - leftScore;
  });
}

function validateCallerId(_, value) {
  const normalized = String(value || '').trim();
  if (!normalized) return Promise.resolve();
  if (/^(?:\+?[0-9]{7,15}|0[0-9]{6,15})$/.test(normalized)) return Promise.resolve();
  return Promise.reject(
    new Error(
      `Укажите Caller ID в цифровом формате. Для текущего FreePBX допускается, например, ${FREEPBX_MAIN_QUEUE_NUMBER} или номер в E.164.`
    )
  );
}

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

export default function TelephonySettings({ onSuccess, onDirtyChange }) {
  const { message } = App.useApp();
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
  // Разрешаем управление, если есть явный пермишн ИЛИ базовые права записи (admin/manager)
  const canManage = canWrite('voip.change_connection') || canWrite();
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
  const [activeTab, setActiveTab] = useState('base');
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [routingDirty, setRoutingDirty] = useState(false);
  const bridgeProviderOptions = getBridgeProviderOptions(editingConnection?.provider);
  const bridgeTypeOptions = getBridgeTypeOptions();
  const preferredInternalNumbers = getPreferredInternalNumbers(internalNumbers);
  const prioritizedNumberGroups = getPrioritizedNumberGroups(numberGroups);

  useEffect(() => {
    loadProfileSettings();
    loadConnections();
    loadRoutingSettings();
    loadRoutingTargets();
  }, []);

  useEffect(() => {
    onDirtyChange?.(settingsDirty || routingDirty);
  }, [settingsDirty, routingDirty, onDirtyChange]);

  useEffect(() => {
    return () => {
      onDirtyChange?.(false);
    };
  }, [onDirtyChange]);

  const loadProfileSettings = async () => {
    setSettingsLoading(true);
    try {
      const profile = await getVoipSystemSettings();
      settingsForm.setFieldsValue({
        incoming_enabled: profile.incoming_enabled !== false,
        incoming_poll_interval_ms: Number(profile.incoming_poll_interval_ms || 4000),
        incoming_popup_ttl_ms: Number(profile.incoming_popup_ttl_ms || 20000),
        telephony_route_mode: BRIDGE_ROUTE_MODE,
        telephony_event_mode: profile.telephony_event_mode || DEFAULT_TELEPHONY_EVENT_MODE,
        telephony_provider: profile.telephony_provider || DEFAULT_TELEPHONY_PROVIDER,
        webrtc_stun_servers: profile.webrtc_stun_servers || DEFAULT_STUN_SERVERS,
        forward_unknown_calls: !!profile.forward_unknown_calls,
        forward_url: profile.forward_url || '',
        forwarding_allowed_ip: profile.forwarding_allowed_ip || '',
      });
      setSettingsDirty(false);
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
      setRoutingDirty(false);
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
      const list = Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response)
          ? response
          : [];
      setConnections(list);
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
        sip_server: values.type === 'sip' ? String(values.sip_server || '').trim() : '',
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
        incoming_enabled: !!values.incoming_enabled,
        incoming_poll_interval_ms: Number(values.incoming_poll_interval_ms || 4000),
        incoming_popup_ttl_ms: Number(values.incoming_popup_ttl_ms || 20000),
        telephony_route_mode: BRIDGE_ROUTE_MODE,
        telephony_event_mode: values.telephony_event_mode || DEFAULT_TELEPHONY_EVENT_MODE,
        telephony_provider: values.telephony_provider || DEFAULT_TELEPHONY_PROVIDER,
        webrtc_stun_servers: values.webrtc_stun_servers || '',
        forward_unknown_calls: !!values.forward_unknown_calls,
        forward_url: values.forward_unknown_calls ? String(values.forward_url || '').trim() : '',
        forwarding_allowed_ip: String(values.forwarding_allowed_ip || '').trim(),
      });
      message.success(tr('telephonySettings.messages.settingsSaved', 'Настройки телефонии сохранены'));
      setSettingsDirty(false);
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
      setRoutingDirty(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving routing rules:', error);
      message.error(tr('telephonySettings.messages.routingSaveError', 'Не удалось сохранить правила маршрутизации'));
    } finally {
      setRoutingLoading(false);
    }
  };

  const openCreateConnectionModal = () => {
    setEditingConnection(null);
    form.resetFields();
    setModalVisible(true);
  };

  const addRoutingRuleFromFooter = () => {
    const current = routingForm.getFieldValue('routing_rules') || [];
    routingForm.setFieldValue('routing_rules', [...current, buildEmptyRoutingRule()]);
    setRoutingDirty(true);
  };


  const columns = [
    {
      title: tr('telephonySettings.table.provider', 'Провайдер'),
      dataIndex: 'provider',
      key: 'provider',
      width: 140,
      render: (provider) => <Tag color={TELEPHONY_PROVIDER_TAG_COLORS[provider] || 'default'}>{provider}</Tag>,
    },
    {
      title: tr('telephonySettings.table.type', 'Тип'),
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type) => {
        const colors = { sip: 'blue' };
        const labels = {
          sip: tr('telephonySettings.types.bridge', 'PBX Bridge'),
        };
        return <Tag color={colors[type] || 'default'}>{labels[type] || String(type || '').toUpperCase()}</Tag>;
      },
    },
    {
      title: tr('telephonySettings.table.number', 'Номер'),
      dataIndex: 'number',
      key: 'number',
      width: 140,
      render: (value, record) => {
        const normalized = String(value || '').trim();
        if (!normalized) return '—';
        if (record?.type === 'sip') {
          return (
            <Space wrap size={[6, 4]}>
              <span>{normalized}</span>
              <Tag color={isPreferredFreePbxExtension(normalized) ? 'success' : 'warning'}>
                {isPreferredFreePbxExtension(normalized) ? '200-219' : 'check range'}
              </Tag>
            </Space>
          );
        }
        return normalized;
      },
    },
    {
      title: tr('telephonySettings.table.sipServer', 'SIP сервер'),
      dataIndex: 'sip_server',
      key: 'sip_server',
      width: 160,
      render: (value, record) => (record.type === 'sip' ? value || '—' : '—'),
    },
    {
      title: tr('telephonySettings.table.callerId', 'Номер отображения'),
      dataIndex: 'callerid',
      key: 'callerid',
      width: 180,
      render: (value) => {
        const normalized = String(value || '').trim();
        if (!normalized) return '—';
        return (
          <Space wrap size={[6, 4]}>
            <span>{normalized}</span>
            {normalized === FREEPBX_MAIN_QUEUE_NUMBER ? <Tag color="processing">queue DID</Tag> : null}
          </Space>
        );
      },
    },
    {
      title: tr('telephonySettings.table.owner', 'Владелец'),
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 140,
      render: (name) => name || '-',
    },
    {
      title: tr('telephonySettings.table.status', 'Статус'),
      dataIndex: 'active',
      key: 'active',
      width: 120,
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? tr('telephonySettings.status.active', 'Активно') : tr('telephonySettings.status.inactive', 'Неактивно')}
        </Tag>
      ),
    },
    {
      title: tr('telephonySettings.table.actions', 'Действия'),
      key: 'actions',
      width: 320,
      render: (_, record) => (
        <Space wrap size={[6, 4]}>
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
    bridge: tr('telephonySettings.routeModes.bridge', 'FreePBX is connected through PBX Bridge. Browser UI manages only safe routing/runtime flags; PBX secrets stay server-side.'),
  };

  const tabsItems = [
    {
      key: 'base',
      label: (
        <Space size={6}>
          <span>{tr('telephonySettings.tabs.base', 'Базовые настройки')}</span>
          {settingsDirty ? <Badge status="warning" text={tr('telephonySettings.tabs.unsaved', 'Не сохранено')} /> : null}
        </Space>
      ),
      children: (
        <>
          <Alert
            style={{ marginBottom: 16 }}
            type="info"
            showIcon
            message={tr('telephonySettings.tabs.baseTitle', 'Шаг 1: Базовые параметры интеграции')}
            description={tr('telephonySettings.tabs.baseDescription', 'Укажите режим bridge, параметры входящего popup и правила переадресации неизвестных звонков.')}
          />

          <Form
            form={settingsForm}
            layout="vertical"
            onFinish={handleSaveSettings}
            onValuesChange={() => setSettingsDirty(true)}
            style={{ marginBottom: 8 }}
          >
            <Form.Item
              label={tr('telephonySettings.fields.routeMode', 'Call routing mode')}
              name="telephony_route_mode"
              rules={[{ required: true, message: tr('telephonySettings.validation.selectMode', 'Select mode') }]}
              extra={tr('telephonySettings.fields.routeModeExtra', 'Для этого deployment режим фиксирован: CRM разговаривает с FreePBX через bridge/backend connector.')}
            >
              <Select options={BRIDGE_ROUTE_MODE_OPTIONS} disabled />
            </Form.Item>

            <Form.Item
              label={tr('telephonySettings.fields.eventMode', 'Event integration mode')}
              name="telephony_event_mode"
              rules={[{ required: true, message: tr('telephonySettings.validation.selectEventMode', 'Select event mode') }]}
              extra={tr('telephonySettings.fields.eventModeExtra', 'bridge: события приходят через Go bridge webhook. ami: ingest идёт только через прямой AMI listener.')}
            >
              <Select options={TELEPHONY_EVENT_MODE_OPTIONS} disabled={!canManage} />
            </Form.Item>

            <Form.Item noStyle dependencies={['telephony_route_mode']}>
              {({ getFieldValue }) => {
                const mode = getFieldValue('telephony_route_mode') || BRIDGE_ROUTE_MODE;
                return (
                  <Alert
                    style={{ marginBottom: 16 }}
                    type="success"
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
              extra={tr('telephonySettings.fields.preferredProviderExtra', 'Provider фиксирован на Asterisk/FreePBX. Секреты bridge connector хранятся только на сервере.' )}
            >
              <Select options={bridgeProviderOptions} disabled />
            </Form.Item>

            <Alert
              style={{ marginBottom: 16 }}
              type="warning"
              showIcon
              message={tr('telephonySettings.bridgeSecrets.title', 'PBX secret fields intentionally hidden')}
              description={tr('telephonySettings.bridgeSecrets.description', 'AMI host/user/secret, FreePBX bridge auth, WSS/TURN credentials and other sensitive runtime secrets must be managed on the bridge/backend host. Browser admins should not see or rotate them from this screen.')}
            />

            <Divider orientation="left">{tr('telephonySettings.sections.incomingRealtime', 'Incoming popup и safe realtime settings')}</Divider>

            <Form.Item
              label={tr('telephonySettings.fields.incomingEnabled', 'Enable incoming call popup')}
              name="incoming_enabled"
              valuePropName="checked"
              extra={tr('telephonySettings.fields.incomingEnabledExtra', 'Используйте для операторов 200-219, которым CRM должен показывать realtime popup по bridge-событиям.')}
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label={tr('telephonySettings.fields.incomingPollInterval', 'Incoming polling interval (ms)')}
              name="incoming_poll_interval_ms"
              rules={[{ required: true, message: tr('telephonySettings.validation.enterIncomingPollInterval', 'Enter polling interval') }]}
            >
              <InputNumber min={500} max={60000} step={100} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label={tr('telephonySettings.fields.incomingPopupTtl', 'Incoming popup lifetime (ms)')}
              name="incoming_popup_ttl_ms"
              rules={[{ required: true, message: tr('telephonySettings.validation.enterIncomingPopupTtl', 'Enter popup lifetime') }]}
            >
              <InputNumber min={1000} max={120000} step={1000} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label={tr('telephonySettings.fields.stunServers', 'STUN servers')}
              name="webrtc_stun_servers"
              tooltip={tr('telephonySettings.fields.stunTooltip', 'One per line or comma-separated. Example: stun:stun.l.google.com:19302')}
              extra={tr('telephonySettings.fields.stunExtra', 'Нужны только browser-safe STUN адреса. TURN/WSS credentials остаются server-side вместе с bridge deployment.')}
            >
              <Input.TextArea
                rows={3}
                placeholder={'stun:stun.l.google.com:19302\nstun:global.stun.twilio.com:3478'}
              />
            </Form.Item>

            <Divider orientation="left">{tr('telephonySettings.sections.forwarding', 'Unknown caller forwarding')}</Divider>

            <Form.Item
              label={tr('telephonySettings.fields.forwardUnknownCalls', 'Forward unknown callers')}
              name="forward_unknown_calls"
              valuePropName="checked"
              extra={tr('telephonySettings.fields.forwardUnknownCallsExtra', 'Send webhook payload when CRM cannot match caller to lead/contact/client.')}
            >
              <Switch />
            </Form.Item>

            <Form.Item noStyle dependencies={['forward_unknown_calls']}>
              {({ getFieldValue }) => (
                <>
                  {getFieldValue('forward_unknown_calls') ? (
                    <Form.Item
                      label={tr('telephonySettings.fields.forwardUrl', 'Forward webhook URL')}
                      name="forward_url"
                      rules={[
                        { required: true, message: tr('telephonySettings.validation.enterForwardUrl', 'Enter webhook URL') },
                        { type: 'url', message: tr('telephonySettings.validation.invalidForwardUrl', 'Enter valid URL (https://...)') },
                      ]}
                    >
                      <Input placeholder={tr('telephonySettings.placeholders.forwardUrl', 'https://hooks.example.com/telephony/unknown-call')} />
                    </Form.Item>
                  ) : null}
                </>
              )}
            </Form.Item>

            <Form.Item
              label={tr('telephonySettings.fields.forwardingAllowedIp', 'Allowed source IP/CIDR (optional)')}
              name="forwarding_allowed_ip"
            >
              <Input placeholder={tr('telephonySettings.placeholders.forwardingAllowedIp', '10.0.0.5 or 10.0.0.0/24')} />
            </Form.Item>

          </Form>
        </>
      ),
    },
    {
      key: 'realtime',
      label: tr('telephonySettings.tabs.realtime', 'Realtime и номера'),
      children: (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message={tr('telephonySettings.tabs.realtimeTitle', 'Шаг 2: Realtime и внутренние номера')}
            description={tr('telephonySettings.tabs.realtimeDescription', 'Проверьте WebSocket-настройки и назначьте операторам корректные внутренние номера (200-219).')}
          />
          <Divider orientation="left">WebSocket и realtime</Divider>
          <TelephonyRealtimeSettingsCard canManage={canManage} onSuccess={onSuccess} />
          <Divider orientation="left">Внутренние номера пользователей</Divider>
          <InternalNumbersAdminTable canManage={canManage} onSuccess={onSuccess} />
        </Space>
      ),
    },
    {
      key: 'routing',
      label: (
        <Space size={6}>
          <span>{tr('telephonySettings.tabs.routing', 'Маршрутизация')}</span>
          {routingDirty ? <Badge status="warning" text={tr('telephonySettings.tabs.unsaved', 'Не сохранено')} /> : null}
        </Space>
      ),
      children: (
        <Card
          size="small"
          style={{ marginBottom: 8 }}
          bodyStyle={{ paddingBottom: 8 }}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message={tr('telephonySettings.routing.infoTitle', 'Правила работают по приоритету: чем меньше число, тем раньше правило проверяется.')}
              description={tr('telephonySettings.routing.infoDescription', `Для этого deployment основной inbound DID/queue — ${FREEPBX_MAIN_QUEUE_NUMBER}. Прямые agent routes должны вести только на extensions 200-219.`)}
            />

            <Typography.Text type="secondary">
              {tr('telephonySettings.routing.targetsHint', 'Цели маршрутизации берутся из CRM-справочников внутренних номеров и групп. При наличии 200-219 они будут предложены первыми.')}
            </Typography.Text>

            <Form
              form={routingForm}
              layout="vertical"
              onFinish={handleSaveRoutingRules}
              onValuesChange={() => setRoutingDirty(true)}
            >
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
                            <Input placeholder={tr('telephonySettings.routing.placeholders.ruleName', `Например: Очередь ${FREEPBX_MAIN_QUEUE_NUMBER} -> группа поддержки`)} />
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
                                      options={preferredInternalNumbers.map((item) => ({
                                        value: item.id,
                                        label: `${item.number}${item.display_name ? ` - ${item.display_name}` : ''}${isPreferredFreePbxExtension(item.number) ? ' (200-219)' : ''}`,
                                      }))}
                                      placeholder={tr('telephonySettings.placeholders.selectInternalNumber', 'Select internal number (200-219 preferred)')}
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
                                      options={prioritizedNumberGroups.map((item) => ({
                                        value: item.id,
                                        label: `${item.name}${item.member_count ? ` (${item.member_count})` : ''}${String(item.name || '').includes(FREEPBX_MAIN_QUEUE_NUMBER) ? ` - ${FREEPBX_MAIN_QUEUE_NUMBER}` : ''}`,
                                      }))}
                                      placeholder={tr('telephonySettings.placeholders.selectGroup', `Select group (queue ${FREEPBX_MAIN_QUEUE_NUMBER} first)`)}
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
                    </Space>
                  </Space>
                )}
              </Form.List>
            </Form>
          </Space>
        </Card>
      ),
    },
    {
      key: 'connections',
      label: tr('telephonySettings.tabs.connections', 'VoIP подключения'),
      children: (
        <>
          <Alert
            style={{ marginBottom: 16 }}
            type="info"
            showIcon
            message={tr('telephonySettings.tabs.connectionsTitle', 'Шаг 4: Подключения операторов')}
            description={tr('telephonySettings.tabs.connectionsDescription', 'Добавляйте подключения только в режиме PBX Bridge и используйте реальные extension для операторов.')}
          />
          <div style={{ marginBottom: 16 }}>
            {canManage ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateConnectionModal}
              >
                {tr('telephonySettings.actions.addConnection', 'Добавить подключение')}
              </Button>
            ) : null}
          </div>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <Table
              columns={columns}
              dataSource={connections}
              rowKey="id"
              loading={tableLoading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1290 }}
            />
          </div>
        </>
      ),
    },
  ];

  return (
    <div>
      <Alert
        message={tr('telephonySettings.header.title', 'FreePBX Bridge: безопасная browser-конфигурация')}
        description={tr('telephonySettings.header.description', 'Этот экран рассчитан на bridge-first deployment: основные inbound маршруты идут через очередь 0553636, а рабочие agent extensions находятся в диапазоне 200-219. PBX/AMI/WSS секреты из браузера скрыты.')}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabsItems}
        size="large"
        destroyInactiveTabPane={false}
      />

      <Card
        size="small"
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 20,
          marginTop: 8,
          marginBottom: 12,
          borderRadius: 10,
          boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
        }}
        bodyStyle={{ padding: '10px 12px' }}
      >
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Typography.Text type="secondary">
            {activeTab === 'base' && tr('telephonySettings.footer.baseHint', 'Шаг 1: сохраните базовые параметры интеграции')}
            {activeTab === 'realtime' && tr('telephonySettings.footer.realtimeHint', 'Шаг 2: проверьте realtime и внутренние номера')}
            {activeTab === 'routing' && tr('telephonySettings.footer.routingHint', 'Шаг 3: управляйте правилами маршрутизации и сохраните изменения')}
            {activeTab === 'connections' && tr('telephonySettings.footer.connectionsHint', 'Шаг 4: добавьте/обновите подключения операторов')}
          </Typography.Text>

          <Space wrap>
            {activeTab === 'base' && canManage ? (
              <>
                {settingsDirty ? (
                  <Button
                    icon={<ReloadOutlined />}
                    loading={settingsLoading}
                    onClick={loadProfileSettings}
                  >
                    {tr('actions.reset', 'Сбросить')}
                  </Button>
                ) : null}
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={settingsLoading}
                  onClick={() => settingsForm.submit()}
                >
                  {tr('telephonySettings.actions.saveBase', 'Сохранить базовые настройки')}
                </Button>
              </>
            ) : null}

            {activeTab === 'realtime' ? (
              <Button onClick={() => setActiveTab('connections')}>
                {tr('telephonySettings.footer.goConnections', 'Перейти к подключениям')}
              </Button>
            ) : null}

            {activeTab === 'routing' ? (
              <>
                {canManage ? (
                  <>
                    {routingDirty ? (
                      <Button
                        icon={<ReloadOutlined />}
                        loading={routingLoading || routingTableLoading}
                        onClick={loadRoutingSettings}
                      >
                        {tr('actions.reset', 'Сбросить')}
                      </Button>
                    ) : null}
                    <Button icon={<PlusCircleOutlined />} onClick={addRoutingRuleFromFooter}>
                      {tr('telephonySettings.routing.actions.addRule', 'Add rule')}
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={routingLoading}
                      onClick={() => routingForm.submit()}
                    >
                      {tr('telephonySettings.routing.actions.savePatternRouting', 'Save pattern routing')}
                    </Button>
                  </>
                ) : null}
              </>
            ) : null}

            {activeTab === 'connections' ? (
              <>
                <Button icon={<ReloadOutlined />} onClick={loadConnections} loading={tableLoading}>
                  {tr('actions.refresh', 'Обновить')}
                </Button>
                {canManage ? (
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateConnectionModal}>
                    {tr('telephonySettings.actions.addConnection', 'Добавить подключение')}
                  </Button>
                ) : null}
              </>
            ) : null}
          </Space>
        </Space>
      </Card>

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
          description={tr('telephonySettings.connectionHelp.description', `Новые подключения создавайте только в режиме PBX Bridge для внешнего FreePBX. Рабочий диапазон agent extensions: 200-219. Основная очередь/DID: ${FREEPBX_MAIN_QUEUE_NUMBER}.`)}
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          onValuesChange={(changedValues) => {
            if (changedValues.type && changedValues.type !== 'sip') {
              form.setFieldsValue({ sip_server: '' });
            }
          }}
          initialValues={{ active: true, type: 'sip', provider: DEFAULT_TELEPHONY_PROVIDER }}
        >
          <Form.Item
            label={tr('telephonySettings.fields.provider', 'Provider')}
            name="provider"
            rules={[{ required: true, message: tr('telephonySettings.validation.selectProvider', 'Select provider') }]}
            extra={tr('telephonySettings.fields.providerExtra', 'Провайдер фиксирован на Asterisk/FreePBX bridge deployment.')}
          >
            <Select
              placeholder={tr('telephonySettings.placeholders.provider', 'Asterisk')}
              options={bridgeProviderOptions}
              disabled
            />
          </Form.Item>

          <Form.Item
            label={tr('telephonySettings.fields.connectionType', 'Connection type')}
            name="type"
            rules={[{ required: true, message: tr('telephonySettings.validation.selectType', 'Select type') }]}
            extra={tr('telephonySettings.fields.connectionTypeExtra', 'Для новых подключений используйте только PBX Bridge.')}
          >
            <Select placeholder={tr('telephonySettings.placeholders.connectionType', 'Выберите тип')}>
              {bridgeTypeOptions.map((option) => (
                <Select.Option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item noStyle dependencies={['type']}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              const hintType = type === 'sip' ? 'warning' : 'info';
              const fallback = type === 'sip'
                ? `PBX Bridge режим: укажите только безопасные browser-side поля. SIP/AMI/WSS secret material остаётся на сервере bridge worker.`
                : `Legacy embedded режим найден в старой записи. Новые FreePBX подключения должны мигрировать в bridge flow.`;
              return (
                <Alert
                  style={{ marginBottom: 16 }}
                  type={hintType}
                  showIcon
                  message={tr('telephonySettings.connectionHelp.providerTypeHint', fallback)}
                />
              );
            }}
          </Form.Item>

          <Form.Item noStyle dependencies={['type']}>
            {({ getFieldValue }) => {
              if (getFieldValue('type') !== 'sip') return null;
              return (
                <Form.Item
                  label={tr('telephonySettings.fields.sipServer', 'SIP сервер')}
                  name="sip_server"
                  rules={[
                    { required: true, message: tr('telephonySettings.validation.enterSipServer', 'Введите SIP сервер') },
                    {
                      validator: (_, value) => {
                        const val = String(value || '').trim();
                        if (!val) return Promise.resolve();
                        if (/^[a-zA-Z0-9.-]+(?::\d{2,5})?$/.test(val)) return Promise.resolve();
                        return Promise.reject(new Error(tr('telephonySettings.validation.invalidSipServer', 'Формат SIP сервера: host или host:port')));
                      },
                    },
                  ]}
                  extra={tr('telephonySettings.fields.sipServerExtra', 'Укажите FreePBX/PJSIP host, который использует bridge worker, например pbx.company.uz или pbx.company.uz:5060')}
                >
                  <Input placeholder={tr('telephonySettings.placeholders.sipServer', 'Например: pbx.company.uz:5060')} />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item noStyle dependencies={['type']}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              const labelByType = {
                pbx: tr('telephonySettings.fields.numberByType.pbx', 'Legacy extension (migration only)'),
                sip: tr('telephonySettings.fields.numberByType.sip', 'Agent extension / SIP login'),
                voip: tr('telephonySettings.fields.numberByType.voip', 'External number'),
              };
              const placeholderByType = {
                pbx: tr('telephonySettings.placeholders.numberByType.pbx', 'Legacy example: 101'),
                sip: tr('telephonySettings.placeholders.numberByType.sip', 'Use a real FreePBX extension from 200 to 219'),
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
                        if (selectedType === 'sip' && !isPreferredFreePbxExtension(val)) {
                          return Promise.reject(new Error(`Используйте реальный agent extension FreePBX из диапазона 200-219. Очередь ${FREEPBX_MAIN_QUEUE_NUMBER} задаётся в routing rules, а не в operator connection.`));
                        }
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
            rules={[
              { required: true, message: tr('telephonySettings.validation.enterCallerId', 'Enter caller ID') },
              { validator: validateCallerId },
            ]}
            tooltip={tr('telephonySettings.fields.callerIdTooltip', 'Number shown on outgoing calls')}
            extra={tr('telephonySettings.fields.callerIdExtra', `Обычно это ваш основной DID. Для текущего deployment допустимо использовать ${FREEPBX_MAIN_QUEUE_NUMBER} или внешний номер в E.164.`)}
          >
            <Input placeholder={tr('telephonySettings.placeholders.callerId', `Например: ${FREEPBX_MAIN_QUEUE_NUMBER} или +998712001122`)} />
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
