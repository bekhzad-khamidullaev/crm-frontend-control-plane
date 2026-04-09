import {
  AppstoreOutlined,
  BarsOutlined,
  CalendarOutlined,
  CopyOutlined,
  CustomerServiceOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  ProfileOutlined,
  ProjectOutlined,
  ReloadOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  App,
  Badge,
  Button,
  Calendar,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Grid,
  Input,
  Modal,
  Row,
  Select,
  Segmented,
  Space,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
  theme,
} from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  bulkTransitionContentItems,
  createContentChannelVariant,
  createContentItem,
  createContentPlan,
  approveContentItem,
  deleteContentItem,
  deleteContentPlan,
  getCampaigns,
  getContentItemActivity,
  getContentPlan,
  getContentItems,
  getContentPlans,
  getSegments,
  getTemplates,
  publishContentItemNow,
  rejectContentItem,
  requestContentItemApproval,
  scheduleContentItem,
  transitionContentItem,
  updateContentChannelVariant,
  updateContentItem,
  updateContentPlan,
} from '../lib/api/marketing.js';
import { BusinessEntityListShell } from '../components/business/BusinessEntityListShell';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { WorkspaceSummaryStrip, WorkspaceTabsShell } from '../shared/ui/WorkspaceRhythm';
import CampaignsList from '../modules/marketing/CampaignsList.jsx';
import MarketingSegmentsPage from './marketing-segments.jsx';
import MarketingTemplatesPage from './marketing-templates.jsx';
import { containsText, formatDateSafe, toResults } from './workspace-utils.js';

const { Text, Title } = Typography;

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Черновик' },
  { value: 'active', label: 'Активна' },
  { value: 'archived', label: 'Архив' },
];

const PLAN_STAGES = [
  { value: 'idea', label: 'ИДЕЯ', color: 'default' },
  { value: 'copywriting', label: 'КОПИРАЙТИНГ', color: 'gold' },
  { value: 'design', label: 'ДИЗАЙН', color: 'blue' },
  { value: 'review', label: 'СОГЛАСОВАНИЕ', color: 'purple' },
  { value: 'approved', label: 'ОДОБРЕНО', color: 'cyan' },
  { value: 'scheduled', label: 'ЗАПЛАНИРОВАНО', color: 'processing' },
  { value: 'published', label: 'ОПУБЛИКОВАНО', color: 'success' },
  { value: 'failed', label: 'ОШИБКА', color: 'error' },
];

const CONTENT_FORMATS = ['post', 'stories', 'reels', 'video'];

const CHANNEL_LABELS = {
  sms: 'SMS',
  tg: 'Telegram',
  ig: 'Instagram',
  email: 'Email',
};

const STAGE_TRANSITIONS = {
  idea: ['copywriting'],
  copywriting: ['design', 'review'],
  design: ['review'],
  review: ['copywriting', 'design', 'approved'],
  approved: ['scheduled'],
  scheduled: ['published', 'failed'],
  failed: ['scheduled'],
  published: [],
};

const stageMetaMap = PLAN_STAGES.reduce((acc, stage) => {
  acc[stage.value] = stage;
  return acc;
}, {});

const campaignStatusTag = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') return <Tag color="success">Активна</Tag>;
  if (normalized === 'archived') return <Tag color="default">Архив</Tag>;
  return <Tag>Черновик</Tag>;
};

function toCampaignFormValues(record = {}) {
  return {
    name: record.name || '',
    status: record.status || 'draft',
    timezone: record.timezone || 'Asia/Tashkent',
    campaign: record.campaign || undefined,
    description: record.description || '',
    start_date: (record.start_date || record.start_at) ? dayjs(record.start_date || record.start_at) : null,
    end_date: record.end_date ? dayjs(record.end_date) : null,
  };
}

