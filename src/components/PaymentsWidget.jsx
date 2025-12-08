/**
 * Payments Widget
 * Виджет с информацией о платежах для дашборда
 */

import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Spin, Empty, Tag } from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { getPaymentSummary, getPaymentsThisMonth } from '../lib/api/payments';

const PaymentsWidget = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPaymentsSummary();
  }, []);

  const loadPaymentsSummary = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const [summaryData, paymentsData] = await Promise.all([
        getPaymentSummary({ date_from: firstDay, date_to: lastDay }),
        getPaymentsThisMonth({ page_size: 100 }),
      ]);

      // Подсчитываем статистику
      const payments = paymentsData.results || [];
      const completed = payments.filter((p) => p.status === 'completed');
      const pending = payments.filter((p) => p.status === 'pending');
      const failed = payments.filter((p) => p.status === 'failed');

      const totalAmount = completed.reduce((sum, p) => sum + (p.amount || 0), 0);
      const pendingAmount = pending.reduce((sum, p) => sum + (p.amount || 0), 0);

      setSummary({
        total: totalAmount,
        pending: pendingAmount,
        count: completed.length,
        pendingCount: pending.length,
        failedCount: failed.length,
        currency: payments[0]?.currency || '₽',
      });
    } catch (error) {
      console.error('Error loading payments summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card
        title={
          <span>
            <DollarOutlined /> Платежи за месяц
          </span>
        }
        style={{ height: '100%' }}
      >
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin />
        </div>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card
        title={
          <span>
            <DollarOutlined /> Платежи за месяц
          </span>
        }
        style={{ height: '100%' }}
      >
        <Empty description="Нет данных" />
      </Card>
    );
  }

  return (
    <Card
      title={
        <span>
          <DollarOutlined /> Платежи за месяц
        </span>
      }
      style={{ height: '100%' }}
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Statistic
            title="Получено"
            value={summary.total}
            precision={2}
            suffix={summary.currency}
            valueStyle={{ color: '#3f8600' }}
            prefix={<RiseOutlined />}
          />
          <div style={{ marginTop: 8 }}>
            <Tag color="success">{summary.count} платежей</Tag>
          </div>
        </Col>
        <Col span={12}>
          <Statistic
            title="Ожидается"
            value={summary.pending}
            precision={2}
            suffix={summary.currency}
            valueStyle={{ color: '#cf1322' }}
            prefix={<ClockCircleOutlined />}
          />
          <div style={{ marginTop: 8 }}>
            <Tag color="warning">{summary.pendingCount} в обработке</Tag>
          </div>
        </Col>
      </Row>

      {summary.failedCount > 0 && (
        <div style={{ marginTop: 16, padding: '8px 12px', background: '#fff2e8', borderRadius: 4 }}>
          <Tag color="error" icon={<FallOutlined />}>
            {summary.failedCount} неудачных
          </Tag>
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 12, color: '#999', textAlign: 'center' }}>
        Данные за текущий месяц
      </div>
    </Card>
  );
};

export default PaymentsWidget;
