import React, { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Empty,
  Modal,
  Skeleton,
  Space,
  Typography,
} from 'antd';
import {
  PhoneTwoTone,
  UserOutlined,
} from '@ant-design/icons';

import { api } from '../../lib/api/client.js';
import { getCompanyDisplayName } from '../../lib/utils/company-display.js';
import { t } from '../../lib/i18n';
import { navigate } from '../../router.js';
import { TELEPHONY_MODAL_PROPS } from '../../shared/ui/telephonyModal.js';

const { Text, Title } = Typography;

function asEntityDisplay(entity) {
  if (!entity) return { title: 'Неизвестный', subtitle: '' };

  if (entity.type === 'company') {
    return {
      title: getCompanyDisplayName(entity.data) || 'Компания',
      subtitle: 'Компания',
    };
  }

  const fullName =
    entity.data?.full_name ||
    [entity.data?.first_name, entity.data?.middle_name, entity.data?.last_name].filter(Boolean).join(' ').trim();

  return {
    title: fullName || entity.data?.phone || 'Клиент',
    subtitle: entity.type === 'lead' ? 'Лид' : 'Контакт',
  };
}

function buildEntityPath(entity) {
  if (entity?.path) return entity.path;
  if (!entity?.id && !entity?.data?.id) return null;
  const entityId = entity.id || entity.data?.id;
  if (entity.type === 'company') return `/companies/${entityId}`;
  if (entity.type === 'lead') return `/leads/${entityId}`;
  return `/contacts/${entityId}`;
}

/**
 * OutgoingCallCard - Shows client information card when making outgoing calls
 * Similar to IncomingCallModal but simplified for outgoing calls
 */
function OutgoingCallCard({ visible, phoneNumber, callData, onClose }) {
  const [searchingContact, setSearchingContact] = useState(false);
  const [matchedEntity, setMatchedEntity] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const searchedPhoneRef = useRef('');

  const searchByPhone = async (phone) => {
    if (!phone) return;

    setSearchingContact(true);
    setMatchedEntity(null);
    setRecentItems([]);

    try {
      const context = await api.get('/api/voip/incoming-context/', {
        params: {
          phone: phone,
          caller_name: '',
          call_id: callData?.callId || '',
          channel_type: 'outgoing',
        },
      });

      if (context?.matched_entity) {
        setMatchedEntity(context.matched_entity);
      }
      if (context?.recent_interactions) {
        setRecentItems(context.recent_interactions.slice(0, 5));
      }
    } catch (error) {
      console.error('Error searching by phone:', error);
    } finally {
      setSearchingContact(false);
    }
  };

  useEffect(() => {
    if (!visible || !phoneNumber) return;

    if (searchedPhoneRef.current === phoneNumber) return;
    searchedPhoneRef.current = phoneNumber;

    searchByPhone(phoneNumber);
  }, [visible, phoneNumber]);

  useEffect(() => {
    if (!visible) {
      searchedPhoneRef.current = '';
      setMatchedEntity(null);
      setRecentItems([]);
    }
  }, [visible]);

  const handleOpenCard = () => {
    const path = buildEntityPath(matchedEntity);
    if (!path) return;
    onClose?.();
    navigate(path);
  };

  const handleClose = () => {
    onClose?.();
  };

  const entityDisplay = asEntityDisplay(matchedEntity);

  return (
    <Modal
      title={
        <Space>
          <PhoneTwoTone />
          <span>{t('outgoingCallCard.title', 'Исходящий звонок')}</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
      {...TELEPHONY_MODAL_PROPS}
    >
      <div style={{ padding: '16px 0' }}>
        {/* Phone number being dialed */}
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">{t('outgoingCallCard.dialing', 'Набор номера')}:</Text>
          <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>
            <PhoneTwoTone /> {phoneNumber}
          </div>
        </div>

        {/* Client info section */}
        {searchingContact ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : matchedEntity ? (
          <Card
            size="small"
            title={
              <Space>
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <span>{entityDisplay.title}</span>
              </Space>
            }
            extra={
              <Button type="primary" onClick={handleOpenCard}>
                {t('outgoingCallCard.openCard', 'Открыть карточку')}
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t('outgoingCallCard.type', 'Тип')}>
                {entityDisplay.subtitle}
              </Descriptions.Item>
              {matchedEntity.data?.phone && (
                <Descriptions.Item label={t('outgoingCallCard.phone', 'Телефон')}>
                  {matchedEntity.data.phone}
                </Descriptions.Item>
              )}
              {matchedEntity.data?.email && (
                <Descriptions.Item label={t('outgoingCallCard.email', 'Email')}>
                  {matchedEntity.data.email}
                </Descriptions.Item>
              )}
              {matchedEntity.data?.company && matchedEntity.type !== 'company' && (
                <Descriptions.Item label={t('outgoingCallCard.company', 'Компания')}>
                  {matchedEntity.data.company}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Recent interactions */}
            {recentItems.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>
                  {t('outgoingCallCard.recentInteractions', 'Последние взаимодействия')}
                </Title>
                {recentItems.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px 0',
                      borderBottom: index < recentItems.length - 1 ? '1px solid #f0f0f0' : 'none',
                    }}
                  >
                    <Text strong>{item.title || item.subject}</Text>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.created_at || item.date}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : (
          <Empty
            description={t('outgoingCallCard.notFound', 'Клиент не найден в CRM')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}

        {/* Call controls */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary">
            {t('outgoingCallCard.hint', 'Звонок выполняется через SIP')}
          </Text>
        </div>
      </div>
    </Modal>
  );
}

export default OutgoingCallCard;