export default function ContentPlansWorkspacePage({ initialTab = 'plans' }) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { token } = theme.useToken();
  const { message } = App.useApp();

  const [form] = Form.useForm();
  const [contentForm] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);

  const [search, setSearch] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [contentPlans, setContentPlans] = useState([]);
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [planLayout, setPlanLayout] = useState('grid');
  const [activePlanId, setActivePlanId] = useState(null);
  const [planView, setPlanView] = useState('board');
  const [tasksOnly, setTasksOnly] = useState(false);
  const [planDetailsModalOpen, setPlanDetailsModalOpen] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState(null);

  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [editingPlanItemId, setEditingPlanItemId] = useState(null);
  const [planItemsByCampaign, setPlanItemsByCampaign] = useState({});
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityEntries, setActivityEntries] = useState([]);
  const [activityTitle, setActivityTitle] = useState('История действий');
  const [selectedPlanItemIds, setSelectedPlanItemIds] = useState([]);
  const [bulkTargetStage, setBulkTargetStage] = useState(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const campaignOptions = useMemo(
    () => campaigns.map((item) => ({ value: item.id, label: item.name || `Кампания #${item.id}` })),
    [campaigns],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [campaignsRes, segmentsRes, templatesRes, contentPlansRes] = await Promise.allSettled([
        getCampaigns({ page_size: 500, ordering: '-created_at' }),
        getSegments({ page_size: 500, ordering: '-updated_at' }),
        getTemplates({ page_size: 500, ordering: '-updated_at' }),
        getContentPlans({ page_size: 500 }),
      ]);
      setCampaigns(campaignsRes.status === 'fulfilled' ? toResults(campaignsRes.value) : []);
      setSegments(segmentsRes.status === 'fulfilled' ? toResults(segmentsRes.value) : []);
      setTemplates(templatesRes.status === 'fulfilled' ? toResults(templatesRes.value) : []);
      setContentPlans(contentPlansRes.status === 'fulfilled' ? toResults(contentPlansRes.value) : []);

      const failed = [campaignsRes, segmentsRes, templatesRes, contentPlansRes].some((item) => item.status === 'rejected');
      if (failed) {
        message.warning('Часть данных маркетинга не загрузилась. Проверьте права доступа и повторите обновление.');
      }
    } catch (error) {
      message.error(error?.message || 'Не удалось загрузить контент-планы');
      setCampaigns([]);
      setContentPlans([]);
      setSegments([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCampaigns = useMemo(
    () => contentPlans.filter((item) =>
      containsText(item.name, search)
      || containsText(item.status, search)
      || containsText(item.campaign_name, search)
    ),
    [contentPlans, search],
  );

  useEffect(() => {
    if (activeTab !== 'plans') return;
    if (!filteredCampaigns.length) {
      setActivePlanId(null);
      return;
    }
    if (!filteredCampaigns.some((item) => item.id === activePlanId)) {
      setActivePlanId(filteredCampaigns[0].id);
    }
  }, [activeTab, filteredCampaigns, activePlanId]);

  const activeCampaigns = useMemo(
    () => filteredCampaigns.filter((item) => {
      const normalizedStatus = String(item.status || '').toLowerCase();
      return normalizedStatus === 'active' || Boolean(item.is_active);
    }).length,
    [filteredCampaigns],
  );
  const pausedCampaigns = useMemo(
    () => filteredCampaigns.filter((item) => String(item.status || '').toLowerCase() === 'archived').length,
    [filteredCampaigns],
  );

  const loadPlanItems = useCallback(async (planId) => {
    if (!planId) return;
    try {
      const response = await getContentItems({ plan: planId, page_size: 500, ordering: 'planned_at' });
      const rawItems = toResults(response);
      const normalized = rawItems.map((item) => {
        const firstVariant = Array.isArray(item.channel_variants) && item.channel_variants.length ? item.channel_variants[0] : null;
        return {
          id: item.id,
          campaignId: item.plan,
          date: item.planned_at ? dayjs(item.planned_at).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
          topic: item.title || 'Контент',
          platform: firstVariant?.channel || 'omnichannel',
          format: firstVariant?.format || CONTENT_FORMATS[0],
          status: item.workflow_stage || PLAN_STAGES[0].value,
          variantId: firstVariant?.id,
        };
      });
      setPlanItemsByCampaign((prev) => ({ ...prev, [planId]: normalized }));
    } catch (error) {
      message.error(error?.message || 'Не удалось загрузить публикации контент-плана');
    }
  }, [message]);

  useEffect(() => {
    if (!selectedPlan?.id) return;
    setSelectedPlanItemIds([]);
    loadPlanItems(selectedPlan.id);
  }, [selectedPlan?.id, loadPlanItems]);

  const selectedPlan = useMemo(
    () => contentPlans.find((item) => item.id === activePlanId) || null,
    [contentPlans, activePlanId],
  );

  const selectedPlanItems = useMemo(() => {
    if (!selectedPlan) return [];
    return (planItemsByCampaign[selectedPlan.id] || [])
      .slice()
      .sort((left, right) => dayjs(left.date).valueOf() - dayjs(right.date).valueOf());
  }, [selectedPlan, planItemsByCampaign]);

  const visiblePlanItems = useMemo(
    () => (tasksOnly ? selectedPlanItems.filter((item) => item.status !== 'published') : selectedPlanItems),
    [selectedPlanItems, tasksOnly],
  );

  const groupedPlanItems = useMemo(
    () => PLAN_STAGES.reduce((acc, stage) => {
      acc[stage.value] = visiblePlanItems.filter((item) => item.status === stage.value);
      return acc;
    }, {}),
    [visiblePlanItems],
  );

  const doneItemsCount = useMemo(
    () => selectedPlanItems.filter((item) => item.status === 'published').length,
    [selectedPlanItems],
  );

  const openPlanDetails = useCallback((planId) => {
    setActivePlanId(planId);
    setPlanDetailsModalOpen(true);
  }, []);

  const openCreate = () => {
    setEditingCampaignId(null);
    form.resetFields();
    form.setFieldsValue(toCampaignFormValues());
    setDrawerOpen(true);
  };

  const openEdit = async (record) => {
    setEditingCampaignId(record.id);
    try {
      const full = await getContentPlan(record.id);
      form.setFieldsValue(toCampaignFormValues(full));
      setDrawerOpen(true);
    } catch (error) {
      message.error(error?.message || 'Не удалось открыть контент-план');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        status: values.status,
        description: values.description || '',
        campaign: values.campaign || null,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
        timezone: values.timezone || 'Asia/Tashkent',
      };
      setSaving(true);
      if (editingCampaignId) {
        await updateContentPlan(editingCampaignId, payload);
        message.success('Контент-план обновлен');
      } else {
        const createdCampaign = await createContentPlan(payload);
        if (createdCampaign?.id) {
          setActivePlanId(createdCampaign.id);
        }
        message.success('Контент-план создан');
      }
      setDrawerOpen(false);
      setEditingCampaignId(null);
      await loadData();
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.message || 'Не удалось сохранить контент-план');
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDeletePlan = (record) => {
    Modal.confirm({
      title: 'Удалить контент-план?',
      content: 'Удаление необратимо',
      okText: 'Удалить',
      okButtonProps: { danger: true },
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await deleteContentPlan(record.id);
          setPlanItemsByCampaign((prev) => {
            const next = { ...prev };
            delete next[record.id];
            return next;
          });
          message.success('Контент-план удален');
          if (record.id === activePlanId) {
            setActivePlanId(null);
            setPlanDetailsModalOpen(false);
          }
          await loadData();
        } catch (error) {
          message.error(error?.message || 'Не удалось удалить контент-план');
        }
      },
    });
  };

  const handleDuplicateSelectedPlan = async () => {
    if (!selectedPlan) return;
    const payload = {
      name: `${selectedPlan.name || 'Контент-план'} (копия)`,
      status: selectedPlan.status || 'draft',
      description: selectedPlan.description || '',
      campaign: selectedPlan.campaign || null,
      start_date: selectedPlan.start_date || null,
      end_date: selectedPlan.end_date || null,
      timezone: selectedPlan.timezone || 'Asia/Tashkent',
    };

    setCopying(true);
    try {
      const createdCampaign = await createContentPlan(payload);
      const createdPlanId = createdCampaign?.id;

      if (createdPlanId) {
        await Promise.all(selectedPlanItems.map(async (item) => {
          const createdItem = await createContentItem({
            plan: createdPlanId,
            title: item.topic,
            workflow_stage: item.status,
            planned_at: dayjs(item.date).toISOString(),
          });
          if (createdItem?.id) {
            await createContentChannelVariant({
              item: createdItem.id,
              channel: String(item.platform || 'ig').toLowerCase(),
              format: String(item.format || 'post').toLowerCase(),
              body: '',
            });
          }
        }));
        setActivePlanId(createdPlanId);
        await loadPlanItems(createdPlanId);
      }

      message.success('Контент-план скопирован');
      await loadData();
    } catch (error) {
      message.error(error?.message || 'Не удалось скопировать контент-план');
    } finally {
      setCopying(false);
    }
  };

  const openAddContentModal = useCallback(() => {
    if (!selectedPlan) return;
    contentForm.resetFields();
    contentForm.setFieldsValue({
      date: dayjs(),
      topic: '',
      platform: 'ig',
      format: CONTENT_FORMATS[0],
      status: PLAN_STAGES[0].value,
    });
    setEditingPlanItemId(null);
    setContentModalOpen(true);
  }, [selectedPlan, contentForm]);

  const openEditContentModal = useCallback((item) => {
    contentForm.resetFields();
    contentForm.setFieldsValue({
      date: item.date ? dayjs(item.date) : dayjs(),
      topic: item.topic || '',
      platform: item.platform || 'ig',
      format: item.format || CONTENT_FORMATS[0],
      status: item.status || PLAN_STAGES[0].value,
    });
    setEditingPlanItemId(item.id);
    setContentModalOpen(true);
  }, [contentForm, selectedPlan]);

  const handleDeleteContentItem = useCallback((item) => {
    Modal.confirm({
      title: 'Удалить публикацию?',
      content: 'Публикация будет удалена из контент-плана',
      okText: 'Удалить',
      okButtonProps: { danger: true },
      cancelText: 'Отмена',
      onOk: async () => {
        await deleteContentItem(item.id);
        await loadPlanItems(item.campaignId);
        message.success('Публикация удалена');
      },
    });
  }, [message, loadPlanItems]);

  const handleSaveContentItem = async () => {
    if (!selectedPlan) return;
    try {
      const values = await contentForm.validateFields();
      const payload = {
        plan: selectedPlan.id,
        title: values.topic,
        workflow_stage: values.status,
        planned_at: values.date.startOf('day').toISOString(),
      };
      let savedItemId = editingPlanItemId;
      let variantId = null;
      if (editingPlanItemId) {
        const existingItem = (planItemsByCampaign[selectedPlan.id] || []).find((item) => item.id === editingPlanItemId);
        variantId = existingItem?.variantId || null;
        await updateContentItem(editingPlanItemId, payload);
      } else {
        const created = await createContentItem(payload);
        savedItemId = created?.id;
      }
      if (savedItemId) {
        const variantPayload = {
          item: savedItemId,
          channel: String(values.platform || 'ig').toLowerCase(),
          format: String(values.format || 'post').toLowerCase(),
          body: '',
        };
        if (variantId) {
          await updateContentChannelVariant(variantId, variantPayload);
        } else {
          await createContentChannelVariant(variantPayload);
        }
      }
      await loadPlanItems(selectedPlan.id);
      setContentModalOpen(false);
      setEditingPlanItemId(null);
      message.success(editingPlanItemId ? 'Публикация обновлена' : 'Публикация добавлена в контент-план');
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.message || 'Не удалось сохранить публикацию');
      }
    }
  };

  const handleTransitionContentItem = useCallback(async (item, targetStage) => {
    try {
      await transitionContentItem(item.id, targetStage);
      await loadPlanItems(item.campaignId);
      message.success('Статус публикации обновлен');
    } catch (error) {
      message.error(error?.message || 'Не удалось обновить статус');
    }
  }, [loadPlanItems, message]);

  const handleBulkTransition = useCallback(async () => {
    if (!selectedPlan?.id || !selectedPlanItemIds.length || !bulkTargetStage) return;
    try {
      const response = await bulkTransitionContentItems(selectedPlanItemIds, bulkTargetStage);
      const updatedCount = Array.isArray(response?.updated_ids) ? response.updated_ids.length : 0;
      const failedCount = Array.isArray(response?.failed) ? response.failed.length : 0;
      if (updatedCount) {
        message.success(`Массово обновлено: ${updatedCount}`);
      }
      if (failedCount) {
        message.warning(`Не обновлено: ${failedCount}`);
      }
      setSelectedPlanItemIds([]);
      await loadPlanItems(selectedPlan.id);
    } catch (error) {
      message.error(error?.message || 'Не удалось выполнить массовый переход');
    }
  }, [bulkTargetStage, loadPlanItems, message, selectedPlan?.id, selectedPlanItemIds]);

  const handleRequestApproval = useCallback(async (item) => {
    try {
      await requestContentItemApproval(item.id, {});
      await loadPlanItems(item.campaignId);
      message.success('Согласование запрошено');
    } catch (error) {
      message.error(error?.message || 'Не удалось запросить согласование');
    }
  }, [loadPlanItems, message]);

  const handleApprovalDecision = useCallback(async (item, approve) => {
    try {
      if (approve) {
        await approveContentItem(item.id, {});
      } else {
        await rejectContentItem(item.id, {});
      }
      await loadPlanItems(item.campaignId);
      message.success(approve ? 'Публикация согласована' : 'Публикация отклонена');
    } catch (error) {
      message.error(error?.message || 'Не удалось применить решение согласования');
    }
  }, [loadPlanItems, message]);

  const handleScheduleOrPublish = useCallback(async (item, publishNow = false) => {
    try {
      if (publishNow) {
        await publishContentItemNow(item.id);
      } else {
        await scheduleContentItem(item.id, dayjs(item.date).startOf('day').toISOString());
      }
      await loadPlanItems(item.campaignId);
      message.success(publishNow ? 'Публикация отправлена' : 'Публикация поставлена в расписание');
    } catch (error) {
      message.error(error?.message || 'Не удалось выполнить действие публикации');
    }
  }, [loadPlanItems, message]);

  const openActivityModal = useCallback(async (item) => {
    setActivityModalOpen(true);
    setActivityLoading(true);
    setActivityTitle(`История: ${item.topic}`);
    try {
      const response = await getContentItemActivity(item.id);
      setActivityEntries(Array.isArray(response) ? response : []);
    } catch (error) {
      setActivityEntries([]);
      message.error(error?.message || 'Не удалось загрузить историю действий');
    } finally {
      setActivityLoading(false);
    }
  }, [message]);

  const activeFilters = search
    ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }]
    : [];

  const summaryItems = useMemo(
    () => [
      { key: 'campaigns', label: 'Кампании', value: campaigns.length },
      { key: 'plans', label: 'Контент-планы', value: filteredCampaigns.length },
      { key: 'active', label: 'Активные планы', value: activeCampaigns },
      { key: 'segments', label: 'Сегменты', value: segments.length },
      { key: 'templates', label: 'Шаблоны', value: templates.length, hint: `На паузе: ${pausedCampaigns}` },
    ],
    [campaigns.length, filteredCampaigns.length, activeCampaigns, pausedCampaigns, templates.length, segments.length],
  );

  const segmentedOptions = useMemo(
    () => [
      { value: 'campaigns', label: `Кампании · ${campaigns.length}` },
      { value: 'plans', label: `Контент-планы · ${filteredCampaigns.length}` },
      { value: 'segments', label: `Сегменты · ${segments.length}` },
      { value: 'templates', label: `Шаблоны · ${templates.length}` },
    ],
    [campaigns.length, filteredCampaigns.length, segments.length, templates.length],
  );

  const tabLabel = (icon, title, count) => (
    <Space size={6}>
      {icon}
      <span>{title}</span>
      <Badge count={count} style={{ backgroundColor: '#1677ff' }} />
    </Space>
  );

  const planLayoutOptions = useMemo(
    () => [
      {
        value: 'grid',
        label: (
          <Space size={6}>
            <AppstoreOutlined />
            <span>Плитка</span>
          </Space>
        ),
      },
      {
        value: 'list',
        label: (
          <Space size={6}>
            <BarsOutlined />
            <span>Список</span>
          </Space>
        ),
      },
    ],
    [],
  );

  const planViewOptions = useMemo(
    () => [
      {
        value: 'calendar',
        label: (
          <Space size={6}>
            <CalendarOutlined />
            <span>Календарь</span>
          </Space>
        ),
      },
      {
        value: 'list',
        label: (
          <Space size={6}>
            <UnorderedListOutlined />
            <span>Список</span>
          </Space>
        ),
      },
      {
        value: 'board',
        label: (
          <Space size={6}>
            <ProfileOutlined />
            <span>Доска</span>
          </Space>
        ),
      },
      {
        value: 'timeline',
        label: (
          <Space size={6}>
            <ProjectOutlined />
            <span>Таймлайн</span>
          </Space>
        ),
      },
    ],
    [],
  );

  const planTableColumns = useMemo(
    () => [
      {
        title: 'Контент-план',
        dataIndex: 'name',
        key: 'name',
        render: (value, record) => (
          <Button type="link" style={{ paddingInline: 0 }} onClick={() => openPlanDetails(record.id)}>
            {value || `План #${record.id}`}
          </Button>
        ),
      },
      {
        title: 'Период',
        key: 'period',
        render: (_, record) => `${formatDateSafe(record.start_date)} - ${formatDateSafe(record.end_date)}`,
      },
      {
        title: 'Кампания',
        dataIndex: 'campaign_name',
        key: 'campaign_name',
        render: (value) => value || '-',
      },
      {
        title: 'Таймзона',
        dataIndex: 'timezone',
        key: 'timezone',
        render: (value) => value || '-',
      },
      {
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        render: (value) => campaignStatusTag(value),
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 220,
        render: (_, record) => (
          <Space size={6}>
            <Button size="small" type={record.id === activePlanId ? 'primary' : 'default'} onClick={() => openPlanDetails(record.id)}>
              Открыть
            </Button>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
              Ред.
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => confirmDeletePlan(record)}>
              Удал.
            </Button>
          </Space>
        ),
      },
    ],
    [activePlanId, openPlanDetails],
  );

  const renderWorkflowActions = useCallback((item) => {
    const nextStages = STAGE_TRANSITIONS[item.status] || [];
    return (
      <Space size={4} wrap>
        {nextStages.slice(0, 2).map((stage) => (
          <Button
            key={stage}
            size="small"
            type="text"
            onClick={() => handleTransitionContentItem(item, stage)}
          >
            → {(stageMetaMap[stage] || {}).label || stage}
          </Button>
        ))}
        {item.status === 'review' ? (
          <>
            <Button size="small" type="text" onClick={() => handleApprovalDecision(item, true)}>Approve</Button>
            <Button size="small" type="text" danger onClick={() => handleApprovalDecision(item, false)}>Reject</Button>
          </>
        ) : null}
        {item.status === 'approved' ? (
          <Button size="small" type="text" onClick={() => handleScheduleOrPublish(item, false)}>Schedule</Button>
        ) : null}
        {item.status === 'scheduled' ? (
          <Button size="small" type="text" onClick={() => handleScheduleOrPublish(item, true)}>Publish</Button>
        ) : null}
        {(item.status === 'design' || item.status === 'copywriting') ? (
          <Button size="small" type="text" onClick={() => handleRequestApproval(item)}>Request approval</Button>
        ) : null}
      </Space>
    );
  }, [handleApprovalDecision, handleRequestApproval, handleScheduleOrPublish, handleTransitionContentItem]);

  const planItemsColumns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (value) => formatDateSafe(value),
    },
    {
      title: 'Тема',
      dataIndex: 'topic',
      key: 'topic',
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: 'Площадка',
      dataIndex: 'platform',
      key: 'platform',
      render: (value) => CHANNEL_LABELS[value] || value || '-',
    },
    {
      title: 'Формат',
      dataIndex: 'format',
      key: 'format',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: (value) => {
        const meta = stageMetaMap[value] || PLAN_STAGES[0];
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 170,
      render: (_, item) => (
        <Space size={6} wrap>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditContentModal(item)}>Ред.</Button>
          <Button size="small" onClick={() => openActivityModal(item)}>История</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteContentItem(item)}>Удал.</Button>
          {renderWorkflowActions(item)}
        </Space>
      ),
    },
  ];

  const timelineItems = useMemo(
    () => visiblePlanItems.map((item) => {
      const meta = stageMetaMap[item.status] || PLAN_STAGES[0];
      return {
        color: meta.color,
        label: formatDateSafe(item.date),
        children: (
          <Space direction="vertical" size={2}>
            <Text strong>{item.topic}</Text>
            <Text type="secondary">{CHANNEL_LABELS[item.platform] || item.platform} · {item.format}</Text>
            <Tag color={meta.color}>{meta.label}</Tag>
            <Space size={4}>
              <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEditContentModal(item)}>
                Ред.
              </Button>
              <Button size="small" type="text" onClick={() => openActivityModal(item)}>
                История
              </Button>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteContentItem(item)}>
                Удал.
              </Button>
            </Space>
            {renderWorkflowActions(item)}
          </Space>
        ),
      };
    }),
    [visiblePlanItems, openEditContentModal, handleDeleteContentItem, openActivityModal, renderWorkflowActions],
  );

  const planCalendarCellRender = useCallback((current, info) => {
    if (info?.type && info.type !== 'date') return info.originNode;
    const dayItems = visiblePlanItems.filter((item) => dayjs(item.date).isSame(current, 'day'));
    if (!dayItems.length) return info?.originNode || null;

    const previewItems = dayItems.slice(0, 2);
    return (
      <Space direction="vertical" size={2} style={{ width: '100%' }}>
        {previewItems.map((item) => {
          const meta = stageMetaMap[item.status] || PLAN_STAGES[0];
          return (
            <Tag
              key={item.id}
              color={meta.color}
              style={{
                marginInlineEnd: 0,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer',
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openEditContentModal(item);
              }}
            >
              {item.format}: {item.topic}
            </Tag>
          );
        })}
        {dayItems.length > 2 ? <Text type="secondary">+{dayItems.length - 2}</Text> : null}
      </Space>
    );
  }, [visiblePlanItems, openEditContentModal]);

  return (
    <BusinessEntityListShell
      title="Маркетинг"
      subtitle="Контент-планы по принципу Taska: библиотека планов и единая рабочая область с режимами календаря, списка, доски и таймлайна."
      extra={(
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Новый контент-план
        </Button>
      )}
    >
      <Space direction="vertical" size={10} style={{ width: '100%' }}>

      <Segmented
        block={isMobile}
        value={activeTab}
        onChange={setActiveTab}
        options={segmentedOptions}
      />
      <WorkspaceSummaryStrip items={summaryItems} compact />

      {activeTab === 'plans' ? (
        <EntityListToolbar
          searchValue={search}
          searchPlaceholder="Поиск по контент-планам"
          onSearchChange={setSearch}
          onRefresh={loadData}
          onReset={() => setSearch('')}
          activeFilters={activeFilters}
          loading={loading}
          resultSummary={`Планов: ${filteredCampaigns.length} | Публикаций в выбранном плане: ${selectedPlanItems.length}`}
        />
      ) : null}

      <WorkspaceTabsShell>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarGutter={isMobile ? 8 : 18}
          items={[
            {
              key: 'campaigns',
              label: tabLabel(<CustomerServiceOutlined />, 'Кампании', campaigns.length),
              children: <CampaignsList embedded />,
            },
            {
              key: 'plans',
              label: tabLabel(<ProfileOutlined />, 'Контент-планы', filteredCampaigns.length),
              children: (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Card
                    variant="borderless"
                    style={{ border: `1px solid ${token.colorBorderSecondary}` }}
                    styles={{ body: { padding: isMobile ? 10 : 14 } }}
                  >
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                        <Space align="center" size={8}>
                          <Title level={5} style={{ margin: 0 }}>Контент-планы</Title>
                          <Tag color="blue">{filteredCampaigns.length}</Tag>
                        </Space>
                        <Segmented value={planLayout} onChange={setPlanLayout} options={planLayoutOptions} />
                      </Space>

                      {filteredCampaigns.length ? (
                        planLayout === 'grid' ? (
                          <Row gutter={[12, 12]}>
                            {filteredCampaigns.map((record) => {
                              const isActive = record.id === activePlanId;
                              const itemsCount = (planItemsByCampaign[record.id] || []).length;

                              return (
                                <Col key={record.id} xs={24} md={12} xl={8}>
                                  <Card
                                    hoverable
                                    onClick={() => openPlanDetails(record.id)}
                                    style={{
                                      height: '100%',
                                      borderColor: isActive ? token.colorPrimary : token.colorBorderSecondary,
                                      boxShadow: isActive ? token.boxShadowSecondary : token.boxShadowTertiary,
                                    }}
                                    styles={{ body: { display: 'flex', flexDirection: 'column', gap: 10 } }}
                                  >
                                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                      <Text strong>{record.name || `План #${record.id}`}</Text>
                                      <Text type="secondary">{formatDateSafe(record.start_date)} - {formatDateSafe(record.end_date)}</Text>
                                    </Space>

                                    <Space size={6} wrap>
                                      {campaignStatusTag(record.status)}
                                      <Tag color="cyan">Публикаций: {itemsCount}</Tag>
                                    </Space>

                                    <Space direction="vertical" size={0}>
                                      <Text type="secondary">Кампания: {record.campaign_name || 'Не привязана'}</Text>
                                      <Text type="secondary">Таймзона: {record.timezone || 'Asia/Tashkent'}</Text>
                                    </Space>

                                    <Space size={6} wrap>
                                      <Button size="small" type={isActive ? 'primary' : 'default'} onClick={() => openPlanDetails(record.id)}>
                                        Открыть
                                      </Button>
                                      <Button size="small" icon={<EditOutlined />} onClick={(event) => {
                                        event.stopPropagation();
                                        openEdit(record);
                                      }}>
                                        Ред.
                                      </Button>
                                      <Button size="small" danger icon={<DeleteOutlined />} onClick={(event) => {
                                        event.stopPropagation();
                                        confirmDeletePlan(record);
                                      }}>
                                        Удал.
                                      </Button>
                                    </Space>
                                  </Card>
                                </Col>
                              );
                            })}
                          </Row>
                        ) : (
                          <Table
                            rowKey="id"
                            loading={loading}
                            dataSource={filteredCampaigns}
                            columns={planTableColumns}
                            pagination={{ pageSize: 10, hideOnSinglePage: true }}
                          />
                        )
                      ) : (
                        <Empty description="Контент-планы не найдены" />
                      )}
                    </Space>
                  </Card>

                </Space>
              ),
            },
            {
              key: 'segments',
              label: tabLabel(<TeamOutlined />, 'Сегменты', segments.length),
              children: <MarketingSegmentsPage embedded />,
            },
            {
              key: 'templates',
              label: tabLabel(<FileTextOutlined />, 'Шаблоны', templates.length),
              children: <MarketingTemplatesPage embedded />,
            },
          ]}
        />
      </WorkspaceTabsShell>

      <Modal
        title={selectedPlan?.name || 'Контент-план'}
        open={planDetailsModalOpen}
        onCancel={() => setPlanDetailsModalOpen(false)}
        footer={null}
        width={1200}
        destroyOnHidden={false}
      >
        {selectedPlan ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
              <Space direction="vertical" size={0}>
                <Title level={5} style={{ margin: 0 }}>{selectedPlan.name || `План #${selectedPlan.id}`}</Title>
                <Text type="secondary">
                  {formatDateSafe(selectedPlan.start_date)} - {formatDateSafe(selectedPlan.end_date)}
                  {' · '}
                  Готово: {doneItemsCount} из {selectedPlanItems.length}
                </Text>
              </Space>
              <Space wrap>
                <Button icon={<CopyOutlined />} loading={copying} onClick={handleDuplicateSelectedPlan}>Копировать</Button>
                <Button icon={<ReloadOutlined />} onClick={loadData}>Обновить</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openAddContentModal}>Создать</Button>
              </Space>
            </Space>

            <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
              <Segmented value={planView} onChange={setPlanView} options={planViewOptions} />
              <Space wrap>
                {planView === 'list' ? (
                  <Space wrap>
                    <Select
                      allowClear
                      placeholder="Массовый переход"
                      value={bulkTargetStage}
                      onChange={setBulkTargetStage}
                      options={PLAN_STAGES.map((stage) => ({ value: stage.value, label: stage.label }))}
                      style={{ minWidth: 180 }}
                    />
                    <Button
                      onClick={handleBulkTransition}
                      disabled={!selectedPlanItemIds.length || !bulkTargetStage}
                    >
                      Применить ({selectedPlanItemIds.length})
                    </Button>
                  </Space>
                ) : null}
                <Button type={tasksOnly ? 'primary' : 'default'} onClick={() => setTasksOnly((prev) => !prev)}>
                  Задачи
                </Button>
              </Space>
            </Space>

            {planView === 'calendar' ? (
              <Calendar cellRender={planCalendarCellRender} />
            ) : null}

            {planView === 'list' ? (
              <Table
                rowKey="id"
                dataSource={visiblePlanItems}
                columns={planItemsColumns}
                rowSelection={{
                  selectedRowKeys: selectedPlanItemIds,
                  onChange: (keys) => setSelectedPlanItemIds(keys),
                }}
                pagination={{ pageSize: 8, hideOnSinglePage: true }}
                locale={{ emptyText: 'Публикации не найдены' }}
              />
            ) : null}

            {planView === 'board' ? (
              <div style={{ overflowX: 'auto' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${PLAN_STAGES.length}, minmax(230px, 1fr))`,
                    gap: 10,
                    minWidth: PLAN_STAGES.length * 230,
                  }}
                >
                  {PLAN_STAGES.map((stage) => {
                    const stageItems = groupedPlanItems[stage.value] || [];
                    return (
                      <Card
                        key={stage.value}
                        size="small"
                        title={(
                          <Space size={6}>
                            <Tag color={stage.color} style={{ marginInlineEnd: 0 }}>{stage.label}</Tag>
                            <Badge count={stageItems.length} style={{ backgroundColor: '#1677ff' }} />
                          </Space>
                        )}
                        styles={{ body: { padding: 8 } }}
                      >
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          {stageItems.length ? stageItems.map((item) => (
                            <Card key={item.id} size="small" styles={{ body: { padding: 8 } }}>
                              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                <Text strong style={{ fontSize: 12 }}>{item.topic}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>{formatDateSafe(item.date)}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>{CHANNEL_LABELS[item.platform] || item.platform} · {item.format}</Text>
                                <Space size={4}>
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => openEditContentModal(item)}
                                  >
                                    Ред.
                                  </Button>
                                  <Button
                                    size="small"
                                    type="text"
                                    onClick={() => openActivityModal(item)}
                                  >
                                    История
                                  </Button>
                                  <Button
                                    size="small"
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteContentItem(item)}
                                  >
                                    Удал.
                                  </Button>
                                </Space>
                                {renderWorkflowActions(item)}
                              </Space>
                            </Card>
                          )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Пусто" />}
                        </Space>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {planView === 'timeline' ? (
              timelineItems.length ? (
                <Timeline mode={isMobile ? 'left' : 'alternate'} items={timelineItems} />
              ) : (
                <Empty description="Таймлайн пуст" />
              )
            ) : null}
          </Space>
        ) : (
          <Empty description="Выберите контент-план из списка выше" />
        )}
      </Modal>

      <Modal
        title={editingCampaignId ? 'Редактирование контент-плана' : 'Создание контент-плана'}
        open={drawerOpen}
        onCancel={() => {
          setDrawerOpen(false);
          setEditingCampaignId(null);
        }}
        onOk={handleSave}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={saving}
        width={760}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true, message: 'Введите название' }]}>
            <Input placeholder="Весенняя omnichannel-кампания" />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Space size={12} style={{ width: '100%' }} wrap>
            <Form.Item name="status" label="Статус" style={{ minWidth: 220 }}>
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="timezone" label="Таймзона" style={{ minWidth: 220 }}>
              <Input placeholder="Asia/Tashkent" />
            </Form.Item>
          </Space>
          <Space size={12} style={{ width: '100%' }} wrap>
            <Form.Item name="start_date" label="Дата старта" style={{ minWidth: 220 }}>
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
            <Form.Item name="end_date" label="Дата окончания" style={{ minWidth: 220 }}>
              <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
            </Form.Item>
          </Space>
          <Form.Item name="campaign" label="Связанная кампания">
            <Select allowClear options={campaignOptions} placeholder="Выберите кампанию (необязательно)" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={activityTitle}
        open={activityModalOpen}
        onCancel={() => setActivityModalOpen(false)}
        footer={null}
      >
        {activityLoading ? (
          <Text type="secondary">Загрузка...</Text>
        ) : (
          activityEntries.length ? (
            <Timeline
              items={activityEntries.map((entry) => ({
                color: 'blue',
                label: formatDateSafe(entry.created_at),
                children: (
                  <Space direction="vertical" size={0}>
                    <Text strong>{entry.event_type}</Text>
                    <Text type="secondary">{entry.actor_name || 'System'}</Text>
                  </Space>
                ),
              }))}
            />
          ) : (
            <Empty description="История пуста" />
          )
        )}
      </Modal>

      <Modal
        title={editingPlanItemId ? 'Редактирование публикации' : 'Новая публикация'}
        open={contentModalOpen}
        onCancel={() => {
          setContentModalOpen(false);
          setEditingPlanItemId(null);
        }}
        onOk={handleSaveContentItem}
        okText={editingPlanItemId ? 'Сохранить' : 'Добавить'}
        cancelText="Отмена"
      >
        <Form form={contentForm} layout="vertical">
          <Form.Item name="date" label="Дата" rules={[{ required: true, message: 'Укажите дату' }]}>
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item name="topic" label="Тема" rules={[{ required: true, message: 'Введите тему публикации' }]}>
            <Input placeholder="Например: Пост про новый кейс" />
          </Form.Item>
          <Space size={12} style={{ width: '100%' }} wrap>
            <Form.Item name="platform" label="Площадка" style={{ minWidth: 200 }}>
              <Select
                options={[
                  { value: 'ig', label: 'Instagram' },
                  { value: 'tg', label: 'Telegram' },
                  { value: 'email', label: 'Email' },
                  { value: 'sms', label: 'SMS' },
                ]}
              />
            </Form.Item>
            <Form.Item name="format" label="Формат" style={{ minWidth: 180 }}>
              <Select
                options={CONTENT_FORMATS.map((item) => ({
                  value: item,
                  label: item === 'post' ? 'Пост' : item === 'stories' ? 'Stories' : item === 'reels' ? 'Reels' : 'Видео',
                }))}
              />
            </Form.Item>
            <Form.Item name="status" label="Статус" style={{ minWidth: 200 }}>
              <Select options={PLAN_STAGES.map((stage) => ({ value: stage.value, label: stage.label }))} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
      </Space>
    </BusinessEntityListShell>
  );
}
