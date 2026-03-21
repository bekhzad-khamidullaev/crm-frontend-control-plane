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
import { formatDateTime, normalizeCollection, normalizeCount } from "./utils.js";

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
    const [deploymentsResponse, subscriptionsResponse] = await Promise.all([
      getCpDeployments({ page_size: 1000 }),
      getCpSubscriptions({ page_size: 1000 }),
    ]);
    setAllDeployments(normalizeCollection(deploymentsResponse));
    setAllSubscriptions(normalizeCollection(subscriptionsResponse));
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
    } catch {
      message.error("Failed to assign license");
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
    } catch {
      message.error("Failed to approve request");
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
    } catch {
      message.error("Failed to reject request");
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
                const deploymentOptions = deploymentOptionsByInstance[row.instance_id] || [];
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
                      options={deploymentOptions}
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
