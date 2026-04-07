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
  InputNumber,
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
  createCampaign,
  deleteCampaign,
  getCampaign,
  getCampaigns,
  getSegments,
  getTemplates,
  updateCampaign,
} from '../lib/api/marketing.js';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { PageHeader } from '../shared/ui/PageHeader';
import { WorkspaceSummaryStrip, WorkspaceTabsShell } from '../shared/ui/WorkspaceRhythm';
import CampaignsList from '../modules/marketing/CampaignsList.jsx';
import MarketingSegmentsPage from './marketing-segments.jsx';
import MarketingTemplatesPage from './marketing-templates.jsx';
import { containsText, formatDateSafe, toNumberSafe, toResults } from './workspace-utils.js';

const { Text, Title } = Typography;

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Черновик' },
  { value: 'active', label: 'Активна' },
  { value: 'paused', label: 'Пауза' },
  { value: 'completed', label: 'Завершена' },
];

const TYPE_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'social', label: 'Social' },
  { value: 'omnichannel', label: 'Omnichannel' },
];

const PLAN_STAGES = [
  { value: 'idea', label: 'ИДЕЯ', color: 'default' },
  { value: 'copywriting', label: 'КОПИРАЙТИНГ', color: 'gold' },
  { value: 'design', label: 'ДИЗАЙН', color: 'blue' },
  { value: 'approval', label: 'СОГЛАСОВАНИЕ', color: 'purple' },
  { value: 'planned', label: 'ПЛАН', color: 'processing' },
  { value: 'done', label: 'ГОТОВО', color: 'success' },
];

const CONTENT_FORMATS = ['Пост', 'Stories', 'Reels', 'Видео'];

const PLATFORM_BY_TYPE = {
  email: 'Email',
  sms: 'SMS',
  social: 'Instagram',
  omnichannel: 'Omnichannel',
};

const DEFAULT_TOPIC_POOL = [
  'Анонс акции',
  'Пост о кейсе клиента',
  'Сторис с опросом',
  'Обзор продукта',
  'Экспертный совет недели',
  'Рилс с демонстрацией процесса',
];

const PLAN_ITEMS_STORAGE_KEY = 'crm_marketing_plan_items_v1';

function readStoredPlanItems() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PLAN_ITEMS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

const stageMetaMap = PLAN_STAGES.reduce((acc, stage) => {
  acc[stage.value] = stage;
  return acc;
}, {});

const campaignStatusTag = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') return <Tag color="success">Активна</Tag>;
  if (normalized === 'paused') return <Tag color="warning">Пауза</Tag>;
  if (normalized === 'completed') return <Tag color="processing">Завершена</Tag>;
  return <Tag>Черновик</Tag>;
};

function toCampaignFormValues(record = {}) {
  return {
    name: record.name || '',
    type: record.type || 'omnichannel',
    status: record.status || 'draft',
    description: record.description || '',
    start_date: record.start_date ? dayjs(record.start_date) : null,
    end_date: record.end_date ? dayjs(record.end_date) : null,
    budget: typeof record.budget === 'number' ? record.budget : null,
    segment: record.segment || undefined,
    template: record.template || undefined,
  };
}

