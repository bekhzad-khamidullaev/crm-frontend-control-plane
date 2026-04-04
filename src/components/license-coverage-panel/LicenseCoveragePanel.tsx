import { Alert, Card, Col, Empty, Row, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import { KpiStatCard } from '../../shared/ui';
import type { LicenseCoverageEntry, LicenseCoveragePanelProps } from './interface';

const { Text } = Typography;

function toArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeCount(value: unknown): number {
  return Number(value || 0);
}

function statusTagColor(status: string) {
  if (status === 'covered') return 'success';
  if (status === 'exempt') return 'default';
  return 'error';
}

function surfaceLabel(surface: string) {
  if (surface === 'router') return 'Router';
  if (surface === 'named_endpoint') return 'Named endpoint';
  if (surface === 'task') return 'Task';
  if (surface === 'management_command') return 'Management command';
  return 'Unknown';
}

export default function LicenseCoveragePanel({
  summary,
  loading = false,
  error = null,
}: LicenseCoveragePanelProps) {
  const totals = summary?.totals || {};
  const entries = toArray(summary?.entries);
  const uncovered = entries.filter((item) => item?.status && item.status !== 'covered' && item.status !== 'exempt');
  const generatedAt = summary?.generated_at ? dayjs(summary.generated_at).format('DD MMM YYYY HH:mm') : '';

  const columns = [
    {
      title: 'Surface',
      dataIndex: 'surface',
      key: 'surface',
      width: 150,
      render: (value: string) => <Tag>{surfaceLabel(String(value || ''))}</Tag>,
    },
    {
      title: 'Basename',
      dataIndex: 'basename',
      key: 'basename',
      render: (value: string) => <Text code>{String(value || '-')}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (value: string) => <Tag color={statusTagColor(String(value || 'unknown'))}>{String(value || 'unknown')}</Tag>,
    },
    {
      title: 'Viewset',
      dataIndex: 'viewset',
      key: 'viewset',
      render: (value: string) => <Text>{String(value || '-')}</Text>,
    },
    {
      title: 'Feature',
      dataIndex: 'feature',
      key: 'feature',
      render: (value: string) => <Text code>{String(value || '-')}</Text>,
    },
    {
      title: 'Middleware feature',
      dataIndex: 'middleware_feature',
      key: 'middleware_feature',
      render: (value: string) => <Text code>{String(value || '-')}</Text>,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (value: string) => <Text type="secondary">{String(value || '-')}</Text>,
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <KpiStatCard title="Runtime surfaces" value={normalizeCount(totals.total)} loading={loading} />
        </Col>
        <Col xs={24} md={6}>
          <KpiStatCard title="Covered" value={normalizeCount(totals.covered)} loading={loading} />
        </Col>
        <Col xs={24} md={6}>
          <KpiStatCard title="Exempt" value={normalizeCount(totals.exempt)} loading={loading} />
        </Col>
        <Col xs={24} md={6}>
          <KpiStatCard
            title="Coverage gaps"
            value={
              normalizeCount(totals.missing_permission) +
              normalizeCount(totals.missing_feature) +
              normalizeCount(totals.mismatched_feature)
            }
            loading={loading}
          />
        </Col>
      </Row>

      <Card
        title="License coverage health"
        extra={generatedAt ? <Text type="secondary">Generated {generatedAt}</Text> : null}
      >
        {error ? (
          <Alert
            type="warning"
            showIcon
            message="Coverage summary unavailable"
            description="Runtime coverage audit endpoint could not be loaded."
          />
        ) : uncovered.length ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              type="error"
              showIcon
              message="License coverage drift detected"
              description="At least one runtime surface is missing an explicit license contract or disagrees with the coverage registry."
            />
            <Table<LicenseCoverageEntry>
              pagination={false}
              rowKey={(row) => `${row.basename}:${row.status}:${row.prefix}`}
              dataSource={uncovered}
              columns={columns}
              locale={{ emptyText: 'No uncovered endpoints' }}
            />
          </Space>
        ) : entries.length ? (
          <Alert
            type="success"
            showIcon
            message="All audited runtime surfaces are explicitly covered"
            description="HTTP routes and background tasks currently tracked by the licensing audit have an explicit feature contract."
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Coverage summary returned no audited runtime surfaces."
          />
        )}
      </Card>
    </Space>
  );
}
