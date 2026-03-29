import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import settingsApi from '../lib/api/settings.js';
import { getLeadSources, getUsers } from '../lib/api/index.js';
import { t } from '../lib/i18n/index.js';

const { Text } = Typography;

const STRATEGY_OPTIONS = [
  { value: 'fixed_owner', label: 'Fixed owner' },
  { value: 'round_robin', label: 'Round robin' },
];

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.results) ? response.results : [];
};

const formatDateTime = (value) => {
  if (!value) return '-';
  return dayjs(value).isValid() ? dayjs(value).format('DD.MM.YYYY HH:mm') : String(value);
};

const normalizeRulePayload = (values) => ({
  name: String(values?.name || '').trim(),
  description: String(values?.description || '').trim(),
  is_active: Boolean(values?.is_active),
  priority: Number(values?.priority || 100),
  strategy: String(values?.strategy || 'fixed_owner'),
  owner: values?.owner || null,
  candidate_users: Array.isArray(values?.candidate_users) ? values.candidate_users.map(Number).filter(Number.isFinite) : [],
  lead_source_ids: Array.isArray(values?.lead_source_ids) ? values.lead_source_ids.map(Number).filter(Number.isFinite) : [],
  keyword_contains: Array.isArray(values?.keyword_contains)
    ? values.keyword_contains.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean)
    : [],
  version: Number(values?.version || 1),
});

