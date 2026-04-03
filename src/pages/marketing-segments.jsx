import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Card, Drawer, Form, Input, Popconfirm, Select, Space, Switch, Table, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { createSegment, deleteSegment, getSegment, getSegments, updateSegment } from '../lib/api/marketing.js';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';

const { Title, Text } = Typography;

const FIELD_OPTIONS = [
  { label: 'Теги контакта', value: 'contact.tags' },
  { label: 'Страна', value: 'contact.country' },
  { label: 'Источник лида', value: 'lead.source' },
  { label: 'Стадия сделки', value: 'deal.stage' },
  { label: 'Сумма сделки', value: 'deal.amount' },
  { label: 'Последняя активность (дней)', value: 'activity.last_days' },
];

const OPERATOR_OPTIONS = [
  { label: 'Равно', value: 'eq' },
  { label: 'Не равно', value: 'neq' },
  { label: 'Содержит', value: 'contains' },
  { label: 'Не содержит', value: 'not_contains' },
  { label: 'Больше', value: 'gt' },
  { label: 'Меньше', value: 'lt' },
  { label: 'Пусто', value: 'is_empty' },
  { label: 'Не пусто', value: 'is_not_empty' },
];

function parseRules(rawRules) {
  if (!rawRules || typeof rawRules !== 'object') {
    return { logic: 'and', conditions: [{ field: undefined, operator: undefined, value: '' }] };
  }
  const logic = String(rawRules.logic || rawRules.condition || 'and').toLowerCase() === 'or' ? 'or' : 'and';
  const conditionsSource = Array.isArray(rawRules.conditions) ? rawRules.conditions : [];
  if (!conditionsSource.length) {
    return { logic, conditions: [{ field: undefined, operator: undefined, value: '' }] };
  }
  return {
    logic,
    conditions: conditionsSource.map((item) => ({
      field: item.field || item.key || undefined,
      operator: item.operator || 'eq',
      value: item.value ?? '',
    })),
  };
}

function buildRulesPayload(values) {
  const conditions = (values.conditions || [])
    .filter((row) => row?.field && row?.operator)
    .map((row) => ({
      field: row.field,
      operator: row.operator,
      value: row.value ?? '',
    }));

  return {
    logic: values.logic === 'or' ? 'or' : 'and',
    conditions,
  };
}

