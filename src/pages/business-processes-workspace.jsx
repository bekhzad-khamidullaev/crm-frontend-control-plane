import {
  arrayMove,
} from '@dnd-kit/sortable';
import {
  CheckCircleOutlined,
  CopyOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Steps,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BusinessProcessFlowConfigurator } from '../components/business/BusinessProcessFlowConfigurator';
import { BusinessProcessLaunchWizard } from '../components/business/BusinessProcessLaunchWizard';
import {
  advanceBusinessProcessInstance,
  cancelBusinessProcessInstance,
  createBusinessProcessTemplate,
  getBusinessProcessInstance,
  getBusinessProcessInstances,
  getBusinessProcessTemplate,
  getBusinessProcessTemplates,
  launchBusinessProcessTemplate,
  updateBusinessProcessTemplate,
} from '../lib/api/businessProcesses.js';
import { hasAnyFeature } from '../lib/rbac.js';
import { getDepartments } from '../lib/api/reference.js';
import { getProfile, getUsers } from '../lib/api/user.js';
import { getLeads } from '../lib/api/leads.js';
import { getDeals } from '../lib/api/deals.js';
import { getCompanies } from '../lib/api/companies.js';
import { BusinessFeatureGateNotice } from '../components/business/BusinessFeatureGateNotice';
import { PageHeader } from '../shared/ui/PageHeader';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { WorkspaceSummaryStrip, WorkspaceTabsShell } from '../shared/ui/WorkspaceRhythm';

const { Text } = Typography;

const toResults = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const statusTag = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') return <Tag color="processing">Активен</Tag>;
  if (normalized === 'completed') return <Tag color="success">Завершен</Tag>;
  if (normalized === 'cancelled') return <Tag color="error">Отменен</Tag>;
  if (normalized === 'archived') return <Tag>Архив</Tag>;
  if (normalized === 'draft') return <Tag>Черновик</Tag>;
  return <Tag>{status || '—'}</Tag>;
};

const eventTypeLabel = (eventType) => {
  const key = String(eventType || '').toLowerCase();
  if (key === 'instance_launched') return 'Экземпляр запущен';
  if (key === 'step_activated') return 'Шаг активирован';
  if (key === 'task_created') return 'Создана задача';
  if (key === 'step_completed') return 'Шаг завершен';
  if (key === 'instance_completed') return 'Экземпляр завершен';
  if (key === 'instance_cancelled') return 'Экземпляр отменен';
  return eventType || 'Событие';
};

const EMPTY_STEP = {
  name: '',
  description: '',
  assignee_type: 'user',
  assignee_user_id: undefined,
  assignee_group_id: undefined,
  next_step_order_no: undefined,
  transition_enabled: false,
  transition_field: undefined,
  transition_operator: 'eq',
  transition_value: '',
  sla_target_hours: undefined,
};

const TRANSITION_FIELD_OPTIONS = [
  { label: 'Приоритет', value: 'priority' },
  { label: 'Сумма сделки', value: 'deal.amount' },
  { label: 'Канал', value: 'channel' },
  { label: 'Тип контекста', value: 'context_type' },
];

const TRANSITION_OPERATOR_OPTIONS = [
  { label: 'Равно', value: 'eq' },
  { label: 'Не равно', value: 'neq' },
  { label: 'Больше', value: 'gt' },
  { label: 'Больше или равно', value: 'gte' },
  { label: 'Меньше', value: 'lt' },
  { label: 'Меньше или равно', value: 'lte' },
  { label: 'Содержит', value: 'contains' },
  { label: 'Существует', value: 'exists' },
  { label: 'Отсутствует', value: 'not_exists' },
];

const PROCESS_TEMPLATE_PRESETS = [
  {
    key: 'contract_approval',
    label: 'Согласование договора',
    description: 'Быстрый шаблон: подготовка -> юридическое согласование -> подписание',
    steps: [
      { name: 'Подготовка КП' },
      { name: 'Согласование юристом' },
      { name: 'Подписание с клиентом' },
    ],
  },
  {
    key: 'procurement',
    label: 'Закупка',
    description: 'Шаблон закупки: заявка -> бюджет -> заказ/приемка',
    steps: [
      { name: 'Заявка на закупку' },
      { name: 'Согласование бюджета' },
      { name: 'Заказ и приемка' },
    ],
  },
  {
    key: 'content_release',
    label: 'Публикация контента',
    description: 'Контент-процесс: черновик -> дизайн -> публикация',
    steps: [
      { name: 'Черновик контента' },
      { name: 'Дизайн и верстка' },
      { name: 'Публикация' },
    ],
  },
];

const parseTransitionRuleToUi = (rule) => {
  if (!rule || typeof rule !== 'object' || !Object.keys(rule).length) {
    return {
      transition_enabled: false,
      transition_field: undefined,
      transition_operator: 'eq',
      transition_value: '',
    };
  }
  return {
    transition_enabled: true,
    transition_field: rule.field || undefined,
    transition_operator: rule.operator || 'eq',
    transition_value:
      rule.value === null || rule.value === undefined ? '' : String(rule.value),
  };
};

const buildTransitionRuleFromUi = (step) => {
  if (!step.transition_enabled) return {};
  if (!step.transition_field || !step.transition_operator) return {};
  if (['exists', 'not_exists'].includes(step.transition_operator)) {
    return {
      field: step.transition_field,
      operator: step.transition_operator,
    };
  }
  return {
    field: step.transition_field,
    operator: step.transition_operator,
    value: step.transition_value,
  };
};

const formatTransitionRule = (rule) => {
  if (!rule || typeof rule !== 'object' || !Object.keys(rule).length) return 'Без условия';
  const field = String(rule.field || 'field');
  const operator = String(rule.operator || 'eq');
  if (operator === 'exists') return `${field} существует`;
  if (operator === 'not_exists') return `${field} отсутствует`;
  return `${field} ${operator} ${String(rule.value ?? '')}`.trim();
};

const buildFlowDiagnostics = (steps) => {
  const items = [];
  if (!Array.isArray(steps) || !steps.length) {
    return [{ type: 'warning', text: 'Добавьте хотя бы один шаг в процесс.' }];
  }
  const maxOrder = steps.length;
  const incomingCount = Array(maxOrder).fill(0);

  steps.forEach((step, index) => {
    const defaultNext = index < maxOrder - 1 ? index + 2 : null;
    const next = Number(step?.next_step_order_no || defaultNext || 0);
    if (next > 0) {
      if (next < 1 || next > maxOrder) {
        items.push({
          type: 'error',
          text: `Шаг ${index + 1}: переход указывает на несуществующий шаг ${next}.`,
        });
      } else {
        incomingCount[next - 1] += 1;
      }
    }
    if (step?.transition_enabled && !step?.next_step_order_no) {
      items.push({
        type: 'warning',
        text: `Шаг ${index + 1}: включено условие, но не указан целевой шаг для перехода.`,
      });
    }
  });

  for (let idx = 1; idx < incomingCount.length; idx += 1) {
    if (incomingCount[idx] === 0) {
      items.push({
        type: 'warning',
        text: `Шаг ${idx + 1} недостижим из других шагов. Проверьте схему переходов.`,
      });
    }
  }
  return items;
};