function buildPlanItems(campaign, templates = []) {
  if (!campaign) return [];

  const sourceTopics = templates.length
    ? templates.map((item) => item.name || 'Контент').filter(Boolean)
    : DEFAULT_TOPIC_POOL;
  const planSeed = Number(campaign.id) || String(campaign.name || '').length || 1;
  const stageOffset = Math.abs(planSeed) % PLAN_STAGES.length;
  const totalItems = Math.max(12, Math.min(30, sourceTopics.length * 2));
  const baseDateRaw = campaign.start_date || campaign.start_at || campaign.update_date || campaign.created_at;
  const baseDate = baseDateRaw ? dayjs(baseDateRaw) : dayjs();
  const platform = PLATFORM_BY_TYPE[campaign.type] || 'Omnichannel';

  return Array.from({ length: totalItems }, (_, index) => {
    const stage = PLAN_STAGES[(index + stageOffset) % PLAN_STAGES.length].value;
    const topic = sourceTopics[index % sourceTopics.length];
    const format = CONTENT_FORMATS[(index + planSeed) % CONTENT_FORMATS.length];

    return {
      id: `generated-${campaign.id}-${index}`,
      campaignId: campaign.id,
      date: baseDate.add(index, 'day').format('YYYY-MM-DD'),
      topic,
      platform,
      format,
      status: stage,
    };
  });
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
  const [planItemsByCampaign, setPlanItemsByCampaign] = useState(() => readStoredPlanItems());

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const segmentOptions = useMemo(
    () => segments.map((item) => ({ value: item.id, label: item.name || 'Сегмент' })),
    [segments],
  );
  const templateOptions = useMemo(
    () => templates.map((item) => ({ value: item.id, label: item.name || 'Шаблон' })),
    [templates],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [campaignsRes, segmentsRes, templatesRes] = await Promise.allSettled([
        getCampaigns({ page_size: 500, ordering: '-created_at' }),
        getSegments({ page_size: 500, ordering: '-updated_at' }),
        getTemplates({ page_size: 500, ordering: '-updated_at' }),
      ]);
      setCampaigns(campaignsRes.status === 'fulfilled' ? toResults(campaignsRes.value) : []);
      setSegments(segmentsRes.status === 'fulfilled' ? toResults(segmentsRes.value) : []);
      setTemplates(templatesRes.status === 'fulfilled' ? toResults(templatesRes.value) : []);

      const failed = [campaignsRes, segmentsRes, templatesRes].some((item) => item.status === 'rejected');
      if (failed) {
        message.warning('Часть данных маркетинга не загрузилась. Проверьте права доступа и повторите обновление.');
      }
    } catch (error) {
      message.error(error?.message || 'Не удалось загрузить контент-планы');
      setCampaigns([]);
      setSegments([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PLAN_ITEMS_STORAGE_KEY, JSON.stringify(planItemsByCampaign));
    } catch {
      // ignore localStorage write errors
    }
  }, [planItemsByCampaign]);

  const filteredCampaigns = useMemo(
    () => campaigns.filter((item) =>
      containsText(item.name, search)
      || containsText(item.type, search)
      || containsText(item.status, search)
      || containsText(item.segment_name, search)
      || containsText(item.template_name, search)
    ),
    [campaigns, search],
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
    () => filteredCampaigns.filter((item) => String(item.status || '').toLowerCase() === 'paused').length,
    [filteredCampaigns],
  );

  useEffect(() => {
    setPlanItemsByCampaign((prev) => {
      let changed = false;
      const next = { ...prev };
      const campaignIdSet = new Set(campaigns.map((campaign) => String(campaign.id)));

      Object.keys(next).forEach((campaignId) => {
        if (!campaignIdSet.has(String(campaignId))) {
          delete next[campaignId];
          changed = true;
        }
      });

      campaigns.forEach((campaign) => {
        if (!next[campaign.id]) {
          next[campaign.id] = buildPlanItems(campaign, templates);
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [campaigns, templates]);

  const selectedPlan = useMemo(
    () => campaigns.find((item) => item.id === activePlanId) || null,
    [campaigns, activePlanId],
  );

  const selectedPlanItems = useMemo(() => {
    if (!selectedPlan) return [];
    return (planItemsByCampaign[selectedPlan.id] || [])
      .slice()
      .sort((left, right) => dayjs(left.date).valueOf() - dayjs(right.date).valueOf());
  }, [selectedPlan, planItemsByCampaign]);

  const visiblePlanItems = useMemo(
    () => (tasksOnly ? selectedPlanItems.filter((item) => item.status !== 'done') : selectedPlanItems),
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
    () => selectedPlanItems.filter((item) => item.status === 'done').length,
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
      const full = await getCampaign(record.id);
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
        type: values.type,
        status: values.status,
        description: values.description || '',
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
        budget: toNumberSafe(values.budget),
        segment: values.segment || null,
        template: values.template || null,
      };
      setSaving(true);
      if (editingCampaignId) {
        await updateCampaign(editingCampaignId, payload);
        message.success('Контент-план обновлен');
      } else {
        const createdCampaign = await createCampaign(payload);
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
          await deleteCampaign(record.id);
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
      type: selectedPlan.type || 'omnichannel',
      status: selectedPlan.status || 'draft',
      description: selectedPlan.description || '',
      start_date: selectedPlan.start_date || null,
      end_date: selectedPlan.end_date || null,
      budget: toNumberSafe(selectedPlan.budget),
      segment: selectedPlan.segment || null,
      template: selectedPlan.template || null,
    };

    setCopying(true);
    try {
      const createdCampaign = await createCampaign(payload);
      const createdPlanId = createdCampaign?.id;

      if (createdPlanId) {
        setPlanItemsByCampaign((prev) => ({
          ...prev,
          [createdPlanId]: selectedPlanItems.map((item, index) => ({
            ...item,
            id: `manual-${createdPlanId}-${Date.now()}-${index}`,
            campaignId: createdPlanId,
          })),
        }));
        setActivePlanId(createdPlanId);
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
      platform: PLATFORM_BY_TYPE[selectedPlan.type] || 'Omnichannel',
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
      platform: item.platform || PLATFORM_BY_TYPE[selectedPlan?.type] || 'Omnichannel',
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
      onOk: () => {
        setPlanItemsByCampaign((prev) => ({
          ...prev,
          [item.campaignId]: (prev[item.campaignId] || []).filter((planItem) => planItem.id !== item.id),
        }));
        message.success('Публикация удалена');
      },
    });
  }, [message]);

  const handleSaveContentItem = async () => {
    if (!selectedPlan) return;
    try {
      const values = await contentForm.validateFields();
      const normalizedItem = {
        id: editingPlanItemId || `manual-${selectedPlan.id}-${Date.now()}`,
        campaignId: selectedPlan.id,
        date: values.date.format('YYYY-MM-DD'),
        topic: values.topic,
        platform: values.platform,
        format: values.format,
        status: values.status,
      };

      setPlanItemsByCampaign((prev) => {
        const existing = prev[selectedPlan.id] || [];
        const nextItems = editingPlanItemId
          ? existing.map((item) => (item.id === editingPlanItemId ? normalizedItem : item))
          : [...existing, normalizedItem];
        return {
          ...prev,
          [selectedPlan.id]: nextItems,
        };
      });
      setContentModalOpen(false);
      setEditingPlanItemId(null);
      message.success(editingPlanItemId ? 'Публикация обновлена' : 'Публикация добавлена в контент-план');
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.message || 'Не удалось сохранить публикацию');
      }
    }
  };

  const activeFilters = search
    ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }]
    : [];

  const summaryItems = useMemo(
    () => [
      { key: 'campaigns', label: 'Кампании', value: campaigns.length },
      { key: 'plans', label: 'Контент-планы', value: filteredCampaigns.length },
      { key: 'active', label: 'Активные кампании', value: activeCampaigns },
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
        title: 'Сегмент',
        dataIndex: 'segment_name',
        key: 'segment_name',
        render: (value) => value || '-',
      },
      {
        title: 'Шаблон',
        dataIndex: 'template_name',
        key: 'template_name',
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
        <Space size={6}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditContentModal(item)}>
            Ред.
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteContentItem(item)}>
            Удал.
          </Button>
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
            <Text type="secondary">{item.platform} · {item.format}</Text>
            <Tag color={meta.color}>{meta.label}</Tag>
            <Space size={4}>
              <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEditContentModal(item)}>
                Ред.
              </Button>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteContentItem(item)}>
                Удал.
              </Button>
            </Space>
          </Space>
        ),
      };
    }),
    [visiblePlanItems, openEditContentModal, handleDeleteContentItem],
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
    <Space direction="vertical" size={10} style={{ width: '100%' }}>
      <PageHeader
        title="Маркетинг"
        subtitle="Контент-планы по принципу Taska: библиотека планов и единая рабочая область с режимами календаря, списка, доски и таймлайна."
        extra={(
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Новый контент-план
          </Button>
        )}
      />

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
                                      <Text type="secondary">Сегмент: {record.segment_name || 'Не указан'}</Text>
                                      <Text type="secondary">Шаблон: {record.template_name || 'Не указан'}</Text>
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
              <Button type={tasksOnly ? 'primary' : 'default'} onClick={() => setTasksOnly((prev) => !prev)}>
                Задачи
              </Button>
            </Space>

            {planView === 'calendar' ? (
              <Calendar cellRender={planCalendarCellRender} />
            ) : null}

            {planView === 'list' ? (
              <Table
                rowKey="id"
                dataSource={visiblePlanItems}
                columns={planItemsColumns}
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
                                <Text type="secondary" style={{ fontSize: 12 }}>{item.platform} · {item.format}</Text>
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
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteContentItem(item)}
                                  >
                                    Удал.
                                  </Button>
                                </Space>
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
            <Form.Item name="type" label="Тип" style={{ minWidth: 220 }}>
              <Select options={TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item name="status" label="Статус" style={{ minWidth: 220 }}>
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="budget" label="Бюджет" style={{ minWidth: 220 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
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
          <Space size={12} style={{ width: '100%' }} wrap>
            <Form.Item name="segment" label="Сегмент" style={{ minWidth: 320 }}>
              <Select allowClear options={segmentOptions} placeholder="Выберите сегмент" />
            </Form.Item>
            <Form.Item name="template" label="Шаблон" style={{ minWidth: 320 }}>
              <Select allowClear options={templateOptions} placeholder="Выберите шаблон" />
            </Form.Item>
          </Space>
        </Form>
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
                  { value: 'Instagram', label: 'Instagram' },
                  { value: 'Facebook', label: 'Facebook' },
                  { value: 'WhatsApp', label: 'WhatsApp' },
                  { value: 'Telegram', label: 'Telegram' },
                  { value: 'Omnichannel', label: 'Omnichannel' },
                ]}
              />
            </Form.Item>
            <Form.Item name="format" label="Формат" style={{ minWidth: 180 }}>
              <Select options={CONTENT_FORMATS.map((item) => ({ value: item, label: item }))} />
            </Form.Item>
            <Form.Item name="status" label="Статус" style={{ minWidth: 200 }}>
              <Select options={PLAN_STAGES.map((stage) => ({ value: stage.value, label: stage.label }))} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Space>
  );
}
