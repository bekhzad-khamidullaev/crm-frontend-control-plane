import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  getCpOverview,
  getLicenseCoverageSummary,
  getLicenseMe,
  getLicenseOperationsSummary,
} from '../../lib/api/licenseControl.js';
import parseLicenseRestriction from '../../lib/api/licenseError.ts';
import LicenseRestrictedResult from '../../components/LicenseRestrictedResult.jsx';
import { LicenseOperationsPanel } from '../../components/license-operations-panel';
import { LicenseCoveragePanel } from '../../components/license-coverage-panel';
import CustomersSection from './sections/CustomersSection.jsx';
import DeploymentsSection from './sections/DeploymentsSection.jsx';
import SubscriptionsSection from './sections/SubscriptionsSection.jsx';
import PlansFeaturesSection from './sections/PlansFeaturesSection.jsx';
import QueueSection from './sections/QueueSection.jsx';
import AuditSection from './sections/AuditSection.jsx';
import RuntimeIncidentsSection from './sections/RuntimeIncidentsSection.jsx';
import { KpiStatCard } from '../../shared/ui';

const { Text } = Typography;

export default function ControlPlaneAdminPage() {
  const [overview, setOverview] = useState(null);
  const [licenseMe, setLicenseMe] = useState(null);
  const [operationsSummary, setOperationsSummary] = useState(null);
  const [coverageSummary, setCoverageSummary] = useState(null);
  const [overviewError, setOverviewError] = useState(null);
  const [licenseError, setLicenseError] = useState(null);
  const [operationsError, setOperationsError] = useState(null);
  const [coverageError, setCoverageError] = useState(null);
  const [pageRestriction, setPageRestriction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('customers');
  const [auditPresetFilters, setAuditPresetFilters] = useState(null);
  const [incidentPresetFilters, setIncidentPresetFilters] = useState(null);

  const loadOverview = async () => {
    setLoading(true);
    const [overviewResult, licenseResult, operationsResult, coverageResult] = await Promise.allSettled([
      getCpOverview(),
      getLicenseMe(),
      getLicenseOperationsSummary(),
      getLicenseCoverageSummary(),
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

    if (operationsResult.status === 'fulfilled') {
      setOperationsSummary(operationsResult.value || null);
      setOperationsError(null);
    } else {
      setOperationsSummary(null);
      setOperationsError(
        operationsResult.reason || new Error('Failed to load runtime operations summary')
      );
    }

    if (coverageResult.status === 'fulfilled') {
      setCoverageSummary(coverageResult.value || null);
      setCoverageError(null);
    } else {
      setCoverageSummary(null);
      setCoverageError(coverageResult.reason || new Error('Failed to load runtime coverage summary'));
    }

    setLoading(false);
  };

  useEffect(() => {
    loadOverview();
  }, [refreshKey]);

  const refreshAll = () => setRefreshKey((v) => v + 1);
  const openIncidentsFromOperations = (filters = {}) => {
    setIncidentPresetFilters({
      ...filters,
      windowHours: Number(operationsSummary?.window_hours || 24),
      token: Date.now(),
    });
    setActiveTab('runtime-incidents');
  };

  const licenseStatus = String(licenseMe?.status || '').trim();
  const licenseStatusKey = licenseStatus.toLowerCase();
  const seatUsage = licenseMe?.seat_usage || {};
  const seatUsed = seatUsage.used ?? licenseMe?.seat_usage_used ?? null;
  const seatLimit =
    seatUsage.limit ?? licenseMe?.seat_usage_limit ?? licenseMe?.max_active_users ?? null;
  const overLimit =
    licenseMe?.over_limit ??
    (seatUsed != null && seatLimit != null ? Number(seatUsed) > Number(seatLimit) : false);
  const licenseDenials = overview?.license_denials || {};
  const denialTopCode = Array.isArray(licenseDenials.top_codes) ? licenseDenials.top_codes[0] : null;
  const recentDenials = Array.isArray(licenseDenials.recent) ? licenseDenials.recent : [];

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
          action={
            <Button size="small" onClick={refreshAll}>
              Retry
            </Button>
          }
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
            action={
              <Button size="small" onClick={refreshAll}>
                Retry
              </Button>
            }
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
            action={
              <Button size="small" onClick={refreshAll}>
                Retry
              </Button>
            }
          />
        )}
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <KpiStatCard
            width="100%"
            height={112}
            bodyPadding="12px"
            titleMinHeight={40}
            title="Customers"
            value={renderOverviewValue(overview?.customers?.total)}
          />
        </Col>
        <Col xs={24} md={6}>
          <KpiStatCard
            width="100%"
            height={112}
            bodyPadding="12px"
            titleMinHeight={40}
            title="Active licenses"
            value={renderOverviewValue(overview?.licenses?.active_non_revoked)}
          />
        </Col>
        <Col xs={24} md={6}>
          <KpiStatCard
            width="100%"
            height={112}
            bodyPadding="12px"
            titleMinHeight={40}
            title="Pending runtime review"
            value={renderOverviewValue(overview?.runtime_queue?.pending_review)}
          />
        </Col>
        <Col xs={24} md={6}>
          <KpiStatCard
            width="100%"
            height={112}
            bodyPadding="12px"
            titleMinHeight={40}
            title="Unlicensed deployments"
            value={renderOverviewValue(overview?.deployments?.unlicensed)}
          />
        </Col>
      </Row>
      {recentDenials.length ? (
        <Alert
          type="warning"
          showIcon
          message="Recent license denials"
          description={
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text>
                24h total: <Text strong>{renderOverviewValue(licenseDenials.last_24h_total)}</Text>
                {denialTopCode ? (
                  <>
                    {' · '}top code: <Text code>{String(denialTopCode.code || 'UNKNOWN')}</Text> ({denialTopCode.count})
                  </>
                ) : null}
              </Text>
              {recentDenials.slice(0, 3).map((row) => (
                <Text key={row.id}>
                  <Text code>{String(row?.details?.code || 'UNKNOWN')}</Text>
                  {' · '}
                  {String(row?.details?.correlation_id || 'no-correlation')}
                  {' · '}
                  {String(row?.details?.path || '-')}
                </Text>
              ))}
            </Space>
          }
        />
      ) : null}
      <LicenseOperationsPanel
        summary={operationsSummary}
        loading={loading && !operationsSummary && !operationsError}
        error={operationsError}
        onOpenAudit={openIncidentsFromOperations}
      />
      <LicenseCoveragePanel
        summary={coverageSummary}
        loading={loading && !coverageSummary && !coverageError}
        error={coverageError}
      />

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
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
            {
              key: 'runtime-incidents',
              label: 'Runtime incidents',
              children: <RuntimeIncidentsSection presetFilters={incidentPresetFilters} />,
            },
            { key: 'audit', label: 'Audit', children: <AuditSection presetFilters={auditPresetFilters} /> },
          ]}
        />
      </Card>
    </Space>
  );
}
