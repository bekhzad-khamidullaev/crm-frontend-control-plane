/**
 * Integrations Page
 * Manage all integrations with social networks, SMS, telephony
 */

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Row, Col, Space, Button, Modal, App } from 'antd';
import {
  InstagramOutlined,
  FacebookOutlined,
  SendOutlined,
  MessageOutlined,
  PhoneOutlined,
  ApiOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import IntegrationCard from '../components/IntegrationCard';
import InstagramConnect from '../components/InstagramConnect';
import FacebookConnect from '../components/FacebookConnect';
import TelegramConnect from '../components/TelegramConnect';
import TelephonySettings from '../components/TelephonySettings';
import {
  getInstagramStatus,
  disconnectInstagram,
  getInstagramStats,
} from '../lib/api/integrations/instagram';
import {
  getFacebookStatus,
  disconnectFacebook,
  getFacebookStats,
} from '../lib/api/integrations/facebook';
import {
  getTelegramStatus,
  disconnectTelegramBot,
  getTelegramStats,
} from '../lib/api/integrations/telegram';
// SMS API removed - not available in Django-CRM API.yaml
import { getTelephonyStats } from '../lib/api/telephony';

const { TabPane } = Tabs;

export default function IntegrationsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState({});
  const [statuses, setStatuses] = useState({
    instagram: { status: 'disconnected', stats: {} },
    facebook: { status: 'disconnected', stats: {} },
    telegram: { status: 'disconnected', stats: {} },
    sms: { status: 'disconnected', stats: {} },
    telephony: { status: 'disconnected', stats: {} },
  });

  const [modalVisible, setModalVisible] = useState({
    instagram: false,
    facebook: false,
    telegram: false,
    telephony: false,
  });

  useEffect(() => {
    loadAllStatuses();
  }, []);

  const loadAllStatuses = async () => {
    await Promise.all([
      loadInstagramStatus(),
      loadFacebookStatus(),
      loadTelegramStatus(),
      loadSMSStatus(),
      loadTelephonyStatus(),
    ]);
  };

  const loadInstagramStatus = async () => {
    setLoading(prev => ({ ...prev, instagram: true }));
    try {
      const status = await getInstagramStatus();
      const stats = status.connected ? await getInstagramStats() : {};
      setStatuses(prev => ({
        ...prev,
        instagram: {
          status: status.connected ? 'connected' : 'disconnected',
          stats: stats,
          error: status.error,
        },
      }));
    } catch (error) {
      console.error('Error loading Instagram status:', error);
      setStatuses(prev => ({
        ...prev,
        instagram: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading(prev => ({ ...prev, instagram: false }));
    }
  };

  const loadFacebookStatus = async () => {
    setLoading(prev => ({ ...prev, facebook: true }));
    try {
      const status = await getFacebookStatus();
      const stats = status.connected ? await getFacebookStats() : {};
      setStatuses(prev => ({
        ...prev,
        facebook: {
          status: status.connected ? 'connected' : 'disconnected',
          stats: stats,
          error: status.error,
        },
      }));
    } catch (error) {
      console.error('Error loading Facebook status:', error);
      setStatuses(prev => ({
        ...prev,
        facebook: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading(prev => ({ ...prev, facebook: false }));
    }
  };

  const loadTelegramStatus = async () => {
    setLoading(prev => ({ ...prev, telegram: true }));
    try {
      const status = await getTelegramStatus();
      const stats = status.connected ? await getTelegramStats() : {};
      setStatuses(prev => ({
        ...prev,
        telegram: {
          status: status.connected ? 'connected' : 'disconnected',
          stats: stats,
          error: status.error,
        },
      }));
    } catch (error) {
      console.error('Error loading Telegram status:', error);
      setStatuses(prev => ({
        ...prev,
        telegram: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading(prev => ({ ...prev, telegram: false }));
    }
  };

  const loadSMSStatus = async () => {
    setLoading(prev => ({ ...prev, sms: true }));
    try {
      // SMS API not available - showing placeholder
      setStatuses(prev => ({
        ...prev,
        sms: {
          status: 'disconnected',
          stats: {
            'Баланс': 0,
            'Отправлено за месяц': 0,
            'Доставлено': 0,
          },
        },
      }));
    } catch (error) {
      console.error('Error loading SMS status:', error);
      setStatuses(prev => ({
        ...prev,
        sms: { status: 'error', stats: {}, error: error.message },
      }));
    } finally {
      setLoading(prev => ({ ...prev, sms: false }));
    }
  };

  const loadTelephonyStatus = async () => {
    setLoading(prev => ({ ...prev, telephony: true }));
    try {
      const stats = await getTelephonyStats();
      setStatuses(prev => ({
        ...prev,
        telephony: {
          status: stats.configured ? 'connected' : 'disconnected',
          stats: {
            'Звонков сегодня': stats.calls_today || 0,
            'Средняя длительность': `${Math.round((stats.avg_duration || 0) / 60)} мин`,
            'Пропущенных': stats.missed || 0,
          },
        },
      }));
    } catch (error) {
      console.error('Error loading telephony status:', error);
      setStatuses(prev => ({
        ...prev,
        telephony: { status: 'disconnected', stats: {} },
      }));
    } finally {
      setLoading(prev => ({ ...prev, telephony: false }));
    }
  };

  const handleInstagramDisconnect = async () => {
    try {
      await disconnectInstagram();
      await loadInstagramStatus();
    } catch (error) {
      message.error('Ошибка отключения Instagram');
    }
  };

  const handleFacebookDisconnect = async () => {
    try {
      await disconnectFacebook();
      await loadFacebookStatus();
    } catch (error) {
      message.error('Ошибка отключения Facebook');
    }
  };

  const handleTelegramDisconnect = async () => {
    try {
      await disconnectTelegramBot();
      await loadTelegramStatus();
    } catch (error) {
      message.error('Ошибка отключения Telegram');
    }
  };

  const openModal = (type) => {
    setModalVisible(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type) => {
    setModalVisible(prev => ({ ...prev, [type]: false }));
  };

  const handleIntegrationSuccess = async (type) => {
    closeModal(type);
    message.success(`${type} успешно подключен`);
    
    // Reload status
    switch (type) {
      case 'instagram':
        await loadInstagramStatus();
        break;
      case 'facebook':
        await loadFacebookStatus();
        break;
      case 'telegram':
        await loadTelegramStatus();
        break;
      case 'telephony':
        await loadTelephonyStatus();
        break;
    }
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
        <Tabs defaultActiveKey="social">
          <TabPane tab="Социальные сети" key="social">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <IntegrationCard
                title="Instagram"
                description="Подключите Instagram Business для работы с Direct сообщениями и комментариями"
                icon={<InstagramOutlined style={{ fontSize: 24, color: '#E1306C' }} />}
                type="instagram"
                status={statuses.instagram.status}
                stats={statuses.instagram.stats}
                error={statuses.instagram.error}
                loading={loading.instagram}
                onConnect={() => openModal('instagram')}
                onDisconnect={handleInstagramDisconnect}
                onRefresh={loadInstagramStatus}
              />

              <IntegrationCard
                title="Facebook Messenger"
                description="Подключите Facebook страницу для обработки сообщений в Messenger"
                icon={<FacebookOutlined style={{ fontSize: 24, color: '#1877F2' }} />}
                type="facebook"
                status={statuses.facebook.status}
                stats={statuses.facebook.stats}
                error={statuses.facebook.error}
                loading={loading.facebook}
                onConnect={() => openModal('facebook')}
                onDisconnect={handleFacebookDisconnect}
                onRefresh={loadFacebookStatus}
              />

              <IntegrationCard
                title="Telegram"
                description="Подключите Telegram бота для уведомлений и чатов с клиентами"
                icon={<SendOutlined style={{ fontSize: 24, color: '#0088cc' }} />}
                type="telegram"
                status={statuses.telegram.status}
                stats={statuses.telegram.stats}
                error={statuses.telegram.error}
                loading={loading.telegram}
                onConnect={() => openModal('telegram')}
                onDisconnect={handleTelegramDisconnect}
                onRefresh={loadTelegramStatus}
              />
            </Space>
          </TabPane>

          <TabPane tab="Коммуникации" key="communications">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <IntegrationCard
                title="SMS"
                description="Настройте SMS провайдера для рассылок и уведомлений"
                icon={<MessageOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                type="sms"
                status={statuses.sms.status}
                stats={statuses.sms.stats}
                loading={loading.sms}
                onConnect={() => message.info('Настройка SMS провайдера')}
                onRefresh={loadSMSStatus}
              />

              <IntegrationCard
                title="Телефония"
                description="Подключите SIP/WebRTC провайдера для звонков прямо из CRM"
                icon={<PhoneOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                type="telephony"
                status={statuses.telephony.status}
                stats={statuses.telephony.stats}
                loading={loading.telephony}
                onConnect={() => openModal('telephony')}
                onRefresh={loadTelephonyStatus}
              />
            </Space>
          </TabPane>
        </Tabs>
      </Card>

      {/* Modals */}
      <Modal
        title="Подключение Instagram"
        open={modalVisible.instagram}
        onCancel={() => closeModal('instagram')}
        footer={null}
        width={700}
      >
        <InstagramConnect
          onSuccess={() => handleIntegrationSuccess('instagram')}
          onCancel={() => closeModal('instagram')}
        />
      </Modal>

      <Modal
        title="Подключение Facebook Messenger"
        open={modalVisible.facebook}
        onCancel={() => closeModal('facebook')}
        footer={null}
        width={700}
      >
        <FacebookConnect
          onSuccess={() => handleIntegrationSuccess('facebook')}
          onCancel={() => closeModal('facebook')}
        />
      </Modal>

      <Modal
        title="Подключение Telegram"
        open={modalVisible.telegram}
        onCancel={() => closeModal('telegram')}
        footer={null}
        width={700}
      >
        <TelegramConnect
          onSuccess={() => handleIntegrationSuccess('telegram')}
          onCancel={() => closeModal('telegram')}
        />
      </Modal>

      <Modal
        title="Настройка телефонии"
        open={modalVisible.telephony}
        onCancel={() => closeModal('telephony')}
        footer={null}
        width={700}
      >
        <TelephonySettings
          onSuccess={() => handleIntegrationSuccess('telephony')}
        />
      </Modal>
    </div>
  );
}
