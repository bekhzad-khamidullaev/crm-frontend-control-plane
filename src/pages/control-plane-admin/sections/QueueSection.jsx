import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Descriptions, Empty, Form, Input, Modal, Select, Space, Steps, Table, Tag, Typography, message } from "antd";
import {
  approveCpRuntimeRequest,
  assignCpDeploymentLicense,
  getCpDeployments,
  getCpLicenseArtifact,
  getCpLicenses,
  getCpRuntimeUnlicensedRequests,
  getCpSubscriptions,
  getCpUnlicensedDeployments,
  rejectCpRuntimeRequest,
  revokeCpLicense,
} from "../../../lib/api/licenseControl.js";
import { formatBackendError, formatDateTime, normalizeCollection, normalizeCount } from "./utils.js";

const { Text } = Typography;
const RUNTIME_FLOW_ORDER = ["pending_review", "approved", "issued", "installed"];
const APPROVED_TTL_HOURS = 72;
const APPROVED_TTL_WARNING_HOURS = 12;

export function getRuntimeLifecycleStep(status) {
  const normalized = String(status || "").trim().toLowerCase();
  const index = RUNTIME_FLOW_ORDER.indexOf(normalized);
  if (index >= 0) return index;
  if (normalized === "rejected") return 0;
  return 0;
}

export function buildRuntimeLifecycleItems(row) {
  const normalized = String(row?.status || "").trim().toLowerCase();
  const rejected = normalized === "rejected";
  return [
    {
      title: "Pending review",
      description: row?.created_at ? `Created: ${formatDateTime(row.created_at)}` : "Waiting for operator review",
      status: "finish",
    },
    {
      title: "Approved",
      description: row?.reviewed_at ? `Reviewed: ${formatDateTime(row.reviewed_at)}` : "Not approved yet",
      status: rejected ? "error" : undefined,
    },
    {
      title: "Issued",
      description: row?.issued_at ? `Issued: ${formatDateTime(row.issued_at)}` : "Signed artifact not issued yet",
    },
    {
      title: "Installed",
      description: row?.installed_at ? `Installed: ${formatDateTime(row.installed_at)}` : "Install acknowledgement not received",
    },
  ];
}

export function getApprovalTtlMeta(row, now = new Date()) {
  const normalized = String(row?.status || "").trim().toLowerCase();
  if (normalized !== "approved") return null;
  const reviewedAtRaw = row?.reviewed_at;
  if (!reviewedAtRaw) return null;
  const reviewedAt = new Date(reviewedAtRaw);
  if (Number.isNaN(reviewedAt.getTime())) return null;
  const expiresAt = new Date(reviewedAt.getTime() + APPROVED_TTL_HOURS * 60 * 60 * 1000);
  const remainingMs = expiresAt.getTime() - now.getTime();
  const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
  if (remainingMs <= 0) {
    return {
      level: "expired",
      remainingHours,
      expiresAt,
      message: "Approval TTL expired. Runtime issue will require re-approval.",
    };
  }
  if (remainingMs <= APPROVED_TTL_WARNING_HOURS * 60 * 60 * 1000) {
    return {
      level: "warning",
      remainingHours,
      expiresAt,
      message: `Approval expires in ${Math.max(0, remainingHours)}h.`,
    };
  }
  return {
    level: "ok",
    remainingHours,
    expiresAt,
    message: `Approval valid for ${remainingHours}h.`,
  };
}

export function resolveApproveBindings(row, requestDeploymentMap = {}, requestSubscriptionMap = {}) {
  const requestId = row?.id;
  const deploymentId = requestDeploymentMap?.[requestId] ?? row?.deployment ?? null;
  const subscriptionId = requestSubscriptionMap?.[requestId] ?? row?.subscription ?? null;
  return {
    deploymentId: deploymentId == null ? null : Number(deploymentId),
    subscriptionId: subscriptionId == null ? null : Number(subscriptionId),
  };
}

const normalizeMatchValue = (value) => String(value || "").trim().toLowerCase();

