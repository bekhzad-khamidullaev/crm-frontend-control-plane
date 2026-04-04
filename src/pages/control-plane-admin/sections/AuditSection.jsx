import { useEffect, useState } from "react";
import { Input, Select, Space, Table, Tag, Typography, message } from "antd";
import { getCpLicenseAudit } from "../../../lib/api/licenseControl.js";
import { formatDateTime, normalizeCollection, normalizeCount } from "./utils.js";

const { Text } = Typography;
const ACTION_OPTIONS = [
  { label: "All actions", value: "" },
  { label: "Deny", value: "deny" },
  { label: "Issue", value: "issue" },
  { label: "Approve", value: "approve" },
  { label: "Reject", value: "reject" },
  { label: "Heartbeat", value: "heartbeat" },
  { label: "Install Ack", value: "install_ack" },
  { label: "Revoke", value: "revoke" },
];
const CODE_OPTIONS = [
  { label: "All codes", value: "" },
  { label: "LICENSE_FEATURE_DISABLED", value: "LICENSE_FEATURE_DISABLED" },
  { label: "LICENSE_SEAT_LIMIT_EXCEEDED", value: "LICENSE_SEAT_LIMIT_EXCEEDED" },
  { label: "LICENSE_EXPIRED", value: "LICENSE_EXPIRED" },
  { label: "LICENSE_REVOKED", value: "LICENSE_REVOKED" },
  { label: "LICENSE_INVALID_SIGNATURE", value: "LICENSE_INVALID_SIGNATURE" },
];
const METHOD_OPTIONS = [
  { label: "All methods", value: "" },
  { label: "GET", value: "GET" },
  { label: "POST", value: "POST" },
  { label: "PATCH", value: "PATCH" },
  { label: "PUT", value: "PUT" },
  { label: "DELETE", value: "DELETE" },
];
const SURFACE_TYPE_OPTIONS = [
  { label: "All surfaces", value: "" },
  { label: "HTTP", value: "http" },
  { label: "Task", value: "task" },
  { label: "Management command", value: "management_command" },
];

