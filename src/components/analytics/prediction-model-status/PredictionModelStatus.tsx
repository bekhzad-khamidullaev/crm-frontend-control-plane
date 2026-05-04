import React, { useMemo } from 'react';
import { Empty, Progress, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { PredictionModelRun, PredictionModelStatusProps } from './interface';
import './index.css';

const { Text } = Typography;

const seriesLabels: Record<string, string> = {
  daily_revenue: 'Revenue',
  new_leads: 'Leads',
  new_clients: 'Clients',
};

const statusColors: Record<string, string> = {
  success: 'success',
  running: 'processing',
  failed: 'error',
};

function renderMetric(value: number | null): string {
  if (value === null || Number.isNaN(Number(value))) {
    return '-';
  }
  return Number(value).toFixed(2);
}

function qualityPercent(mae: number | null): number {
  if (mae === null || Number.isNaN(Number(mae))) {
    return 0;
  }
  const normalized = Math.max(0, 100 - Number(mae) * 10);
  return Math.min(100, Math.round(normalized));
}

const PredictionModelStatus: React.FC<PredictionModelStatusProps> = ({ runs, loading = false, emptyText = 'No model runs yet' }) => {
  const rows = useMemo(
    () =>
      runs.map((run, index) => ({
        ...run,
        key: `${run.series_key}-${run.completed_at || index}`,
      })),
    [runs]
  );

  const columns: ColumnsType<PredictionModelRun & { key: string }> = [
    {
      title: 'Series',
      dataIndex: 'series_key',
      key: 'series_key',
      width: 130,
      render: (value: string) => <Text strong>{seriesLabels[value] || value}</Text>,
    },
    {
      title: 'Model',
      dataIndex: 'model_label',
      key: 'model_label',
      render: (_value: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.model_label || record.model_key}</Text>
          <Text type="secondary">{record.model_source || 'local'}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: string) => <Tag color={statusColors[value] || 'default'}>{value || 'unknown'}</Tag>,
    },
    {
      title: 'Horizon',
      dataIndex: 'horizon_days',
      key: 'horizon_days',
      width: 95,
      render: (value: number) => `${value || 0}d`,
    },
    {
      title: 'MAE',
      dataIndex: 'mae',
      key: 'mae',
      width: 90,
      render: (value: number | null) => renderMetric(value),
    },
    {
      title: 'RMSE',
      dataIndex: 'rmse',
      key: 'rmse',
      width: 90,
      render: (value: number | null) => renderMetric(value),
    },
    {
      title: 'MAPE',
      dataIndex: 'mape',
      key: 'mape',
      width: 90,
      render: (value: number | null) => (value === null ? '-' : `${Number(value).toFixed(2)}%`),
    },
    {
      title: 'Quality',
      dataIndex: 'mae',
      key: 'quality',
      width: 130,
      render: (value: number | null) => (
        <Progress
          className="component_PredictionModelStatus_Quality"
          percent={qualityPercent(value)}
          size="small"
          showInfo={false}
          strokeColor="#1677ff"
        />
      ),
    },
  ];

  if (!rows.length && !loading) {
    return <Empty description={emptyText} />;
  }

  return (
    <div className="component_PredictionModelStatus_Wrap">
      <Table
        size="small"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={false}
        scroll={{ x: 860 }}
      />
    </div>
  );
};

export default PredictionModelStatus;