export default function MarketingSegmentsPage({ embedded = false }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [segments, setSegments] = useState([]);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState(null);

  const loadSegments = async () => {
    setLoading(true);
    try {
      const response = await getSegments({ page_size: 500, ordering: '-updated_at' });
      const results = Array.isArray(response?.results) ? response.results : response || [];
      setSegments(Array.isArray(results) ? results : []);
    } catch (error) {
      setSegments([]);
      message.error(error?.message || 'Не удалось загрузить сегменты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSegments();
  }, []);

  const filteredData = useMemo(() => {
    if (!search) return segments;
    const needle = search.toLowerCase();
    return segments.filter((item) =>
      [item.name, item.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [search, segments]);

  const openCreate = () => {
    setEditingSegmentId(null);
    form.resetFields();
    form.setFieldsValue({
      name: '',
      description: '',
      is_dynamic: true,
      logic: 'and',
      conditions: [{ field: undefined, operator: undefined, value: '' }],
    });
    setDrawerOpen(true);
  };

  const openEdit = async (record) => {
    setEditingSegmentId(record.id);
    try {
      const full = await getSegment(record.id);
      const parsed = parseRules(full?.rules || full?.filters);
      form.setFieldsValue({
        name: full?.name || '',
        description: full?.description || '',
        is_dynamic: full?.is_dynamic ?? true,
        logic: parsed.logic,
        conditions: parsed.conditions,
      });
      setDrawerOpen(true);
    } catch (error) {
      message.error(error?.message || 'Не удалось открыть сегмент');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const rulesPayload = buildRulesPayload(values);
      const payload = {
        name: values.name,
        description: values.description || '',
        is_dynamic: Boolean(values.is_dynamic),
        rules: rulesPayload,
        filters: rulesPayload,
      };
      setSaving(true);
      if (editingSegmentId) {
        await updateSegment(editingSegmentId, payload);
        message.success('Сегмент обновлен');
      } else {
        await createSegment(payload);
        message.success('Сегмент создан');
      }
      setDrawerOpen(false);
      setEditingSegmentId(null);
      await loadSegments();
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.message || 'Не удалось сохранить сегмент');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteSegment(record.id);
      message.success('Сегмент удален');
      await loadSegments();
    } catch (error) {
      message.error(error?.message || 'Не удалось удалить сегмент');
    }
  };

  const content = (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          {embedded ? (
            <>
              <Text strong>Сегменты аудитории</Text>
              <div>
                <Text type="secondary">Конструктор правил сегментации клиентов.</Text>
              </div>
            </>
          ) : (
            <>
              <Title level={3} style={{ margin: 0 }}>Маркетинговые сегменты</Title>
              <Text type="secondary">
                Графический конструктор правил сегментации без ручного JSON.
              </Text>
            </>
          )}
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Создать сегмент
        </Button>
      </Space>

      <EntityListToolbar
        searchValue={search}
        searchPlaceholder="Поиск по названию или описанию"
        onSearchChange={setSearch}
        onRefresh={loadSegments}
        onReset={() => setSearch('')}
        loading={loading}
        resultSummary={`Всего сегментов: ${filteredData.length}`}
        activeFilters={search ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }] : []}
      />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filteredData}
        columns={[
          { title: 'Название', dataIndex: 'name', key: 'name', render: (value) => <Text strong>{value || '-'}</Text> },
          { title: 'Описание', dataIndex: 'description', key: 'description', render: (value) => value || '-' },
          { title: 'Размер', dataIndex: 'size_cache', key: 'size_cache', width: 140, render: (value) => value ?? '-' },
          {
            title: 'Тип',
            dataIndex: 'is_dynamic',
            key: 'is_dynamic',
            width: 140,
            render: (value) => (value ? <Tag color="processing">Динамический</Tag> : <Tag>Статический</Tag>),
          },
          {
            title: 'Действия',
            key: 'actions',
            width: 170,
            render: (_, record) => (
              <Space size={4}>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                  Ред.
                </Button>
                <Popconfirm
                  title="Удалить сегмент?"
                  description="Действие нельзя отменить"
                  okText="Удалить"
                  cancelText="Отмена"
                  onConfirm={() => handleDelete(record)}
                >
                  <Button size="small" danger icon={<DeleteOutlined />}>Удал.</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
      />
    </Space>
  );

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {embedded ? content : <Card>{content}</Card>}

      <Drawer
        title={editingSegmentId ? 'Редактирование сегмента' : 'Создание сегмента'}
        open={drawerOpen}
        width={760}
        destroyOnClose
        onClose={() => {
          setDrawerOpen(false);
          setEditingSegmentId(null);
        }}
        extra={(
          <Space>
            <Button onClick={loadSegments} icon={<ReloadOutlined />}>Обновить</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>Сохранить</Button>
          </Space>
        )}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Название сегмента"
            rules={[{ required: true, message: 'Введите название сегмента' }]}
          >
            <Input placeholder="Например: Активные клиенты из Ташкента" />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} placeholder="Кратко опишите логику сегмента" />
          </Form.Item>
          <Form.Item name="is_dynamic" label="Тип сегмента" valuePropName="checked">
            <Switch checkedChildren="Динамический" unCheckedChildren="Статический" />
          </Form.Item>
          <Form.Item name="logic" label="Связка правил" initialValue="and">
            <Select
              options={[
                { value: 'and', label: 'Все условия (AND)' },
                { value: 'or', label: 'Любое условие (OR)' },
              ]}
            />
          </Form.Item>

          <Form.List name="conditions">
            {(fields, { add, remove }) => (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`Условие ${index + 1}`}
                    extra={fields.length > 1 ? (
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                    ) : null}
                  >
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'field']}
                        label="Поле"
                        rules={[{ required: true, message: 'Выберите поле' }]}
                      >
                        <Select showSearch options={FIELD_OPTIONS} placeholder="Выберите поле" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'operator']}
                        label="Оператор"
                        rules={[{ required: true, message: 'Выберите оператор' }]}
                      >
                        <Select options={OPERATOR_OPTIONS} placeholder="Выберите оператор" />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'value']} label="Значение">
                        <Input placeholder="Например: VIP или 100000" />
                      </Form.Item>
                    </Space>
                  </Card>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ field: undefined, operator: undefined, value: '' })}>
                  Добавить условие
                </Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </Drawer>
    </Space>
  );
}
