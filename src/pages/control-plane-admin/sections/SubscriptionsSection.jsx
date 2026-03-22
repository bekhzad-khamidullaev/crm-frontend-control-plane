import { useEffect, useMemo, useState } from "react";
import { Button, DatePicker, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from "antd";
import dayjs from "dayjs";
import {
  createCpSubscription,
  deleteCpSubscription,
  getCpCustomers,
  getCpFeatures,
  getCpPlans,
  getCpSubscriptions,
  updateCpSubscription,
} from "../../../lib/api/licenseControl.js";
import { formatBackendError, formatDateTime, normalizeCollection, normalizeCount } from "./utils.js";

export default function SubscriptionsSection({ onMutated }) {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [features, setFeatures] = useState([]);
  const [plans, setPlans] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const loadLookups = async () => {
    const [customersResponse, plansResponse, featuresResponse] = await Promise.allSettled([
      getCpCustomers({ page_size: 500, ordering: "legal_name" }),
      getCpPlans({ page_size: 500, ordering: "code" }),
      getCpFeatures({ page_size: 500, ordering: "code" }),
    ]);

    if (customersResponse.status === "fulfilled") {
      setCustomers(normalizeCollection(customersResponse.value));
    } else {
      message.error(formatBackendError(customersResponse.reason, "Failed to load customers"));
    }

    if (plansResponse.status === "fulfilled") {
      setPlans(normalizeCollection(plansResponse.value));
    } else {
      message.error(formatBackendError(plansResponse.reason, "Failed to load plans"));
    }

    if (featuresResponse.status === "fulfilled") {
      setFeatures(normalizeCollection(featuresResponse.value));
    } else {
      message.error(formatBackendError(featuresResponse.reason, "Failed to load features"));
    }
  };

  const load = async (override = {}) => {
    const nextPage = override.page ?? page;
    const nextPageSize = override.pageSize ?? pageSize;
    const nextSearch = override.search ?? search;
    setLoading(true);
    try {
      const response = await getCpSubscriptions({
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
      message.error(formatBackendError(error, "Failed to load subscriptions"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadLookups();
  }, []);

  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c.legal_name])), [customers]);
  const planMap = useMemo(() => new Map(plans.map((p) => [p.id, p.code])), [plans]);
  const featureOptions = useMemo(
    () => features.map((feature) => ({ value: feature.id, label: `${feature.name || feature.code} [${feature.code}]` })),
    [features]
  );

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({
      customer: undefined,
      plan: undefined,
      status: "active",
      valid_from: null,
      valid_to: null,
      max_active_users: 1,
      extra_features: [],
    });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    form.setFieldsValue({
      customer: row.customer,
      plan: row.plan,
      status: row.status,
      valid_from: row.valid_from ? dayjs(row.valid_from) : null,
      valid_to: row.valid_to ? dayjs(row.valid_to) : null,
      max_active_users: row.max_active_users,
      extra_features: Array.isArray(row.extra_features) ? row.extra_features : [],
    });
    setOpen(true);
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        valid_from: values.valid_from?.toISOString(),
        valid_to: values.valid_to?.toISOString(),
      };
      setSaving(true);
      if (editing?.id) await updateCpSubscription(editing.id, payload);
      else await createCpSubscription(payload);
      setOpen(false);
      await load();
      onMutated?.();
      message.success("Subscription saved");
    } catch (error) {
      if (!error?.errorFields) message.error(formatBackendError(error, "Failed to save subscription"));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    try {
      await deleteCpSubscription(id);
      await load();
      onMutated?.();
      message.success("Subscription deleted");
    } catch (error) {
      message.error(formatBackendError(error, "Failed to delete subscription"));
    }
  };

  return (
    <>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }} wrap>
        <Input.Search
          allowClear
          placeholder="Search subscriptions"
          defaultValue={search}
          onSearch={(value) => load({ page: 1, search: String(value || "").trim() })}
          style={{ width: 320 }}
        />
        <Button type="primary" onClick={openCreate}>
          Add subscription
        </Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: "Customer", key: "customer", render: (_, row) => row.customer_name || customerMap.get(row.customer) || row.customer },
          {
            title: "Plan",
            key: "plan",
            render: (_, row) => row.plan_name ? `${row.plan_name} (${row.plan_code})` : row.plan_code || planMap.get(row.plan) || row.plan,
          },
          {
            title: "Edition",
            dataIndex: "plan_edition_code",
            key: "plan_edition_code",
            render: (value) => value || "—",
          },
          {
            title: "Add-ons",
            dataIndex: "extra_feature_codes",
            key: "extra_feature_codes",
            render: (value) => Array.isArray(value) && value.length > 0 ? value.join(", ") : "—",
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (v) => <Tag color={v === "active" || v === "trial" ? "success" : "default"}>{String(v || "").toUpperCase()}</Tag>,
          },
          { title: "Valid from", dataIndex: "valid_from", key: "valid_from", render: formatDateTime },
          { title: "Valid to", dataIndex: "valid_to", key: "valid_to", render: formatDateTime },
          { title: "Max users", dataIndex: "max_active_users", key: "max_active_users" },
          {
            title: "Actions",
            key: "actions",
            render: (_, row) => (
              <Space>
                <Button type="link" onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <Popconfirm title="Delete subscription?" onConfirm={() => onDelete(row.id)}>
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
        title={editing ? "Edit subscription" : "Add subscription"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSave}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="customer" label="Customer" rules={[{ required: true }]}>
            <Select options={customers.map((c) => ({ value: c.id, label: `${c.legal_name} (${c.code})` }))} />
          </Form.Item>
          <Form.Item name="plan" label="Plan" rules={[{ required: true }]}>
            <Select options={plans.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "ACTIVE", value: "active" },
                { label: "TRIAL", value: "trial" },
                { label: "SUSPENDED", value: "suspended" },
                { label: "EXPIRED", value: "expired" },
              ]}
            />
          </Form.Item>
          <Form.Item name="valid_from" label="Valid from" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="valid_to" label="Valid to" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="max_active_users" label="Max active users" rules={[{ required: true }]}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item name="extra_features" label="Add-on features">
            <Select mode="multiple" options={featureOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
