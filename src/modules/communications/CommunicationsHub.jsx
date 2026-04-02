import { App, Button, Card, Form, Input, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import { ReloadOutlined, SendOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { sendOmnichannelMessage } from '../../lib/api/compliance.js';
import { createCrmEmail, getCrmEmails } from '../../lib/api/emails.js';
import { getFacebookPages } from '../../lib/api/integrations/facebook.js';
import { getInstagramAccounts } from '../../lib/api/integrations/instagram.js';
import { getTelegramBots } from '../../lib/api/integrations/telegram.js';
import { getWhatsAppAccounts } from '../../lib/api/integrations/whatsapp.js';
import { getMailings, getMessages } from '../../lib/api/massmail.js';
import smsApi from '../../lib/api/sms.js';
import ChannelBrandIcon from '../../components/channel/ChannelBrandIcon.jsx';

const { TextArea } = Input;
const { Text, Title } = Typography;

const CHANNEL_OPTIONS = [
  { value: 'email', label: <Space size={8}><ChannelBrandIcon channel="crm-email" /><span>Email</span></Space> },
  { value: 'whatsapp', label: <Space size={8}><ChannelBrandIcon channel="whatsapp" /><span>WhatsApp</span></Space> },
  { value: 'telegram', label: <Space size={8}><ChannelBrandIcon channel="telegram" /><span>Telegram</span></Space> },
  { value: 'instagram', label: <Space size={8}><ChannelBrandIcon channel="instagram" /><span>Instagram</span></Space> },
  { value: 'facebook', label: <Space size={8}><ChannelBrandIcon channel="facebook" /><span>Facebook</span></Space> },
];

function normalizeList(response) {
  if (Array.isArray(response?.results)) return response.results;
  return Array.isArray(response) ? response : [];
}

export default function CommunicationsHub({ defaultTab = 'omnichannel' }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [crmEmails, setCrmEmails] = useState([]);
  const [mailings, setMailings] = useState([]);
  const [massmailMessages, setMassmailMessages] = useState([]);
  const [channelAccounts, setChannelAccounts] = useState({
    whatsapp: [],
    telegram: [],
    instagram: [],
    facebook: [],
    sms: [],
  });
  const [channelAccountsLoading, setChannelAccountsLoading] = useState(false);
  const selectedChannel = Form.useWatch('channel', form);

  const loadOmnichannelAccounts = useCallback(async () => {
    setChannelAccountsLoading(true);
    try {
      const [whatsappRes, telegramRes, instagramRes, facebookRes, smsRes] = await Promise.allSettled([
        getWhatsAppAccounts({ page_size: 200 }),
        getTelegramBots({ page_size: 200 }),
        getInstagramAccounts({ page_size: 200 }),
        getFacebookPages({ page_size: 200 }),
        smsApi.providers(),
      ]);
      const valueOrEmpty = (result) => (result?.status === 'fulfilled' ? normalizeList(result.value) : []);
      setChannelAccounts({
        whatsapp: valueOrEmpty(whatsappRes),
        telegram: valueOrEmpty(telegramRes),
        instagram: valueOrEmpty(instagramRes),
        facebook: valueOrEmpty(facebookRes),
        sms: valueOrEmpty(smsRes),
      });
    } finally {
      setChannelAccountsLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [emailsRes, mailingsRes, messagesRes] = await Promise.all([
        getCrmEmails({ page_size: 100, ordering: '-creation_date' }),
        getMailings({ page_size: 100, ordering: '-sending_date' }),
        getMessages({ page_size: 100, ordering: '-update_date' }),
      ]);
      setCrmEmails(normalizeList(emailsRes));
      setMailings(normalizeList(mailingsRes));
      setMassmailMessages(normalizeList(messagesRes));
      await loadOmnichannelAccounts();
    } catch (error) {
      message.error(error?.message || 'Не удалось загрузить коммуникации');
      setCrmEmails([]);
      setMailings([]);
      setMassmailMessages([]);
      setChannelAccounts({
        whatsapp: [],
        telegram: [],
        instagram: [],
        facebook: [],
        sms: [],
      });
    } finally {
      setLoading(false);
    }
  }, [loadOmnichannelAccounts, message]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSend = async () => {
    try {
      const values = await form.validateFields();
      setSending(true);

      if (values.channel === 'email') {
        await createCrmEmail({
          subject: values.subject,
          content: values.text,
          to: values.recipient,
          to_email: values.recipient,
          incoming: false,
          sent: true,
          direction: 'outgoing',
        });
      } else {
        const payload = {
          channel: values.channel,
          text: values.text,
        };
        if (values.channel === 'telegram') {
          payload.chat_id = values.recipient;
          payload.sender_id = values.recipient;
          payload.channel_id = values.channel_id || values.channel;
        } else if (values.channel === 'whatsapp') {
          payload.to = values.recipient;
          payload.channel_id = values.channel_id || values.channel;
        } else {
          payload.recipient_id = values.recipient;
          payload.channel_id = values.channel_id || values.channel;
        }
        await sendOmnichannelMessage(payload);
      }

      message.success('Сообщение отправлено');
      form.resetFields();
      await loadData();
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.message || 'Не удалось отправить сообщение');
      }
    } finally {
      setSending(false);
    }
  };

  const statusSummary = useMemo(() => {
    const failed = massmailMessages.filter((item) => String(item.status || '').toLowerCase() === 'failed').length;
    const sent = massmailMessages.filter((item) => String(item.status || '').toLowerCase() === 'sent').length;
    return { failed, sent, total: massmailMessages.length };
  }, [massmailMessages]);

  const channelIdOptions = useMemo(() => {
    const accountLabelByType = {
      whatsapp: (item) => item?.business_name || item?.name || item?.phone_number || item?.display_phone_number || 'WhatsApp account',
      telegram: (item) => item?.name || item?.bot_username || item?.username || 'Telegram bot',
      instagram: (item) => item?.username ? `@${item.username}` : item?.name || 'Instagram account',
      facebook: (item) => item?.page_name || item?.name || 'Facebook page',
      sms: (item) => item?.name || item?.provider || item?.title || 'SMS provider',
    };
    const list = channelAccounts?.[selectedChannel] || [];
    return list
      .map((item) => {
        const rawId = item?.id || item?.channel_id || item?.phone_number_id || item?.facebook_page_id || item?.instagram_user_id;
        if (!rawId) return null;
        const externalId = item?.channel_id || item?.phone_number_id || item?.facebook_page_id || item?.instagram_user_id;
        const suffix = externalId ? ` • #${externalId}` : '';
        return {
          value: String(rawId),
          label: `${accountLabelByType[selectedChannel]?.(item) || 'Account'}${suffix}`,
        };
      })
      .filter(Boolean);
  }, [channelAccounts, selectedChannel]);

  useEffect(() => {
    if (!selectedChannel || selectedChannel === 'email') {
      form.setFieldValue('channel_id', undefined);
      return;
    }
    const current = form.getFieldValue('channel_id');
    const hasCurrent = channelIdOptions.some((option) => String(option.value) === String(current));
    if (hasCurrent) return;
    if (channelIdOptions.length > 0) {
      form.setFieldValue('channel_id', channelIdOptions[0].value);
      return;
    }
    form.setFieldValue('channel_id', undefined);
  }, [channelIdOptions, form, selectedChannel]);

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Card
        extra={<Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>Обновить</Button>}
      >
        <Space direction="vertical" size={4}>
          <Title level={3} style={{ margin: 0 }}>Omnichannel Communications Hub</Title>
          <Text type="secondary">
            Единый центр для CRM Emails, массовых рассылок и omnichannel отправки сообщений.
          </Text>
        </Space>
      </Card>

      <Tabs
        defaultActiveKey={defaultTab}
        items={[
          {
            key: 'omnichannel',
            label: 'Отправка Omnichannel',
            children: (
              <Card>
                <Form layout="vertical" form={form}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Form.Item name="channel" label="Канал" rules={[{ required: true, message: 'Выберите канал' }]}>
                      <Select options={CHANNEL_OPTIONS} />
                    </Form.Item>
                    <Form.Item name="channel_id" label="Аккаунт канала (опционально)">
                      <Select
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        loading={channelAccountsLoading}
                        options={channelIdOptions}
                        placeholder={selectedChannel === 'email' ? 'Для Email не требуется' : 'Выберите подключённый аккаунт канала'}
                      />
                    </Form.Item>
                    <Form.Item name="recipient" label="Получатель" rules={[{ required: true, message: 'Введите получателя' }]}>
                      <Input placeholder="Email / phone / chat_id / recipient_id" />
                    </Form.Item>
                    <Form.Item name="subject" label="Тема (для email)">
                      <Input placeholder="Тема письма" />
                    </Form.Item>
                    <Form.Item name="text" label="Сообщение" rules={[{ required: true, message: 'Введите текст сообщения' }]}>
                      <TextArea rows={5} placeholder="Текст сообщения" />
                    </Form.Item>
                    <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={sending}>
                      Отправить
                    </Button>
                  </Space>
                </Form>
              </Card>
            ),
          },
          {
            key: 'crm-emails',
            label: 'CRM Emails',
            children: (
              <Card>
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={crmEmails}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Тема', dataIndex: 'subject', key: 'subject', render: (value) => value || '-' },
                    { title: 'От', dataIndex: 'from_field', key: 'from_field', render: (value) => value || '-' },
                    { title: 'Кому', dataIndex: 'to', key: 'to', render: (value) => value || '-' },
                    { title: 'Статус', dataIndex: 'sent', key: 'sent', render: (value) => (value ? <Tag color="success">Отправлено</Tag> : <Tag>Черновик</Tag>) },
                    { title: 'Создано', dataIndex: 'creation_date', key: 'creation_date', render: (value) => (value ? new Date(value).toLocaleString('ru-RU') : '-') },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'massmail',
            label: 'Массовые рассылки',
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Card>
                  <Space size={12} wrap>
                    <Tag color="processing">Всего сообщений: {statusSummary.total}</Tag>
                    <Tag color="success">Отправлено: {statusSummary.sent}</Tag>
                    <Tag color={statusSummary.failed ? 'error' : 'default'}>Ошибок: {statusSummary.failed}</Tag>
                  </Space>
                </Card>
                <Card>
                  <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={mailings}
                    pagination={{ pageSize: 10, hideOnSinglePage: true }}
                    columns={[
                      { title: 'Рассылка', dataIndex: 'name', key: 'name', render: (value) => value || '-' },
                      { title: 'Статус', dataIndex: 'status', key: 'status', render: (value) => <Tag>{value || '-'}</Tag> },
                      { title: 'Дата отправки', dataIndex: 'sending_date', key: 'sending_date', render: (value) => (value ? new Date(value).toLocaleString('ru-RU') : '-') },
                      { title: 'Получателей', dataIndex: 'recipients_number', key: 'recipients_number', render: (value) => value ?? '-' },
                    ]}
                  />
                </Card>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  );
}
