import { useState } from 'react';
import { Alert, Button, Card, Col, Empty, Progress, Row, Segmented, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import { KpiStatCard } from '../../shared/ui';
import type {
  LicenseAuditDrilldown,
  LicenseOperationsAlert,
  LicenseOperationsCodeStat,
  LicenseOperationsEndpointStat,
  LicenseOperationsFeatureStat,
  LicenseOperationsPanelProps,
  LicenseOperationsRuntimeSurfaceStat,
  LicenseOperationsSurfaceStat,
  LicenseOperationsTrendBucket,
} from './interface';

const { Text } = Typography;

function formatBucketLabel(value?: string) {
  if (!value) return '-';
  return dayjs(value).format('DD MMM HH:00');
}

function toArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

export default function LicenseOperationsPanel({
  summary,
  loading = false,
  error = null,
  onOpenAudit,
}: LicenseOperationsPanelProps) {
  const totals = summary?.totals || {};
  const byCode = toArray(summary?.by_code);
  const byFeature = toArray(summary?.by_feature);
  const byEndpoint = toArray(summary?.by_endpoint);
  const bySurface = toArray(summary?.by_surface);
  const byRuntimeSurface = toArray(summary?.by_runtime_surface);
  const trend = toArray(summary?.trend);
  const alerts = toArray(summary?.alerts);
  const [breakdownMode, setBreakdownMode] = useState<'endpoint' | 'runtime_surface'>('endpoint');

  const totalDenials = Number(totals.total_denials || 0);
  const uniqueCodes = Number(totals.unique_codes || 0);
  const uniqueFeatures = Number(totals.unique_features || 0);
  const uniqueCorrelations = Number(totals.unique_correlations || 0);
  const peakTrendCount = Math.max(...trend.map((item) => Number(item?.total || 0)), 0);
  const generatedAt = summary?.generated_at ? dayjs(summary.generated_at).format('DD MMM YYYY HH:mm') : '';
  const windowHours = Number(summary?.window_hours || 24);

  const openAudit = (filters: LicenseAuditDrilldown) => {
    onOpenAudit?.({
      action: 'deny',
      ...filters,
    });
  };

  const trendColumns = [
    {
      title: 'Hour',
      dataIndex: 'bucket_start',
      key: 'bucket_start',
      render: (value: string) => <Text>{formatBucketLabel(value)}</Text>,
    },
    {
      title: 'Denials',
      dataIndex: 'total',
      key: 'total',
      width: 96,
      render: (value: number) => <Text strong>{Number(value || 0)}</Text>,
    },
    {
      title: 'Peak share',
      key: 'peak_share',
      render: (_: unknown, row: LicenseOperationsTrendBucket) => (
        <Progress
          percent={peakTrendCount ? Math.round((Number(row?.total || 0) / peakTrendCount) * 100) : 0}
          showInfo={false}
          size="small"
          strokeColor={Number(row?.total || 0) > 0 ? '#fa8c16' : '#d9d9d9'}
        />
      ),
    },
    {
      title: 'Top code',
      dataIndex: 'top_code',
      key: 'top_code',
      render: (value: string) =>
        value ? (
          <Button type="link" size="small" onClick={() => openAudit({ code: String(value) })}>
            <Tag color="warning">{String(value)}</Tag>
          </Button>
        ) : (
          <Text type="secondary">No denials</Text>
        ),
    },
    {
      title: 'Investigate',
      key: 'investigate',
      width: 110,
      render: (_: unknown, row: LicenseOperationsTrendBucket) => (
        <Button
          size="small"
          disabled={!row?.top_code}
          onClick={() =>
            openAudit({
              code: row?.top_code,
            })
          }
        >
          Audit
        </Button>
      ),
    },
  ];

  const featureColumns = [
    {
      title: 'Feature',
      dataIndex: 'feature',
      key: 'feature',
      render: (value: string) => <Text code>{String(value || 'unscoped')}</Text>,
    },
    {
      title: 'Denials',
      dataIndex: 'count',
      key: 'count',
      width: 96,
      render: (value: number) => <Text strong>{Number(value || 0)}</Text>,
    },
    {
      title: 'Pressure',
      key: 'pressure',
      render: (_: unknown, row: LicenseOperationsFeatureStat) => (
        <Progress
          percent={totalDenials ? Math.round((Number(row?.count || 0) / totalDenials) * 100) : 0}
          showInfo={false}
          size="small"
          strokeColor="#1677ff"
        />
      ),
    },
    {
      title: 'Top code',
      dataIndex: 'top_code',
      key: 'top_code',
      render: (value: string) =>
        value ? (
          <Tag color="processing">{String(value)}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Investigate',
      key: 'investigate',
      width: 110,
      render: (_: unknown, row: LicenseOperationsFeatureStat) => (
        <Button
          size="small"
          onClick={() =>
            openAudit({
              code: row?.top_code,
              feature: row?.feature,
            })
          }
        >
          Audit
        </Button>
      ),
    },
  ];

  const endpointColumns = [
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 90,
      render: (value: string) => <Tag color="geekblue">{String(value || '-')}</Tag>,
    },
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
      render: (value: string) => <Text code>{String(value || '-')}</Text>,
    },
    {
      title: 'Denials',
      dataIndex: 'count',
      key: 'count',
      width: 96,
      render: (value: number) => <Text strong>{Number(value || 0)}</Text>,
    },
    {
      title: 'Top code',
      dataIndex: 'top_code',
      key: 'top_code',
      render: (value: string) => (value ? <Tag color="volcano">{String(value)}</Tag> : '-'),
    },
    {
      title: 'Investigate',
      key: 'investigate',
      width: 110,
      render: (_: unknown, row: LicenseOperationsEndpointStat) => (
        <Button
          size="small"
          onClick={() =>
            openAudit({
              code: row?.top_code,
              path: row?.path,
              method: row?.method,
              surfaceType: 'http',
              surfaceName: row?.path,
            })
          }
        >
          Audit
        </Button>
      ),
    },
  ];

  const surfaceColumns = [
    {
      title: 'Surface type',
      dataIndex: 'surface_type',
      key: 'surface_type',
      render: (value: string) => <Tag color="purple">{String(value || 'unknown')}</Tag>,
    },
    {
      title: 'Denials',
      dataIndex: 'count',
      key: 'count',
      width: 96,
      render: (value: number) => <Text strong>{Number(value || 0)}</Text>,
    },
    {
      title: 'Top code',
      dataIndex: 'top_code',
      key: 'top_code',
      render: (value: string) => (value ? <Tag color="processing">{String(value)}</Tag> : '-'),
    },
  ];

  const runtimeSurfaceColumns = [
    {
      title: 'Surface type',
      dataIndex: 'surface_type',
      key: 'surface_type',
      width: 140,
      render: (value: string) => <Tag color="purple">{String(value || 'unknown')}</Tag>,
    },
    {
      title: 'Surface name',
      dataIndex: 'surface_name',
      key: 'surface_name',
      render: (value: string) => <Text code>{String(value || '-')}</Text>,
    },
    {
      title: 'Denials',
      dataIndex: 'count',
      key: 'count',
      width: 96,
      render: (value: number) => <Text strong>{Number(value || 0)}</Text>,
    },
    {
      title: 'Top code',
      dataIndex: 'top_code',
      key: 'top_code',
      render: (value: string) => (value ? <Tag color="gold">{String(value)}</Tag> : '-'),
    },
    {
      title: 'Investigate',
      key: 'investigate',
      width: 110,
      render: (_: unknown, row: LicenseOperationsRuntimeSurfaceStat) => (
        <Button
          size="small"
          onClick={() =>
            openAudit({
              code: row?.top_code,
              surfaceType: row?.surface_type,
              surfaceName: row?.surface_name,
            })
          }
        >
          Audit
        </Button>
      ),
    },
  ];

  return (
    <Space
      direction="vertical"
      size="middle"
      style={{ width: '100%' }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <KpiStatCard
            width="100%"
            height={112}
            bodyPadding="12px"
            titleMinHeight={40}
            title="Runtime denials"
            value={totalDenials}
            loading={loading}
          />
        </Col>
        <Col xs={24} md={6}>
          <KpiStatCard
            width="100%"
            height={112}
            bodyPadding="12px"
            titleMinHeight={40}
            title="Unique codes"
            value={uniqueCodes}
            loading={loading}
          />
        </Col>
        <Col xs={24} md={6}>
          <KpiStatCard
            width="100%"
            height={112}
            bodyPadding="12px"
            titleMinHeight={40}
            title="Feature hotspots"
            value={uniqueFeatures}
            loading={loading}
          />
        </Col>
        <Col xs={24} md={6}>
          <KpiStatCard
            width="100%"
            height={112}
            bodyPadding="12px"
            titleMinHeight={40}
            title="Correlated incidents"
            value={uniqueCorrelations}
            loading={loading}
          />
        </Col>
      </Row>

      {error && !summary ? (
        <Alert
          type="info"
          showIcon
          message="Runtime operations summary unavailable"
          description="The runtime licensing analytics endpoint did not return data."
        />
      ) : null}

      {alerts.length ? (
        <Card title="Operations alerts" loading={loading}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {alerts.map((row: LicenseOperationsAlert) => {
              const alertType =
                row?.severity === 'error'
                  ? 'error'
                  : row?.severity === 'warning'
                    ? 'warning'
                    : 'info';
              return (
                <Alert
                  key={row.code}
                  type={alertType}
                  showIcon
                  message={row.title}
                  description={
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text>{row.description}</Text>
                      {row.metric ? <Text type="secondary">Metric: {row.metric}</Text> : null}
                    </Space>
                  }
                  action={
                    row.code === 'seat_over_limit' || row.code === 'seat_capacity_warning' ? null : (
                      <Button
                        size="small"
                        onClick={() =>
                          openAudit({
                            code: row?.related_code,
                            feature: row?.feature,
                            path: row?.path,
                            method: row?.method,
                            surfaceType: row?.surface_type,
                            surfaceName: row?.surface_name,
                          })
                        }
                      >
                        Open audit
                      </Button>
                    )
                  }
                />
              );
            })}
          </Space>
        </Card>
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title={`Runtime denial trend (${windowHours}h)`}
            extra={generatedAt ? <Text type="secondary">Updated {generatedAt}</Text> : null}
            loading={loading}
          >
            {trend.length ? (
              <Table
                rowKey="bucket_start"
                size="small"
                pagination={false}
                dataSource={trend}
                columns={trendColumns}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No runtime denials in this window" />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Feature breakdown" loading={loading}>
            {byFeature.length ? (
              <Table
                rowKey="feature"
                size="small"
                pagination={false}
                dataSource={byFeature}
                columns={featureColumns}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No feature-scoped denials" />
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title="Runtime surface breakdown"
        extra={
          <Segmented
            value={breakdownMode}
            onChange={(value) => setBreakdownMode(value as 'endpoint' | 'runtime_surface')}
            options={[
              { label: 'HTTP endpoints', value: 'endpoint' },
              { label: 'Tasks & commands', value: 'runtime_surface' },
            ]}
          />
        }
        loading={loading}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {bySurface.length ? (
            <Table
              rowKey={(row: LicenseOperationsSurfaceStat) => `${row.surface_type || '-'}`}
              size="small"
              pagination={false}
              dataSource={bySurface}
              columns={surfaceColumns}
            />
          ) : null}
          {breakdownMode === 'endpoint' ? (
            byEndpoint.length ? (
              <Table
                rowKey={(row) => `${row.method || '-'}-${row.path || '-'}`}
                size="small"
                pagination={false}
                dataSource={byEndpoint}
                columns={endpointColumns}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No endpoint hotspots recorded" />
            )
          ) : byRuntimeSurface.length ? (
            <Table
              rowKey={(row) => `${row.surface_type || '-'}-${row.surface_name || '-'}`}
              size="small"
              pagination={false}
              dataSource={byRuntimeSurface}
              columns={runtimeSurfaceColumns}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No task or command hotspots recorded" />
          )}
        </Space>
      </Card>

      <Card title="Top denial codes" loading={loading}>
        {byCode.length ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {byCode.map((row: LicenseOperationsCodeStat) => (
              <div key={row.code}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                  <Button type="link" size="small" onClick={() => openAudit({ code: row.code })}>
                    <Tag color="error">{String(row.code)}</Tag>
                  </Button>
                  <Text strong>{Number(row.count || 0)}</Text>
                </Space>
                <Progress
                  percent={totalDenials ? Math.round((Number(row.count || 0) / totalDenials) * 100) : 0}
                  showInfo={false}
                  strokeColor="#ff4d4f"
                />
              </div>
            ))}
          </Space>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No denial codes recorded" />
        )}
      </Card>
    </Space>
  );
}
