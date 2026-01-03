/**
 * Integrations Page
 * Manage SMS and telephony integrations backed by CRM API
 */

import React, { useEffect, useState } from 'react';
import { Card, Space, Button, Modal, App } from 'antd';
import { ApiOutlined, MessageOutlined, PhoneOutlined, ReloadOutlined } from '@ant-design/icons';
import IntegrationCard from '../components/IntegrationCard';
import SMSSettings from '../components/SMSSettings';
import TelephonySettings from '../components/TelephonySettings';
import smsApi from '../lib/api/sms.js';
import { getTelephonyStats, getVoIPConnections } from '../lib/api/telephony';

export default function IntegrationsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState({});
  const [statuses, setStatuses] = useState({
    sms: { status: 'disconnected', stats: {} },
    telephony: { status: 'disconnected', stats: {} },
  });
  const [modalVisible, setModalVisible] = useState({
    sms: false,
    telephony: false,
  });

  useEffect(() => {
    loadAllStatuses();
  }, []);

  const loadAllStatuses = async () => {
    await Promise.all([loadSMSStatus(), loadTelephonyStatus()]);
  };

  const loadSMSStatus = async () => {
    setLoading((prev) => ({ ...prev, sms: true }));
    try {
      const [providers, status] = await Promise.all([smsApi.providers(), smsApi.status()]);
      const list = providers?.results || providers || [];
      const connected = Array.isArray(list) && list.length > 0;

      const stats = status && typeof status === 'object' ? status : {};
      setStatuses((prev) => ({
        ...prev,
        sms: {
          status: connected ? 'connected' : 'disconnected',
          stats: {
            'Каналов': list.length,
            ...stats,
          },
        },
      }));
    } catch (error) {
      console.error('Error loading SMS status:', error);
      setStatuses((prev) => ({
        ...prev,
        sms: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, sms: false }));
    }
  };

  const loadTelephonyStatus = async () => {
    setLoading((prev) => ({ ...prev, telephony: true }));
    try {
      const [connections, stats] = await Promise.all([getVoIPConnections(), getTelephonyStats()]);
      const list = connections?.results || connections || [];
      const active = list.find((item) => item.active);

      setStatuses((prev) => ({
        ...prev,
        telephony: {
          status: active ? 'connected' : 'disconnected',
          stats: {
            'Подключений': list.length,
            'Активный провайдер': active?.provider || '-',
            'Звонков сегодня': stats?.calls_today || stats?.total || 0,
            'Пропущенных': stats?.missed || stats?.missed_calls || 0,
          },
        },
      }));
    } catch (error) {
      console.error('Error loading telephony status:', error);
      setStatuses((prev) => ({
        ...prev,
        telephony: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, telephony: false }));
    }
  };

  const openModal = (type) => setModalVisible((prev) => ({ ...prev, [type]: true }));
  const closeModal = (type) => setModalVisible((prev) => ({ ...prev, [type]: false }));

  const handleIntegrationSuccess = async (type) => {
    closeModal(type);
    message.success('Настройки сохранены');
    if (type === 'sms') await loadSMSStatus();
    if (type === 'telephony') await loadTelephonyStatus();
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <ApiOutlined />
            <span>Интеграции</span>
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadAllStatuses}>
            Обновить все
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <IntegrationCard
            title="SMS"
            description="Провайдеры и статус отправки SMS"
            icon={<MessageOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
            type="sms"
            status={statuses.sms.status}
            stats={statuses.sms.stats}
            error={statuses.sms.error}
            loading={loading.sms}
            onConnect={() => openModal('sms')}
            onRefresh={loadSMSStatus}
          />

          <IntegrationCard
            title="Телефония"
            description="Подключения VoIP/SIP для звонков из CRM"
            icon={<PhoneOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
            type="telephony"
            status={statuses.telephony.status}
            stats={statuses.telephony.stats}
            error={statuses.telephony.error}
            loading={loading.telephony}
            onConnect={() => openModal('telephony')}
            onRefresh={loadTelephonyStatus}
          />
        </Space>
      </Card>

      <Modal
        title="Настройка SMS"
        open={modalVisible.sms}
        onCancel={() => closeModal('sms')}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <SMSSettings onSuccess={() => handleIntegrationSuccess('sms')} />
      </Modal>

      <Modal
        title="Настройка телефонии"
        open={modalVisible.telephony}
        onCancel={() => closeModal('telephony')}
        footer={null}
        width={700}
      >
        <TelephonySettings onSuccess={() => handleIntegrationSuccess('telephony')} />
      </Modal>
    </div>
  );
}
