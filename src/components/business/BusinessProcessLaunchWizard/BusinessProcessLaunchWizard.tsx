import { DeleteOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Descriptions, Empty, Form, Input, InputNumber, Modal, Radio, Select, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo } from 'react';
import type { BusinessProcessLaunchPayload, BusinessProcessLaunchWizardProps } from './interface';
import './index.css';

const { Text } = Typography;

const CONTEXT_TYPE_OPTIONS = [
  { label: 'Без привязки', value: 'none' },
  { label: 'Лид', value: 'lead' },
  { label: 'Сделка', value: 'deal' },
  { label: 'Компания', value: 'company' },
];

const ATTRIBUTE_FIELD_OPTIONS = [
  { label: 'priority', value: 'priority', valueType: 'text' },
  { label: 'channel', value: 'channel', valueType: 'text' },
  { label: 'customer.segment', value: 'customer.segment', valueType: 'text' },
  { label: 'customer.region', value: 'customer.region', valueType: 'text' },
  { label: 'customer.tier', value: 'customer.tier', valueType: 'text' },
  { label: 'deal.amount', value: 'deal.amount', valueType: 'number' },
  { label: 'deal.stage', value: 'deal.stage', valueType: 'text' },
];

const QUICK_CONTEXT_PRESETS = [
  {
    key: 'high-priority',
    label: 'Высокий приоритет',
    attributes: [{ path: 'priority', value: 'high' }],
  },
  {
    key: 'online-channel',
    label: 'Онлайн-канал',
    attributes: [{ path: 'channel', value: 'online' }],
  },
  {
    key: 'vip-segment',
    label: 'VIP сегмент',
    attributes: [{ path: 'customer.segment', value: 'vip' }],
  },
];

function setNestedValue(target: Record<string, any>, path: string, value: any) {
  const chunks = String(path || '')
    .split('.')
    .map((item) => item.trim())
    .filter(Boolean);
  if (!chunks.length) return;
  let current = target;
  chunks.forEach((chunk, index) => {
    if (index === chunks.length - 1) {
      current[chunk] = value;
      return;
    }
    if (!current[chunk] || typeof current[chunk] !== 'object' || Array.isArray(current[chunk])) {
      current[chunk] = {};
    }
    current = current[chunk];
  });
}

function buildEntitySnapshot(contextType: string, entity: Record<string, any> | undefined) {
  if (!entity || !contextType || contextType === 'none') return {};
  if (contextType === 'lead') {
    return {
      lead: {
        id: entity.id,
        full_name: entity.full_name || '',
        company_name: entity.company_name || '',
        status: entity.status || '',
      },
    };
  }
  if (contextType === 'deal') {
    return {
      deal: {
        id: entity.id,
        name: entity.name || '',
        amount: entity.amount === null || entity.amount === undefined || entity.amount === '' ? null : Number(entity.amount),
        stage: entity.stage_name || '',
        company_name: entity.company_name || '',
      },
    };
  }
  if (contextType === 'company') {
    return {
      company: {
        id: entity.id,
        full_name: entity.full_name || '',
        email: entity.email || '',
        phone: entity.phone || '',
      },
    };
  }
  return {};
}

function mergePayload(base: Record<string, any>, additions: Array<Record<string, any>>) {
  return additions.reduce((acc, item) => {
    Object.entries(item || {}).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        acc[key] = { ...(acc[key] || {}), ...value };
      } else {
        acc[key] = value;
      }
    });
    return acc;
  }, { ...base });
}

function normalizeAttributeValue(path: string, value: any) {
  const option = ATTRIBUTE_FIELD_OPTIONS.find((item) => item.value === path);
  if (option?.valueType === 'number') {
    return value === null || value === undefined || value === '' ? null : Number(value);
  }
  return value === null || value === undefined ? '' : String(value);
}

function formatTransitionRule(rule: Record<string, any> | undefined) {
  if (!rule || !Object.keys(rule).length) return 'Переход без условия';
  if (rule.operator === 'exists') return `${rule.field} существует`;
  if (rule.operator === 'not_exists') return `${rule.field} отсутствует`;
  return `${rule.field} ${rule.operator} ${String(rule.value ?? '')}`.trim();
}

