import { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, message } from "antd";
import {
  createCpDeployment,
  deleteCpDeployment,
  getCpCustomers,
  getCpDeployments,
  updateCpDeployment,
} from "../../../lib/api/licenseControl.js";
import { formatDateTime, normalizeCollection, normalizeCount } from "./utils.js";

export default function DeploymentsSection({ onMutated }) {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const loadCustomers = async () => {
    const response = await getCpCustomers({ page_size: 500, ordering: "legal_name" });
    setCustomers(normalizeCollection(response));
  };

  const load = async (override = {}) => {
    const nextPage = override.page ?? page;
    const nextPageSize = override.pageSize ?? pageSize;
    const nextSearch = override.search ?? search;
    setLoading(true);
    try {
      const response = await getCpDeployments({
        page: nextPage,
        page_size: nextPageSize,
        search: nextSearch || undefined,
      });
      setRows(normalizeCollection(response));
      setTotal(normalizeCount(response));
      setPage(nextPage);
      setPageSize(nextPageSize);
      setSearch(nextSearch);
    } catch {
      message.error("Failed to load deployments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadCustomers();
  }, []);

  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c.legal_name])), [customers]);
  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: c.id, label: `${c.legal_name} (${c.code})` })),
    [customers]
  );

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({ customer: undefined, instance_id: "", domain: "", environment: "prod", notes: "" });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    form.setFieldsValue({
      customer: row.customer,
      instance_id: row.instance_id,
      domain: row.domain,
      environment: row.environment,
      notes: row.notes || "",
    });
    setOpen(true);
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing?.id) await updateCpDeployment(editing.id, values);
      else await createCpDeployment(values);
      setOpen(false);
      await load();
      onMutated?.();
      message.success("Deployment saved");
    } catch (error) {
      if (!error?.errorFields) message.error("Failed to save deployment");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    try {
      await deleteCpDeployment(id);
      await load();
      onMutated?.();
      message.success("Deployment deleted");
    } catch {
      message.error("Failed to delete deployment");
    }
  };

  return (
    <>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }} wrap>
        <Input.Search
          allowClear
          placeholder="Search deployments"
          defaultValue={search}
          onSearch={(value) => load({ page: 1, search: String(value || "").trim() })}
          style={{ width: 320 }}
        />
        <Button type="primary" onClick={openCreate}>
          Add deployment
        </Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: "Instance", dataIndex: "instance_id", key: "instance_id" },
          { title: "Domain", dataIndex: "domain", key: "domain", render: (v) => v || "-" },
          { title: "Customer", key: "customer", render: (_, row) => customerMap.get(row.customer) || row.customer },
          { title: "Environment", dataIndex: "environment", key: "environment", render: (v) => String(v || "").toUpperCase() },
          { title: "Created", dataIndex: "created_at", key: "created_at", render: formatDateTime },
          {
            title: "Actions",
            key: "actions",
            render: (_, row) => (
              <Space>
                <Button type="link" onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <Popconfirm title="Delete deployment?" onConfirm={() => onDelete(row.id)}>
                  <Button type="link" danger>
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        pagination={{ current: page, pageSize, total, showSizeChanger: true }}
        onChange={(pagination) => load({ page: pagination.current, pageSize: pagination.pageSize })}
      />
      <Modal
        title={editing ? "Edit deployment" : "Add deployment"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSave}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="customer" label="Customer" rules={[{ required: true }]}>
            <Select options={customerOptions} />
          </Form.Item>
          <Form.Item name="instance_id" label="Instance ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="domain" label="Domain">
            <Input />
          </Form.Item>
          <Form.Item name="environment" label="Environment" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "PROD", value: "prod" },
                { label: "STAGING", value: "staging" },
                { label: "TEST", value: "test" },
              ]}
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
