import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Statistic,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getCpOverview, getLicenseMe } from '../../lib/api/licenseControl.js';
import parseLicenseRestriction from '../../lib/api/licenseError.ts';
import LicenseRestrictedResult from '../../components/LicenseRestrictedResult.jsx';
import CustomersSection from './sections/CustomersSection.jsx';
import DeploymentsSection from './sections/DeploymentsSection.jsx';
import SubscriptionsSection from './sections/SubscriptionsSection.jsx';
import PlansFeaturesSection from './sections/PlansFeaturesSection.jsx';
import QueueSection from './sections/QueueSection.jsx';
import AuditSection from './sections/AuditSection.jsx';

const { Text } = Typography;

export default function ControlPlaneAdminPage() {
  const [overview, setOverview] = useState(null);
  const [licenseMe, setLicenseMe] = useState(null);
  const [overviewError, setOverviewError] = useState(null);
  const [licenseError, setLicenseError] = useState(null);
  const [pageRestriction, setPageRestriction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadOverview = async () => {
    setLoading(true);
    const [overviewResult, licenseResult] = await Promise.allSettled([
      getCpOverview(),
      getLicenseMe(),
    ]);
    const overviewRestriction =
      overviewResult.status === 'rejected' ? parseLicenseRestriction(overviewResult.reason) : null;

    if (overviewResult.status === 'fulfilled') {
      setOverview(overviewResult.value || null);
      setOverviewError(null);
      setPageRestriction(null);
    } else {
      setOverview(null);
      setOverviewError(overviewResult.reason || new Error('Failed to load control-plane overview'));
      setPageRestriction(
        overviewRestriction
          ? {
              code: String(overviewRestriction.code || 'LICENSE_FEATURE_DISABLED'),
              feature: String(overviewRestriction.feature || 'settings.core'),
              message: String(overviewRestriction.message || ''),
            }
          : null
      );
    }

    if (licenseResult.status === 'fulfilled') {
      setLicenseMe(licenseResult.value || null);
      setLicenseError(null);
    } else {
      setLicenseMe(null);
      setLicenseError(licenseResult.reason || new Error('Failed to load license summary'));
    }

    setLoading(false);
  };

  useEffect(() => {
    loadOverview();
  }, [refreshKey]);

  const refreshAll = () => setRefreshKey((v) => v + 1);

  const licenseStatus = String(licenseMe?.status || '').trim();
  const licenseStatusKey = licenseStatus.toLowerCase();
  const seatUsage = licenseMe?.seat_usage || {};
  const seatUsed = seatUsage.used ?? licenseMe?.seat_usage_used ?? null;
  const seatLimit =
    seatUsage.limit ?? licenseMe?.seat_usage_limit ?? licenseMe?.max_active_users ?? null;
  const overLimit =
    licenseMe?.over_limit ??
    (seatUsed != null && seatLimit != null ? Number(seatUsed) > Number(seatLimit) : false);

  const statusTagColor =
    licenseStatusKey === 'active'
      ? 'success'
      : licenseStatusKey === 'trial' || licenseStatusKey === 'grace'
        ? 'processing'
        : licenseStatusKey === 'suspended' || licenseStatusKey === 'expired'
          ? 'warning'
          : licenseStatusKey === 'revoked' || licenseStatusKey === 'invalid' || overLimit
            ? 'error'
            : 'default';

  const renderLicenseValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  };
  const overviewUnavailable = Boolean(!loading && !overview && overviewError && !pageRestriction);
  const renderOverviewValue = (value) => (overviewUnavailable ? '—' : (value ?? 0));

  if (pageRestriction) {
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card>
          <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            <div>
              <Text strong>Control Plane</Text>
              <div>
                <Text type="secondary">
                  Single source of truth for customers, deployments, subscriptions, plans, and
                  license assignments.
                </Text>
              </div>
            </div>
            <Button icon={<ReloadOutlined />} loading={loading} onClick={refreshAll}>
              Refresh
            </Button>
          </Space>
        </Card>
        <LicenseRestrictedResult
          restriction={pageRestriction}
          onBack={() => (window.location.hash = '#/dashboard')}
        />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {overviewError && !loading && !overview ? (
        <Alert
          type="info"
          showIcon
          message="Control-plane API unavailable"
          description="This environment does not expose cp/* endpoints or your user has no access."
        />
      ) : null}
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <div>
            <Text strong>Control Plane</Text>
            <div>
              <Text type="secondary">
                Single source of truth for customers, deployments, subscriptions, plans, and license
                assignments.
              </Text>
            </div>
          </div>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={refreshAll}>
            Refresh
          </Button>
        </Space>
      </Card>
      <Card size="small" title="License summary" loading={loading && !licenseMe && !licenseError}>
        {licenseError ? (
          <Alert
            type="warning"
            showIcon
            message="License summary unavailable"
            description="The control-plane license endpoint could not be loaded."
          />
        ) : licenseMe ? (
          <Alert
            type={overLimit ? 'error' : statusTagColor === 'warning' ? 'warning' : 'info'}
            showIcon
            message={
              <Space size={8} wrap>
                <Text strong>Current license</Text>
                <Tag color={statusTagColor}>
                  {licenseStatus ? licenseStatus.toUpperCase() : 'UNKNOWN'}
                </Tag>
                {overLimit ? <Tag color="error">OVER LIMIT</Tag> : null}
              </Space>
            }
            description={
              <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 5 }} colon={false}>
                <Descriptions.Item label="plan_code">
                  {renderLicenseValue(licenseMe?.plan_code)}
                </Descriptions.Item>
                <Descriptions.Item label="max_active_users">
                  {renderLicenseValue(licenseMe?.max_active_users)}
                </Descriptions.Item>
                <Descriptions.Item label="seat_usage.used">
                  {renderLicenseValue(seatUsed)}
                </Descriptions.Item>
                <Descriptions.Item label="seat_usage.limit">
                  {renderLicenseValue(seatLimit)}
                </Descriptions.Item>
                <Descriptions.Item label="over_limit">
                  <Tag color={overLimit ? 'error' : 'success'}>{overLimit ? 'TRUE' : 'FALSE'}</Tag>
                </Descriptions.Item>
              </Descriptions>
            }
          />
        ) : (
          <Alert
            type="info"
            showIcon
            message="License summary not available"
            description="The endpoint returned an empty payload."
          />
        )}
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Customers" value={renderOverviewValue(overview?.customers?.total)} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Active licenses"
              value={renderOverviewValue(overview?.licenses?.active_non_revoked)}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Pending runtime review"
              value={renderOverviewValue(overview?.runtime_queue?.pending_review)}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Unlicensed deployments"
              value={renderOverviewValue(overview?.deployments?.unlicensed)}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          items={[
            {
              key: 'customers',
              label: 'Customers',
              children: <CustomersSection onMutated={refreshAll} />,
            },
            {
              key: 'deployments',
              label: 'Deployments',
              children: <DeploymentsSection onMutated={refreshAll} />,
            },
            {
              key: 'subscriptions',
              label: 'Subscriptions',
              children: <SubscriptionsSection onMutated={refreshAll} />,
            },
            {
              key: 'plans-features',
              label: 'Plans & Features',
              children: <PlansFeaturesSection onMutated={refreshAll} />,
            },
            { key: 'queue', label: 'Queue', children: <QueueSection onMutated={refreshAll} /> },
            { key: 'audit', label: 'Audit', children: <AuditSection /> },
          ]}
        />
      </Card>
    </Space>
  );
}