export default function BusinessProcessLaunchWizard({
  open,
  loading = false,
  submitting = false,
  template,
  entityOptionsByType,
  initialContext,
  onCancel,
  onSubmit,
}: BusinessProcessLaunchWizardProps) {
  const [form] = Form.useForm();
  const contextType = Form.useWatch('context_type', form) || 'none';
  const contextId = Form.useWatch('context_id', form);
  const attributes = Form.useWatch('attributes', form) || [];

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      context_type: initialContext?.contextType || 'none',
      context_id: initialContext?.contextId ? Number(initialContext.contextId) : undefined,
      attributes: [],
    });
  }, [form, initialContext?.contextId, initialContext?.contextType, open, template?.id]);

  const selectedEntity = useMemo(() => {
    const options = entityOptionsByType?.[contextType] || [];
    return options.find((item) => Number(item.value) === Number(contextId))?.entity;
  }, [contextId, contextType, entityOptionsByType]);

  const routeRules = useMemo(
    () =>
      (template?.steps || []).filter((step) => step.transition_rule_json && Object.keys(step.transition_rule_json || {}).length),
    [template?.steps],
  );

  const summaryTags = useMemo(() => {
    const items = [];
    if (template?.steps?.length) {
      items.push({ key: 'steps', label: `${template.steps.length} шагов` });
    }
    if (routeRules.length) {
      items.push({ key: 'rules', label: `${routeRules.length} условных переходов` });
    }
    const slaCount = (template?.steps || []).filter((step) => step.sla_target_hours).length;
    if (slaCount) {
      items.push({ key: 'sla', label: `${slaCount} шагов со SLA` });
    }
    return items;
  }, [routeRules.length, template?.steps]);

  const handleQuickPreset = (presetKey: string) => {
    const preset = QUICK_CONTEXT_PRESETS.find((item) => item.key === presetKey);
    if (!preset) return;
    form.setFieldValue('attributes', preset.attributes);
  };

  const handleConfirm = async () => {
    const values = await form.validateFields();
    const normalizedContextType = values.context_type === 'none' ? '' : values.context_type;
    const payloadBase: Record<string, any> = {
      context_type: normalizedContextType || 'custom',
    };
    if (values.context_id) {
      payloadBase.context_id = String(values.context_id);
    }

    const attributePayload: Record<string, any> = {};
    (values.attributes || []).forEach((item: { path?: string; value?: any }) => {
      if (!item?.path) return;
      const normalizedValue = normalizeAttributeValue(item.path, item.value);
      if (normalizedValue === '' || normalizedValue === null || Number.isNaN(normalizedValue)) return;
      setNestedValue(attributePayload, item.path, normalizedValue);
    });

    const entitySnapshot = buildEntitySnapshot(values.context_type, selectedEntity);
    const requestPayload: BusinessProcessLaunchPayload = {
      context_type: normalizedContextType,
      context_id: values.context_id ? String(values.context_id) : '',
      context_payload: mergePayload(payloadBase, [entitySnapshot, attributePayload]),
    };

    await onSubmit(requestPayload);
  };

  return (
    <Modal
      open={open}
      width={1040}
      destroyOnClose
      title={template ? `Запуск процесса: ${template.name}` : 'Запуск процесса'}
      onCancel={onCancel}
      onOk={handleConfirm}
      okText="Запустить процесс"
      cancelText="Отмена"
      confirmLoading={submitting}
    >
      <div className="component_BusinessProcessLaunchWizard_root">
        {loading || !template ? (
          <Card loading />
        ) : (
          <div className="component_BusinessProcessLaunchWizard_grid">
            <div>
              <Alert
                type="info"
                showIcon
                message="Контекст запуска формируется визуально"
                description="Процесс будет запущен с привязкой к сущности CRM и с подготовленным payload для условных переходов. Сырой JSON не нужен."
                style={{ marginBottom: 16 }}
              />

              <Form form={form} layout="vertical">
                <Form.Item name="context_type" label="К чему привязать экземпляр процесса?" initialValue="none">
                  <Radio.Group optionType="button" buttonStyle="solid" options={CONTEXT_TYPE_OPTIONS} />
                </Form.Item>

                {contextType !== 'none' ? (
                  <Form.Item
                    name="context_id"
                    label="Целевая сущность"
                    rules={[{ required: true, message: 'Выберите сущность для запуска процесса' }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Начните вводить название"
                      options={(entityOptionsByType?.[contextType] || []).map((item) => ({
                        value: item.value,
                        label: item.label,
                      }))}
                    />
                  </Form.Item>
                ) : null}

                <Card
                  size="small"
                  title="Контекстные атрибуты"
                  extra={
                    <Space className="component_BusinessProcessLaunchWizard_quickActions" size={6} wrap>
                      {QUICK_CONTEXT_PRESETS.map((preset) => (
                        <Button key={preset.key} size="small" icon={<ThunderboltOutlined />} onClick={() => handleQuickPreset(preset.key)}>
                          {preset.label}
                        </Button>
                      ))}
                    </Space>
                  }
                >
                  <Form.List name="attributes">
                    {(fields, { add, remove }) => (
                      <Space direction="vertical" size={10} style={{ width: '100%' }}>
                        {fields.length ? fields.map((field) => (
                          <div key={field.key} className="component_BusinessProcessLaunchWizard_attributeRow">
                            <Form.Item
                              name={[field.name, 'path']}
                              rules={[{ required: true, message: 'Выберите поле' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Select
                                showSearch
                                optionFilterProp="label"
                                placeholder="Поле для условия"
                                options={ATTRIBUTE_FIELD_OPTIONS.map((item) => ({
                                  label: item.label,
                                  value: item.value,
                                }))}
                              />
                            </Form.Item>

                            <Form.Item shouldUpdate noStyle>
                              {({ getFieldValue }) => {
                                const path = getFieldValue(['attributes', field.name, 'path']);
                                const option = ATTRIBUTE_FIELD_OPTIONS.find((item) => item.value === path);
                                if (option?.valueType === 'number') {
                                  return (
                                    <Form.Item
                                      name={[field.name, 'value']}
                                      rules={[{ required: true, message: 'Введите число' }]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <InputNumber style={{ width: '100%' }} min={0} placeholder="Например: 10000" />
                                    </Form.Item>
                                  );
                                }

                                return (
                                  <Form.Item
                                    name={[field.name, 'value']}
                                    rules={[{ required: true, message: 'Введите значение' }]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <Input placeholder="Например: high" />
                                  </Form.Item>
                                );
                              }}
                            </Form.Item>

                            <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                          </div>
                        )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Дополнительные атрибуты не заданы" />}

                        <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ path: undefined, value: '' })}>
                          Добавить атрибут
                        </Button>
                      </Space>
                    )}
                  </Form.List>
                </Card>
              </Form>
            </div>

            <div className="component_BusinessProcessLaunchWizard_sidebar">
              <Card size="small" title="Сводка запуска">
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <div className="component_BusinessProcessLaunchWizard_summaryTags">
                    {summaryTags.map((item) => (
                      <Tag key={item.key} color="blue">
                        {item.label}
                      </Tag>
                    ))}
                  </div>
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="Процесс">{template.name}</Descriptions.Item>
                    <Descriptions.Item label="Версия">v{template.version || 1}</Descriptions.Item>
                    <Descriptions.Item label="Привязка">
                      {contextType === 'none' ? 'Без привязки' : CONTEXT_TYPE_OPTIONS.find((item) => item.value === contextType)?.label}
                    </Descriptions.Item>
                    <Descriptions.Item label="Выбранная сущность">
                      {selectedEntity ? (
                        <Text>{selectedEntity.full_name || selectedEntity.name || selectedEntity.company_name || `#${selectedEntity.id}`}</Text>
                      ) : (
                        <Text type="secondary">Не выбрана</Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Атрибутов">{attributes.length || 0}</Descriptions.Item>
                  </Descriptions>
                </Space>
              </Card>

              <Card size="small" title="Какие условия есть в шаблоне">
                {routeRules.length ? (
                  <div className="component_BusinessProcessLaunchWizard_ruleList">
                    {routeRules.map((step) => (
                      <div key={step.id} className="component_BusinessProcessLaunchWizard_ruleItem">
                        <Text strong>{`Шаг ${step.order_no}. ${step.name}`}</Text>
                        <div className="component_BusinessProcessLaunchWizard_ruleMeta">
                          <Text type="secondary">{formatTransitionRule(step.transition_rule_json)}</Text>
                        </div>
                        {step.next_step_order_no ? (
                          <div className="component_BusinessProcessLaunchWizard_ruleMeta">
                            <Tag color="gold">Переход к шагу {step.next_step_order_no}</Tag>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="В шаблоне нет условных переходов" />
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
