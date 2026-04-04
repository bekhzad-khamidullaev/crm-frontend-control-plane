import { useEffect, useState } from "react";
import { Alert, Button, Input, Select, Space, Table, Tag, Typography, message } from "antd";
import { exportToCSV, generateFilename } from "../../../lib/utils/export.js";
import { getLicenseIncidents, getLicenseObservabilityExport } from "../../../lib/api/licenseControl.js";
import { formatBackendError, formatDateTime, normalizeCollection, normalizeCount } from "./utils.js";

const { Text } = Typography;

const CODE_OPTIONS = [
  { label: "All codes", value: "" },
  { label: "LICENSE_FEATURE_DISABLED", value: "LICENSE_FEATURE_DISABLED" },
  { label: "LICENSE_SEAT_LIMIT_EXCEEDED", value: "LICENSE_SEAT_LIMIT_EXCEEDED" },
  { label: "LICENSE_EXPIRED", value: "LICENSE_EXPIRED" },
  { label: "LICENSE_REVOKED", value: "LICENSE_REVOKED" },
  { label: "LICENSE_INVALID_SIGNATURE", value: "LICENSE_INVALID_SIGNATURE" },
  { label: "LICENSE_RUNTIME_SURFACE_UNCLASSIFIED", value: "LICENSE_RUNTIME_SURFACE_UNCLASSIFIED" },
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
  { label: "Unknown", value: "unknown" },
];

const WINDOW_OPTIONS = [
  { label: "24h", value: "24" },
  { label: "72h", value: "72" },
  { label: "7d", value: "168" },
];

const INCIDENT_EXPORT_COLUMNS = [
  { key: "created_at", label: "Created At" },
  { key: "event_type", label: "Event Type" },
  { key: "severity", label: "Severity" },
  { key: "code", label: "Code" },
  { key: "correlation_id", label: "Correlation ID" },
  { key: "feature", label: "Feature" },
  { key: "surface_type", label: "Surface Type" },
  { key: "surface_name", label: "Surface Name" },
  { key: "method", label: "Method" },
  { key: "path", label: "Path" },
  { key: "message", label: "Message" },
];

function downloadBlob(blob, filename) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(href);
}

