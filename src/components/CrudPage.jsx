/**
 * CrudPage Component - Rewritten for Ant Design 5.x
 * Universal CRUD page with table, form, and modal
 */

import React, { useEffect, useState } from 'react';
import { Form, Modal, Button, Table, Card, Space, Input, InputNumber, Switch, DatePicker, Select, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import EntitySelect from './EntitySelect.jsx';
import EnhancedTable from './ui-EnhancedTable.jsx';
import { canWrite as canWriteByRole } from '../lib/rbac.js';

const { TextArea } = Input;
const { Option } = Select;

export default function CrudPage({
  title = 'CRUD',
  api,
  columns = [],
  fields = [],
  readOnly = false,
  canCreate,
  canEdit,
  canDelete,
  canView = true,
  initialValues = {},
  pageSize = 20,
}) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize, total: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const roleCanWrite = canWriteByRole();
  const allowCreate = !readOnly && (canCreate ?? roleCanWrite);
  const allowEdit = !readOnly && (canEdit ?? roleCanWrite);
  const allowDelete = !readOnly && (canDelete ?? roleCanWrite);
  const allowView = canView !== false;

  const fetchList = async () => {
    if (!api?.list) return;
    setLoading(true);
    try {
      const res = await api.list({ page: pagination.current, page_size: pagination.pageSize });
      const results = Array.isArray(res) ? res : res?.results || [];
      const total = res?.count ?? results.length;
      setData(results);
      setPagination((p) => ({ ...p, total }));
    } catch (e) {
      console.error('List load error', e);
      message.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize]);

  const openCreate = () => {
    if (!allowCreate) return;
    setEditing(false);
    setCurrentId(null);
    form.resetFields();
    form.setFieldsValue(getInitialValues(fields, initialValues));
    setModalOpen(true);
  };

  const openEdit = async (record) => {
    if (!allowEdit) return;
    setEditing(true);
    setCurrentId(record?.id);
    try {
      if (api?.retrieve && record?.id) {
        const full = await api.retrieve(record.id);
        form.setFieldsValue(prepareFormValues(fields, full));
      } else {
        form.setFieldsValue(prepareFormValues(fields, record));
      }
      setModalOpen(true);
    } catch (e) {
      console.error('Edit load error', e);
      message.error('Не удалось загрузить запись');
    }
  };

  const openView = async (record) => {
    if (!allowView) return;
    try {
      if (api?.retrieve && record?.id) {
        const full = await api.retrieve(record.id);
        setViewRecord(full);
      } else {
        setViewRecord(record);
      }
    } catch (e) {
      console.error('View load error', e);
      message.error('Не удалось загрузить запись');
    }
  };

  const handleDelete = (record) => {
    if (!allowDelete) return;
    modal.confirm({
      title: 'Удалить запись?',
      content: 'Это действие нельзя отменить',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        if (!api?.delete) return;
        try {
          await api.delete(record.id);
          message.success('Запись удалена');
          fetchList();
        } catch (e) {
          console.error('Delete error', e);
          message.error('Не удалось удалить запись');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = preparePayload(fields, values);

      if (editing && currentId) {
        if (!allowEdit) {
          message.error('Недостаточно прав для редактирования');
          return;
        }
        if (!api?.update) {
          message.error('Update API не определён');
          return;
        }
        await api.update(currentId, payload);
        message.success('Запись обновлена');
      } else {
        if (!allowCreate) {
          message.error('Недостаточно прав для создания');
          return;
        }
        if (!api?.create) {
          message.error('Create API не определён');
          return;
        }
        await api.create(payload);
        message.success('Запись создана');
      }

      setModalOpen(false);
      form.resetFields();
      fetchList();
    } catch (e) {
      if (e.errorFields) {
        // Validation error - Ant Design handles it
        return;
      }
      console.error('Submit error', e);
      message.error(editing ? 'Ошибка обновления' : 'Ошибка создания');
    }
  };

  const handleTableChange = (pagination) => {
    setPagination({ ...pagination });
  };

  const hasAnyAction = allowView || allowEdit || allowDelete;
  const actionColumn = hasAnyAction
    ? {
        title: 'Действия',
        key: 'actions',
        fixed: 'right',
        width: 150,
        render: (_, record) => (
          <Space size="small">
            {allowView && (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => openView(record)}
              />
            )}
            {allowEdit && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
              />
            )}
            {allowDelete && (
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              />
            )}
          </Space>
        ),
      }
    : null;

  const tableColumns = actionColumn ? [...columns, actionColumn] : columns;

  return (
    <Card
      title={title}
      extra={
        allowCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Создать
          </Button>
        )
      }
    >
      <EnhancedTable
        columns={tableColumns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowKey="id"
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editing ? 'Редактировать' : 'Создать'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        width={800}
        okText={editing ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={getInitialValues(fields, initialValues)}
        >
          {fields.map((field) => renderField(field))}
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="Просмотр"
        open={!!viewRecord}
        onCancel={() => setViewRecord(null)}
        footer={[
          <Button key="close" onClick={() => setViewRecord(null)}>
            Закрыть
          </Button>,
        ]}
        width={800}
      >
        {viewRecord && (
          <div>
            {fields.map((field) => (
              <div key={field.name} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{field.label}:</div>
                <div>{formatValue(field, viewRecord[field.name])}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Card>
  );
}

// Helper functions
function getInitialValues(fields, defaults = {}) {
  const values = {};
  fields.forEach((field) => {
    if (defaults[field.name] !== undefined) {
      values[field.name] = defaults[field.name];
    } else if (field.defaultValue !== undefined) {
      values[field.name] = field.defaultValue;
    } else {
      values[field.name] = getFieldDefaultValue(field);
    }
  });
  return values;
}

function getFieldDefaultValue(field) {
  switch (field.type) {
    case 'boolean':
      return false;
    case 'number':
      return 0;
    case 'array':
      return [];
    default:
      return '';
  }
}

function prepareFormValues(fields, record) {
  const values = {};
  fields.forEach((field) => {
    const value = record[field.name];
    if (field.type === 'date' && value) {
      values[field.name] = dayjs(value);
    } else if (field.type === 'daterange' && Array.isArray(value) && value.length === 2) {
      values[field.name] = [dayjs(value[0]), dayjs(value[1])];
    } else {
      values[field.name] = value;
    }
  });
  return values;
}

function preparePayload(fields, values) {
  const payload = {};
  fields.forEach((field) => {
    const value = values[field.name];
    if (field.type === 'date' && value) {
      payload[field.name] = dayjs(value).format('YYYY-MM-DD');
    } else if (field.type === 'daterange' && Array.isArray(value) && value.length === 2) {
      payload[field.name] = [
        dayjs(value[0]).format('YYYY-MM-DD'),
        dayjs(value[1]).format('YYYY-MM-DD'),
      ];
    } else {
      payload[field.name] = value;
    }
  });
  return payload;
}

function formatValue(field, value) {
  if (value === null || value === undefined) return '-';
  
  switch (field.type) {
    case 'boolean':
      return value ? 'Да' : 'Нет';
    case 'date':
      return dayjs(value).format('DD.MM.YYYY');
    case 'daterange':
      if (Array.isArray(value) && value.length === 2) {
        return `${dayjs(value[0]).format('DD.MM.YYYY')} - ${dayjs(value[1]).format('DD.MM.YYYY')}`;
      }
      return '-';
    case 'array':
      return Array.isArray(value) ? value.join(', ') : '-';
    default:
      return String(value);
  }
}

function renderField(field) {
  const rules = [];
  if (field.required) {
    rules.push({ required: true, message: `${field.label} обязательно` });
  }

  const commonProps = {
    placeholder: field.placeholder || `Введите ${field.label}`,
    disabled: field.disabled,
  };

  let input;

  switch (field.type) {
    case 'textarea':
      input = <TextArea rows={4} {...commonProps} />;
      break;

    case 'number':
      input = <InputNumber style={{ width: '100%' }} {...commonProps} />;
      break;

    case 'boolean':
      input = <Switch />;
      break;

    case 'date':
      input = <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" {...commonProps} />;
      break;

    case 'daterange':
      input = <DatePicker.RangePicker style={{ width: '100%' }} format="DD.MM.YYYY" {...commonProps} />;
      break;

    case 'select':
      input = (
        <Select {...commonProps} allowClear>
          {field.options?.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      );
      break;

    case 'entity':
      input = (
        <EntitySelect
          {...commonProps}
          fetchOptions={field.fetchOptions}
          fetchList={field.fetchList}
          labelKey={field.labelKey}
          valueKey={field.valueKey}
        />
      );
      break;

    default:
      input = <Input {...commonProps} />;
  }

  return (
    <Form.Item
      key={field.name}
      name={field.name}
      label={field.label}
      rules={rules}
      valuePropName={field.type === 'boolean' ? 'checked' : 'value'}
    >
      {input}
    </Form.Item>
  );
}
