import { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Switch, Table, message } from "antd";
import {
  createCpFeature,
  createCpPlan,
  deleteCpFeature,
  deleteCpPlan,
  getCpFeatures,
  getCpPlans,
  updateCpFeature,
  updateCpPlan,
} from "../../../lib/api/licenseControl.js";
import { normalizeCollection, normalizeCount } from "./utils.js";

const EDITION_OPTIONS = [
  { value: "starter", label: "Starter" },
  { value: "sales", label: "Sales" },
  { value: "omnichannel", label: "Omnichannel" },
  { value: "enterprise", label: "Enterprise" },
  { value: "onprem-enterprise", label: "On-prem Enterprise" },
];

const INSTALL_PROFILE_OPTIONS = [
  { value: "smb-sales", label: "SMB Sales" },
  { value: "sales-faststart", label: "Sales Faststart" },
  { value: "omnichannel-workspace", label: "Omnichannel Workspace" },
  { value: "enterprise-standard", label: "Enterprise Standard" },
  { value: "onprem-secure", label: "On-prem Secure" },
];

export default function PlansFeaturesSection({ onMutated }) {
  const [features, setFeatures] = useState([]);
  const [featuresTotal, setFeaturesTotal] = useState(0);
  const [featuresPage, setFeaturesPage] = useState(1);
  const [featuresPageSize, setFeaturesPageSize] = useState(8);
  const [featuresSearch, setFeaturesSearch] = useState("");
  const [featuresLoading, setFeaturesLoading] = useState(false);

  const [plans, setPlans] = useState([]);
  const [plansTotal, setPlansTotal] = useState(0);
  const [plansPage, setPlansPage] = useState(1);
  const [plansPageSize, setPlansPageSize] = useState(8);
  const [plansSearch, setPlansSearch] = useState("");
  const [plansLoading, setPlansLoading] = useState(false);

  const [featureOpen, setFeatureOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [featureForm] = Form.useForm();
  const [planForm] = Form.useForm();

  const loadFeatures = async (override = {}) => {
    const nextPage = override.page ?? featuresPage;
    const nextPageSize = override.pageSize ?? featuresPageSize;
    const nextSearch = override.search ?? featuresSearch;
    setFeaturesLoading(true);
    try {
      const response = await getCpFeatures({
        page: nextPage,
        page_size: nextPageSize,
        search: nextSearch || undefined,
      });
      setFeatures(normalizeCollection(response));
      setFeaturesTotal(normalizeCount(response));
      setFeaturesPage(nextPage);
      setFeaturesPageSize(nextPageSize);
      setFeaturesSearch(nextSearch);
    } catch {
      message.error("Failed to load features");
    } finally {
      setFeaturesLoading(false);
    }
  };

  const loadPlans = async (override = {}) => {
    const nextPage = override.page ?? plansPage;
    const nextPageSize = override.pageSize ?? plansPageSize;
    const nextSearch = override.search ?? plansSearch;
    setPlansLoading(true);
    try {
      const response = await getCpPlans({
        page: nextPage,
        page_size: nextPageSize,
        search: nextSearch || undefined,
      });
      setPlans(normalizeCollection(response));
      setPlansTotal(normalizeCount(response));
      setPlansPage(nextPage);
      setPlansPageSize(nextPageSize);
      setPlansSearch(nextSearch);
    } catch {
      message.error("Failed to load plans");
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    loadFeatures();
    loadPlans();
  }, []);

  const featureOptions = useMemo(
    () => features.map((item) => ({ value: item.id, label: `${item.name || item.code} [${item.code}]` })),
    [features]
  );

  const saveFeature = async () => {
    try {
      const values = await featureForm.validateFields();
      setSaving(true);
      if (editingFeature?.id) await updateCpFeature(editingFeature.id, values);
      else await createCpFeature(values);
      setFeatureOpen(false);
      await loadFeatures();
      onMutated?.();
      message.success("Feature saved");
    } catch (error) {
      if (!error?.errorFields) message.error("Failed to save feature");
    } finally {
      setSaving(false);
    }
  };

  const savePlan = async () => {
    try {
      const values = await planForm.validateFields();
      setSaving(true);
      if (editingPlan?.id) await updateCpPlan(editingPlan.id, values);
      else await createCpPlan(values);
      setPlanOpen(false);
      await loadPlans();
      onMutated?.();
      message.success("Plan saved");
    } catch (error) {
      if (!error?.errorFields) message.error("Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }} wrap>
          <Input.Search
            allowClear
            placeholder="Search features"
            defaultValue={featuresSearch}
            onSearch={(value) => loadFeatures({ page: 1, search: String(value || "").trim() })}
            style={{ width: 260 }}
          />
          <Button
            onClick={() => {
              setEditingFeature(null);
              featureForm.setFieldsValue({ code: "", name: "", description: "", is_active: true });
              setFeatureOpen(true);
            }}
          >
            Add feature
          </Button>
        </Space>
        <Table
          rowKey="id"
          loading={featuresLoading}
          dataSource={features}
          columns={[
            { title: "Code", dataIndex: "code", key: "code" },
            { title: "Name", dataIndex: "name", key: "name" },
            {
              title: "Actions",
              key: "actions",
              render: (_, row) => (
                <Space>
                  <Button
                    type="link"
                    onClick={() => {
                      setEditingFeature(row);
                      featureForm.setFieldsValue({
                        code: row.code,
                        name: row.name,
                        description: row.description,
                        is_active: row.is_active !== false,
                      });
                      setFeatureOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Delete feature?"
                    onConfirm={async () => {
                      await deleteCpFeature(row.id);
                      await loadFeatures();
                      onMutated?.();
                    }}
                  >
                    <Button type="link" danger>
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          pagination={{
            current: featuresPage,
            pageSize: featuresPageSize,
            total: featuresTotal,
            showSizeChanger: true,
          }}
          onChange={(pagination) => loadFeatures({ page: pagination.current, pageSize: pagination.pageSize })}
        />
      </Col>
      <Col xs={24} xl={12}>
        <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }} wrap>
          <Input.Search
            allowClear
            placeholder="Search plans"
            defaultValue={plansSearch}
            onSearch={(value) => loadPlans({ page: 1, search: String(value || "").trim() })}
            style={{ width: 260 }}
          />
          <Button
            onClick={() => {
              setEditingPlan(null);
              planForm.setFieldsValue({
                code: "",
                name: "",
                edition_code: undefined,
                install_profile_code: undefined,
                base_user_limit: 1,
                platform_fee_uzs: 0,
                extra_user_fee_uzs: 0,
                typical_account_mrr_uzs: 0,
                target_segment: "",
                value_summary: "",
                is_active: true,
                included_features: [],
              });
              setPlanOpen(true);
            }}
          >
            Add plan
          </Button>
        </Space>
        <Table
          rowKey="id"
          loading={plansLoading}
          dataSource={plans}
          columns={[
            { title: "Code", dataIndex: "code", key: "code" },
            { title: "Name", dataIndex: "name", key: "name" },
            { title: "Edition", dataIndex: "edition_code", key: "edition_code", render: (value) => value || "—" },
            {
              title: "Install profile",
              dataIndex: "install_profile_code",
              key: "install_profile_code",
              render: (value) => value || "—",
            },
            { title: "Base seats", dataIndex: "base_user_limit", key: "base_user_limit" },
            {
              title: "Actions",
              key: "actions",
              render: (_, row) => (
                <Space>
                  <Button
                    type="link"
                    onClick={() => {
                      setEditingPlan(row);
                      planForm.setFieldsValue({
                        ...row,
                        included_features: Array.isArray(row.included_features) ? row.included_features : [],
                      });
                      setPlanOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Delete plan?"
                    onConfirm={async () => {
                      await deleteCpPlan(row.id);
                      await loadPlans();
                      onMutated?.();
                    }}
                  >
                    <Button type="link" danger>
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          pagination={{ current: plansPage, pageSize: plansPageSize, total: plansTotal, showSizeChanger: true }}
          onChange={(pagination) => loadPlans({ page: pagination.current, pageSize: pagination.pageSize })}
        />
      </Col>
      <Modal
        title={editingFeature ? "Edit feature" : "Add feature"}
        open={featureOpen}
        onCancel={() => setFeatureOpen(false)}
        onOk={saveFeature}
        confirmLoading={saving}
      >
        <Form form={featureForm} layout="vertical">
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={editingPlan ? "Edit plan" : "Add plan"}
        open={planOpen}
        onCancel={() => setPlanOpen(false)}
        onOk={savePlan}
        confirmLoading={saving}
      >
        <Form form={planForm} layout="vertical">
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="edition_code" label="Edition" rules={[{ required: true }]}>
            <Select options={EDITION_OPTIONS} />
          </Form.Item>
          <Form.Item name="install_profile_code" label="Install profile" rules={[{ required: true }]}>
            <Select options={INSTALL_PROFILE_OPTIONS} />
          </Form.Item>
          <Form.Item name="base_user_limit" label="Base user limit" rules={[{ required: true }]}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item name="included_features" label="Features">
            <Select mode="multiple" options={featureOptions} />
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
}
