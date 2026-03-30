import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
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
import { containsText, formatDateSafe, toNumberSafe, toResults } from './workspace-utils.js';

const { Text } = Typography;

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

export default function ContentPlansWorkspacePage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState(null);

  const segmentOptions = useMemo(
    () => segments.map((item) => ({ value: item.id, label: item.name || `Сегмент #${item.id}` })),
    [segments],
  );
  const templateOptions = useMemo(
    () => templates.map((item) => ({ value: item.id, label: item.name || `Шаблон #${item.id}` })),
    [templates],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [campaignsRes, segmentsRes, templatesRes] = await Promise.all([
        getCampaigns({ page_size: 500, ordering: '-update_date' }),
        getSegments({ page_size: 500, ordering: '-update_date' }),
        getTemplates({ page_size: 500, ordering: '-update_date' }),
      ]);
      setCampaigns(toResults(campaignsRes));
      setSegments(toResults(segmentsRes));
      setTemplates(toResults(templatesRes));
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

  const filteredCampaigns = useMemo(
    () => campaigns.filter((item) =>
      containsText(item.name, search)
      || containsText(item.type, search)
      || containsText(item.status, search)
      || containsText(item.segment_name, search)
    ),
    [campaigns, search],
  );

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
        await createCampaign(payload);
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

  const handleDelete = async (record) => {
    try {
      await deleteCampaign(record.id);
      message.success('Контент-план удален');
      await loadData();
    } catch (error) {
      message.error(error?.message || 'Не удалось удалить контент-план');
    }
  };

  const activeFilters = search
    ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }]
    : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="Контент планы"
        subtitle="Управление контентными активностями: кампании, сегменты, шаблоны."
      />

      <EntityListToolbar
        searchValue={search}
        searchPlaceholder="Поиск по контент-планам"
        onSearchChange={setSearch}
        onRefresh={loadData}
        onReset={() => setSearch('')}
        activeFilters={activeFilters}
        loading={loading}
        resultSummary={`Планов: ${filteredCampaigns.length} | Сегментов: ${segments.length} | Шаблонов: ${templates.length}`}
      />
      <Card>
        <Tabs
          items={[
            {
              key: 'plans',
              label: 'Контент-планы',
              children: (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text type="secondary">CRUD управление кампаниями контент-плана</Text>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                      Новый план
                    </Button>
                  </Space>
                  <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={filteredCampaigns}
                    pagination={{ pageSize: 10, hideOnSinglePage: true }}
                    columns={[
                      { title: 'Название', dataIndex: 'name', key: 'name', render: (value) => <Text strong>{value || '-'}</Text> },
                      { title: 'Тип', dataIndex: 'type', key: 'type', render: (value) => value || '-' },
                      { title: 'Статус', dataIndex: 'status', key: 'status', render: (value) => campaignStatusTag(value) },
                      { title: 'Сегмент', dataIndex: 'segment_name', key: 'segment_name', render: (value) => value || '-' },
                      { title: 'Старт', dataIndex: 'start_date', key: 'start_date', render: (value) => formatDateSafe(value) },
                      { title: 'Окончание', dataIndex: 'end_date', key: 'end_date', render: (value) => formatDateSafe(value) },
                      {
                        title: 'Действия',
                        key: 'actions',
                        width: 170,
                        render: (_, record) => (
                          <Space size={4}>
                            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>Ред.</Button>
                            <ModalConfirmDeleteButton onConfirm={() => handleDelete(record)} />
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Space>
              ),
            },
            {
              key: 'segments',
              label: 'Сегменты',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={segments}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Сегмент', dataIndex: 'name', key: 'name', render: (value) => value || '-' },
                    { title: 'Описание', dataIndex: 'description', key: 'description', render: (value) => value || '-' },
                    { title: 'Размер', dataIndex: 'size_cache', key: 'size_cache', render: (value) => value ?? '-' },
                  ]}
                />
              ),
            },
            {
              key: 'templates',
              label: 'Шаблоны',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={templates}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Шаблон', dataIndex: 'name', key: 'name', render: (value) => value || '-' },
                    { title: 'Канал', dataIndex: 'type', key: 'type', render: (value) => value || '-' },
                    { title: 'Тема', dataIndex: 'subject', key: 'subject', render: (value) => value || '-' },
                    { title: 'Обновлено', dataIndex: 'update_date', key: 'update_date', render: (value) => formatDateSafe(value) },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>

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
    </Space>
  );
}

function ModalConfirmDeleteButton({ onConfirm }) {
  return (
    <Button
      size="small"
      danger
      icon={<DeleteOutlined />}
      onClick={() =>
        Modal.confirm({
          title: 'Удалить контент-план?',
          content: 'Удаление необратимо',
          okText: 'Удалить',
          okButtonProps: { danger: true },
          cancelText: 'Отмена',
          onOk: onConfirm,
        })
      }
    >
      Удал.
    </Button>
  );
}
