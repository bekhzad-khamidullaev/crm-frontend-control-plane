import { useEffect, useState } from "react";
import { Input, Space, Table, Tag, Typography, message } from "antd";
import { getCpLicenseAudit } from "../../../lib/api/licenseControl.js";
import { formatDateTime, normalizeCollection, normalizeCount } from "./utils.js";

const { Text } = Typography;

export default function AuditSection() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");

  const load = async (override = {}) => {
    const nextPage = override.page ?? page;
    const nextPageSize = override.pageSize ?? pageSize;
    const nextSearch = override.search ?? search;
    setLoading(true);
    try {
      const response = await getCpLicenseAudit({
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
      message.error("Failed to load license audit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }} wrap>
        <Input.Search
          allowClear
          placeholder="Search by action/user/license/instance"
          defaultValue={search}
          onSearch={(value) => load({ page: 1, search: String(value || "").trim() })}
          style={{ width: 360 }}
        />
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
          { title: "License ID", dataIndex: "license_id", key: "license_id", render: (v) => (v ? <Text code>{v}</Text> : "-") },
          { title: "Instance", dataIndex: "deployment_instance_id", key: "deployment_instance_id", render: (v) => (v ? <Text code>{v}</Text> : "-") },
        ]}
      />
    </>
  );
}
