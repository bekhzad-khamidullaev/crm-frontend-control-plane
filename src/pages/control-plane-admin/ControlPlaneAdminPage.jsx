import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Row, Space, Statistic, Tabs, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { getCpOverview } from "../../lib/api/licenseControl.js";
import CustomersSection from "./sections/CustomersSection.jsx";
import DeploymentsSection from "./sections/DeploymentsSection.jsx";
import SubscriptionsSection from "./sections/SubscriptionsSection.jsx";
import PlansFeaturesSection from "./sections/PlansFeaturesSection.jsx";
import QueueSection from "./sections/QueueSection.jsx";
import AuditSection from "./sections/AuditSection.jsx";

const { Text } = Typography;

export default function ControlPlaneAdminPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const response = await getCpOverview();
      setOverview(response || null);
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [refreshKey]);

  const refreshAll = () => setRefreshKey((v) => v + 1);

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {!overview && !loading ? (
        <Alert
          type="info"
          showIcon
          message="Control-plane API unavailable"
          description="This environment does not expose cp/* endpoints or your user has no access."
        />
      ) : null}
      <Card>
        <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
          <div>
            <Text strong>Control Plane</Text>
            <div>
              <Text type="secondary">
                Single source of truth for customers, deployments, subscriptions, plans, and license assignments.
              </Text>
            </div>
          </div>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={refreshAll}>
            Refresh
          </Button>
        </Space>
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Customers" value={overview?.customers?.total ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Active licenses" value={overview?.licenses?.active_non_revoked ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Pending runtime review" value={overview?.runtime_queue?.pending_review ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Unlicensed deployments" value={overview?.deployments?.unlicensed ?? 0} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          items={[
            { key: "customers", label: "Customers", children: <CustomersSection onMutated={refreshAll} /> },
            { key: "deployments", label: "Deployments", children: <DeploymentsSection onMutated={refreshAll} /> },
            { key: "subscriptions", label: "Subscriptions", children: <SubscriptionsSection onMutated={refreshAll} /> },
            { key: "plans-features", label: "Plans & Features", children: <PlansFeaturesSection onMutated={refreshAll} /> },
            { key: "queue", label: "Queue", children: <QueueSection onMutated={refreshAll} /> },
            { key: "audit", label: "Audit", children: <AuditSection /> },
          ]}
        />
      </Card>
    </Space>
  );
}
