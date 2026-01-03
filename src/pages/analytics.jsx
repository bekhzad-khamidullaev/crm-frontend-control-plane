import React, { useEffect, useState } from 'react';
import { Card, Tabs, Button, Space, Spin, Typography } from 'antd';
import { ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { api } from '../lib/api/client.js';
import { getOverview, getDashboardAnalytics, getFunnelData, getActivityFeed } from '../lib/api/analytics.js';
import predictions from '../lib/api/predictions.js';

const { Text } = Typography;

function JsonCard({ title, load, trigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    try {
      const res = await load();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async () => {
    if (!trigger) return;
    setTriggerLoading(true);
    try {
      const res = await trigger();
      setData(res ?? data);
    } finally {
      setTriggerLoading(false);
    }
  };

  useEffect(() => {
    handleLoad();
  }, []);

  return (
    <Card
      title={title}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleLoad} loading={loading}>
            Обновить
          </Button>
          {trigger && (
            <Button icon={<ThunderboltOutlined />} onClick={handleTrigger} loading={triggerLoading}>
              Запустить
            </Button>
          )}
        </Space>
      }
    >
      {loading ? (
        <Spin />
      ) : (
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {data ? JSON.stringify(data, null, 2) : 'Нет данных'}
        </pre>
      )}
    </Card>
  );
}

export default function AnalyticsPage() {
  const tabs = [
    {
      key: 'overview',
      label: 'Обзор',
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <JsonCard title="Analytics Overview" load={() => getOverview()} />
          <JsonCard title="Dashboard Analytics (30d)" load={() => getDashboardAnalytics({ period: '30d' })} />
          <JsonCard title="Funnel" load={() => getFunnelData({ period: '30d' })} />
          <JsonCard title="Activity Feed" load={() => getActivityFeed({})} />
        </Space>
      ),
    },
    {
      key: 'auth-stats',
      label: 'Auth Stats',
      children: (
        <JsonCard title="Auth Stats" load={() => api.get('/api/auth-stats/')} />
      ),
    },
    {
      key: 'predictions',
      label: 'Predictions',
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <JsonCard title="Clients Forecast" load={() => predictions.clients.forecast()} trigger={() => predictions.clients.predict()} />
          <JsonCard title="Leads Forecast" load={() => predictions.leads.forecast()} trigger={() => predictions.leads.predict()} />
          <JsonCard title="Next Actions (Clients)" load={() => predictions.nextActions.clients()} trigger={() => predictions.nextActions.predictClients()} />
          <JsonCard title="Next Actions (Deals)" load={() => predictions.nextActions.deals()} trigger={() => predictions.nextActions.predict()} />
          <JsonCard title="Revenue Forecast" load={() => predictions.revenue.forecast()} trigger={() => predictions.revenue.predict()} />
          <JsonCard title="Prediction Status" load={() => predictions.status()} trigger={() => predictions.predictAll()} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Tabs items={tabs} />
      <Text type="secondary">
        Данные обновляются при нажатии “Обновить”. Прогнозы запускаются по кнопке “Запустить”.
      </Text>
    </div>
  );
}