function LeadRulesPanel() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [simulationForm] = Form.useForm();
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };

  const [rules, setRules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [modal, setModal] = useState({ open: false, record: null });

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || `#${user.id}`,
      })),
    [users]
  );

  const leadSourceOptions = useMemo(
    () =>
      leadSources.map((item) => ({
        value: item.id,
        label: item.name || item.name_ru || item.name_en || `#${item.id}`,
      })),
    [leadSources]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesResp, templatesResp, sourcesResp, usersResp] = await Promise.all([
        settingsApi.leadRules.list(),
        settingsApi.leadRules.templates(),
        getLeadSources({ limit: 200 }),
        getUsers({ limit: 200 }),
      ]);
      setRules(normalizeList(rulesResp));
      setTemplates(Array.isArray(templatesResp) ? templatesResp : []);
      setLeadSources(normalizeList(sourcesResp));
      setUsers(normalizeList(usersResp));
    } catch (error) {
      message.error(error?.details?.message || error?.message || tr('settingsWorkspace.leadRules.loadError', 'Не удалось загрузить lead rules'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const closeModal = () => {
    setModal({ open: false, record: null });
    form.resetFields();
  };

  const openCreateModal = (template = null) => {
    const templateDefaults = template?.defaults || {};
    const initialValues = {
      name: template?.name || '',
      description: template?.description || '',
      strategy: templateDefaults.strategy || 'fixed_owner',
      priority: templateDefaults.priority || 100,
      is_active: templateDefaults.is_active ?? true,
      owner: null,
      candidate_users: [],
      lead_source_ids: Array.isArray(templateDefaults.lead_source_ids) ? templateDefaults.lead_source_ids : [],
      keyword_contains: Array.isArray(templateDefaults.keyword_contains) ? templateDefaults.keyword_contains : [],
      version: 1,
    };
    setModal({ open: true, record: null });
    form.setFieldsValue(initialValues);
  };

  const openEditModal = (record) => {
    setModal({ open: true, record });
    form.setFieldsValue({
      name: record.name || '',
      description: record.description || '',
      strategy: record.strategy || 'fixed_owner',
      priority: Number(record.priority || 100),
      is_active: Boolean(record.is_active),
      owner: record.owner || null,
      candidate_users: Array.isArray(record.candidate_users) ? record.candidate_users : [],
      lead_source_ids: Array.isArray(record.lead_source_ids) ? record.lead_source_ids : [],
      keyword_contains: Array.isArray(record.keyword_contains) ? record.keyword_contains : [],
      version: Number(record.version || 1),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = normalizeRulePayload(values);
      setSaving(true);

      if (modal.record?.id) {
        await settingsApi.leadRules.patch(modal.record.id, payload);
        message.success(tr('settingsWorkspace.leadRules.updated', 'Правило обновлено'));
      } else {
        await settingsApi.leadRules.create(payload);
        message.success(tr('settingsWorkspace.leadRules.created', 'Правило создано'));
      }

      closeModal();
      await fetchData();
    } catch (error) {
      if (error?.errorFields) return;
      const serverVersionError =
        error?.details?.details?.version ||
        error?.details?.version ||
        error?.details?.message;
      message.error(
        serverVersionError ||
          error?.message ||
          tr('settingsWorkspace.leadRules.saveError', 'Не удалось сохранить правило')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await settingsApi.leadRules.remove(record.id);
      message.success(tr('settingsWorkspace.leadRules.deleted', 'Правило удалено'));
      await fetchData();
    } catch (error) {
      message.error(error?.details?.message || error?.message || tr('settingsWorkspace.leadRules.deleteError', 'Не удалось удалить правило'));
    }
  };

  const handleToggle = async (record) => {
    try {
      await settingsApi.leadRules.toggle(record.id, { version: record.version });
      message.success(tr('settingsWorkspace.leadRules.toggled', 'Статус правила обновлен'));
      await fetchData();
    } catch (error) {
      message.error(
        error?.details?.message ||
          error?.details?.details?.version?.expected ||
          error?.message ||
          tr('settingsWorkspace.leadRules.toggleError', 'Не удалось изменить статус правила')
      );
    }
  };

  const handleSimulate = async () => {
    try {
      const values = await simulationForm.validateFields();
      setSimulating(true);
      const response = await settingsApi.leadRules.simulate({
        lead_source_id: values?.lead_source_id || null,
        first_name: String(values?.first_name || '').trim(),
        middle_name: String(values?.middle_name || '').trim(),
        last_name: String(values?.last_name || '').trim(),
        company_name: String(values?.company_name || '').trim(),
        email: String(values?.email || '').trim(),
        phone: String(values?.phone || '').trim(),
        mobile: String(values?.mobile || '').trim(),
        description: String(values?.description || '').trim(),
      });
      setSimulationResult(response || null);
    } catch (error) {
      if (error?.errorFields) return;
      message.error(
        error?.details?.message
          || error?.message
          || tr('settingsWorkspace.leadRules.simulation.error', 'Не удалось выполнить симуляцию'),
      );
      setSimulationResult(null);
    } finally {
      setSimulating(false);
    }
  };

  const selectedStrategy = Form.useWatch('strategy', form);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={tr('settingsWorkspace.leadRules.title', 'Правила авто-распределения лидов')}
        description={tr(
          'settingsWorkspace.leadRules.description',
          'Создавайте правила по источникам и ключевым словам, используйте fixed owner или round-robin и безопасно управляйте включением/выключением.'
        )}
      />

      <Card
        title={tr('settingsWorkspace.leadRules.templatesTitle', 'Шаблоны политик')}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              {tr('actions.refresh', 'Обновить')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreateModal()}>
              {tr('settingsWorkspace.leadRules.createRule', 'Новое правило')}
            </Button>
          </Space>
        }
      >
        {templates.length ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {templates.map((template) => (
              <Card
                key={template.code}
                size="small"
                title={template.name}
                extra={
                  <Button size="small" onClick={() => openCreateModal(template)}>
                    {tr('settingsWorkspace.leadRules.applyTemplate', 'Использовать')}
                  </Button>
                }
              >
                <Text type="secondary">{template.description}</Text>
              </Card>
            ))}
          </div>
        ) : (
          <Empty description={tr('settingsWorkspace.leadRules.templatesEmpty', 'Шаблоны пока недоступны')} />
        )}
      </Card>

      <Card
        title={tr('settingsWorkspace.leadRules.simulation.title', 'Simulation (dry-run)')}
        extra={(
          <Space>
            <Button
              onClick={() => {
                simulationForm.resetFields();
                setSimulationResult(null);
              }}
            >
              {tr('actions.reset', 'Сбросить')}
            </Button>
            <Button type="primary" onClick={handleSimulate} loading={simulating}>
              {tr('settingsWorkspace.leadRules.simulation.run', 'Запустить симуляцию')}
            </Button>
          </Space>
        )}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message={tr('settingsWorkspace.leadRules.simulation.hintTitle', 'Проверка правила без изменения данных')}
            description={tr(
              'settingsWorkspace.leadRules.simulation.hintDescription',
              'Введите источник и признаки лида, чтобы увидеть, какое правило и какой владелец будут выбраны.',
            )}
          />

          <Form form={simulationForm} layout="vertical">
            <Row gutter={[12, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={tr('settingsWorkspace.leadRules.sources', 'Источники лидов')}
                  name="lead_source_id"
                >
                  <Select allowClear options={leadSourceOptions} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={tr('settingsWorkspace.fields.company', 'Компания')} name="company_name">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label={tr('settingsWorkspace.fields.firstName', 'Имя')} name="first_name">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label={tr('settingsWorkspace.fields.lastName', 'Фамилия')} name="last_name">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label={tr('settingsWorkspace.fields.email', 'Email')} name="email">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={tr('settingsWorkspace.fields.phone', 'Телефон')} name="phone">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={tr('settingsWorkspace.fields.mobile', 'Мобильный')} name="mobile">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label={tr('settingsWorkspace.table.description', 'Описание')} name="description">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          {simulationResult ? (
            <Alert
              type={simulationResult.assignable ? 'success' : simulationResult.matched ? 'warning' : 'info'}
              showIcon
              message={simulationResult.assignable
                ? tr('settingsWorkspace.leadRules.simulation.success', 'Найдено назначение')
                : simulationResult.matched
                  ? tr('settingsWorkspace.leadRules.simulation.partial', 'Правило найдено, но назначение недоступно')
                  : tr('settingsWorkspace.leadRules.simulation.noMatch', 'Совпадений не найдено')}
              description={simulationResult.reason || '-'}
            />
          ) : null}

          {simulationResult ? (
            <Descriptions column={{ xs: 1, md: 2 }} size="small" bordered>
              <Descriptions.Item label={tr('settingsWorkspace.leadRules.simulation.matched', 'Правило')}>
                {simulationResult.rule?.name || tr('settingsWorkspace.common.none', 'Не найдено')}
              </Descriptions.Item>
              <Descriptions.Item label={tr('settingsWorkspace.leadRules.simulation.strategy', 'Стратегия')}>
                {simulationResult.strategy || tr('settingsWorkspace.common.none', 'Не найдено')}
              </Descriptions.Item>
              <Descriptions.Item label={tr('settingsWorkspace.leadRules.simulation.owner', 'Владелец')}>
                {simulationResult.owner?.label || tr('settingsWorkspace.common.none', 'Не назначен')}
              </Descriptions.Item>
              <Descriptions.Item label={tr('settingsWorkspace.leadRules.simulation.priority', 'Приоритет')}>
                {simulationResult.rule?.priority ?? '-'}
              </Descriptions.Item>
            </Descriptions>
          ) : null}
        </Space>
      </Card>

      <Card title={tr('settingsWorkspace.leadRules.rulesTitle', 'Активные правила')}>
        {rules.length === 0 && !loading ? (
          <Empty
            description={tr('settingsWorkspace.leadRules.empty', 'Правил пока нет. Создайте первое правило из пустого экрана.')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreateModal()}>
              {tr('settingsWorkspace.leadRules.createFirst', 'Создать первое правило')}
            </Button>
          </Empty>
        ) : (
          <Table
            size="small"
            loading={loading}
            rowKey={(record) => record.id}
            dataSource={rules}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            columns={[
              {
                title: tr('settingsWorkspace.leadRules.table.priority', 'Приоритет'),
                dataIndex: 'priority',
                key: 'priority',
                width: 100,
              },
              {
                title: tr('settingsWorkspace.table.name', 'Название'),
                key: 'name',
                render: (_, record) => (
                  <Space direction="vertical" size={0}>
                    <Text strong>{record.name}</Text>
                    {record.description ? <Text type="secondary">{record.description}</Text> : null}
                  </Space>
                ),
              },
              {
                title: tr('settingsWorkspace.leadRules.table.matching', 'Условия'),
                key: 'matching',
                render: (_, record) => (
                  <Space size={[4, 4]} wrap>
                    <Tag>
                      {tr('settingsWorkspace.leadRules.sources', 'Источники')}: {Array.isArray(record.lead_source_ids) ? record.lead_source_ids.length : 0}
                    </Tag>
                    <Tag>
                      {tr('settingsWorkspace.leadRules.keywords', 'Ключевые слова')}: {Array.isArray(record.keyword_contains) ? record.keyword_contains.length : 0}
                    </Tag>
                  </Space>
                ),
              },
              {
                title: tr('settingsWorkspace.leadRules.table.strategy', 'Стратегия'),
                key: 'strategy',
                render: (_, record) => (
                  <Tag color={record.strategy === 'round_robin' ? 'processing' : 'default'}>
                    {record.strategy === 'round_robin' ? 'Round robin' : 'Fixed owner'}
                  </Tag>
                ),
              },
              {
                title: tr('settingsWorkspace.leadRules.table.assignee', 'Назначение'),
                key: 'assignee',
                render: (_, record) => {
                  if (record.strategy === 'round_robin') {
                    return (
                      <Space direction="vertical" size={0}>
                        <Text>{tr('settingsWorkspace.leadRules.candidates', 'Кандидатов')}: {Array.isArray(record.candidate_users) ? record.candidate_users.length : 0}</Text>
                        {record.last_assigned_user_display ? (
                          <Text type="secondary">{tr('settingsWorkspace.leadRules.lastAssigned', 'Последний')}: {record.last_assigned_user_display}</Text>
                        ) : null}
                      </Space>
                    );
                  }
                  return <Text>{record.owner_display || '-'}</Text>;
                },
              },
              {
                title: tr('settingsWorkspace.table.status', 'Статус'),
                key: 'is_active',
                width: 130,
                render: (_, record) => (
                  <Switch checked={Boolean(record.is_active)} onChange={() => handleToggle(record)} />
                ),
              },
              {
                title: tr('settingsWorkspace.table.updatedAt', 'Обновлено'),
                dataIndex: 'updated_at',
                key: 'updated_at',
                width: 170,
                render: formatDateTime,
              },
              {
                title: tr('settingsWorkspace.table.actions', 'Действия'),
                key: 'actions',
                width: 150,
                render: (_, record) => (
                  <Space>
                    <Button type="link" onClick={() => openEditModal(record)}>
                      {tr('actions.edit', 'Редактировать')}
                    </Button>
                    <Popconfirm
                      title={tr('settingsWorkspace.leadRules.deleteConfirm', 'Удалить правило?')}
                      okText={tr('actions.delete', 'Удалить')}
                      cancelText={tr('actions.cancel', 'Отмена')}
                      onConfirm={() => handleDelete(record)}
                    >
                      <Button type="link" danger>
                        {tr('actions.delete', 'Удалить')}
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        title={modal.record ? tr('settingsWorkspace.leadRules.editRule', 'Редактирование правила') : tr('settingsWorkspace.leadRules.createRule', 'Новое правило')}
        open={modal.open}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={saving}
        width={760}
      >
        <Form form={form} layout="vertical" initialValues={{ strategy: 'fixed_owner', is_active: true, priority: 100 }}>
          <Form.Item
            label={tr('settingsWorkspace.table.name', 'Название')}
            name="name"
            rules={[{ required: true, message: tr('settingsWorkspace.leadRules.validation.name', 'Введите название правила') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label={tr('settingsWorkspace.table.description', 'Описание')} name="description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large" align="start" wrap>
            <Form.Item
              label={tr('settingsWorkspace.leadRules.table.strategy', 'Стратегия')}
              name="strategy"
              rules={[{ required: true, message: tr('settingsWorkspace.leadRules.validation.strategy', 'Выберите стратегию') }]}
              style={{ minWidth: 240 }}
            >
              <Select options={STRATEGY_OPTIONS} />
            </Form.Item>
            <Form.Item
              label={tr('settingsWorkspace.leadRules.table.priority', 'Приоритет')}
              name="priority"
              style={{ minWidth: 160 }}
            >
              <InputNumber min={1} max={9999} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label={tr('settingsWorkspace.table.status', 'Активно')}
              name="is_active"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Space>

          <Form.Item label={tr('settingsWorkspace.leadRules.sources', 'Источники лидов')} name="lead_source_ids">
            <Select mode="multiple" allowClear options={leadSourceOptions} />
          </Form.Item>

          <Form.Item
            label={tr('settingsWorkspace.leadRules.keywords', 'Ключевые слова')}
            name="keyword_contains"
            extra={tr('settingsWorkspace.leadRules.keywordsHint', 'Введите слова, при наличии которых сработает правило')}
          >
            <Select mode="tags" tokenSeparators={[',', ';']} />
          </Form.Item>

          {selectedStrategy === 'fixed_owner' ? (
            <Form.Item
              label={tr('settingsWorkspace.leadRules.fixedOwner', 'Фиксированный владелец')}
              name="owner"
              rules={[{ required: true, message: tr('settingsWorkspace.leadRules.validation.owner', 'Выберите владельца') }]}
            >
              <Select allowClear options={userOptions} />
            </Form.Item>
          ) : (
            <Form.Item
              label={tr('settingsWorkspace.leadRules.roundRobinCandidates', 'Кандидаты round-robin')}
              name="candidate_users"
              rules={[{ required: true, message: tr('settingsWorkspace.leadRules.validation.candidates', 'Выберите кандидатов') }]}
            >
              <Select mode="multiple" allowClear options={userOptions} />
            </Form.Item>
          )}

          <Form.Item name="version" hidden>
            <InputNumber />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default LeadRulesPanel;
