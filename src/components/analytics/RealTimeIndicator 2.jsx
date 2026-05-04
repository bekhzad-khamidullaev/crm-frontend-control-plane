import React from 'react';
import { Badge, Tooltip, Space, Typography } from 'antd';
import { SyncOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';

dayjs.extend(relativeTime);
dayjs.locale('ru');

const { Text } = Typography;

/**
 * RealTimeIndicator - индикатор real-time обновлений
 * 
 * @param {boolean} isActive - активен ли real-time режим
 * @param {Date} lastUpdate - время последнего обновления
 * @param {number} interval - интервал обновления в мс
 * @param {boolean} loading - идет ли загрузка
 */
function RealTimeIndicator({ 
  isActive = false, 
  lastUpdate = null, 
  interval = 30000,
  loading = false 
}) {
  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Никогда';
    return dayjs(lastUpdate).fromNow();
  };

  const formatInterval = () => {
    const seconds = Math.floor(interval / 1000);
    if (seconds < 60) return `${seconds} сек`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} мин`;
  };

  const getStatusColor = () => {
    if (loading) return 'processing';
    if (isActive) return 'success';
    return 'default';
  };

  const getStatusText = () => {
    if (loading) return 'Обновление...';
    if (isActive) return 'Real-time активен';
    return 'Real-time выключен';
  };

  const getIcon = () => {
    if (loading) return <SyncOutlined spin />;
    if (isActive) return <CheckCircleOutlined />;
    return <ClockCircleOutlined />;
  };

  return (
    <Tooltip
      title={
        <div>
          <div><strong>Статус:</strong> {getStatusText()}</div>
          <div><strong>Интервал:</strong> {formatInterval()}</div>
          <div><strong>Последнее обновление:</strong> {formatLastUpdate()}</div>
        </div>
      }
    >
      <Space size={4} style={{ cursor: 'pointer' }}>
        <Badge status={getStatusColor()} />
        {getIcon()}
        <Text type="secondary" style={{ fontSize: 12 }}>
          {isActive ? `Обновление каждые ${formatInterval()}` : 'Автообновление выключено'}
        </Text>
      </Space>
    </Tooltip>
  );
}

export default RealTimeIndicator;
