import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  message,
} from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import EntitySelect from './EntitySelect.jsx';
import ReferenceSelect from './ui-ReferenceSelect';

const { Search } = Input;
const { TextArea } = Input;

function renderValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function parseDateValue(value, type) {
  if (!value) return null;
  return type === 'date' ? dayjs(value) : dayjs(value);
}

function serializeDateValue(value, type) {
  if (!value) return null;
  return type === 'date' ? value.format('YYYY-MM-DD') : value.toISOString();
}

function buildRules(field) {
  const rules = [];
  if (field.required) {
    rules.push({ required: true, message: field.requiredMessage || 'Поле обязательно' });
  }
  if (field.type === 'json') {
    rules.push({
      validator: (_, value) => {
        if (!value) return Promise.resolve();
        try {
          JSON.parse(value);
          return Promise.resolve();
        } catch (err) {
          return Promise.reject(new Error('Некорректный JSON'));
        }
      },
    });
  }
  return rules;
}

function renderField(field) {
  const commonProps = field.props || {};

  switch (field.type) {
    case 'textarea':
      return <TextArea rows={field.rows || 4} placeholder={field.placeholder} {...commonProps} />;
    case 'number':
      return <InputNumber min={field.min} max={field.max} style={{ width: '100%' }} placeholder={field.placeholder} {...commonProps} />;
    case 'select':
      return (
        <Select
          placeholder={field.placeholder}
          mode={field.multiple ? 'multiple' : undefined}
          options={field.options || []}
          allowClear={field.allowClear}
          {...commonProps}
        />
      );
    case 'switch':
      return <Switch />;
    case 'date':
      return <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" {...commonProps} />;
    case 'datetime':
      return <DatePicker style={{ width: '100%' }} showTime format="YYYY-MM-DD HH:mm" {...commonProps} />;
    case 'entity':
      return (
        <EntitySelect
          placeholder={field.placeholder}
          fetchOptions={field.fetchOptions || field.fetchList}
          fetchById={field.fetchById}
          allowClear
          {...commonProps}
        />
      );
    case 'reference':
      return (
        <ReferenceSelect
          type={field.referenceType}
          placeholder={field.placeholder}
          mode={field.multiple ? 'multiple' : undefined}
          allowClear
          {...commonProps}
        />
      );
    case 'json':
      return <TextArea rows={field.rows || 6} placeholder={field.placeholder || '{ }'} {...commonProps} />;
    default:
      return <Input placeholder={field.placeholder} {...commonProps} />;
  }
}

function deserializeRecord(record, fields) {
  const next = { ...record };
  fields.forEach((field) => {
    if (field.type === 'date' || field.type === 'datetime') {
      next[field.name] = parseDateValue(record[field.name], field.type);
    }
    if (field.type === 'json' && record[field.name] !== undefined) {
      try {
        next[field.name] = JSON.stringify(record[field.name] ?? {}, null, 2);
      } catch (err) {
        next[field.name] = '';
      }
    }
  });
  return next;
}

function serializeValues(values, fields) {
  const payload = { ...values };
  fields.forEach((field) => {
    if (field.type === 'date' || field.type === 'datetime') {
      payload[field.name] = serializeDateValue(values[field.name], field.type);
    }
    if (field.type === 'json') {
      if (values[field.name]) {
        payload[field.name] = JSON.parse(values[field.name]);
      }
    }
  });
  return payload;
}

export default function CrudPage({
  title,
  description,
  api,
  columns,
  fields,
  rowKey = 'id',
  searchable = true,
  searchPlaceholder = 'Поиск',
  initialValues = {},
  readOnly = false,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [form] = Form.useForm();

  const mergedColumns = useMemo(() => {
    const actions = {
      title: 'Действия',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          {!readOnly && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          )}
          {!readOnly && (
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
          )}
        </Space>
      ),
    };
    return [...columns, actions];
  }, [columns, readOnly]);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchText]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
      };
      if (searchable && searchText) {
        params.search = searchText;
      }
      const response = await api.list(params);
      const results = response?.results || response || [];
      setData(results);
      setPagination((prev) => ({ ...prev, total: response?.count || results.length }));
    } catch (error) {
      message.error('Не удалось загрузить данные');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setModalOpen(true);
  };

  const handleEdit = async (record) => {
    setEditing(record);
    try {
      const detail = api.retrieve ? await api.retrieve(record[rowKey]) : record;
      form.setFieldsValue(deserializeRecord(detail, fields));
      setModalOpen(true);
    } catch (error) {
      message.error('Не удалось загрузить данные');
    }
  };

  const handleView = async (record) => {
    try {
      const detail = api.retrieve ? await api.retrieve(record[rowKey]) : record;
      setViewRecord(detail);
      setDrawerOpen(true);
    } catch (error) {
      message.error('Не удалось загрузить данные');
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Удалить запись?',
      content: 'Действие нельзя отменить.',
      okText: 'Удалить',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.remove(record[rowKey]);
          message.success('Запись удалена');
          fetchData();
        } catch (error) {
          message.error('Не удалось удалить запись');
        }
      },
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = serializeValues(values, fields);

      if (editing) {
        await api.update(editing[rowKey], payload);
        message.success('Изменения сохранены');
      } else {
        await api.create(payload);
        message.success('Запись создана');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error('Ошибка сохранения');
      console.error(error);
    }
  };

  return (
    <Card title={title} extra={!readOnly && (
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
        Добавить
      </Button>
    )}>
      {description && <p style={{ marginBottom: 16 }}>{description}</p>}
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {searchable && (
          <Search
            placeholder={searchPlaceholder}
            allowClear
            style={{ maxWidth: 320 }}
            onSearch={setSearchText}
          />
        )}
        <Table
          columns={mergedColumns}
          dataSource={data}
          rowKey={rowKey}
          loading={loading}
          pagination={pagination}
          onChange={(pagination) => setPagination(pagination)}
          scroll={{ x: 1000 }}
        />
      </Space>

      <Modal
        title={editing ? 'Редактирование' : 'Создание'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={initialValues}>
          {fields.map((field) => (
            <Form.Item
              key={field.name}
              label={field.label}
              name={field.name}
              rules={buildRules(field)}
              valuePropName={field.type === 'switch' ? 'checked' : 'value'}
            >
              {renderField(field)}
            </Form.Item>
          ))}
        </Form>
      </Modal>

      <Drawer
        title="Детали"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
      >
        {viewRecord && (
          <Descriptions column={1} bordered>
            {Object.entries(viewRecord).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>
                {renderValue(value)}
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </Drawer>
    </Card>
  );
}
