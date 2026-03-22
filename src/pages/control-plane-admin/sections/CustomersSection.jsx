import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Empty, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag, message } from "antd";
import {
  createCpCustomer,
  deleteCpCustomer,
  getCpCustomers,
  updateCpCustomer,
} from "../../../lib/api/licenseControl.js";
import { formatBackendError, normalizeCollection, normalizeCount, formatDateTime } from "./utils.js";

export default function CustomersSection({ onMutated }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [form] = Form.useForm();

  const load = async (override = {}) => {
    const nextPage = override.page ?? page;
    const nextPageSize = override.pageSize ?? pageSize;
    const nextSearch = override.search ?? search;
    setLoading(true);
    setLoadError("");
    try {
      const response = await getCpCustomers({
        page: nextPage,
        page_size: nextPageSize,
        search: nextSearch || undefined,
      });
      setRows(normalizeCollection(response));
      setTotal(normalizeCount(response));
      setPage(nextPage);
      setPageSize(nextPageSize);
      setSearch(nextSearch);
    } catch (error) {
      const nextError = formatBackendError(error, "Failed to load customers");
      setLoadError(nextError);
      message.error(nextError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({ code: "", legal_name: "", contact_email: "", is_active: true });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    form.setFieldsValue({
      code: row.code,
      legal_name: row.legal_name,
      contact_email: row.contact_email,
      is_active: row.is_active !== false,
    });
    setOpen(true);
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing?.id) await updateCpCustomer(editing.id, values);
      else await createCpCustomer(values);
      setOpen(false);
      await load();
      onMutated?.();
      message.success("Customer saved");
    } catch (error) {
      if (!error?.errorFields) message.error("Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    try {
      await deleteCpCustomer(id);
      await load();
      onMutated?.();
      message.success("Customer deleted");
    } catch {
      message.error("Failed to delete customer");
    }
  };

  const columns = useMemo(
    () => [
      { title: "Code", dataIndex: "code", key: "code" },
      { title: "Name", dataIndex: "legal_name", key: "legal_name" },
      { title: "Email", dataIndex: "contact_email", key: "contact_email" },
      {
        title: "Status",
        key: "status",
        render: (_, row) => <Tag color={row.is_active ? "success" : "default"}>{row.is_active ? "ACTIVE" : "INACTIVE"}</Tag>,
      },
      { title: "Updated", dataIndex: "updated_at", key: "updated_at", render: formatDateTime },
      {
        title: "Actions",
        key: "actions",
        render: (_, row) => (
          <Space>
            <Button type="link" onClick={() => openEdit(row)}>
              Edit
            </Button>
            <Popconfirm title="Delete customer?" onConfirm={() => onDelete(row.id)}>
              <Button danger type="link">
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }} wrap>
        <Input.Search
          allowClear
          placeholder="Search customers"
          defaultValue={search}
          onSearch={(value) => load({ page: 1, search: String(value || "").trim() })}
          style={{ width: 320 }}
        />
        <Button type="primary" onClick={openCreate}>
          Add customer
        </Button>
      </Space>
      {loadError ? (
        <Alert
          showIcon
          type="warning"
          style={{ marginBottom: 12 }}
          message="Customers list is temporarily unavailable"
          description={loadError}
          action={
            <Button size="small" onClick={() => load()}>
              Retry
            </Button>
          }
        />
      ) : null}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={search ? "No customers match the current search" : "No customers yet"}
            />
          ),
        }}
        pagination={{ current: page, pageSize, total, showSizeChanger: true }}
        onChange={(pagination) => load({ page: pagination.current, pageSize: pagination.pageSize })}
      />
      <Modal
        title={editing ? "Edit customer" : "Add customer"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSave}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="legal_name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contact_email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="is_active" valuePropName="checked" label="Active">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