export default function AuditSection({ presetFilters = null }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [code, setCode] = useState("");
  const [correlationId, setCorrelationId] = useState("");
  const [feature, setFeature] = useState("");
  const [path, setPath] = useState("");
  const [method, setMethod] = useState("");
  const [surfaceType, setSurfaceType] = useState("");
  const [surfaceName, setSurfaceName] = useState("");

  const load = async (override = {}) => {
    const nextPage = override.page ?? page;
    const nextPageSize = override.pageSize ?? pageSize;
    const nextSearch = override.search ?? search;
    const nextAction = override.action ?? action;
    const nextCode = override.code ?? code;
    const nextCorrelationId = override.correlationId ?? correlationId;
    const nextFeature = override.feature ?? feature;
    const nextPath = override.path ?? path;
    const nextMethod = override.method ?? method;
    const nextSurfaceType = override.surfaceType ?? surfaceType;
    const nextSurfaceName = override.surfaceName ?? surfaceName;
    setLoading(true);
    try {
      const response = await getCpLicenseAudit({
        page: nextPage,
        page_size: nextPageSize,
        search: nextSearch || undefined,
        action: nextAction || undefined,
        code: nextCode || undefined,
        correlation_id: nextCorrelationId || undefined,
        feature: nextFeature || undefined,
        path: nextPath || undefined,
        method: nextMethod || undefined,
        surface_type: nextSurfaceType || undefined,
        surface_name: nextSurfaceName || undefined,
      });
      setRows(normalizeCollection(response));
      setTotal(normalizeCount(response));
      setPage(nextPage);
      setPageSize(nextPageSize);
      setSearch(nextSearch);
      setAction(nextAction);
      setCode(nextCode);
      setCorrelationId(nextCorrelationId);
      setFeature(nextFeature);
      setPath(nextPath);
      setMethod(nextMethod);
      setSurfaceType(nextSurfaceType);
      setSurfaceName(nextSurfaceName);
    } catch {
      message.error("Failed to load license audit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!presetFilters) return;
    load({
      page: 1,
      action: String(presetFilters.action || ""),
      code: String(presetFilters.code || ""),
      correlationId: String(presetFilters.correlationId || ""),
      feature: String(presetFilters.feature || ""),
      path: String(presetFilters.path || ""),
      method: String(presetFilters.method || ""),
      surfaceType: String(presetFilters.surfaceType || ""),
      surfaceName: String(presetFilters.surfaceName || ""),
    });
  }, [presetFilters?.token]);

  return (
    <>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }} wrap>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search by action/user/license/instance"
            value={search}
            onChange={(event) => setSearch(String(event?.target?.value || ""))}
            onSearch={(value) => load({ page: 1, search: String(value || "").trim() })}
            style={{ width: 320 }}
          />
          <Select
            value={action}
            aria-label="Action Filter"
            options={ACTION_OPTIONS}
            onChange={(value) => load({ page: 1, action: String(value || "") })}
            style={{ width: 180 }}
          />
          <Select
            value={code}
            aria-label="Code Filter"
            options={CODE_OPTIONS}
            onChange={(value) => load({ page: 1, code: String(value || "") })}
            style={{ width: 260 }}
            showSearch
            optionFilterProp="label"
          />
          <Select
            value={method}
            aria-label="Method Filter"
            options={METHOD_OPTIONS}
            onChange={(value) => load({ page: 1, method: String(value || "") })}
            style={{ width: 160 }}
          />
          <Select
            value={surfaceType}
            aria-label="Surface Type Filter"
            options={SURFACE_TYPE_OPTIONS}
            onChange={(value) => load({ page: 1, surfaceType: String(value || "") })}
            style={{ width: 190 }}
          />
          <Input.Search
            allowClear
            placeholder="Correlation ID"
            value={correlationId}
            onChange={(event) => setCorrelationId(String(event?.target?.value || ""))}
            onSearch={(value) => load({ page: 1, correlationId: String(value || "").trim() })}
            style={{ width: 220 }}
          />
          <Input.Search
            allowClear
            placeholder="Feature code"
            value={feature}
            onChange={(event) => setFeature(String(event?.target?.value || ""))}
            onSearch={(value) => load({ page: 1, feature: String(value || "").trim() })}
            style={{ width: 220 }}
          />
          <Input.Search
            allowClear
            placeholder="Path"
            value={path}
            onChange={(event) => setPath(String(event?.target?.value || ""))}
            onSearch={(value) => load({ page: 1, path: String(value || "").trim() })}
            style={{ width: 260 }}
          />
          <Input.Search
            allowClear
            placeholder="Surface name"
            value={surfaceName}
            onChange={(event) => setSurfaceName(String(event?.target?.value || ""))}
            onSearch={(value) => load({ page: 1, surfaceName: String(value || "").trim() })}
            style={{ width: 260 }}
          />
        </Space>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={{ current: page, pageSize, total, showSizeChanger: true }}
        onChange={(pagination) => load({ page: pagination.current, pageSize: pagination.pageSize })}
        columns={[
          { title: "When", dataIndex: "created_at", key: "created_at", render: formatDateTime },
          { title: "Action", dataIndex: "action", key: "action", render: (v) => <Tag color="processing">{String(v || "").toUpperCase()}</Tag> },
          { title: "User", dataIndex: "actor_username", key: "actor_username", render: (v) => v || "-" },
          {
            title: "Code",
            key: "code",
            render: (_, row) => {
              const code = row?.details?.code;
              return code ? <Text code>{String(code)}</Text> : "-";
            },
          },
          {
            title: "Correlation",
            key: "correlation_id",
            render: (_, row) => {
              const correlationId = row?.details?.correlation_id;
              return correlationId ? <Text code>{String(correlationId)}</Text> : "-";
            },
          },
          {
            title: "Feature",
            key: "feature",
            render: (_, row) => {
              const featureValue = row?.details?.feature;
              return featureValue ? <Text code>{String(featureValue)}</Text> : "-";
            },
          },
          {
            title: "Surface",
            key: "surface_type",
            render: (_, row) => {
              const surfaceValue = row?.details?.surface_type;
              return surfaceValue ? <Tag color="purple">{String(surfaceValue)}</Tag> : "-";
            },
          },
          {
            title: "Surface name",
            key: "surface_name",
            render: (_, row) => {
              const surfaceNameValue = row?.details?.surface_name;
              return surfaceNameValue ? <Text code>{String(surfaceNameValue)}</Text> : "-";
            },
          },
          {
            title: "Method",
            key: "method",
            render: (_, row) => {
              const methodValue = row?.details?.method;
              return methodValue ? <Tag color="geekblue">{String(methodValue)}</Tag> : "-";
            },
          },
          {
            title: "Path",
            key: "path",
            render: (_, row) => {
              const pathValue = row?.details?.path;
              return pathValue ? <Text code>{String(pathValue)}</Text> : "-";
            },
          },
          { title: "License ID", dataIndex: "license_id", key: "license_id", render: (v) => (v ? <Text code>{v}</Text> : "-") },
          { title: "Instance", dataIndex: "deployment_instance_id", key: "deployment_instance_id", render: (v) => (v ? <Text code>{v}</Text> : "-") },
        ]}
      />
    </>
  );
}