export default function RuntimeIncidentsSection({ presetFilters = null }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [windowHours, setWindowHours] = useState("24");
  const [search, setSearch] = useState("");
  const [code, setCode] = useState("");
  const [correlationId, setCorrelationId] = useState("");
  const [feature, setFeature] = useState("");
  const [path, setPath] = useState("");
  const [method, setMethod] = useState("");
  const [surfaceType, setSurfaceType] = useState("");
  const [surfaceName, setSurfaceName] = useState("");
  const [loadError, setLoadError] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = async (override = {}) => {
    const nextPage = override.page ?? page;
    const nextPageSize = override.pageSize ?? pageSize;
    const nextWindowHours = String(override.windowHours ?? windowHours ?? "24");
    const nextSearch = override.search ?? search;
    const nextCode = override.code ?? code;
    const nextCorrelationId = override.correlationId ?? correlationId;
    const nextFeature = override.feature ?? feature;
    const nextPath = override.path ?? path;
    const nextMethod = override.method ?? method;
    const nextSurfaceType = override.surfaceType ?? surfaceType;
    const nextSurfaceName = override.surfaceName ?? surfaceName;

    setLoading(true);
    try {
      const response = await getLicenseIncidents({
        page: nextPage,
        page_size: nextPageSize,
        hours: nextWindowHours,
        search: nextSearch || undefined,
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
      setWindowHours(nextWindowHours);
      setSearch(nextSearch);
      setCode(nextCode);
      setCorrelationId(nextCorrelationId);
      setFeature(nextFeature);
      setPath(nextPath);
      setMethod(nextMethod);
      setSurfaceType(nextSurfaceType);
      setSurfaceName(nextSurfaceName);
      setLoadError("");
    } catch (error) {
      const errorText = formatBackendError(error, "Failed to load runtime incidents");
      setLoadError(errorText);
      message.error(errorText);
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
      windowHours: String(presetFilters.windowHours || "24"),
      code: String(presetFilters.code || ""),
      correlationId: String(presetFilters.correlationId || ""),
      feature: String(presetFilters.feature || ""),
      path: String(presetFilters.path || ""),
      method: String(presetFilters.method || ""),
      surfaceType: String(presetFilters.surfaceType || ""),
      surfaceName: String(presetFilters.surfaceName || ""),
    });
  }, [presetFilters?.token]);

  const exportParams = {
    hours: windowHours,
    search: search || undefined,
    code: code || undefined,
    correlation_id: correlationId || undefined,
    feature: feature || undefined,
    path: path || undefined,
    method: method || undefined,
    surface_type: surfaceType || undefined,
    surface_name: surfaceName || undefined,
  };

  const handleExportCsv = () => {
    if (!rows.length) {
      message.warning("No runtime incidents to export");
      return;
    }
    exportToCSV(rows, INCIDENT_EXPORT_COLUMNS, generateFilename("license_runtime_incidents", "csv"));
    message.success(`Exported ${rows.length} runtime incidents to CSV`);
  };

  const handleExportBackend = async (format) => {
    setExporting(true);
    try {
      if (format === "prometheus") {
        const payload = await getLicenseObservabilityExport(
          { ...exportParams, export_format: "prometheus" },
          "text"
        );
        downloadBlob(
          new Blob([payload], { type: "text/plain;charset=utf-8" }),
          generateFilename("license_observability_metrics", "prom")
        );
        message.success("Observability metrics downloaded");
        return;
      }

      const payload = await getLicenseObservabilityExport({ ...exportParams, export_format: "json" });
      downloadBlob(
        new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }),
        generateFilename("license_observability_export", "json")
      );
      message.success("Observability export downloaded");
    } catch (error) {
      message.error(formatBackendError(error, "Failed to export observability payload"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        message="Runtime incident explorer"
        description="Read-only deny events from the runtime event chain. Use this view for endpoint, task, and management-command investigations without mixing them into control-plane issuance audit."
      />
      <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
        <Space wrap>
          <Select
            value={windowHours}
            aria-label="Window Filter"
            options={WINDOW_OPTIONS}
            onChange={(value) => load({ page: 1, windowHours: String(value || "24") })}
            style={{ width: 120 }}
          />
          <Input.Search
            allowClear
            placeholder="Search incidents"
            value={search}
            onChange={(event) => setSearch(String(event?.target?.value || ""))}
            onSearch={(value) => load({ page: 1, search: String(value || "").trim() })}
            style={{ width: 260 }}
          />
          <Select
            value={code}
            aria-label="Incident Code Filter"
            options={CODE_OPTIONS}
            onChange={(value) => load({ page: 1, code: String(value || "") })}
            style={{ width: 280 }}
            showSearch
            optionFilterProp="label"
          />
          <Select
            value={method}
            aria-label="Incident Method Filter"
            options={METHOD_OPTIONS}
            onChange={(value) => load({ page: 1, method: String(value || "") })}
            style={{ width: 160 }}
          />
          <Select
            value={surfaceType}
            aria-label="Incident Surface Type Filter"
            options={SURFACE_TYPE_OPTIONS}
            onChange={(value) => load({ page: 1, surfaceType: String(value || "") })}
            style={{ width: 210 }}
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
            style={{ width: 240 }}
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
        <Space wrap>
          <Button onClick={handleExportCsv} disabled={!rows.length}>
            Export CSV
          </Button>
          <Button onClick={() => handleExportBackend("json")} loading={exporting}>
            Export JSON
          </Button>
          <Button onClick={() => handleExportBackend("prometheus")} loading={exporting}>
            Export metrics
          </Button>
        </Space>
      </Space>
      {loadError ? <Alert type="warning" showIcon message="Runtime incidents unavailable" description={loadError} /> : null}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={{ current: page, pageSize, total, showSizeChanger: true }}
        onChange={(pagination) => load({ page: pagination.current, pageSize: pagination.pageSize })}
        scroll={{ x: 1380 }}
        columns={[
          { title: "When", dataIndex: "created_at", key: "created_at", render: formatDateTime, width: 160 },
          { title: "Event", dataIndex: "event_type", key: "event_type", render: (value) => <Text code>{String(value || "-")}</Text>, width: 180 },
          { title: "Severity", dataIndex: "severity", key: "severity", render: (value) => <Tag color="error">{String(value || "-")}</Tag>, width: 100 },
          { title: "Code", dataIndex: "code", key: "code", render: (value) => (value ? <Text code>{String(value)}</Text> : "-"), width: 240 },
          { title: "Correlation", dataIndex: "correlation_id", key: "correlation_id", render: (value) => (value ? <Text code>{String(value)}</Text> : "-"), width: 220 },
          { title: "Feature", dataIndex: "feature", key: "feature", render: (value) => (value ? <Text code>{String(value)}</Text> : "-"), width: 180 },
          { title: "Surface", dataIndex: "surface_type", key: "surface_type", render: (value) => (value ? <Tag color="purple">{String(value)}</Tag> : "-"), width: 140 },
          { title: "Surface name", dataIndex: "surface_name", key: "surface_name", render: (value) => (value ? <Text code>{String(value)}</Text> : "-"), width: 240 },
          { title: "Method", dataIndex: "method", key: "method", render: (value) => (value ? <Tag color="geekblue">{String(value)}</Tag> : "-"), width: 100 },
          { title: "Path", dataIndex: "path", key: "path", render: (value) => (value ? <Text code>{String(value)}</Text> : "-"), width: 220 },
          { title: "Message", dataIndex: "message", key: "message", render: (value) => value || "-" },
        ]}
      />
    </Space>
  );
}
