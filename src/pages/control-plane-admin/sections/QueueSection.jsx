import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Select, Space, Table, Tag, message } from "antd";
import {
  approveCpRuntimeRequest,
  assignCpDeploymentLicense,
  getCpDeployments,
  getCpRuntimeUnlicensedRequests,
  getCpSubscriptions,
  getCpUnlicensedDeployments,
  rejectCpRuntimeRequest,
} from "../../../lib/api/licenseControl.js";
import { formatBackendError, formatDateTime, normalizeCollection, normalizeCount } from "./utils.js";

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

  const [runtimeRows, setRuntimeRows] = useState([]);
  const [runtimeTotal, setRuntimeTotal] = useState(0);
  const [runtimePage, setRuntimePage] = useState(1);
  const [runtimePageSize, setRuntimePageSize] = useState(10);
  const [runtimeSearch, setRuntimeSearch] = useState("");
  const [runtimeLoading, setRuntimeLoading] = useState(false);

  const [assignLoading, setAssignLoading] = useState({});
  const [rowSubscriptionMap, setRowSubscriptionMap] = useState({});
  const [requestDeploymentMap, setRequestDeploymentMap] = useState({});
  const [requestSubscriptionMap, setRequestSubscriptionMap] = useState({});

  const [allDeployments, setAllDeployments] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);

  const loadOptions = async () => {
    const [deploymentsResponse, subscriptionsResponse] = await Promise.allSettled([
      getCpDeployments({ page_size: 1000 }),
      getCpSubscriptions({ page_size: 1000 }),
    ]);

    if (deploymentsResponse.status === "fulfilled") {
      setAllDeployments(normalizeCollection(deploymentsResponse.value));
    } else {
      message.error(formatBackendError(deploymentsResponse.reason, "Failed to load deployments"));
    }

    if (subscriptionsResponse.status === "fulfilled") {
      setAllSubscriptions(normalizeCollection(subscriptionsResponse.value));
    } else {
      message.error(formatBackendError(subscriptionsResponse.reason, "Failed to load subscriptions"));
    }
  };

  const loadUnlicensed = async (override = {}) => {
    const nextPage = override.page ?? unlicensedPage;
    const nextPageSize = override.pageSize ?? unlicensedPageSize;
    const nextSearch = override.search ?? unlicensedSearch;
    setUnlicensedLoading(true);
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
      message.error(formatBackendError(error, "Failed to load unlicensed deployments"));
    } finally {
      setUnlicensedLoading(false);
    }
  };

  const loadRuntime = async (override = {}) => {
    const nextPage = override.page ?? runtimePage;
    const nextPageSize = override.pageSize ?? runtimePageSize;
    const nextSearch = override.search ?? runtimeSearch;
    setRuntimeLoading(true);
    try {
      const response = await getCpRuntimeUnlicensedRequests({
        page: nextPage,
        page_size: nextPageSize,
        search: nextSearch || undefined,
      });
      setRuntimeRows(normalizeCollection(response));
      setRuntimeTotal(normalizeCount(response));
      setRuntimePage(nextPage);
      setRuntimePageSize(nextPageSize);
      setRuntimeSearch(nextSearch);
    } catch (error) {
      message.error(formatBackendError(error, "Failed to load runtime requests"));
    } finally {
      setRuntimeLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
    loadUnlicensed();
    loadRuntime();
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
        const options = getDeploymentOptionsForRequest(row, allDeployments);
        if (options.length === 1) {
          next[row.id] = options[0].value;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [allDeployments, runtimeRows]);

  const onAssign = async (deploymentId) => {
    const subscriptionId = rowSubscriptionMap[deploymentId];
    if (!subscriptionId) {
      message.warning("Select subscription first");
      return;
    }
    setAssignLoading((prev) => ({ ...prev, [deploymentId]: true }));
    try {
      await assignCpDeploymentLicense(deploymentId, subscriptionId);
      await loadUnlicensed();
      await loadRuntime();
      onMutated?.();
      message.success("License assigned");
    } catch (error) {
      message.error(formatBackendError(error, "Failed to assign license"));
    } finally {
      setAssignLoading((prev) => ({ ...prev, [deploymentId]: false }));
    }
  };

  const onApproveRequest = async (requestId) => {
    const deploymentId = requestDeploymentMap[requestId];
    const subscriptionId = requestSubscriptionMap[requestId];
    if (!deploymentId || !subscriptionId) {
      message.warning("Select deployment and subscription");
      return;
    }
    setAssignLoading((prev) => ({ ...prev, [`req-${requestId}`]: true }));
    try {
      await approveCpRuntimeRequest(requestId, { deployment_id: deploymentId, subscription_id: subscriptionId, review_note: "Approved" });
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

  const onRejectRequest = async (requestId) => {
    setAssignLoading((prev) => ({ ...prev, [`req-${requestId}`]: true }));
    try {
      await rejectCpRuntimeRequest(requestId, "Rejected from queue");
      await loadRuntime();
      onMutated?.();
      message.success("Request rejected");
    } catch (error) {
      message.error(formatBackendError(error, "Failed to reject request"));
    } finally {
      setAssignLoading((prev) => ({ ...prev, [`req-${requestId}`]: false }));
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
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
        <Table
          rowKey="id"
          loading={unlicensedLoading}
          dataSource={unlicensedRows}
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
          <Input.Search
            allowClear
            placeholder="Search instance or customer"
            defaultValue={runtimeSearch}
            onSearch={(value) => loadRuntime({ page: 1, search: String(value || "").trim() })}
            style={{ width: 300 }}
          />
        }
      >
        <Table
          rowKey="id"
          loading={runtimeLoading}
          dataSource={runtimeRows}
          pagination={{ current: runtimePage, pageSize: runtimePageSize, total: runtimeTotal, showSizeChanger: true }}
          onChange={(pagination) => loadRuntime({ page: pagination.current, pageSize: pagination.pageSize })}
          columns={[
            { title: "Instance", dataIndex: "instance_id", key: "instance_id" },
            { title: "Status", dataIndex: "status", key: "status", render: (v) => <Tag color="processing">{v}</Tag> },
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
                return (
                  <Space wrap>
                    <Select
                      style={{ width: 220 }}
                      placeholder="Deployment"
                      options={availableDeploymentOptions}
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
                  </Space>
                );
              },
            },
          ]}
        />
      </Card>
    </Space>
  );
}