const getHashQueryParams = () => {
  if (typeof window === 'undefined') return new URLSearchParams();
  const hashValue = window.location.hash || '';
  const queryIndex = hashValue.indexOf('?');
  if (queryIndex === -1) return new URLSearchParams();
  return new URLSearchParams(hashValue.slice(queryIndex + 1));
};

export default function BusinessProcessesWorkspacePage() {
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('processes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [templates, setTemplates] = useState([]);
  const [instances, setInstances] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editorWizardStep, setEditorWizardStep] = useState(0);
  const [selectedFlowNodeId, setSelectedFlowNodeId] = useState(undefined);
  const stepCardRefs = useRef({});
  const selectPopupContainer = useCallback((triggerNode) => {
    if (typeof document === 'undefined') return undefined;
    if (!triggerNode) return document.body;
    return (
      triggerNode.closest('.ant-form-item')
      || triggerNode.closest('.ant-card')
      || triggerNode.closest('.ant-drawer-body')
      || document.body
    );
  }, []);
  const [form] = Form.useForm();

  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [templateDetailsLoading, setTemplateDetailsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [instanceDrawerOpen, setInstanceDrawerOpen] = useState(false);
  const [instanceDetailsLoading, setInstanceDetailsLoading] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [launchWizardOpen, setLaunchWizardOpen] = useState(false);
  const [launchWizardLoading, setLaunchWizardLoading] = useState(false);
  const [launchSubmitting, setLaunchSubmitting] = useState(false);
  const [launchTemplate, setLaunchTemplate] = useState(null);
  const [launchEntityOptions, setLaunchEntityOptions] = useState({ lead: [], deal: [], company: [] });
  const [launchPrefill, setLaunchPrefill] = useState(null);
  const [prefillAutoHandled, setPrefillAutoHandled] = useState(false);
  const anyProcessDrawerOpen = editorOpen || templateDrawerOpen || instanceDrawerOpen;

  const loadReferenceData = useCallback(async () => {
    const [usersRes, groupsRes] = await Promise.allSettled([
      getUsers({ page_size: 300 }),
      getDepartments({ page_size: 300 }),
    ]);

    if (usersRes.status === 'fulfilled') {
      setUsers(toResults(usersRes.value));
    }
    if (groupsRes.status === 'fulfilled') {
      setGroups(toResults(groupsRes.value));
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      setUserProfile(profile || null);
    } catch {
      setUserProfile(null);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const [templatesRes, instancesRes] = await Promise.allSettled([
      getBusinessProcessTemplates({ page_size: 300, search }),
      getBusinessProcessInstances({ page_size: 300 }),
    ]);

    if (templatesRes.status === 'fulfilled') {
      setTemplates(toResults(templatesRes.value));
    } else {
      setTemplates([]);
    }

    if (instancesRes.status === 'fulfilled') {
      setInstances(toResults(instancesRes.value));
    } else {
      setInstances([]);
    }

    if (templatesRes.status === 'rejected' || instancesRes.status === 'rejected') {
      setError('Не удалось загрузить часть данных по бизнес-процессам.');
    }

    setLoading(false);
  }, [search]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const params = getHashQueryParams();
    const contextType = (params.get('context_type') || '').trim();
    const contextId = (params.get('context_id') || '').trim();
    const templateId = (params.get('template_id') || '').trim();

    if (!contextType && !contextId && !templateId) {
      setLaunchPrefill(null);
      return;
    }

    setLaunchPrefill({
      contextType: contextType || undefined,
      contextId: contextId || undefined,
      templateId: templateId || undefined,
    });
    setPrefillAutoHandled(false);
  }, []);

  const summaryItems = useMemo(() => {
    const activeInstancesCount = instances.filter((item) => item.status === 'active').length;
    const completedInstancesCount = instances.filter((item) => item.status === 'completed').length;
    return [
      { key: 'templates', label: 'Шаблоны процессов', value: templates.length },
      { key: 'instances_active', label: 'Активные экземпляры', value: activeInstancesCount },
      { key: 'instances_done', label: 'Завершенные экземпляры', value: completedInstancesCount },
      {
        key: 'steps_total',
        label: 'Шагов в шаблонах',
        value: templates.reduce((acc, row) => acc + Number(row.steps_count || 0), 0),
      },
    ];
  }, [templates, instances]);

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label:
          `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email || `User #${user.id}`,
      })),
    [users],
  );

  const groupOptions = useMemo(
    () =>
      groups.map((group) => ({
        value: group.id,
        label: group.name || `Group #${group.id}`,
      })),
    [groups],
  );

  const permissionSet = useMemo(() => {
    const permissions = Array.isArray(userProfile?.permissions) ? userProfile.permissions : [];
    return new Set(permissions.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean));
  }, [userProfile]);

  const isPrivileged = Boolean(userProfile?.is_staff || userProfile?.is_superuser);
  const canCreateTemplate = isPrivileged || permissionSet.has('business_processes.add_processtemplate');
  const canEditTemplates = isPrivileged || permissionSet.has('business_processes.change_processtemplate');
  const canLaunchInstances = isPrivileged || permissionSet.has('business_processes.add_processinstance');
  const canManageInstances = isPrivileged || permissionSet.has('business_processes.change_processinstance');
  const canAdvanceAnyInstance = canManageInstances || instances.some((item) => item.can_advance);
  const canCancelAnyInstance = canManageInstances || instances.some((item) => item.can_cancel);
  const canUseTransitionsFeature = hasAnyFeature(['business_processes.transitions', 'business_processes']);
  const canUseSlaFeature = hasAnyFeature(['business_processes.sla', 'business_processes']);
  const canUseBpAnalyticsFeature = hasAnyFeature(['business_processes.analytics', 'business_processes']);

  const resolveApiErrorMessage = useCallback((apiError, fallback) => {
    const details = apiError?.details || {};
    if (details?.message) return details.message;
    if (details?.detail) return details.detail;
    const code = details?.code || apiError?.code;
    const mapByCode = {
      BP_PERMISSION_DENIED: 'Недостаточно прав для выполнения действия',
      BP_VALIDATION_ERROR: 'Обнаружены ошибки в схеме процесса. Проверьте шаги и переходы.',
      BP_STEP_TASKS_NOT_COMPLETED: 'Нельзя продвинуть процесс: есть незавершенные задачи текущего шага.',
      LICENSE_FEATURE_DISABLED: 'Функция недоступна по текущей лицензии.',
      BP_LICENSE_LIMIT_REACHED: 'Достигнут лимит лицензии для бизнес-процессов.',
    };
    if (code && mapByCode[code]) return mapByCode[code];
    if (details?.code === 'BP_PERMISSION_DENIED') return 'Недостаточно прав для выполнения действия';
    return apiError?.message || fallback;
  }, []);

  const openCreateEditor = () => {
    if (!canCreateTemplate) {
      message.warning('Недостаточно прав для создания шаблона');
      return;
    }
    setEditingTemplate(null);
    form.setFieldsValue({
      name: '',
      description: '',
      steps: [{ ...EMPTY_STEP, order_no: 1 }],
    });
    setEditorWizardStep(0);
    setSelectedFlowNodeId('0');
    setEditorOpen(true);
  };

  const openEditEditor = async (templateId) => {
    const templateRow = templates.find((item) => Number(item.id) === Number(templateId));
    if (templateRow && !templateRow.can_edit && !canEditTemplates) {
      message.warning('Недостаточно прав для редактирования шаблона');
      return;
    }
    setEditorLoading(true);
    try {
      const details = await getBusinessProcessTemplate(templateId);
      setEditingTemplate(details);
      form.setFieldsValue({
        name: details.name,
        description: details.description,
        steps: (details.steps || []).map((step, idx) => ({
          order_no: idx + 1,
          name: step.name,
          description: step.description || '',
          assignee_type: step.assignee_type || 'user',
          assignee_user_id: step.assignee_user || undefined,
          assignee_group_id: step.assignee_group || undefined,
          next_step_order_no: step.next_step_order_no || undefined,
          ...parseTransitionRuleToUi(step.transition_rule_json),
          sla_target_hours: step.sla_target_hours || undefined,
        })),
      });
      setEditorWizardStep(1);
      setSelectedFlowNodeId('0');
      setEditorOpen(true);
    } catch (apiError) {
      message.error(resolveApiErrorMessage(apiError, 'Не удалось открыть шаблон для редактирования'));
    } finally {
      setEditorLoading(false);
    }
  };

  const submitEditor = async () => {
    try {
      const values = await form.validateFields();
      const stepValues = values.steps || [];
      if (!canUseTransitionsFeature && stepValues.some((step) => Boolean(step?.transition_enabled))) {
        message.warning('Условные переходы недоступны по текущей лицензии.');
        return;
      }
      if (!canUseSlaFeature && stepValues.some((step) => Boolean(step?.sla_target_hours))) {
        message.warning('SLA для шагов недоступен по текущей лицензии.');
        return;
      }
      const payload = {
        name: values.name,
        description: values.description || '',
        steps: stepValues.map((step, idx) => {
          const transitionRule = canUseTransitionsFeature ? buildTransitionRuleFromUi(step) : {};
          return {
            order_no: idx + 1,
            name: step.name,
            description: step.description || '',
            assignee_type: step.assignee_type,
            assignee_user_id: step.assignee_type === 'user' ? step.assignee_user_id : null,
            assignee_group_id: step.assignee_type === 'group' ? step.assignee_group_id : null,
            next_step_order_no: step.next_step_order_no || null,
            transition_rule_json: transitionRule,
            sla_target_hours: canUseSlaFeature ? (step.sla_target_hours || null) : null,
          };
        }),
      };

      setEditorLoading(true);
      if (editingTemplate?.id) {
        await updateBusinessProcessTemplate(editingTemplate.id, payload);
        message.success('Шаблон процесса обновлен');
      } else {
        await createBusinessProcessTemplate(payload);
        message.success('Шаблон процесса создан');
      }
      setEditorOpen(false);
      setEditingTemplate(null);
      setEditorWizardStep(0);
      await loadData();
    } catch (apiError) {
      if (apiError?.errorFields) return;
      message.error(resolveApiErrorMessage(apiError, 'Не удалось сохранить шаблон'));
    } finally {
      setEditorLoading(false);
    }
  };

  const applyProcessPreset = (presetKey) => {
    const preset = PROCESS_TEMPLATE_PRESETS.find((item) => item.key === presetKey);
    if (!preset) return;
    const defaultAssigneeUserId = userProfile?.id || userOptions[0]?.value;
    const steps = preset.steps.map((step, index) => ({
      ...EMPTY_STEP,
      order_no: index + 1,
      name: step.name,
      assignee_type: 'user',
      assignee_user_id: defaultAssigneeUserId,
      transition_enabled: false,
    }));
    form.setFieldValue('steps', steps);
    setSelectedFlowNodeId('0');
    message.success(`Пресет "${preset.label}" применен`);
  };

  const goToFlowWizardStep = async () => {
    try {
      await form.validateFields(['name']);
      if (!Array.isArray(form.getFieldValue('steps')) || !form.getFieldValue('steps').length) {
        form.setFieldValue('steps', [{ ...EMPTY_STEP, order_no: 1 }]);
      }
      setEditorWizardStep(1);
    } catch {
      // Validation feedback is shown by Form.Item.
    }
  };

  const openTemplateDetails = async (templateId) => {
    setTemplateDrawerOpen(true);
    setTemplateDetailsLoading(true);
    try {
      const details = await getBusinessProcessTemplate(templateId);
      setSelectedTemplate(details);
    } catch (apiError) {
      setSelectedTemplate(null);
      message.error(resolveApiErrorMessage(apiError, 'Не удалось загрузить детали шаблона'));
    } finally {
      setTemplateDetailsLoading(false);
    }
  };

  const runTemplate = async (templateId) => {
    const templateRow = templates.find((item) => Number(item.id) === Number(templateId));
    if (templateRow && !templateRow.can_launch && !canLaunchInstances) {
      message.warning('Недостаточно прав для запуска экземпляра');
      return;
    }
    setLaunchWizardOpen(true);
    setLaunchWizardLoading(true);
    try {
      const [templateDetails, leadsRes, dealsRes, companiesRes] = await Promise.all([
        selectedTemplate?.id === templateId && selectedTemplate?.steps?.length
          ? Promise.resolve(selectedTemplate)
          : getBusinessProcessTemplate(templateId),
        getLeads({ page_size: 200, ordering: '-creation_date' }),
        getDeals({ page_size: 200, ordering: '-update_date' }),
        getCompanies({ page_size: 200, ordering: '-update_date' }),
      ]);

      setLaunchTemplate(templateDetails);
      setLaunchEntityOptions({
        lead: toResults(leadsRes).map((item) => ({
          value: item.id,
          label: item.full_name || item.company_name || `Лид #${item.id}`,
          meta: item.company_name || item.status || '',
          entity: item,
        })),
        deal: toResults(dealsRes).map((item) => ({
          value: item.id,
          label: item.name || `Сделка #${item.id}`,
          meta: [item.stage_name, item.amount ? `${item.amount} ${item.currency_code || ''}`.trim() : '']
            .filter(Boolean)
            .join(' • '),
          entity: item,
        })),
        company: toResults(companiesRes).map((item) => ({
          value: item.id,
          label: item.full_name || `Компания #${item.id}`,
          meta: item.phone || item.email || '',
          entity: item,
        })),
      });
    } catch (apiError) {
      setLaunchWizardOpen(false);
      setLaunchTemplate(null);
      message.error(resolveApiErrorMessage(apiError, 'Не удалось запустить процесс'));
    } finally {
      setLaunchWizardLoading(false);
    }
  };

  const submitLaunchWizard = async (payload) => {
    if (!launchTemplate?.id) return;
    setLaunchSubmitting(true);
    try {
      const instance = await launchBusinessProcessTemplate(launchTemplate.id, payload);
      message.success('Экземпляр процесса запущен');
      setLaunchWizardOpen(false);
      setLaunchTemplate(null);
      setSelectedInstance(instance);
      setInstanceDetailsLoading(false);
      setInstanceDrawerOpen(true);
      await loadData();
      if (selectedTemplate?.id === launchTemplate.id) {
        await openTemplateDetails(launchTemplate.id);
      }
    } catch (apiError) {
      message.error(resolveApiErrorMessage(apiError, 'Не удалось запустить процесс'));
    } finally {
      setLaunchSubmitting(false);
    }
  };

  const openInstanceDetails = async (instanceId) => {
    setInstanceDrawerOpen(true);
    setInstanceDetailsLoading(true);
    try {
      const details = await getBusinessProcessInstance(instanceId);
      setSelectedInstance(details);
    } catch (apiError) {
      setSelectedInstance(null);
      message.error(resolveApiErrorMessage(apiError, 'Не удалось загрузить экземпляр'));
    } finally {
      setInstanceDetailsLoading(false);
    }
  };

  const handleAdvanceInstance = async (instanceId) => {
    const row = instances.find((item) => Number(item.id) === Number(instanceId));
    if (row && !row.can_advance && !canManageInstances) {
      message.warning('Недостаточно прав для продвижения шага');
      return;
    }
    try {
      await advanceBusinessProcessInstance(instanceId);
      message.success('Экземпляр переведен на следующий шаг');
      await loadData();
      if (selectedInstance?.id === instanceId) {
        await openInstanceDetails(instanceId);
      }
    } catch (apiError) {
      message.error(resolveApiErrorMessage(apiError, 'Невозможно продвинуть экземпляр'));
    }
  };

  const handleCancelInstance = async (instanceId) => {
    const row = instances.find((item) => Number(item.id) === Number(instanceId));
    if (row && !row.can_cancel && !canManageInstances) {
      message.warning('Недостаточно прав для отмены экземпляра');
      return;
    }
    try {
      await cancelBusinessProcessInstance(instanceId, 'Cancelled from workspace');
      message.success('Экземпляр отменен');
      await loadData();
      if (selectedInstance?.id === instanceId) {
        await openInstanceDetails(instanceId);
      }
    } catch (apiError) {
      message.error(resolveApiErrorMessage(apiError, 'Не удалось отменить экземпляр'));
    }
  };

  const templatesColumns = [
    {
      title: 'Процесс',
      dataIndex: 'name',
      key: 'name',
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <Text strong>{row.name}</Text>
          <Text type="secondary">{row.description || '—'}</Text>
        </Space>
      ),
    },
    {
      title: 'Версия',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (value) => `v${value || 1}`,
    },
    {
      title: 'Шагов',
      dataIndex: 'steps_count',
      key: 'steps_count',
      width: 90,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: statusTag,
    },
    {
      title: 'Экземпляры',
      key: 'counters',
      width: 180,
      render: (_, row) => (
        <Space size={4}>
          <Tag color="processing">Активные: {row.active_instances_count || 0}</Tag>
          <Tag color="success">Завершенные: {row.completed_instances_count || 0}</Tag>
        </Space>
      ),
    },
    {
      title: 'Обновлено',
      dataIndex: 'update_date',
      key: 'update_date',
      width: 180,
      render: formatDateTime,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 280,
      render: (_, row) => (
        <Space wrap>
          <Button size="small" onClick={() => openTemplateDetails(row.id)}>
            Открыть
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditEditor(row.id)} disabled={!row.can_edit}>
            Редактировать
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => runTemplate(row.id)}
            disabled={!row.can_launch}
          >
            Запустить
          </Button>
        </Space>
      ),
    },
  ];

  const instancesColumns = [
    {
      title: 'Процесс',
      dataIndex: 'template_name',
      key: 'template_name',
      render: (value, row) => (
        <Space direction="vertical" size={2}>
          <Text strong>{value}</Text>
          <Text type="secondary">v{row.version || 1}</Text>
        </Space>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: statusTag,
    },
    {
      title: 'Текущий шаг',
      dataIndex: 'current_step_no',
      key: 'current_step_no',
      width: 130,
    },
    {
      title: 'Запущен',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 180,
      render: formatDateTime,
    },
    {
      title: 'Завершен',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 180,
      render: formatDateTime,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 300,
      render: (_, row) => (
        <Space wrap>
          <Button size="small" onClick={() => openInstanceDetails(row.id)}>
            Открыть
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CheckCircleOutlined />}
            disabled={row.status !== 'active' || !row.can_advance}
            onClick={() => handleAdvanceInstance(row.id)}
          >
            Продвинуть шаг
          </Button>
          <Popconfirm
            title="Отменить экземпляр?"
            okText="Отменить экземпляр"
            cancelText="Назад"
            onConfirm={() => handleCancelInstance(row.id)}
            disabled={row.status !== 'active' || !row.can_cancel}
          >
            <Button size="small" danger icon={<StopOutlined />} disabled={row.status !== 'active' || !row.can_cancel}>
              Отменить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredInstances = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return instances;
    return instances.filter((item) => {
      const values = [item.template_name, item.status, item.context_type, item.context_id]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');
      return values.includes(query);
    });
  }, [instances, search]);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return templates;
    return templates.filter((item) => {
      const values = [item.name, item.description, item.status].map((value) => String(value || '').toLowerCase()).join(' ');
      return values.includes(query);
    });
  }, [templates, search]);

  const activeFilters = search ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }] : [];

  const selectedTemplateInstances = useMemo(() => {
    if (!selectedTemplate?.id) return [];
    return instances.filter((item) => Number(item.template) === Number(selectedTemplate.id));
  }, [instances, selectedTemplate]);

  const isCreateMode = !editingTemplate?.id;
  const showWizardMetaStep = isCreateMode && editorWizardStep === 0;
  const showWizardFlowStep = !isCreateMode || editorWizardStep === 1;

  const watchedSteps = Form.useWatch('steps', form) || [];
  const flowNodes = useMemo(
    () =>
      watchedSteps.map((step, idx) => ({
        id: String(idx),
        orderNo: idx + 1,
        title: step?.name || `Шаг ${idx + 1}`,
        subtitle: step?.description || '',
        nextLabel: step?.next_step_order_no ? `Шаг ${step.next_step_order_no}` : 'Следующий по порядку',
        hasCondition: Boolean(step?.transition_enabled),
        assigneeLabel:
          step?.assignee_type === 'group'
            ? `Группа: ${groupOptions.find((item) => Number(item.value) === Number(step?.assignee_group_id))?.label || 'не выбрана'}`
            : `Сотрудник: ${userOptions.find((item) => Number(item.value) === Number(step?.assignee_user_id))?.label || 'не выбран'}`,
        slaLabel: step?.sla_target_hours ? `SLA ${step.sla_target_hours}ч` : '',
        conditionLabel: step?.transition_enabled ? formatTransitionRule(buildTransitionRuleFromUi(step)) : '',
      })),
    [groupOptions, userOptions, watchedSteps],
  );
  const flowDiagnostics = useMemo(() => buildFlowDiagnostics(watchedSteps), [watchedSteps]);

  useEffect(() => {
    if (prefillAutoHandled || !launchPrefill?.templateId || !templates.length) return;
    const templateExists = templates.some((item) => String(item.id) === String(launchPrefill.templateId));
    if (!templateExists) return;
    setPrefillAutoHandled(true);
    runTemplate(launchPrefill.templateId);
  }, [launchPrefill, prefillAutoHandled, templates]);

  useEffect(() => {
    if (!flowNodes.length) {
      setSelectedFlowNodeId(undefined);
      return;
    }
    const selectedExists = flowNodes.some((node) => String(node.id) === String(selectedFlowNodeId));
    if (!selectedExists) {
      setSelectedFlowNodeId(flowNodes[0].id);
    }
  }, [flowNodes, selectedFlowNodeId]);

  useEffect(() => {
    if (!editorOpen || selectedFlowNodeId === undefined || selectedFlowNodeId === null) return;
    const node = stepCardRefs.current[String(selectedFlowNodeId)];
    if (!node || typeof node.scrollIntoView !== 'function') return;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [editorOpen, selectedFlowNodeId]);

  return (
    <Space direction="vertical" size={10} style={{ width: '100%' }}>
      <PageHeader
        title="Бизнес-процессы"
        subtitle="Шаблоны процессов, запуск экземпляров и контроль шагов исполнения"
        breadcrumbs={[{ title: 'Бизнес-процессы' }]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              Обновить
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateEditor} disabled={!canCreateTemplate}>
              Создать процесс
            </Button>
          </Space>
        }
      />

      {error ? <Alert type="warning" showIcon message={error} /> : null}

      {launchPrefill?.contextType && launchPrefill?.contextId ? (
        <Alert
          type="info"
          showIcon
          message="Процесс будет запущен в контексте CRM-сущности"
          description={`Контекст: ${launchPrefill.contextType} #${launchPrefill.contextId}. Выберите шаблон процесса, и данные подставятся автоматически.`}
        />
      ) : null}

      <WorkspaceSummaryStrip items={summaryItems} />

      <WorkspaceTabsShell>
        <EntityListToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Поиск по шаблонам и экземплярам"
          activeFilters={activeFilters}
          onReset={() => setSearch('')}
          onRefresh={loadData}
          loading={loading}
          resultSummary={
            activeTab === 'processes'
              ? `${filteredTemplates.length} шаблонов`
              : `${filteredInstances.length} экземпляров`
          }
        />

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'processes',
              label: 'Процессы',
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  loading={loading}
                  columns={templatesColumns}
                  dataSource={filteredTemplates}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                  scroll={{ x: 1200 }}
                />
              ),
            },
            {
              key: 'instances',
              label: 'Запущенные',
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  loading={loading}
                  columns={instancesColumns}
                  dataSource={filteredInstances}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                  scroll={{ x: 1200 }}
                />
              ),
            },
          ]}
        />
      </WorkspaceTabsShell>

      {anyProcessDrawerOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2300,
            pointerEvents: 'none',
            background: 'rgba(15, 23, 42, 0.32)',
            backdropFilter: 'blur(1px)',
          }}
        />
      ) : null}

      <Drawer
        title={editingTemplate ? 'Редактировать процесс' : 'Новый процесс'}
        open={editorOpen}
        width={880}
        zIndex={2400}
        destroyOnClose
        styles={{ body: { paddingBottom: 96 } }}
        onClose={() => {
          setEditorOpen(false);
          setEditingTemplate(null);
          setEditorWizardStep(0);
          setSelectedFlowNodeId(undefined);
        }}
        footer={
          <Space>
            <Button onClick={() => setEditorOpen(false)}>Отмена</Button>
            {isCreateMode && editorWizardStep === 1 ? (
              <Button onClick={() => setEditorWizardStep(0)}>Назад</Button>
            ) : null}
            {isCreateMode && editorWizardStep === 0 ? (
              <Button type="primary" onClick={goToFlowWizardStep}>
                Далее: шаги и маршрут
              </Button>
            ) : (
              <Button type="primary" onClick={submitEditor} loading={editorLoading}>
                Сохранить
              </Button>
            )}
          </Space>
        }
      >
        <Form form={form} layout="vertical" preserve={false} initialValues={{ steps: [{ ...EMPTY_STEP, order_no: 1 }] }}>
          {isCreateMode ? (
            <Card size="small" style={{ marginBottom: 12 }}>
              <Steps
                size="small"
                current={editorWizardStep}
                items={[
                  { title: 'Параметры процесса' },
                  { title: 'Шаги и маршрут' },
                ]}
              />
            </Card>
          ) : null}

          {showWizardMetaStep || !isCreateMode ? (
            <>
              <Form.Item name="name" label="Название процесса" rules={[{ required: true, message: 'Введите название процесса' }]}>
                <Input placeholder="Например: Согласование договора" />
              </Form.Item>

              <Form.Item name="description" label="Описание">
                <Input.TextArea rows={3} placeholder="Краткое описание процесса" />
              </Form.Item>
            </>
          ) : null}

          {showWizardMetaStep ? (
            <Card size="small" title="Быстрый старт (пресеты)">
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {PROCESS_TEMPLATE_PRESETS.map((preset) => (
                  <Card
                    key={preset.key}
                    size="small"
                    title={preset.label}
                    extra={
                      <Button size="small" onClick={() => applyProcessPreset(preset.key)}>
                        Применить
                      </Button>
                    }
                  >
                    <Text type="secondary">{preset.description}</Text>
                  </Card>
                ))}
              </Space>
            </Card>
          ) : null}

          {showWizardFlowStep ? (
            <>
          <Divider orientation="left" plain>
            Шаги процесса
          </Divider>

          <Form.List name="steps">
            {(fields, { add, remove }) => {
              const handleReorder = (activeId, overId) => {
                const keys = fields.map((field, index) => String(index));
                const oldIndex = keys.indexOf(String(activeId));
                const newIndex = keys.indexOf(String(overId));
                if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

                const currentSteps = form.getFieldValue('steps') || [];
                const reordered = arrayMove(currentSteps, oldIndex, newIndex);

                const oldOrderToNodeId = Object.fromEntries(keys.map((key, idx) => [idx + 1, key]));
                const movedKeys = arrayMove(keys, oldIndex, newIndex);
                const nodeIdToNewOrder = Object.fromEntries(movedKeys.map((key, idx) => [key, idx + 1]));

                const normalized = reordered.map((step) => {
                  const oldNext = Number(step?.next_step_order_no || 0);
                  if (!oldNext) return step;
                  const targetNodeId = oldOrderToNodeId[oldNext];
                  const remappedNext = Number(nodeIdToNewOrder[targetNodeId] || 0);
                  return { ...step, next_step_order_no: remappedNext || undefined };
                });

                form.setFieldValue('steps', normalized);
                setSelectedFlowNodeId(String(newIndex));
              };

              const selectedField =
                fields.find((field) => String(field.name) === String(selectedFlowNodeId))
                || fields[0]
                || null;
              const selectedStepIndex = selectedField ? fields.findIndex((field) => field.key === selectedField.key) : -1;
              const selectedNodeId = selectedField ? String(selectedField.name) : undefined;

              return (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {flowDiagnostics.length ? (
                    <Alert
                      type={flowDiagnostics.some((item) => item.type === 'error') ? 'error' : 'warning'}
                      showIcon
                      message="Проверьте схему маршрута"
                      description={
                        <Space direction="vertical" size={2}>
                          {flowDiagnostics.map((item) => (
                            <Text key={item.text} type={item.type === 'error' ? 'danger' : 'secondary'}>
                              {item.text}
                            </Text>
                          ))}
                        </Space>
                      }
                    />
                  ) : null}

                  <Card
                    size="small"
                    title="Визуальный конфигуратор маршрута"
                    extra={
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          add({ ...EMPTY_STEP });
                          setSelectedFlowNodeId(String(fields.length));
                        }}
                      >
                        Добавить шаг
                      </Button>
                    }
                  >
                    <BusinessProcessFlowConfigurator
                      nodes={flowNodes}
                      selectedId={selectedFlowNodeId}
                      onSelect={setSelectedFlowNodeId}
                      onReorder={handleReorder}
                    />
                  </Card>

                  <Row gutter={[12, 12]} align="top">
                    <Col xs={24} xl={9}>
                      <Card
                        size="small"
                        title="Шаги процесса"
                        extra={
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              add({ ...EMPTY_STEP });
                              setSelectedFlowNodeId(String(fields.length));
                            }}
                          >
                            Добавить
                          </Button>
                        }
                      >
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          {fields.map((field, idx) => {
                            const nodeId = String(field.name);
                            const isSelected = String(selectedFlowNodeId) === nodeId;
                            return (
                              <Card
                                key={field.key}
                                ref={(node) => {
                                  if (node) {
                                    stepCardRefs.current[nodeId] = node;
                                  } else {
                                    delete stepCardRefs.current[nodeId];
                                  }
                                }}
                                size="small"
                                hoverable
                                onClick={() => setSelectedFlowNodeId(nodeId)}
                                styles={
                                  isSelected
                                    ? { body: { background: '#f2f7ff' }, header: { borderBottomColor: '#91caff' } }
                                    : undefined
                                }
                                title={`Шаг ${idx + 1}`}
                                extra={isSelected ? <Tag color="processing">Редактируется</Tag> : null}
                              >
                                <Space direction="vertical" size={4}>
                                  <Text strong>{watchedSteps[idx]?.name || `Шаг ${idx + 1}`}</Text>
                                  <Text type="secondary">
                                    {watchedSteps[idx]?.next_step_order_no
                                      ? `Переход к шагу ${watchedSteps[idx]?.next_step_order_no}`
                                      : 'Переход к следующему шагу по порядку'}
                                  </Text>
                                </Space>
                              </Card>
                            );
                          })}
                        </Space>
                      </Card>
                    </Col>

                    <Col xs={24} xl={15}>
                      {selectedField ? (
                        <Card
                          size="small"
                          title={`Редактор шага ${selectedStepIndex + 1}`}
                          extra={
                            <Space>
                              <Button
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => {
                                  const stepsValue = form.getFieldValue('steps') || [];
                                  const source = stepsValue[selectedStepIndex] || {};
                                  const clonedName = source?.name
                                    ? `${source.name} (копия)`
                                    : `Шаг ${selectedStepIndex + 1} (копия)`;
                                  add({ ...source, name: clonedName }, selectedStepIndex + 1);
                                  setSelectedFlowNodeId(String(selectedStepIndex + 1));
                                }}
                              >
                                Дублировать
                              </Button>
                              {fields.length > 1 ? (
                                <Button
                                  size="small"
                                  danger
                                  onClick={() => {
                                    remove(selectedField.name);
                                    setSelectedFlowNodeId(String(Math.max(0, selectedStepIndex - 1)));
                                  }}
                                >
                                  Удалить
                                </Button>
                              ) : null}
                            </Space>
                          }
                        >
                          <Space direction="vertical" size={12} style={{ width: '100%' }}>
                            <Form.Item
                              name={[selectedField.name, 'name']}
                              label="Название шага"
                              rules={[{ required: true, message: 'Введите название шага' }]}
                            >
                              <Input placeholder="Например: Согласование юристом" />
                            </Form.Item>

                            <Form.Item name={[selectedField.name, 'description']} label="Описание действий">
                              <Input.TextArea rows={3} placeholder="Какие действия должны быть выполнены" />
                            </Form.Item>

                            <Row gutter={[12, 0]}>
                              <Col xs={24} md={10}>
                                <Form.Item
                                  name={[selectedField.name, 'assignee_type']}
                                  label="Тип ответственного"
                                  rules={[{ required: true, message: 'Выберите тип ответственного' }]}
                                >
                                  <Select
                                    getPopupContainer={selectPopupContainer}
                                    options={[
                                      { label: 'Сотрудник', value: 'user' },
                                      { label: 'Должность/группа', value: 'group' },
                                    ]}
                                  />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={14}>
                                <Form.Item shouldUpdate noStyle>
                                  {({ getFieldValue }) => {
                                    const assigneeType = getFieldValue(['steps', selectedField.name, 'assignee_type']) || 'user';
                                    if (assigneeType === 'group') {
                                      return (
                                        <Form.Item
                                          name={[selectedField.name, 'assignee_group_id']}
                                          label="Должность/группа"
                                          rules={[{ required: true, message: 'Выберите группу' }]}
                                        >
                                          <Select
                                            getPopupContainer={selectPopupContainer}
                                            showSearch
                                            optionFilterProp="label"
                                            placeholder="Выберите группу"
                                            options={groupOptions}
                                          />
                                        </Form.Item>
                                      );
                                    }

                                    return (
                                      <Form.Item
                                        name={[selectedField.name, 'assignee_user_id']}
                                        label="Сотрудник"
                                        rules={[{ required: true, message: 'Выберите сотрудника' }]}
                                      >
                                        <Select
                                          getPopupContainer={selectPopupContainer}
                                          showSearch
                                          optionFilterProp="label"
                                          placeholder="Выберите сотрудника"
                                          options={userOptions}
                                        />
                                      </Form.Item>
                                    );
                                  }}
                                </Form.Item>
                              </Col>
                            </Row>

                            <Row gutter={[12, 0]}>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  name={[selectedField.name, 'next_step_order_no']}
                                  label="Переход на шаг"
                                  tooltip="Если не указан, используется стандартный последовательный переход"
                                >
                                  <Select
                                    getPopupContainer={selectPopupContainer}
                                    allowClear
                                    placeholder="По умолчанию: следующий по порядку"
                                    options={fields
                                      .map((_, optionIndex) => ({
                                        value: optionIndex + 1,
                                        label: `Шаг ${optionIndex + 1}`,
                                      }))
                                      .filter((item) => item.value !== selectedStepIndex + 1)}
                                  />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  name={[selectedField.name, 'sla_target_hours']}
                                  label="SLA (часы)"
                                  tooltip="Через сколько часов шаг считается просроченным"
                                >
                                  <InputNumber
                                    min={1}
                                    precision={0}
                                    style={{ width: '100%' }}
                                    placeholder="Например: 24"
                                    disabled={!canUseSlaFeature}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>

                            {!canUseSlaFeature ? (
                              <BusinessFeatureGateNotice
                                featureCode="business_processes.sla"
                                title="SLA для шагов недоступен"
                                description="В текущем тарифе SLA-контроль шагов отключен."
                              />
                            ) : null}

                            <Card
                              size="small"
                              title={
                                <Space size={6}>
                                  <span>Условный переход</span>
                                  <Tooltip title="Вместо JSON задайте условие через визуальные поля">
                                    <InfoCircleOutlined />
                                  </Tooltip>
                                </Space>
                              }
                            >
                              <Form.Item
                                name={[selectedField.name, 'transition_enabled']}
                                label="Включить условие"
                                valuePropName="checked"
                              >
                                <Switch disabled={!canUseTransitionsFeature} />
                              </Form.Item>

                              {!canUseTransitionsFeature ? (
                                <BusinessFeatureGateNotice
                                  featureCode="business_processes.transitions"
                                  title="Условные переходы недоступны"
                                  description="В текущем тарифе доступны только последовательные переходы."
                                />
                              ) : null}

                              <Form.Item shouldUpdate noStyle>
                                {({ getFieldValue }) => {
                                  if (!canUseTransitionsFeature) return null;
                                  const enabled = Boolean(getFieldValue(['steps', selectedField.name, 'transition_enabled']));
                                  if (!enabled) return null;
                                  const operator = getFieldValue(['steps', selectedField.name, 'transition_operator']) || 'eq';
                                  const requiresValue = !['exists', 'not_exists'].includes(operator);
                                  return (
                                    <Row gutter={[12, 0]}>
                                      <Col xs={24} md={8}>
                                        <Form.Item
                                          name={[selectedField.name, 'transition_field']}
                                          label="Поле"
                                          rules={[{ required: true, message: 'Выберите поле условия' }]}
                                        >
                                          <Select
                                            getPopupContainer={selectPopupContainer}
                                            showSearch
                                            optionFilterProp="label"
                                            placeholder="Выберите поле"
                                            options={TRANSITION_FIELD_OPTIONS}
                                          />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={24} md={8}>
                                        <Form.Item
                                          name={[selectedField.name, 'transition_operator']}
                                          label="Оператор"
                                          rules={[{ required: true, message: 'Выберите оператор' }]}
                                        >
                                          <Select
                                            getPopupContainer={selectPopupContainer}
                                            options={TRANSITION_OPERATOR_OPTIONS}
                                          />
                                        </Form.Item>
                                      </Col>
                                      {requiresValue ? (
                                        <Col xs={24} md={8}>
                                          <Form.Item
                                            name={[selectedField.name, 'transition_value']}
                                            label="Значение"
                                            rules={[{ required: true, message: 'Введите значение' }]}
                                          >
                                            <Input placeholder="Например: high" />
                                          </Form.Item>
                                        </Col>
                                      ) : null}
                                    </Row>
                                  );
                                }}
                              </Form.Item>
                            </Card>
                          </Space>
                        </Card>
                      ) : null}
                    </Col>
                  </Row>
                </Space>
              );
            }}
          </Form.List>
            </>
          ) : null}
        </Form>
      </Drawer>

      <Drawer
        title={selectedTemplate ? `Процесс: ${selectedTemplate.name}` : 'Детали процесса'}
        open={templateDrawerOpen}
        width={920}
        zIndex={2400}
        destroyOnClose
        loading={templateDetailsLoading}
        onClose={() => {
          setTemplateDrawerOpen(false);
          setSelectedTemplate(null);
        }}
        extra={
          selectedTemplate ? (
            <Space>
              <Button icon={<EditOutlined />} onClick={() => openEditEditor(selectedTemplate.id)} disabled={!selectedTemplate.can_edit}>
                Редактировать
              </Button>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => runTemplate(selectedTemplate.id)}
                disabled={!selectedTemplate.can_launch}
              >
                Запустить процесс
              </Button>
            </Space>
          ) : null
        }
      >
        {selectedTemplate ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Статус">{statusTag(selectedTemplate.status)}</Descriptions.Item>
              <Descriptions.Item label="Версия">v{selectedTemplate.version || 1}</Descriptions.Item>
              <Descriptions.Item label="Описание">{selectedTemplate.description || '—'}</Descriptions.Item>
            </Descriptions>

            <Card size="small" title="Схема шагов">
              <Space direction="vertical" style={{ width: '100%' }}>
                {(selectedTemplate.steps || []).map((step) => (
                  <Card key={step.id} size="small">
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Text strong>
                        {step.order_no}. {step.name}
                      </Text>
                      <Text type="secondary">{step.description || '—'}</Text>
                      <Space>
                        <Tag>{step.assignee_type === 'group' ? 'Должность/группа' : 'Сотрудник'}</Tag>
                        <Tag color="blue">
                          {step.assignee_type === 'group'
                            ? groupOptions.find((item) => item.value === step.assignee_group)?.label || '—'
                            : userOptions.find((item) => item.value === step.assignee_user)?.label || '—'}
                        </Tag>
                        {step.sla_target_hours ? <Tag color="orange">SLA: {step.sla_target_hours}ч</Tag> : null}
                        {step.next_step_order_no ? <Tag color="purple">Переход: шаг {step.next_step_order_no}</Tag> : null}
                      </Space>
                      <Text type="secondary">Условие: {formatTransitionRule(step.transition_rule_json)}</Text>
                    </Space>
                  </Card>
                ))}
              </Space>
            </Card>

            <Card
              size="small"
              title={`Экземпляры процесса (${selectedTemplateInstances.length})`}
              extra={<Tag color="processing">Активные: {selectedTemplate.active_instances_count || 0}</Tag>}
            >
              <Table
                rowKey="id"
                size="small"
                columns={instancesColumns.filter((col) => col.key !== 'actions')}
                dataSource={selectedTemplateInstances}
                pagination={{ pageSize: 5, showSizeChanger: false }}
              />
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <Drawer
        title={selectedInstance ? `Экземпляр #${selectedInstance.id}` : 'Детали экземпляра'}
        open={instanceDrawerOpen}
        width={920}
        zIndex={2400}
        destroyOnClose
        loading={instanceDetailsLoading}
        onClose={() => {
          setInstanceDrawerOpen(false);
          setSelectedInstance(null);
        }}
        extra={
          selectedInstance?.status === 'active' ? (
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleAdvanceInstance(selectedInstance.id)}
                disabled={!selectedInstance.can_advance}
              >
                Продвинуть шаг
              </Button>
              <Popconfirm
                title="Отменить экземпляр?"
                okText="Отменить"
                cancelText="Назад"
                onConfirm={() => handleCancelInstance(selectedInstance.id)}
                disabled={!selectedInstance.can_cancel}
              >
                <Button danger icon={<StopOutlined />} disabled={!selectedInstance.can_cancel}>
                  Отменить
                </Button>
              </Popconfirm>
            </Space>
          ) : null
        }
      >
        {selectedInstance ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Descriptions size="small" bordered column={1}>
              <Descriptions.Item label="Процесс">{selectedInstance.template_name}</Descriptions.Item>
              <Descriptions.Item label="Версия">v{selectedInstance.version || 1}</Descriptions.Item>
              <Descriptions.Item label="Статус">{statusTag(selectedInstance.status)}</Descriptions.Item>
              <Descriptions.Item label="Текущий шаг">{selectedInstance.current_step_no}</Descriptions.Item>
              <Descriptions.Item label="Запущен">{formatDateTime(selectedInstance.started_at)}</Descriptions.Item>
              <Descriptions.Item label="Контекст">
                {selectedInstance.context_type || selectedInstance.context_id
                  ? `${selectedInstance.context_type || 'custom'}:${selectedInstance.context_id || '—'}`
                  : '—'}
              </Descriptions.Item>
            </Descriptions>

            <Tabs
              defaultActiveKey="steps"
              items={[
                {
                  key: 'steps',
                  label: 'Исполнение',
                  children: (
                    <Row gutter={[12, 12]}>
                      <Col xs={24} lg={14}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {(selectedInstance.steps || []).map((step) => (
                            <Card
                              key={step.id}
                              size="small"
                              title={`${step.order_no}. ${step.name_snapshot}`}
                              extra={statusTag(step.status)}
                            >
                              <Space direction="vertical" style={{ width: '100%' }}>
                                <Text type="secondary">{step.description_snapshot || '—'}</Text>
                                <Space wrap size={6}>
                                  {step.sla_target_hours_snapshot ? <Tag color="orange">SLA: {step.sla_target_hours_snapshot}ч</Tag> : null}
                                  {step.due_at ? <Tag color="gold">Due: {formatDateTime(step.due_at)}</Tag> : null}
                                  {step.overdue_since ? <Tag color="error">Просрочен с {formatDateTime(step.overdue_since)}</Tag> : null}
                                </Space>
                                <Table
                                  rowKey="id"
                                  size="small"
                                  pagination={false}
                                  dataSource={step.tasks || []}
                                  columns={[
                                    { title: 'Задача', dataIndex: 'name', key: 'name' },
                                    {
                                      title: 'Стадия',
                                      dataIndex: 'stage_name',
                                      key: 'stage_name',
                                      width: 220,
                                      render: (value, row) => (
                                        <Space>
                                          <Text>{value || '—'}</Text>
                                          {row.stage_done ? <Tag color="success">Done</Tag> : row.active ? <Tag color="processing">Active</Tag> : <Tag>Closed</Tag>}
                                        </Space>
                                      ),
                                    },
                                  ]}
                                />
                              </Space>
                            </Card>
                          ))}
                        </Space>
                      </Col>
                      <Col xs={24} lg={10}>
                        {canUseBpAnalyticsFeature ? (
                          <Card size="small" title="Таймлайн исполнения">
                            <Table
                              rowKey="id"
                              size="small"
                              pagination={{ pageSize: 6, showSizeChanger: false }}
                              dataSource={selectedInstance.events || []}
                              columns={[
                                {
                                  title: 'Время',
                                  dataIndex: 'created_at',
                                  key: 'created_at',
                                  width: 170,
                                  render: formatDateTime,
                                },
                                {
                                  title: 'Событие',
                                  dataIndex: 'event_type',
                                  key: 'event_type',
                                  width: 170,
                                  render: (value) => <Tag color="blue">{eventTypeLabel(value)}</Tag>,
                                },
                              ]}
                            />
                          </Card>
                        ) : (
                          <BusinessFeatureGateNotice
                            featureCode="business_processes.analytics"
                            title="Таймлайн исполнения недоступен"
                            description="Для просмотра событий процесса требуется модуль аналитики бизнес-процессов."
                          />
                        )}
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: 'timeline',
                  label: 'Таймлайн',
                  children: canUseBpAnalyticsFeature ? (
                    <Table
                      rowKey="id"
                      size="small"
                      pagination={{ pageSize: 8, showSizeChanger: false }}
                      dataSource={selectedInstance.events || []}
                      columns={[
                        {
                          title: 'Время',
                          dataIndex: 'created_at',
                          key: 'created_at',
                          width: 200,
                          render: formatDateTime,
                        },
                        {
                          title: 'Событие',
                          dataIndex: 'event_type',
                          key: 'event_type',
                          width: 220,
                          render: (value) => <Tag color="blue">{eventTypeLabel(value)}</Tag>,
                        },
                        {
                          title: 'Детали',
                          dataIndex: 'payload_json',
                          key: 'payload_json',
                          render: (value) => (
                            <Text type="secondary" style={{ wordBreak: 'break-word' }}>
                              {value ? JSON.stringify(value) : '—'}
                            </Text>
                          ),
                        },
                      ]}
                    />
                  ) : (
                    <BusinessFeatureGateNotice
                      featureCode="business_processes.analytics"
                      title="Таймлайн исполнения недоступен"
                      description="Для просмотра событий процесса требуется модуль аналитики бизнес-процессов."
                    />
                  ),
                },
              ]}
            />
          </Space>
        ) : null}
      </Drawer>

      <BusinessProcessLaunchWizard
        open={launchWizardOpen}
        loading={launchWizardLoading}
        submitting={launchSubmitting}
        template={launchTemplate}
        entityOptionsByType={launchEntityOptions}
        initialContext={launchPrefill}
        onCancel={() => {
          setLaunchWizardOpen(false);
          setLaunchTemplate(null);
        }}
        onSubmit={submitLaunchWizard}
      />
    </Space>
  );
}