const normalizeDomainValue = (value) => {
  const text = normalizeMatchValue(value);
  if (!text) return "";

  try {
    const parsed = text.includes("://") ? new URL(text) : new URL(`https://${text}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return text.replace(/^www\./, "").replace(/\/.*$/, "");
  }
};

const getRequestPayloadDomain = (requestPayload) => {
  if (!requestPayload) return "";

  if (typeof requestPayload === "string") {
    try {
      const parsed = JSON.parse(requestPayload);
      return normalizeMatchValue(parsed?.domain || parsed?.request_domain || "");
    } catch {
      return "";
    }
  }

  return normalizeMatchValue(requestPayload?.domain || requestPayload?.request_domain || "");
};

export function getDeploymentOptionsForRequest(row, deployments) {
  const requestInstance = normalizeMatchValue(row?.instance_id);
  const requestDomain = normalizeDomainValue(getRequestPayloadDomain(row?.request_payload));
  const seen = new Set();

  return (deployments || [])
    .filter((dep) => {
      const deploymentInstance = normalizeMatchValue(dep.instance_id);
      const deploymentDomain = normalizeDomainValue(dep.domain);
      const matchesInstance = requestInstance && deploymentInstance === requestInstance;
      const matchesDomain = requestDomain && deploymentDomain === requestDomain;
      return matchesInstance || matchesDomain;
    })
    .filter((dep) => {
      if (seen.has(dep.id)) return false;
      seen.add(dep.id);
      return true;
    })
    .map((dep) => ({
      label: `${dep.instance_id} (${dep.environment}${dep.domain ? `, ${dep.domain}` : ""})`,
      value: dep.id,
    }));
}

export default function QueueSection({ onMutated }) {
  const [unlicensedRows, setUnlicensedRows] = useState([]);
  const [unlicensedTotal, setUnlicensedTotal] = useState(0);
  const [unlicensedPage, setUnlicensedPage] = useState(1);
  const [unlicensedPageSize, setUnlicensedPageSize] = useState(10);
  const [unlicensedSearch, setUnlicensedSearch] = useState("");
  const [unlicensedLoading, setUnlicensedLoading] = useState(false);
  const [unlicensedError, setUnlicensedError] = useState("");

  const [runtimeRows, setRuntimeRows] = useState([]);
  const [runtimeTotal, setRuntimeTotal] = useState(0);
  const [runtimePage, setRuntimePage] = useState(1);
  const [runtimePageSize, setRuntimePageSize] = useState(10);
  const [runtimeSearch, setRuntimeSearch] = useState("");
  const [runtimeStatusFilter, setRuntimeStatusFilter] = useState(["pending_review", "approved", "issued"]);
  const [runtimeLoading, setRuntimeLoading] = useState(false);
  const [runtimeError, setRuntimeError] = useState("");

  const [issuedRows, setIssuedRows] = useState([]);
  const [issuedTotal, setIssuedTotal] = useState(0);
  const [issuedPage, setIssuedPage] = useState(1);
  const [issuedPageSize, setIssuedPageSize] = useState(10);
  const [issuedSearch, setIssuedSearch] = useState("");
  const [issuedLoading, setIssuedLoading] = useState(false);
  const [issuedError, setIssuedError] = useState("");

  const [assignLoading, setAssignLoading] = useState({});
  const [rowSubscriptionMap, setRowSubscriptionMap] = useState({});
  const [requestDeploymentMap, setRequestDeploymentMap] = useState({});
  const [requestSubscriptionMap, setRequestSubscriptionMap] = useState({});
  const [rejectNoteMap, setRejectNoteMap] = useState({});

  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeSaving, setRevokeSaving] = useState(false);
  const [revokeForm] = Form.useForm();
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [artifactTarget, setArtifactTarget] = useState(null);
  const [artifactData, setArtifactData] = useState(null);
  const [artifactLoading, setArtifactLoading] = useState(false);

  const [allDeployments, setAllDeployments] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [optionsError, setOptionsError] = useState("");

  const loadOptions = async () => {
    const [deploymentsResponse, subscriptionsResponse] = await Promise.allSettled([
      getCpDeployments({ page_size: 1000 }),
      getCpSubscriptions({ page_size: 1000 }),
    ]);
    const nextErrors = [];

    if (deploymentsResponse.status === "fulfilled") {
      setAllDeployments(normalizeCollection(deploymentsResponse.value));
    } else {
      const nextError = formatBackendError(deploymentsResponse.reason, "Failed to load deployments");
      nextErrors.push(nextError);
      message.error(nextError);
    }

    if (subscriptionsResponse.status === "fulfilled") {
      setAllSubscriptions(normalizeCollection(subscriptionsResponse.value));
    } else {
      const nextError = formatBackendError(subscriptionsResponse.reason, "Failed to load subscriptions");
      nextErrors.push(nextError);
      message.error(nextError);
    }

    setOptionsError(nextErrors.join(" | "));
  };

  const loadUnlicensed = async (override = {}) => {
    const nextPage = override.page ?? unlicensedPage;
    const nextPageSize = override.pageSize ?? unlicensedPageSize;
    const nextSearch = override.search ?? unlicensedSearch;
    setUnlicensedLoading(true);
    setUnlicensedError("");
    try {
      const response = await getCpUnlicensedDeployments({
        page: nextPage,
        page_size: nextPageSize,
        search: nextSearch || undefined,
      });
      setUnlicensedRows(normalizeCollection(response));
      setUnlicensedTotal(normalizeCount(response));
      setUnlicensedPage(nextPage);
      setUnlicensedPageSize(nextPageSize);
      setUnlicensedSearch(nextSearch);
    } catch (error) {
      const nextError = formatBackendError(error, "Failed to load unlicensed deployments");
      setUnlicensedError(nextError);
      message.error(nextError);
    } finally {
      setUnlicensedLoading(false);
    }
  };

  const loadRuntime = async (override = {}) => {
    const nextPage = override.page ?? runtimePage;
    const nextPageSize = override.pageSize ?? runtimePageSize;
    const nextSearch = override.search ?? runtimeSearch;
    const nextStatuses = override.statuses ?? runtimeStatusFilter;
    setRuntimeLoading(true);
    setRuntimeError("");
    try {
      const response = await getCpRuntimeUnlicensedRequests({
        page: nextPage,
        page_size: nextPageSize,
        search: nextSearch || undefined,
        status: Array.isArray(nextStatuses) && nextStatuses.length ? nextStatuses.join(",") : undefined,
      });
      setRuntimeRows(normalizeCollection(response));
      setRuntimeTotal(normalizeCount(response));
      setRuntimePage(nextPage);
      setRuntimePageSize(nextPageSize);
      setRuntimeSearch(nextSearch);
      setRuntimeStatusFilter(nextStatuses);
    } catch (error) {
      const nextError = formatBackendError(error, "Failed to load runtime requests");
      setRuntimeError(nextError);
      message.error(nextError);
    } finally {
      setRuntimeLoading(false);
    }
  };

  const loadIssued = async (override = {}) => {
    const nextPage = override.page ?? issuedPage;
    const nextPageSize = override.pageSize ?? issuedPageSize;
    const nextSearch = override.search ?? issuedSearch;
    setIssuedLoading(true);
    setIssuedError("");
    try {
      const response = await getCpLicenses({
        page: nextPage,
        page_size: nextPageSize,
        search: nextSearch || undefined,
      });
      setIssuedRows(normalizeCollection(response));
      setIssuedTotal(normalizeCount(response));
      setIssuedPage(nextPage);
      setIssuedPageSize(nextPageSize);
      setIssuedSearch(nextSearch);
    } catch (error) {
      const nextError = formatBackendError(error, "Failed to load issued licenses");
      setIssuedError(nextError);
      message.error(nextError);
    } finally {
      setIssuedLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
    loadUnlicensed();
    loadRuntime();
    loadIssued();
  }, []);

  const deploymentOptionsByInstance = useMemo(
    () =>
      allDeployments.reduce((acc, dep) => {
        const key = dep.instance_id || "";
        if (!acc[key]) acc[key] = [];
        acc[key].push({ label: `${dep.instance_id} (${dep.environment})`, value: dep.id });
        return acc;
      }, {}),
    [allDeployments]
  );

  useEffect(() => {
    setRequestDeploymentMap((prev) => {
      let changed = false;
      const next = { ...prev };

      runtimeRows.forEach((row) => {
        if (next[row.id] != null) return;
        if (row?.deployment != null) {
          next[row.id] = row.deployment;
          changed = true;
          return;
        }
        const options = getDeploymentOptionsForRequest(row, allDeployments);
        if (options.length === 1) {
          next[row.id] = options[0].value;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [allDeployments, runtimeRows]);

  useEffect(() => {
    setRequestSubscriptionMap((prev) => {
      let changed = false;
      const next = { ...prev };
      runtimeRows.forEach((row) => {
        if (next[row.id] != null) return;
        if (row?.subscription != null) {
          next[row.id] = row.subscription;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [runtimeRows]);

  const runtimeTtlSummary = useMemo(() => {
    let expiring = 0;
    let expired = 0;
    runtimeRows.forEach((row) => {
      const meta = getApprovalTtlMeta(row);
      if (!meta) return;
      if (meta.level === "expired") expired += 1;
      if (meta.level === "warning") expiring += 1;
    });
    return { expiring, expired };
  }, [runtimeRows]);

  const onAssign = async (deploymentId) => {
    const subscriptionId = rowSubscriptionMap[deploymentId];
    if (!subscriptionId) {
      message.warning("Select subscription first");
      return;
    }
    setAssignLoading((prev) => ({ ...prev, [deploymentId]: true }));
    try {
      const response = await assignCpDeploymentLicense(deploymentId, subscriptionId);
      await loadUnlicensed();
      await loadRuntime();
      await loadIssued();
      onMutated?.();
      const revokedCount = Array.isArray(response?.revoked_license_ids) ? response.revoked_license_ids.length : 0;
      if (revokedCount > 0) {
        message.success(`License assigned and ${revokedCount} previous issue(s) revoked`);
      } else {
        message.success("License assigned");
      }
    } catch (error) {
      message.error(formatBackendError(error, "Failed to assign license"));
    } finally {
      setAssignLoading((prev) => ({ ...prev, [deploymentId]: false }));
    }
  };

  const onApproveRequest = async (requestId) => {
    const row = runtimeRows.find((item) => item.id === requestId) || null;
    const { deploymentId, subscriptionId } = resolveApproveBindings(
      row,
      requestDeploymentMap,
      requestSubscriptionMap
    );
    if (!deploymentId || !subscriptionId) {
      message.warning("Select deployment and subscription");
      return;
    }
    setAssignLoading((prev) => ({ ...prev, [`req-${requestId}`]: true }));
    try {
      await approveCpRuntimeRequest(requestId, {
        deployment_id: deploymentId,
        subscription_id: subscriptionId,
        review_note: "Approved from control-plane queue",
      });
      await loadRuntime();
      await loadUnlicensed();
      onMutated?.();
      message.success("Request approved");
    } catch (error) {
      message.error(formatBackendError(error, "Failed to approve request"));
    } finally {
      setAssignLoading((prev) => ({ ...prev, [`req-${requestId}`]: false }));
    }
  };

  const onReapproveRequest = async (requestId) => {
    const row = runtimeRows.find((item) => item.id === requestId) || null;
    const { deploymentId, subscriptionId } = resolveApproveBindings(
      row,
      requestDeploymentMap,
      requestSubscriptionMap
    );
    if (!deploymentId || !subscriptionId) {
      message.warning("Re-approve requires linked deployment and subscription");
      return;
    }
    setAssignLoading((prev) => ({ ...prev, [`req-reapprove-${requestId}`]: true }));
    try {
      await approveCpRuntimeRequest(requestId, {
        deployment_id: deploymentId,
        subscription_id: subscriptionId,
        review_note: "Re-approved after TTL check",
      });
      await loadRuntime();
      onMutated?.();
      message.success("Request re-approved");
    } catch (error) {
      message.error(formatBackendError(error, "Failed to re-approve request"));
    } finally {
      setAssignLoading((prev) => ({ ...prev, [`req-reapprove-${requestId}`]: false }));
    }
  };

  const onRejectRequest = async (requestId) => {
    const reviewNote = String(rejectNoteMap[requestId] || "").trim();
    setAssignLoading((prev) => ({ ...prev, [`req-${requestId}`]: true }));
    try {
      await rejectCpRuntimeRequest(requestId, reviewNote || "Rejected from queue");
      await loadRuntime();
      onMutated?.();
      message.success("Request rejected");
    } catch (error) {
      message.error(formatBackendError(error, "Failed to reject request"));
    } finally {
      setAssignLoading((prev) => ({ ...prev, [`req-${requestId}`]: false }));
    }
  };

  const openRevoke = (row) => {
    setRevokeTarget(row);
    revokeForm.setFieldsValue({ reason: "manual_revoke" });
    setRevokeOpen(true);
  };

  const onConfirmRevoke = async () => {
    if (!revokeTarget?.id) return;
    try {
      const values = await revokeForm.validateFields();
      setRevokeSaving(true);
      await revokeCpLicense(revokeTarget.id, String(values.reason || "").trim() || "manual_revoke");
      setRevokeOpen(false);
      setRevokeTarget(null);
      await loadIssued();
      await loadRuntime();
      await loadUnlicensed();
      onMutated?.();
      message.success("License revoked");
    } catch (error) {
      if (!error?.errorFields) {
        message.error(formatBackendError(error, "Failed to revoke license"));
      }
    } finally {
      setRevokeSaving(false);
    }
  };

  const copyToClipboard = async (value, successText) => {
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("clipboard_unavailable");
      }
      await navigator.clipboard.writeText(String(value || ""));
      message.success(successText);
    } catch {
      message.error("Copy failed. Please copy manually.");
    }
  };

  const onDownloadArtifact = () => {
    if (!artifactData) return;
    try {
      const blob = new Blob([artifactObjectText], { type: "application/json;charset=utf-8" });
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = artifactData?.download_filename || `license-artifact-${artifactData?.license_id || "unknown"}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(href);
      message.success("Artifact file downloaded");
    } catch {
      message.error("Download failed");
    }
  };

  const onOpenArtifact = async (row) => {
    if (!row?.id) return;
    setArtifactOpen(true);
    setArtifactTarget(row);
    setArtifactData(null);
    setArtifactLoading(true);
    try {
      const response = await getCpLicenseArtifact(row.id);
      setArtifactData(response);
    } catch (error) {
      const nextError = formatBackendError(error, "Failed to load license artifact");
      message.error(nextError);
      setArtifactOpen(false);
      setArtifactTarget(null);
    } finally {
      setArtifactLoading(false);
    }
  };

  const closeArtifactModal = () => {
    setArtifactOpen(false);
    setArtifactTarget(null);
    setArtifactData(null);
    setArtifactLoading(false);
  };

  const artifactPayloadText = JSON.stringify(artifactData?.payload || {}, null, 2);
  const artifactObjectText = JSON.stringify(
    artifactData?.artifact || {
      payload: artifactData?.payload || {},
      signature: artifactData?.signature || "",
    },
    null,
    2
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Alert
        showIcon
        type="info"
        message="Runtime licensing flow"
        description={
          <Space direction="vertical" size={0}>
            <Text>1) Runtime sends request -&gt; status PENDING_REVIEW</Text>
            <Text>2) Operator approves/rejects request in queue</Text>
            <Text>3) Runtime pulls signed artifact and installs it</Text>
            <Text>4) Reissue/revoke is performed from issued licenses list</Text>
          </Space>
        }
      />
      {optionsError ? (
        <Alert
          showIcon
          type="warning"
          message="Assignment options are partially unavailable"
          description={optionsError}
          action={
            <Button size="small" onClick={loadOptions}>
              Retry
            </Button>
          }
        />
      ) : null}
      <Card
        title="Installations without license"
        extra={
          <Input.Search
            allowClear
            placeholder="Search instance/domain/customer"
            defaultValue={unlicensedSearch}
            onSearch={(value) => loadUnlicensed({ page: 1, search: String(value || "").trim() })}
            style={{ width: 300 }}
          />
        }
      >
        {unlicensedError ? (
          <Alert
            showIcon
            type="warning"
            style={{ marginBottom: 12 }}
            message="Unlicensed deployments could not be loaded"
            description={unlicensedError}
            action={
              <Button size="small" onClick={() => loadUnlicensed()}>
                Retry
              </Button>
            }
          />
        ) : null}
        <Table
          rowKey="id"
          loading={unlicensedLoading}
          dataSource={unlicensedRows}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  unlicensedSearch
                    ? "No unlicensed deployments match the current search"
                    : "No unlicensed deployments"
                }
              />
            ),
          }}
          pagination={{ current: unlicensedPage, pageSize: unlicensedPageSize, total: unlicensedTotal, showSizeChanger: true }}
          onChange={(pagination) => loadUnlicensed({ page: pagination.current, pageSize: pagination.pageSize })}
          columns={[
            { title: "Customer", key: "customer", render: (_, row) => row?.customer?.legal_name || "-" },
            { title: "Instance", dataIndex: "instance_id", key: "instance_id" },
            { title: "Domain", dataIndex: "domain", key: "domain", render: (v) => v || "-" },
            { title: "Runtime request", key: "latest_runtime_request", render: (_, row) => row?.latest_runtime_request ? <Tag color="warning">{row.latest_runtime_request.status}</Tag> : "-" },
            {
              title: "Assign",
              key: "assign",
              render: (_, row) => {
                const options = allSubscriptions
                  .filter((sub) => sub.customer === row?.customer?.id)
                  .map((sub) => ({
                    label: `${sub.plan_code || sub.plan} • ${sub.status} • ${formatDateTime(sub.valid_to)}`,
                    value: sub.id,
                  }));
                return (
                  <Space>
                    <Select
                      style={{ width: 260 }}
                      placeholder="Subscription"
                      notFoundContent={optionsError ? "Subscription list unavailable" : undefined}
                      options={options}
                      value={rowSubscriptionMap[row.id]}
                      onChange={(value) => setRowSubscriptionMap((prev) => ({ ...prev, [row.id]: value }))}
                    />
                    <Button type="primary" loading={Boolean(assignLoading[row.id])} onClick={() => onAssign(row.id)}>
                      Assign
                    </Button>
                  </Space>
                );
              },
            },
          ]}
        />
      </Card>
      <Card
        title="Runtime requests without issued license"
        extra={
          <Space wrap>
            <Select
              mode="multiple"
              allowClear
              placeholder="Statuses"
              style={{ width: 280 }}
              value={runtimeStatusFilter}
              options={[
                { label: "PENDING_REVIEW", value: "pending_review" },
                { label: "APPROVED", value: "approved" },
                { label: "ISSUED", value: "issued" },
                { label: "REJECTED", value: "rejected" },
                { label: "INSTALLED", value: "installed" },
              ]}
              onChange={(value) => loadRuntime({ page: 1, statuses: value })}
            />
            <Input.Search
              allowClear
              placeholder="Search instance or customer"
              defaultValue={runtimeSearch}
              onSearch={(value) => loadRuntime({ page: 1, search: String(value || "").trim() })}
              style={{ width: 300 }}
            />
          </Space>
        }
      >
        {runtimeTtlSummary.expired > 0 || runtimeTtlSummary.expiring > 0 ? (
          <Alert
            showIcon
            type={runtimeTtlSummary.expired > 0 ? "error" : "warning"}
            style={{ marginBottom: 12 }}
            message={
              runtimeTtlSummary.expired > 0
                ? `${runtimeTtlSummary.expired} approved request(s) already expired by TTL`
                : `${runtimeTtlSummary.expiring} approved request(s) are close to TTL expiry`
            }
            description="Re-approve stale requests to avoid runtime issue failures."
          />
        ) : null}
        {runtimeError ? (
          <Alert
            showIcon
            type="warning"
            style={{ marginBottom: 12 }}
            message="Runtime license requests could not be loaded"
            description={runtimeError}
            action={
              <Button size="small" onClick={() => loadRuntime()}>
                Retry
              </Button>
            }
          />
        ) : null}
        <Table
          rowKey="id"
          loading={runtimeLoading}
          dataSource={runtimeRows}
          expandable={{
            expandedRowRender: (row) => (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Steps
                  size="small"
                  current={getRuntimeLifecycleStep(row?.status)}
                  items={buildRuntimeLifecycleItems(row)}
                />
                <Descriptions size="small" column={{ xs: 1, sm: 2, md: 4 }} colon={false}>
                  <Descriptions.Item label="Request ID">{row?.id ?? "-"}</Descriptions.Item>
                  <Descriptions.Item label="Deployment ID">{row?.deployment ?? "-"}</Descriptions.Item>
                  <Descriptions.Item label="Subscription ID">{row?.subscription ?? "-"}</Descriptions.Item>
                  <Descriptions.Item label="Issued license">{row?.issued_license ?? "-"}</Descriptions.Item>
                </Descriptions>
                {row?.review_note ? (
                  <Alert
                    type={String(row?.status || "").toLowerCase() === "rejected" ? "error" : "info"}
                    showIcon
                    message="Review note"
                    description={row.review_note}
                  />
                ) : null}
              </Space>
            ),
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  runtimeSearch
                    ? "No runtime requests match the current search"
                    : "No runtime license requests"
                }
              />
            ),
          }}
          pagination={{ current: runtimePage, pageSize: runtimePageSize, total: runtimeTotal, showSizeChanger: true }}
          onChange={(pagination) => loadRuntime({ page: pagination.current, pageSize: pagination.pageSize })}
          columns={[
            { title: "Instance", dataIndex: "instance_id", key: "instance_id" },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              render: (v, row) => {
                const ttlMeta = getApprovalTtlMeta(row);
                return (
                  <Space size={6} wrap>
                    <Tag color="processing">{v}</Tag>
                    {ttlMeta?.level === "warning" ? <Tag color="warning">{ttlMeta.message}</Tag> : null}
                    {ttlMeta?.level === "expired" ? <Tag color="error">TTL expired</Tag> : null}
                  </Space>
                );
              },
            },
            { title: "Created", dataIndex: "created_at", key: "created_at", render: formatDateTime },
            {
              title: "Actions",
              key: "actions",
              render: (_, row) => {
                const deploymentOptions = getDeploymentOptionsForRequest(row, allDeployments);
                const instanceDeploymentOptions = deploymentOptionsByInstance[row.instance_id] || [];
                const availableDeploymentOptions = deploymentOptions.length ? deploymentOptions : instanceDeploymentOptions;
                const selectedDeployment = allDeployments.find((dep) => dep.id === requestDeploymentMap[row.id]);
                const subscriptionOptions = allSubscriptions
                  .filter((sub) => !selectedDeployment || sub.customer === selectedDeployment.customer)
                  .map((sub) => ({
                    label: `${sub.plan_code || sub.plan} • ${sub.status}`,
                    value: sub.id,
                  }));
                const ttlMeta = getApprovalTtlMeta(row);
                const showReapprove = ttlMeta?.level === "warning" || ttlMeta?.level === "expired";
                return (
                  <Space wrap>
                    <Select
                      style={{ width: 220 }}
                      placeholder="Deployment"
                      options={availableDeploymentOptions}
                      notFoundContent={optionsError ? "Deployment list unavailable" : undefined}
                      value={requestDeploymentMap[row.id]}
                      onChange={(value) => {
                        setRequestDeploymentMap((prev) => ({ ...prev, [row.id]: value }));
                        setRequestSubscriptionMap((prev) => ({ ...prev, [row.id]: undefined }));
                      }}
                    />
                    <Select
                      style={{ width: 220 }}
                      placeholder="Subscription"
                      options={subscriptionOptions}
                      notFoundContent={optionsError ? "Subscription list unavailable" : undefined}
                      value={requestSubscriptionMap[row.id]}
                      onChange={(value) => setRequestSubscriptionMap((prev) => ({ ...prev, [row.id]: value }))}
                    />
                    <Button
                      type="primary"
                      loading={Boolean(assignLoading[`req-${row.id}`])}
                      onClick={() => onApproveRequest(row.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      danger
                      loading={Boolean(assignLoading[`req-${row.id}`])}
                      onClick={() => onRejectRequest(row.id)}
                    >
                      Reject
                    </Button>
                    {showReapprove ? (
                      <Button
                        type="dashed"
                        loading={Boolean(assignLoading[`req-reapprove-${row.id}`])}
                        onClick={() => onReapproveRequest(row.id)}
                      >
                        Re-approve
                      </Button>
                    ) : null}
                    <Input
                      style={{ width: 220 }}
                      placeholder="Reject note (optional)"
                      value={rejectNoteMap[row.id]}
                      onChange={(event) =>
                        setRejectNoteMap((prev) => ({ ...prev, [row.id]: event.target.value }))
                      }
                    />
                  </Space>
                );
              },
            },
          ]}
        />
      </Card>
      <Card
        title="Issued licenses"
        extra={
          <Input.Search
            allowClear
            placeholder="Search by instance/license"
            defaultValue={issuedSearch}
            onSearch={(value) => loadIssued({ page: 1, search: String(value || "").trim() })}
            style={{ width: 300 }}
          />
        }
      >
        <Alert
          showIcon
          type="info"
          style={{ marginBottom: 12 }}
          message="How to provide signature to runtime team"
          description="Open any issued license row and click Show artifact. Copy Signature (or full artifact JSON) and pass it to the runtime install form."
        />
        {issuedError ? (
          <Alert
            showIcon
            type="warning"
            style={{ marginBottom: 12 }}
            message="Issued licenses could not be loaded"
            description={issuedError}
            action={
              <Button size="small" onClick={() => loadIssued()}>
                Retry
              </Button>
            }
          />
        ) : null}
        <Table
          rowKey="id"
          loading={issuedLoading}
          dataSource={issuedRows}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={issuedSearch ? "No issued licenses match search" : "No issued licenses"}
              />
            ),
          }}
          pagination={{ current: issuedPage, pageSize: issuedPageSize, total: issuedTotal, showSizeChanger: true }}
          onChange={(pagination) => loadIssued({ page: pagination.current, pageSize: pagination.pageSize })}
          columns={[
            { title: "License ID", dataIndex: "license_id", key: "license_id", render: (v) => <Text code>{v || "-"}</Text> },
            { title: "Deployment", dataIndex: "deployment", key: "deployment", render: (v) => (v == null ? "-" : `#${v}`) },
            { title: "Subscription", dataIndex: "subscription", key: "subscription", render: (v) => (v == null ? "-" : `#${v}`) },
            {
              title: "Plan",
              dataIndex: "payload_json",
              key: "plan_code",
              render: (payload) => payload?.plan_code || "—",
            },
            {
              title: "Status",
              key: "status",
              render: (_, row) =>
                row?.is_revoked ? <Tag color="error">REVOKED</Tag> : <Tag color="success">ACTIVE</Tag>,
            },
            { title: "Issued at", dataIndex: "issued_at", key: "issued_at", render: formatDateTime },
            {
              title: "Actions",
              key: "actions",
              render: (_, row) => (
                <Space wrap>
                  <Button onClick={() => onOpenArtifact(row)}>Show artifact</Button>
                  <Button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(
                          {
                            payload: row?.payload_json || {},
                            signature: row?.signature || "",
                          },
                          null,
                          2
                        ),
                        "Artifact JSON copied"
                      )
                    }
                  >
                    Copy artifact
                  </Button>
                  <Button danger disabled={Boolean(row?.is_revoked)} onClick={() => openRevoke(row)}>
                    Revoke
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        title="Revoke issued license"
        open={revokeOpen}
        onCancel={() => {
          setRevokeOpen(false);
          setRevokeTarget(null);
        }}
        onOk={onConfirmRevoke}
        confirmLoading={revokeSaving}
      >
        <Form form={revokeForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: "Reason is required" }]}
          >
            <Input placeholder="manual_revoke" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="License artifact"
        open={artifactOpen}
        onCancel={closeArtifactModal}
        footer={[
          <Button key="close" onClick={closeArtifactModal}>
            Close
          </Button>,
          <Button
            key="copy-signature"
            disabled={artifactLoading || !artifactData?.signature}
            onClick={() => copyToClipboard(artifactData?.signature, "Signature copied")}
          >
            Copy signature
          </Button>,
          <Button
            key="copy-artifact"
            type="primary"
            disabled={artifactLoading || !artifactData}
            onClick={() => copyToClipboard(artifactObjectText, "Artifact copied")}
          >
            Copy artifact JSON
          </Button>,
          <Button
            key="download-artifact"
            disabled={artifactLoading || !artifactData}
            onClick={onDownloadArtifact}
          >
            Download artifact.json
          </Button>,
        ]}
        width={860}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {artifactTarget?.license_id ? (
            <Descriptions size="small" column={{ xs: 1, sm: 2 }} colon={false}>
              <Descriptions.Item label="License ID">
                <Text code>{artifactTarget.license_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {artifactData?.status === "revoked" ? <Tag color="error">REVOKED</Tag> : <Tag color="success">ACTIVE</Tag>}
              </Descriptions.Item>
            </Descriptions>
          ) : null}
          <Alert
            showIcon
            type="info"
            message="Where to use this"
            description={
              artifactData?.runtime_install_help ||
              "In runtime CRM -> License page -> Install signed artifact. Paste full artifact JSON or paste payload and signature separately."
            }
          />
          <div>
            <Text strong>Signature</Text>
            <Input.TextArea
              readOnly
              autoSize={{ minRows: 3, maxRows: 6 }}
              value={artifactLoading ? "Loading..." : artifactData?.signature || ""}
            />
          </div>
          <div>
            <Text strong>Payload JSON</Text>
            <Input.TextArea
              readOnly
              autoSize={{ minRows: 6, maxRows: 16 }}
              value={artifactLoading ? "Loading..." : artifactPayloadText}
            />
          </div>
          <div>
            <Text strong>Full artifact JSON</Text>
            <Input.TextArea
              readOnly
              autoSize={{ minRows: 6, maxRows: 16 }}
              value={artifactLoading ? "Loading..." : artifactObjectText}
            />
          </div>
        </Space>
      </Modal>
    </Space>
  );
}
