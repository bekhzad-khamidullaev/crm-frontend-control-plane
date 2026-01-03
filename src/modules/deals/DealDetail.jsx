import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Spin,
  message,
  Tabs,
  Typography,
  Progress,
  Steps,
  Table,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CalendarOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  PhoneTwoTone,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getDeal, deleteDeal, getCompany, getContact } from '../../lib/api/client';
import { getDealCallLogs } from '../../lib/api/calls';
import { getStages } from '../../lib/api/reference';
import ActivityLog from '../../components/ActivityLog';
import CallButton from '../../components/CallButton';
import ChatWidget from '../../modules/chat/ChatWidget';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function DealDetail({ id }) {
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callLogs, setCallLogs] = useState([]);
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [stages, setStages] = useState([]);
  const [company, setCompany] = useState(null);
  const [contact, setContact] = useState(null);

  useEffect(() => {
    loadDeal();
    loadCallLogs();
    loadStages();
  }, [id]);

  useEffect(() => {
    if (deal?.company) {
      loadCompany(deal.company);
    } else {
      setCompany(null);
    }
    if (deal?.contact) {
      loadContact(deal.contact);
    } else {
      setContact(null);
    }
  }, [deal]);

  const loadDeal = async () => {
    setLoading(true);
    try {
      const data = await getDeal(id);
      setDeal(data);
    } catch (error) {
      message.error('Ошибка загрузки данных сделки');
    } finally {
      setLoading(false);
    }
  };

  const loadCallLogs = async () => {
    setCallLogsLoading(true);
    try {
      const response = await getDealCallLogs(id);
      setCallLogs(response.results || []);
    } catch (error) {
      console.error('Error loading call logs:', error);
      setCallLogs([]);
    } finally {
      setCallLogsLoading(false);
    }
  };

  const loadStages = async () => {
    try {
      const response = await getStages({ page_size: 200 });
      setStages(response.results || response || []);
    } catch (error) {
      console.error('Error loading stages:', error);
      setStages([]);
    }
  };

  const loadCompany = async (companyId) => {
    try {
      const data = await getCompany(companyId);
      setCompany(data);
    } catch (error) {
      console.error('Error loading company:', error);
      setCompany(null);
    }
  };

  const loadContact = async (contactId) => {
    try {
      const data = await getContact(contactId);
      setContact(data);
    } catch (error) {
      console.error('Error loading contact:', error);
      setContact(null);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDeal(id);
      message.success('Сделка удалена');
      navigate('/deals');
    } catch (error) {
      message.error('Ошибка удаления сделки');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!deal) {
    return <div>Сделка не найдена</div>;
  }

  const sortedStages = [...stages].sort((a, b) => (a.index_number || 0) - (b.index_number || 0));
  const currentStageIndex = sortedStages.findIndex((stage) => stage.id === deal.stage);
  const stageLabel =
    deal.stage_name ||
    sortedStages.find((stage) => stage.id === deal.stage)?.name ||
    (deal.stage ? `Этап #${deal.stage}` : '-');
  const closeDate = deal.closing_date ? new Date(deal.closing_date) : null;
  const today = new Date();
  const daysLeft = closeDate ? Math.ceil((closeDate - today) / (1000 * 60 * 60 * 24)) : null;

  const tabItems = [
    {
      key: 'details',
      label: 'Детали',
      children: (
        <>
          <Card style={{ marginBottom: 16 }}>
            {sortedStages.length > 0 ? (
              <Steps
                current={currentStageIndex >= 0 ? currentStageIndex : 0}
                items={sortedStages.map((stage) => ({ title: stage.name }))}
              />
            ) : (
              <Text type="secondary">Этапы не найдены</Text>
            )}
          </Card>

          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Название сделки" span={2}>
              <Text strong style={{ fontSize: 16 }}>
                {deal.name}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Сумма">
              <Space>
                <DollarOutlined style={{ color: '#52c41a' }} />
                <Text strong style={{ fontSize: 16 }}>
                  {Number(deal.amount || 0).toLocaleString('ru-RU')} {deal.currency_name || '₽'}
                </Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Стадия">
              {deal.stage ? <Tag color="blue">{stageLabel}</Tag> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Вероятность">
              <Progress
                percent={Number(deal.probability || 0)}
                size="small"
                status={
                  Number(deal.probability || 0) >= 70
                    ? 'success'
                    : Number(deal.probability || 0) >= 40
                    ? 'normal'
                    : 'exception'
                }
              />
            </Descriptions.Item>
            <Descriptions.Item label="Дата закрытия">
              {closeDate ? (
                <Space direction="vertical" size="small">
                  <Space>
                    <CalendarOutlined />
                    {closeDate.toLocaleDateString('ru-RU')}
                  </Space>
                  {daysLeft > 0 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      через {daysLeft} дней
                    </Text>
                  )}
                  {daysLeft < 0 && (
                    <Text type="danger" style={{ fontSize: 12 }}>
                      просрочено на {Math.abs(daysLeft)} дней
                    </Text>
                  )}
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Компания">
              {company ? (
                <Space>
                  <ShopOutlined />
                  <a onClick={() => navigate(`/companies/${company.id}`)}>
                    {company.full_name || company.name || `#${company.id}`}
                  </a>
                </Space>
              ) : deal.company ? (
                `#${deal.company}`
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Контактное лицо">
              {contact ? (
                <Space direction="vertical" size="small">
                  <a onClick={() => navigate(`/contacts/${contact.id}`)}>
                    {contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || `#${contact.id}`}
                  </a>
                  {contact.title && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {contact.title}
                    </Text>
                  )}
                </Space>
              ) : deal.contact ? (
                `#${deal.contact}`
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Ответственный">
              {deal.owner_name || deal.owner || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Дата создания">
              {deal.creation_date ? new Date(deal.creation_date).toLocaleString('ru-RU') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Последнее обновление">
              {deal.update_date ? new Date(deal.update_date).toLocaleString('ru-RU') : '-'}
            </Descriptions.Item>
            {deal.description && (
              <Descriptions.Item label="Описание" span={2}>
                {deal.description}
              </Descriptions.Item>
            )}
          </Descriptions>

        </>
      ),
    },
    {
      key: 'activity',
      label: 'История активности',
      children: <ActivityLog entityType="deal" entityId={deal.id} />,
    },
    {
      key: 'messages',
      label: 'Сообщения',
      children: (
        <ChatWidget
          entityType="deal"
          entityId={deal.id}
          entityName={`Сделка #${deal.id}`}
          entityPhone={contact?.phone}
        />
      ),
    },
    {
      key: 'calls',
      label: `История звонков (${callLogs.length})`,
      children: (
        <Table
          dataSource={callLogs}
          loading={callLogsLoading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                description="Звонков по этой сделке пока не было"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          columns={[
            {
              title: 'Направление',
              dataIndex: 'direction',
              key: 'direction',
              width: 120,
              render: (direction) => (
                <Space>
                  <PhoneTwoTone twoToneColor={direction === 'inbound' ? '#52c41a' : '#1890ff'} />
                  {direction === 'inbound' ? 'Входящий' : 'Исходящий'}
                </Space>
              ),
            },
            {
              title: 'Дата и время',
              dataIndex: 'timestamp',
              key: 'timestamp',
              width: 180,
              render: (date, record) => dayjs(date || record.started_at).format('DD.MM.YYYY HH:mm'),
            },
            {
              title: 'Длительность',
              dataIndex: 'duration',
              key: 'duration',
              width: 120,
              render: (duration) => (
                <Space>
                  <ClockCircleOutlined />
                  {formatDuration(duration)}
                </Space>
              ),
            },
            {
              title: 'Действия',
              key: 'actions',
              width: 120,
              render: (_, record) => (
                <CallButton
                  phone={record.phone_number || record.number}
                  name={contact?.full_name || deal.name}
                  entityType="deal"
                  entityId={deal.id}
                  size="small"
                  type="link"
                />
              ),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/deals')}>
          Назад к списку
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/deals/${id}/edit`)}
        >
          Редактировать
        </Button>
        {contact?.phone && (
          <CallButton
            phone={contact.phone}
            name={contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
            entityType="deal"
            entityId={deal.id}
            size="middle"
            type="default"
            icon={true}
          />
        )}
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
          Удалить
        </Button>
      </Space>

      <Title level={2}>{deal.name}</Title>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}

export default DealDetail;
