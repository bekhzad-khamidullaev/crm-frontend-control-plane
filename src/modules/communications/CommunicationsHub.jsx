import {
  App,
  AutoComplete,
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Segmented,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { ReloadOutlined, SendOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sendOmnichannelMessage } from '../../lib/api/compliance.js';
import { getContacts } from '../../lib/api/client.js';
import { createCrmEmail, getCrmEmails } from '../../lib/api/emails.js';
import { getFacebookPages } from '../../lib/api/integrations/facebook.js';
import { getInstagramAccounts } from '../../lib/api/integrations/instagram.js';
import { getTelegramBots, getTelegramUserAccounts } from '../../lib/api/integrations/telegram.js';
import { getWhatsAppAccounts } from '../../lib/api/integrations/whatsapp.js';
import {
  createMessage,
  getEmailAccounts,
  getMailings,
  getMessages,
} from '../../lib/api/massmail.js';
import smsApi from '../../lib/api/sms.js';
import { t } from '../../lib/i18n/index.js';
import ChannelBrandIcon from '../../components/channel/ChannelBrandIcon.jsx';

const { TextArea } = Input;
const { Text, Title } = Typography;

const CHANNEL_LABELS = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  instagram: 'Instagram',
  facebook: 'Facebook',
  sms: 'SMS',
};

const CHANNEL_OPTIONS = Object.entries(CHANNEL_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function renderChannelOptionContent(option) {
  const value = String(option?.value || '').trim().toLowerCase();
  const label =
    CHANNEL_LABELS[value] ||
    value ||
    String(option?.label || '').trim() ||
    'Channel';
  return (
    <Space size={8}>
      <ChannelBrandIcon channel={value || 'chat'} />
      <span>{label}</span>
    </Space>
  );
}

const OMNICHANNEL_TARGET_META = {
  whatsapp: {
    placeholderKey: 'communicationsHub.omnichannel.placeholders.targetWhatsApp',
    fallbackPlaceholder: 'Номер WhatsApp (например +998901234567)',
  },
  sms: {
    placeholderKey: 'communicationsHub.omnichannel.placeholders.targetSms',
    fallbackPlaceholder: 'Номер телефона (например +998901234567)',
  },
  telegram: {
    placeholderKey: 'communicationsHub.omnichannel.placeholders.targetTelegram',
    fallbackPlaceholder: '@username или chat_id',
  },
  instagram: {
    placeholderKey: 'communicationsHub.omnichannel.placeholders.targetInstagram',
    fallbackPlaceholder: '@username или recipient_id',
  },
  facebook: {
    placeholderKey: 'communicationsHub.omnichannel.placeholders.targetFacebook',
    fallbackPlaceholder: 'PSID / recipient_id',
  },
};

function isContactLockedTargetChannel(channel) {
  const normalizedChannel = String(channel || '')
    .trim()
    .toLowerCase();
  return (
    normalizedChannel === 'whatsapp' ||
    normalizedChannel === 'sms' ||
    normalizedChannel === 'instagram' ||
    normalizedChannel === 'facebook'
  );
}

function firstNonEmpty(values = []) {
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (normalized) return normalized;
  }
  return '';
}

function normalizePhone(raw) {
  return String(raw || '')
    .replace(/\s+/g, '')
    .trim();
}

function resolveContactChannelTarget(contact, channel) {
  if (!contact) return '';
  const normalizedChannel = String(channel || '')
    .trim()
    .toLowerCase();
  const phone = firstNonEmpty([
    normalizePhone(contact?.mobile_e164),
    normalizePhone(contact?.phone_e164),
    normalizePhone(contact?.mobile),
    normalizePhone(contact?.phone),
    normalizePhone(contact?.other_phone),
  ]);
  const telegramUsername = String(contact?.telegram_username || '')
    .trim()
    .replace(/^@/, '');
  const telegramChatId = String(contact?.telegram_chat_id || '')
    .trim()
    .replace(/^tg_/, '');
  const instagramUsername = String(contact?.instagram_username || '')
    .trim()
    .replace(/^@/, '');
  const instagramRecipientId = String(contact?.instagram_recipient_id || '').trim();
  const facebookPsid = String(contact?.facebook_psid || '').trim();

  if (normalizedChannel === 'whatsapp' || normalizedChannel === 'sms') {
    return phone;
  }
  if (normalizedChannel === 'telegram' || normalizedChannel === 'telegram_user') {
    if (telegramUsername) return `@${telegramUsername}`;
    if (telegramChatId) return telegramChatId;
    return phone;
  }
  if (normalizedChannel === 'instagram') {
    if (instagramUsername) return `@${instagramUsername}`;
    return instagramRecipientId;
  }
  if (normalizedChannel === 'facebook') {
    return firstNonEmpty([
      facebookPsid,
      contact?.facebook_psid,
      contact?.facebook_id,
      contact?.facebook_recipient_id,
    ]);
  }
  return '';
}

function normalizeList(response) {
  if (Array.isArray(response?.results)) return response.results;
  return Array.isArray(response) ? response : [];
}

export default function CommunicationsHub({
  defaultTab = 'omnichannel',
  allowedTabs = null,
  showHeader = false,
  title = t('communicationsHub.header.title'),
  subtitle = t('communicationsHub.header.subtitle'),
}) {
  const { message } = App.useApp();
  const [omniForm] = Form.useForm();
  const [crmEmailForm] = Form.useForm();
  const [massmailForm] = Form.useForm();
  const [massmailDispatchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingCrmEmail, setCreatingCrmEmail] = useState(false);
  const [creatingMassmailMessage, setCreatingMassmailMessage] = useState(false);
  const [dispatchingMassmail, setDispatchingMassmail] = useState(false);
  const [crmEmails, setCrmEmails] = useState([]);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [mailings, setMailings] = useState([]);
  const [massmailMessages, setMassmailMessages] = useState([]);
  const [massmailListMode, setMassmailListMode] = useState('messages');
  const [draftPreview, setDraftPreview] = useState(null);
  const [isDraftPreviewOpen, setIsDraftPreviewOpen] = useState(false);
  const [channelAccounts, setChannelAccounts] = useState({
    whatsapp: [],
    telegram: [],
    instagram: [],
    facebook: [],
    sms: [],
  });
  const [channelAccountsLoading, setChannelAccountsLoading] = useState(false);
  const createMessageRef = useRef(null);
  const sendNowRef = useRef(null);
  const lastOmniTargetAutofillRef = useRef('');
  const selectedOmnichannel = Form.useWatch('channel', omniForm);
  const selectedOmnichannelContactId = Form.useWatch('contact_id', omniForm);

  const loadOmnichannelAccounts = useCallback(async () => {
    setChannelAccountsLoading(true);
    try {
      const [whatsAppRes, telegramBotsRes, telegramUsersRes, instagramRes, facebookRes, smsRes] =
        await Promise.allSettled([
          getWhatsAppAccounts({ page_size: 200 }),
          getTelegramBots({ page_size: 200 }),
          getTelegramUserAccounts({ page_size: 200 }),
          getInstagramAccounts({ page_size: 200 }),
          getFacebookPages({ page_size: 200 }),
          smsApi.providers(),
        ]);

      const valueOrEmpty = (result) =>
        result?.status === 'fulfilled' ? normalizeList(result.value) : [];
      setChannelAccounts({
        whatsapp: valueOrEmpty(whatsAppRes),
        telegram: [...valueOrEmpty(telegramBotsRes), ...valueOrEmpty(telegramUsersRes)],
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
      const [emailsRes, emailAccountsRes, contactsRes, mailingsRes, messagesRes] =
        await Promise.all([
          getCrmEmails({ page_size: 100, ordering: '-creation_date' }),
          getEmailAccounts({ page_size: 100, ordering: 'name' }),
          getContacts({ page_size: 1000, ordering: 'full_name' }),
          getMailings({ page_size: 100, ordering: '-sending_date' }),
          getMessages({ page_size: 100, ordering: '-update_date' }),
        ]);
      setCrmEmails(normalizeList(emailsRes));
      setEmailAccounts(normalizeList(emailAccountsRes));
      setContacts(normalizeList(contactsRes));
      setMailings(normalizeList(mailingsRes));
      setMassmailMessages(normalizeList(messagesRes));
      await loadOmnichannelAccounts();
    } catch (error) {
      message.error(error?.message || t('communicationsHub.messages.loadError'));
      setCrmEmails([]);
      setEmailAccounts([]);
      setContacts([]);
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

  const handleOmnichannelSend = async () => {
    try {
      const values = await omniForm.validateFields();
      const channel = String(values.channel || '')
        .trim()
        .toLowerCase();
      const selectedContact =
        omnichannelContactsById.get(String(values.contact_id || '')) || null;
      const contactResolvedTarget = resolveContactChannelTarget(selectedContact, channel);
      const target = String(
        isContactLockedTargetChannel(channel) ? contactResolvedTarget : values.target_id || ''
      ).trim();
      if (!target) {
        message.error(
          t(
            isContactLockedTargetChannel(channel)
              ? 'communicationsHub.omnichannel.validation.contactChannelTargetRequired'
              : 'communicationsHub.omnichannel.validation.targetRequired'
          )
        );
        return;
      }
      setSending(true);

      const payload = {
        channel,
        channel_id: values.channel_id,
        text: values.text,
        contact_id: values.contact_id,
      };
      if (channel === 'telegram' || channel === 'telegram_user') {
        if (target.startsWith('@')) {
          payload.username = target.replace(/^@/, '');
        } else {
          payload.chat_id = target;
          payload.sender_id = target;
        }
      } else if (channel === 'whatsapp') {
        payload.to = target;
      } else if (channel === 'instagram') {
        if (target.startsWith('@')) {
          payload.handle = target.replace(/^@/, '');
        } else {
          payload.recipient_id = target;
        }
      } else {
        payload.recipient_id = target;
      }
      await sendOmnichannelMessage(payload);

      message.success(t('communicationsHub.messages.omnichannelSent'));
      omniForm.resetFields();
      lastOmniTargetAutofillRef.current = '';
      await loadData();
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.message || t('communicationsHub.messages.omnichannelSendError'));
      }
    } finally {
      setSending(false);
    }
  };

  const handleCreateCrmEmail = async () => {
    try {
      const values = await crmEmailForm.validateFields();
      setCreatingCrmEmail(true);
      await createCrmEmail({
        subject: values.subject,
        content: values.content,
        to: values.to,
        to_email: values.to,
        from_field: values.from_field || undefined,
        incoming: false,
        sent: true,
        direction: 'outgoing',
      });
      message.success(t('communicationsHub.messages.crmEmailCreated'));
      crmEmailForm.resetFields();
      await loadData();
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.message || t('communicationsHub.messages.crmEmailCreateError'));
      }
    } finally {
      setCreatingCrmEmail(false);
    }
  };

  const handleCreateMassmailMessage = async () => {
    try {
      const values = await massmailForm.validateFields();
      setCreatingMassmailMessage(true);
      const created = await createMessage({
        subject: values.subject,
        content: values.content,
      });
      const createdMessage = {
        ...(created || {}),
        id: created?.id ?? `draft-${Date.now()}`,
        subject: created?.subject || values.subject || '',
        content: created?.content || values.content || '',
        status: created?.status || 'draft',
        update_date: created?.update_date || new Date().toISOString(),
      };
      setMassmailMessages((prev) => [
        createdMessage,
        ...prev.filter((item) => String(item.id) !== String(createdMessage.id)),
      ]);
      message.success(t('communicationsHub.messages.massmailMessageCreated'));
      massmailForm.resetFields();
      massmailDispatchForm.setFieldsValue({
        template_id: String(createdMessage.id),
        subject: values.subject || '',
        content_preview: values.content || '',
      });
      await loadData();
      setMassmailListMode('messages');
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.message || t('communicationsHub.messages.massmailMessageCreateError'));
      }
    } finally {
      setCreatingMassmailMessage(false);
    }
  };

  const handleMassmailDispatchTemplateSelect = (templateId) => {
    const template = massmailMessages.find((item) => String(item.id) === String(templateId));
    if (!template) return;
    massmailDispatchForm.setFieldsValue({
      subject: template.subject || '',
      content_preview: template.content || '',
    });
  };

  const extractEmailsFromRecipients = (rawRecipients) => {
    const rawList = Array.isArray(rawRecipients)
      ? rawRecipients
      : String(rawRecipients || '').split(/[\n,;]+/);

    const emails = rawList
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .map((item) => {
        const match = item.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
        return match ? match[1].toLowerCase() : '';
      })
      .filter(Boolean);

    return Array.from(new Set(emails));
  };

  const handleDispatchMassmail = async () => {
    try {
      const values = await massmailDispatchForm.validateFields();
      const template = massmailMessages.find(
        (item) => String(item.id) === String(values.template_id)
      );
      if (!template) {
        message.error(t('communicationsHub.massmail.sendNow.validation.templateNotFound'));
        return;
      }

      const uniqueRecipients = extractEmailsFromRecipients(values.recipients);
      if (uniqueRecipients.length === 0) {
        message.error(t('communicationsHub.massmail.sendNow.validation.recipientsRequired'));
        return;
      }

      setDispatchingMassmail(true);
      const result = await Promise.allSettled(
        uniqueRecipients.map((email) =>
          createCrmEmail({
            subject: values.subject,
            content: template.content || '',
            to: email,
            to_email: email,
            from_field: values.from_field || undefined,
            incoming: false,
            sent: true,
            direction: 'outgoing',
          })
        )
      );
      const successCount = result.filter((item) => item.status === 'fulfilled').length;
      const failedCount = result.length - successCount;

      if (successCount > 0) {
        message.success(
          t('communicationsHub.messages.massmailDispatched', { count: successCount })
        );
      }
      if (failedCount > 0) {
        message.warning(
          t('communicationsHub.messages.massmailDispatchPartial', { count: failedCount })
        );
      }

      massmailDispatchForm.setFieldsValue({ recipients: [] });
      await loadData();
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.message || t('communicationsHub.messages.massmailDispatchError'));
      }
    } finally {
      setDispatchingMassmail(false);
    }
  };

  const isDraftMessage = (item) => {
    const value = String(item?.status || '').toLowerCase();
    return !value || value === 'draft' || value === 'pending';
  };

  const handleOpenDraftPreview = (item) => {
    setDraftPreview(item);
    setIsDraftPreviewOpen(true);
  };

  const handleSendDraftInline = (item) => {
    massmailDispatchForm.setFieldsValue({
      template_id: String(item?.id || ''),
      subject: item?.subject || '',
      content_preview: item?.content || '',
    });
    setIsDraftPreviewOpen(false);
    sendNowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    message.success(t('communicationsHub.messages.massmailDraftReadyForSend'));
  };

  const handleDuplicateDraftInline = (item) => {
    const baseSubject = String(item?.subject || '').trim();
    const duplicatedSubject = baseSubject
      ? `${baseSubject} (${t('communicationsHub.massmail.table.messages.actions.copySuffix')})`
      : t('communicationsHub.massmail.table.messages.actions.copyDefaultTitle');
    massmailForm.setFieldsValue({
      subject: duplicatedSubject,
      content: item?.content || '',
    });
    createMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    message.success(t('communicationsHub.messages.massmailDraftDuplicated'));
  };

  const crmEmailSummary = useMemo(() => {
    const sent = crmEmails.filter((item) => item.sent).length;
    const drafts = crmEmails.length - sent;
    return { total: crmEmails.length, sent, drafts };
  }, [crmEmails]);

  const fromFieldOptions = useMemo(() => {
    const fromCrmEmails = crmEmails
      .map((item) => String(item.from_field || '').trim())
      .filter(Boolean);
    const fromAccounts = emailAccounts
      .map((item) => String(item.from_email || item.email_host_user || '').trim())
      .filter(Boolean);
    const unique = Array.from(new Set([...fromCrmEmails, ...fromAccounts]));
    return unique.map((value) => ({ value }));
  }, [crmEmails, emailAccounts]);

  const crmEmailTemplateOptions = useMemo(
    () =>
      massmailMessages.map((item) => ({
        value: String(item.id),
        label:
          item.subject?.trim() ||
          t('communicationsHub.crmEmails.create.template.defaultTitle', { id: item.id }),
      })),
    [massmailMessages]
  );

  const contactRecipientOptions = useMemo(() => {
    const byEmail = new Map();
    contacts.forEach((contact) => {
      const email = String(contact?.email || '')
        .trim()
        .toLowerCase();
      if (!email) return;
      const name = String(contact?.full_name || '').trim();
      byEmail.set(email, name ? `${name} <${email}>` : email);
    });
    return Array.from(byEmail.entries()).map(([value, label]) => ({ value, label }));
  }, [contacts]);

  const omnichannelContactsById = useMemo(() => {
    const byId = new Map();
    contacts.forEach((contact) => {
      if (contact?.id == null) return;
      byId.set(String(contact.id), contact);
    });
    return byId;
  }, [contacts]);

  const omnichannelContactOptions = useMemo(
    () =>
      contacts
        .map((contact) => {
          if (contact?.id == null) return null;
          const displayName = firstNonEmpty([
            contact?.full_name,
            [contact?.first_name, contact?.last_name].filter(Boolean).join(' '),
            contact?.email,
            `#${contact?.id}`,
          ]);
          const summaryParts = [
            contact?.mobile && `📱 ${contact.mobile}`,
            !contact?.mobile && contact?.phone && `☎ ${contact.phone}`,
            contact?.email && `✉ ${contact.email}`,
            contact?.telegram_username &&
              `TG @${String(contact.telegram_username).replace(/^@/, '')}`,
            contact?.instagram_username &&
              `IG @${String(contact.instagram_username).replace(/^@/, '')}`,
          ].filter(Boolean);
          const summary = summaryParts.slice(0, 3).join(' • ');
          return {
            value: String(contact.id),
            label: summary ? `${displayName} • ${summary}` : displayName,
            searchText:
              `${displayName} ${summary} ${contact?.phone || ''} ${contact?.mobile || ''} ${contact?.email || ''}`.toLowerCase(),
          };
        })
        .filter(Boolean),
    [contacts]
  );

  const selectedOmnichannelContact = useMemo(
    () => omnichannelContactsById.get(String(selectedOmnichannelContactId || '')) || null,
    [omnichannelContactsById, selectedOmnichannelContactId]
  );

  const selectedOmnichannelContactFields = useMemo(() => {
    if (!selectedOmnichannelContact) return [];
    return [
      {
        key: 'phone',
        label: t('communicationsHub.omnichannel.contact.fields.phone'),
        value: selectedOmnichannelContact.phone,
      },
      {
        key: 'phone_e164',
        label: t('communicationsHub.omnichannel.contact.fields.phoneE164'),
        value: selectedOmnichannelContact.phone_e164,
      },
      {
        key: 'mobile',
        label: t('communicationsHub.omnichannel.contact.fields.mobile'),
        value: selectedOmnichannelContact.mobile,
      },
      {
        key: 'mobile_e164',
        label: t('communicationsHub.omnichannel.contact.fields.mobileE164'),
        value: selectedOmnichannelContact.mobile_e164,
      },
      {
        key: 'other_phone',
        label: t('communicationsHub.omnichannel.contact.fields.otherPhone'),
        value: selectedOmnichannelContact.other_phone,
      },
      {
        key: 'email',
        label: t('communicationsHub.omnichannel.contact.fields.email'),
        value: selectedOmnichannelContact.email,
      },
      {
        key: 'telegram_username',
        label: t('communicationsHub.omnichannel.contact.fields.telegram'),
        value: selectedOmnichannelContact.telegram_username
          ? `@${String(selectedOmnichannelContact.telegram_username).replace(/^@/, '')}`
          : '',
      },
      {
        key: 'telegram_chat_id',
        label: t('communicationsHub.omnichannel.contact.fields.telegramChatId'),
        value: selectedOmnichannelContact.telegram_chat_id,
      },
      {
        key: 'instagram_username',
        label: t('communicationsHub.omnichannel.contact.fields.instagram'),
        value: selectedOmnichannelContact.instagram_username
          ? `@${String(selectedOmnichannelContact.instagram_username).replace(/^@/, '')}`
          : '',
      },
      {
        key: 'instagram_recipient_id',
        label: t('communicationsHub.omnichannel.contact.fields.instagramRecipientId'),
        value: selectedOmnichannelContact.instagram_recipient_id,
      },
      {
        key: 'facebook_psid',
        label: t('communicationsHub.omnichannel.contact.fields.facebookPsid'),
        value: selectedOmnichannelContact.facebook_psid,
      },
    ].filter((field) => String(field.value || '').trim());
  }, [selectedOmnichannelContact]);

  const omnichannelTargetMeta =
    OMNICHANNEL_TARGET_META[selectedOmnichannel] || OMNICHANNEL_TARGET_META.whatsapp;
  const selectedOmnichannelLabel =
    CHANNEL_LABELS[String(selectedOmnichannel || '').trim().toLowerCase()] ||
    t('communicationsHub.omnichannel.fields.channel');
  const omnichannelTitleLabel = `${t(
    'communicationsHub.omnichannel.title'
  )} • ${selectedOmnichannelLabel}`;
  const omnichannelChannelAccountLabel = `${t(
    'communicationsHub.omnichannel.fields.channelId'
  )} (${selectedOmnichannelLabel})`;
  const omnichannelTargetLabel = `${t(
    'communicationsHub.omnichannel.fields.target'
  )} (${selectedOmnichannelLabel})`;
  const isOmnichannelTargetLocked = isContactLockedTargetChannel(selectedOmnichannel);
  const resolvedOmnichannelTarget = resolveContactChannelTarget(
    selectedOmnichannelContact,
    selectedOmnichannel
  );
  const hasResolvedOmnichannelTarget = Boolean(String(resolvedOmnichannelTarget || '').trim());

  const omnichannelChannelIdOptions = useMemo(() => {
    const accountLabelByType = {
      whatsapp: (item) =>
        item?.business_name ||
        item?.name ||
        item?.phone_number ||
        item?.display_phone_number ||
        'WhatsApp account',
      telegram: (item) =>
        item?.name || item?.bot_username || item?.username || item?.phone || 'Telegram account',
      instagram: (item) =>
        item?.username ? `@${item.username}` : item?.name || 'Instagram account',
      facebook: (item) => item?.page_name || item?.name || 'Facebook page',
      sms: (item) => item?.name || item?.provider || item?.title || 'SMS provider',
    };
    const list = channelAccounts?.[selectedOmnichannel] || [];
    return list
      .map((item) => {
        const rawId =
          item?.id ||
          item?.channel_id ||
          item?.phone_number_id ||
          item?.facebook_page_id ||
          item?.instagram_user_id;
        if (!rawId) return null;
        const externalId =
          item?.channel_id ||
          item?.phone_number_id ||
          item?.facebook_page_id ||
          item?.instagram_user_id;
        const suffix = externalId ? ` • #${externalId}` : '';
        const label = `${accountLabelByType[selectedOmnichannel]?.(item) || 'Account'}${suffix}`;
        return { value: String(rawId), label };
      })
      .filter(Boolean);
  }, [channelAccounts, selectedOmnichannel]);

  useEffect(() => {
    if (!selectedOmnichannel) return;
    const current = omniForm.getFieldValue('channel_id');
    const hasCurrent = omnichannelChannelIdOptions.some(
      (option) => String(option.value) === String(current)
    );
    if (hasCurrent) return;
    if (omnichannelChannelIdOptions.length > 0) {
      omniForm.setFieldValue('channel_id', omnichannelChannelIdOptions[0].value);
    } else {
      omniForm.setFieldValue('channel_id', undefined);
    }
  }, [omniForm, omnichannelChannelIdOptions, selectedOmnichannel]);

  useEffect(() => {
    if (!selectedOmnichannel) return;
    if (!selectedOmnichannelContact) {
      if (isContactLockedTargetChannel(selectedOmnichannel)) {
        omniForm.setFieldValue('target_id', '');
        lastOmniTargetAutofillRef.current = '';
      }
      return;
    }
    const suggestedTarget = resolveContactChannelTarget(
      selectedOmnichannelContact,
      selectedOmnichannel
    );
    const currentTarget = String(omniForm.getFieldValue('target_id') || '').trim();

    if (isContactLockedTargetChannel(selectedOmnichannel)) {
      omniForm.setFieldValue('target_id', suggestedTarget);
      lastOmniTargetAutofillRef.current = suggestedTarget;
      return;
    }

    if (!currentTarget || currentTarget === lastOmniTargetAutofillRef.current) {
      omniForm.setFieldValue('target_id', suggestedTarget);
      lastOmniTargetAutofillRef.current = suggestedTarget;
    }
  }, [omniForm, selectedOmnichannel, selectedOmnichannelContact]);

  const handleCrmTemplateSelect = (templateId) => {
    const template = massmailMessages.find((item) => String(item.id) === String(templateId));
    if (!template) return;
    crmEmailForm.setFieldsValue({
      subject: template.subject || '',
      content: template.content || '',
    });
    message.success(t('communicationsHub.messages.crmTemplateApplied'));
  };

  const massmailSummary = useMemo(() => {
    const failed = massmailMessages.filter(
      (item) => String(item.status || '').toLowerCase() === 'failed'
    ).length;
    const sent = massmailMessages.filter(
      (item) => String(item.status || '').toLowerCase() === 'sent'
    ).length;
    const drafts = massmailMessages.filter((item) => {
      const value = String(item.status || '').toLowerCase();
      return value === 'draft' || value === 'pending' || !value;
    }).length;
    return { failed, sent, total: massmailMessages.length, drafts };
  }, [massmailMessages]);

  const allTabItems = [
    {
      key: 'omnichannel',
      label: t('communicationsHub.tabs.omnichannel'),
      children: (
        <Card size="small" styles={{ body: { padding: 12 } }}>
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Flex justify="space-between" align="center" gap={10} wrap="wrap">
              <Space direction="vertical" size={0}>
                <Title level={5} style={{ margin: 0 }}>
                  {omnichannelTitleLabel}
                </Title>
                <Text type="secondary">{t('communicationsHub.omnichannel.subtitle')}</Text>
              </Space>
              <Button size="small" icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
                {t('communicationsHub.actions.refresh')}
              </Button>
            </Flex>
            <Form layout="vertical" form={omniForm} initialValues={{ channel: 'whatsapp' }}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Form.Item
                  name="channel"
                  label={t('communicationsHub.omnichannel.fields.channel')}
                  rules={[
                    {
                      required: true,
                      message: t('communicationsHub.omnichannel.validation.channelRequired'),
                    },
                  ]}
                >
                  <Select
                    options={CHANNEL_OPTIONS}
                    optionLabelProp="label"
                    optionRender={(option) => renderChannelOptionContent(option?.data)}
                    labelRender={(props) => renderChannelOptionContent(props)}
                  />
                </Form.Item>
                <Form.Item
                  name="channel_id"
                  label={omnichannelChannelAccountLabel}
                  rules={[
                    {
                      required: true,
                      message: t('communicationsHub.omnichannel.validation.channelIdRequired'),
                    },
                  ]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    loading={channelAccountsLoading}
                    options={omnichannelChannelIdOptions}
                    placeholder={t('communicationsHub.omnichannel.placeholders.channelId')}
                    notFoundContent={t('communicationsHub.omnichannel.placeholders.channelId')}
                  />
                </Form.Item>
                <Form.Item
                  name="contact_id"
                  label={t('communicationsHub.omnichannel.fields.contact')}
                  rules={[
                    {
                      required: true,
                      message: t('communicationsHub.omnichannel.validation.contactRequired'),
                    },
                  ]}
                >
                  <Select
                    allowClear
                    showSearch
                    options={omnichannelContactOptions}
                    optionFilterProp="label"
                    placeholder={t('communicationsHub.omnichannel.placeholders.contact')}
                    notFoundContent={t('communicationsHub.omnichannel.placeholders.contact')}
                    filterOption={(input, option) =>
                      String(option?.searchText || option?.label || '')
                        .toLowerCase()
                        .includes(String(input || '').toLowerCase())
                    }
                  />
                </Form.Item>
                {selectedOmnichannelContact && (
                  <Card size="small" styles={{ body: { padding: 10 } }}>
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      <Text strong>{t('communicationsHub.omnichannel.fields.contactDetails')}</Text>
                      <Space wrap size={[6, 6]}>
                        {selectedOmnichannelContactFields.length > 0 ? (
                          selectedOmnichannelContactFields.map((field) => (
                            <Tag key={field.key}>
                              {field.label}: {field.value}
                            </Tag>
                          ))
                        ) : (
                          <Tag>{t('communicationsHub.omnichannel.contact.empty')}</Tag>
                        )}
                      </Space>
                    </Space>
                  </Card>
                )}
                <Form.Item
                  name="target_id"
                  label={omnichannelTargetLabel}
                  extra={t(
                    isOmnichannelTargetLocked
                      ? hasResolvedOmnichannelTarget
                        ? 'communicationsHub.omnichannel.hints.targetAutoFilled'
                        : 'communicationsHub.omnichannel.hints.targetMissingInContact'
                      : 'communicationsHub.omnichannel.hints.targetEditable'
                  )}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const channel = String(getFieldValue('channel') || '')
                          .trim()
                          .toLowerCase();
                        if (isContactLockedTargetChannel(channel)) {
                          const contact =
                            omnichannelContactsById.get(String(getFieldValue('contact_id') || '')) ||
                            null;
                          const autoTarget = resolveContactChannelTarget(contact, channel);
                          if (String(autoTarget || '').trim()) return Promise.resolve();
                          return Promise.reject(
                            new Error(
                              t(
                                'communicationsHub.omnichannel.validation.contactChannelTargetRequired'
                              )
                            )
                          );
                        }
                        if (String(value || '').trim()) return Promise.resolve();
                        return Promise.reject(
                          new Error(t('communicationsHub.omnichannel.validation.targetRequired'))
                        );
                      },
                    }),
                  ]}
                >
                  <Input
                    disabled={isOmnichannelTargetLocked}
                    placeholder={t(
                      omnichannelTargetMeta.placeholderKey,
                      omnichannelTargetMeta.fallbackPlaceholder
                    )}
                  />
                </Form.Item>
                <Form.Item
                  name="text"
                  label={t('communicationsHub.omnichannel.fields.text')}
                  rules={[
                    {
                      required: true,
                      message: t('communicationsHub.omnichannel.validation.textRequired'),
                    },
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder={t('communicationsHub.omnichannel.placeholders.text')}
                  />
                </Form.Item>
                <Button
                  size="small"
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleOmnichannelSend}
                  loading={sending}
                >
                  {t('communicationsHub.omnichannel.actions.send')}
                </Button>
              </Space>
            </Form>
          </Space>
        </Card>
      ),
    },
    {
      key: 'crm-emails',
      label: t('communicationsHub.tabs.crmEmails'),
      children: (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Title level={5} style={{ margin: 0 }}>
                {t('communicationsHub.crmEmails.create.title')}
              </Title>
              <Text type="secondary">{t('communicationsHub.crmEmails.create.subtitle')}</Text>
            </Space>
            <Form layout="vertical" form={crmEmailForm}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Form.Item
                  name="to"
                  label={t('communicationsHub.crmEmails.create.fields.to')}
                  rules={[
                    {
                      required: true,
                      message: t('communicationsHub.crmEmails.create.validation.toRequired'),
                    },
                    {
                      type: 'email',
                      message: t('communicationsHub.crmEmails.create.validation.toInvalid'),
                    },
                  ]}
                >
                  <Input placeholder={t('communicationsHub.crmEmails.create.placeholders.to')} />
                </Form.Item>
                <Form.Item
                  name="subject"
                  label={t('communicationsHub.crmEmails.create.fields.subject')}
                  rules={[
                    {
                      required: true,
                      message: t('communicationsHub.crmEmails.create.validation.subjectRequired'),
                    },
                  ]}
                >
                  <Input
                    placeholder={t('communicationsHub.crmEmails.create.placeholders.subject')}
                  />
                </Form.Item>
                <Form.Item
                  name="template_id"
                  label={t('communicationsHub.crmEmails.create.fields.template')}
                >
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={crmEmailTemplateOptions}
                    onChange={handleCrmTemplateSelect}
                    placeholder={t('communicationsHub.crmEmails.create.placeholders.template')}
                    notFoundContent={t('communicationsHub.crmEmails.create.template.empty')}
                  />
                </Form.Item>
                <Form.Item
                  name="from_field"
                  label={t('communicationsHub.crmEmails.create.fields.from')}
                >
                  <AutoComplete
                    options={fromFieldOptions}
                    filterOption={(inputValue, option) =>
                      String(option?.value || '')
                        .toLowerCase()
                        .includes(String(inputValue || '').toLowerCase())
                    }
                  >
                    <Input
                      placeholder={t('communicationsHub.crmEmails.create.placeholders.from')}
                    />
                  </AutoComplete>
                </Form.Item>
                <Form.Item
                  name="content"
                  label={t('communicationsHub.crmEmails.create.fields.content')}
                  rules={[
                    {
                      required: true,
                      message: t('communicationsHub.crmEmails.create.validation.contentRequired'),
                    },
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder={t('communicationsHub.crmEmails.create.placeholders.content')}
                  />
                </Form.Item>
                <Flex justify="space-between" align="center" wrap="wrap" gap={10}>
                  <Space size={8} wrap>
                    <Tag color="processing">
                      {t('communicationsHub.crmEmails.stats.total', {
                        count: crmEmailSummary.total,
                      })}
                    </Tag>
                    <Tag color="success">
                      {t('communicationsHub.crmEmails.stats.sent', { count: crmEmailSummary.sent })}
                    </Tag>
                    <Tag>
                      {t('communicationsHub.crmEmails.stats.drafts', {
                        count: crmEmailSummary.drafts,
                      })}
                    </Tag>
                  </Space>
                  <Space>
                    <Button size="small" onClick={() => crmEmailForm.resetFields()}>
                      {t('communicationsHub.actions.clear')}
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      icon={<SendOutlined />}
                      loading={creatingCrmEmail}
                      onClick={handleCreateCrmEmail}
                    >
                      {t('communicationsHub.crmEmails.create.actions.send')}
                    </Button>
                  </Space>
                </Flex>
              </Space>
            </Form>
          </Card>

          <Card
            size="small"
            styles={{ body: { padding: 12 } }}
            title={t('communicationsHub.crmEmails.table.title')}
            extra={
              <Button size="small" icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
                {t('communicationsHub.actions.refresh')}
              </Button>
            }
          >
            <Table
              rowKey="id"
              loading={loading}
              dataSource={crmEmails}
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              columns={[
                {
                  title: t('communicationsHub.crmEmails.table.columns.subject'),
                  dataIndex: 'subject',
                  key: 'subject',
                  render: (value) => value || '-',
                },
                {
                  title: t('communicationsHub.crmEmails.table.columns.from'),
                  dataIndex: 'from_field',
                  key: 'from_field',
                  render: (value) => value || '-',
                },
                {
                  title: t('communicationsHub.crmEmails.table.columns.to'),
                  dataIndex: 'to',
                  key: 'to',
                  render: (value) => value || '-',
                },
                {
                  title: t('communicationsHub.crmEmails.table.columns.status'),
                  dataIndex: 'sent',
                  key: 'sent',
                  render: (value) =>
                    value ? (
                      <Tag color="success">
                        {t('communicationsHub.crmEmails.table.status.sent')}
                      </Tag>
                    ) : (
                      <Tag>{t('communicationsHub.crmEmails.table.status.draft')}</Tag>
                    ),
                },
                {
                  title: t('communicationsHub.crmEmails.table.columns.createdAt'),
                  dataIndex: 'creation_date',
                  key: 'creation_date',
                  render: (value) => (value ? new Date(value).toLocaleString('ru-RU') : '-'),
                },
              ]}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'massmail',
      label: t('communicationsHub.tabs.massmail'),
      children: (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div ref={createMessageRef}>
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Title level={5} style={{ margin: 0 }}>
                  {t('communicationsHub.massmail.create.title')}
                </Title>
                <Text type="secondary">{t('communicationsHub.massmail.create.subtitle')}</Text>
              </Space>
              <Form layout="vertical" form={massmailForm}>
                <Space direction="vertical" size={6} style={{ width: '100%', marginTop: 10 }}>
                  <Form.Item
                    name="subject"
                    label={t('communicationsHub.massmail.create.fields.subject')}
                    rules={[
                      {
                        required: true,
                        message: t('communicationsHub.massmail.create.validation.subjectRequired'),
                      },
                    ]}
                  >
                    <Input
                      placeholder={t('communicationsHub.massmail.create.placeholders.subject')}
                    />
                  </Form.Item>
                  <Form.Item
                    name="content"
                    label={t('communicationsHub.massmail.create.fields.content')}
                    rules={[
                      {
                        required: true,
                        message: t('communicationsHub.massmail.create.validation.contentRequired'),
                      },
                    ]}
                  >
                    <TextArea
                      rows={5}
                      placeholder={t('communicationsHub.massmail.create.placeholders.content')}
                    />
                  </Form.Item>
                  <Flex justify="space-between" align="center" wrap="wrap" gap={10}>
                    <Space size={8} wrap>
                      <Tag color="processing">
                        {t('communicationsHub.massmail.stats.total', {
                          count: massmailSummary.total,
                        })}
                      </Tag>
                      <Tag color="success">
                        {t('communicationsHub.massmail.stats.sent', {
                          count: massmailSummary.sent,
                        })}
                      </Tag>
                      <Tag>
                        {t('communicationsHub.massmail.stats.drafts', {
                          count: massmailSummary.drafts,
                        })}
                      </Tag>
                      <Tag color={massmailSummary.failed ? 'error' : 'default'}>
                        {t('communicationsHub.massmail.stats.failed', {
                          count: massmailSummary.failed,
                        })}
                      </Tag>
                    </Space>
                    <Space>
                      <Button size="small" onClick={() => massmailForm.resetFields()}>
                        {t('communicationsHub.actions.clear')}
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        icon={<SendOutlined />}
                        loading={creatingMassmailMessage}
                        onClick={handleCreateMassmailMessage}
                      >
                        {t('communicationsHub.massmail.create.actions.create')}
                      </Button>
                    </Space>
                  </Flex>
                </Space>
              </Form>
            </Card>
          </div>

          <div ref={sendNowRef}>
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Title level={5} style={{ margin: 0 }}>
                  {t('communicationsHub.massmail.sendNow.title')}
                </Title>
                <Text type="secondary">{t('communicationsHub.massmail.sendNow.subtitle')}</Text>
              </Space>
              <Form layout="vertical" form={massmailDispatchForm}>
                <Space direction="vertical" size={6} style={{ width: '100%', marginTop: 10 }}>
                  <Form.Item
                    name="template_id"
                    label={t('communicationsHub.massmail.sendNow.fields.template')}
                    rules={[
                      {
                        required: true,
                        message: t(
                          'communicationsHub.massmail.sendNow.validation.templateRequired'
                        ),
                      },
                    ]}
                  >
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={crmEmailTemplateOptions}
                      onChange={handleMassmailDispatchTemplateSelect}
                      placeholder={t('communicationsHub.massmail.sendNow.placeholders.template')}
                      notFoundContent={t('communicationsHub.massmail.sendNow.emptyTemplates')}
                    />
                  </Form.Item>
                  <Form.Item
                    name="subject"
                    label={t('communicationsHub.massmail.sendNow.fields.subject')}
                    rules={[
                      {
                        required: true,
                        message: t('communicationsHub.massmail.sendNow.validation.subjectRequired'),
                      },
                    ]}
                  >
                    <Input
                      placeholder={t('communicationsHub.massmail.sendNow.placeholders.subject')}
                    />
                  </Form.Item>
                  <Form.Item
                    name="from_field"
                    label={t('communicationsHub.massmail.sendNow.fields.from')}
                  >
                    <AutoComplete
                      options={fromFieldOptions}
                      filterOption={(inputValue, option) =>
                        String(option?.value || '')
                          .toLowerCase()
                          .includes(String(inputValue || '').toLowerCase())
                      }
                    >
                      <Input
                        placeholder={t('communicationsHub.massmail.sendNow.placeholders.from')}
                      />
                    </AutoComplete>
                  </Form.Item>
                  <Form.Item
                    name="recipients"
                    label={t('communicationsHub.massmail.sendNow.fields.recipients')}
                    rules={[
                      {
                        required: true,
                        message: t(
                          'communicationsHub.massmail.sendNow.validation.recipientsRequired'
                        ),
                      },
                    ]}
                  >
                    <Select
                      mode="tags"
                      allowClear
                      showSearch
                      options={contactRecipientOptions}
                      tokenSeparators={[',', ';']}
                      optionFilterProp="label"
                      placeholder={t('communicationsHub.massmail.sendNow.placeholders.recipients')}
                      notFoundContent={t('communicationsHub.massmail.sendNow.emptyContacts')}
                    />
                  </Form.Item>
                  <Form.Item
                    name="content_preview"
                    label={t('communicationsHub.massmail.sendNow.fields.preview')}
                  >
                    <TextArea
                      rows={4}
                      disabled
                      placeholder={t('communicationsHub.massmail.sendNow.placeholders.preview')}
                    />
                  </Form.Item>
                  <Space>
                    <Button size="small" onClick={() => massmailDispatchForm.resetFields()}>
                      {t('communicationsHub.actions.clear')}
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleDispatchMassmail}
                      loading={dispatchingMassmail}
                    >
                      {t('communicationsHub.massmail.sendNow.actions.send')}
                    </Button>
                  </Space>
                </Space>
              </Form>
            </Card>
          </div>

          <Card
            size="small"
            styles={{ body: { padding: 12 } }}
            title={t('communicationsHub.massmail.table.title')}
            extra={
              <Space size={8}>
                <Segmented
                  size="small"
                  value={massmailListMode}
                  onChange={setMassmailListMode}
                  options={[
                    {
                      value: 'messages',
                      label: t('communicationsHub.massmail.table.modes.messages'),
                    },
                    {
                      value: 'mailings',
                      label: t('communicationsHub.massmail.table.modes.mailings'),
                    },
                  ]}
                />
                <Button size="small" icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
                  {t('communicationsHub.actions.refresh')}
                </Button>
              </Space>
            }
          >
            {massmailListMode === 'mailings' ? (
              <Table
                rowKey="id"
                loading={loading}
                dataSource={mailings}
                pagination={{ pageSize: 10, hideOnSinglePage: true }}
                columns={[
                  {
                    title: t('communicationsHub.massmail.table.mailings.columns.name'),
                    dataIndex: 'name',
                    key: 'name',
                    render: (value) => value || '-',
                  },
                  {
                    title: t('communicationsHub.massmail.table.mailings.columns.status'),
                    dataIndex: 'status',
                    key: 'status',
                    render: (value) => <Tag>{value || '-'}</Tag>,
                  },
                  {
                    title: t('communicationsHub.massmail.table.mailings.columns.sendingDate'),
                    dataIndex: 'sending_date',
                    key: 'sending_date',
                    render: (value) => (value ? new Date(value).toLocaleString('ru-RU') : '-'),
                  },
                  {
                    title: t('communicationsHub.massmail.table.mailings.columns.recipients'),
                    dataIndex: 'recipients_number',
                    key: 'recipients_number',
                    render: (value) => value ?? '-',
                  },
                ]}
              />
            ) : (
              <Table
                rowKey="id"
                loading={loading}
                dataSource={massmailMessages}
                pagination={{ pageSize: 10, hideOnSinglePage: true }}
                columns={[
                  {
                    title: t('communicationsHub.massmail.table.messages.columns.subject'),
                    dataIndex: 'subject',
                    key: 'subject',
                    render: (value) => value || '-',
                  },
                  {
                    title: t('communicationsHub.massmail.table.messages.columns.content'),
                    dataIndex: 'content',
                    key: 'content',
                    ellipsis: true,
                    render: (value) => value || '-',
                  },
                  {
                    title: t('communicationsHub.massmail.table.messages.columns.status'),
                    dataIndex: 'status',
                    key: 'status',
                    render: (value) => (
                      <Tag>
                        {value || t('communicationsHub.massmail.table.messages.status.draft')}
                      </Tag>
                    ),
                  },
                  {
                    title: t('communicationsHub.massmail.table.messages.columns.updatedAt'),
                    dataIndex: 'update_date',
                    key: 'update_date',
                    render: (value) => (value ? new Date(value).toLocaleString('ru-RU') : '-'),
                  },
                  {
                    title: t('communicationsHub.massmail.table.messages.columns.actions'),
                    key: 'actions',
                    render: (_, record) => (
                      <Space size={4} wrap>
                        <Button
                          size="small"
                          type="link"
                          onClick={() => handleOpenDraftPreview(record)}
                        >
                          {t('communicationsHub.massmail.table.messages.actions.view')}
                        </Button>
                        {isDraftMessage(record) ? (
                          <Button
                            size="small"
                            type="link"
                            icon={<SendOutlined />}
                            onClick={() => handleSendDraftInline(record)}
                          >
                            {t('communicationsHub.massmail.table.messages.actions.send')}
                          </Button>
                        ) : null}
                        <Button
                          size="small"
                          type="link"
                          onClick={() => handleDuplicateDraftInline(record)}
                        >
                          {t('communicationsHub.massmail.table.messages.actions.duplicate')}
                        </Button>
                      </Space>
                    ),
                  },
                ]}
              />
            )}
          </Card>
        </Space>
      ),
    },
  ];

  const filteredTabItems =
    Array.isArray(allowedTabs) && allowedTabs.length > 0
      ? allTabItems.filter((item) => allowedTabs.includes(item.key))
      : allTabItems;
  const resolvedDefaultTab = filteredTabItems.some((item) => item.key === defaultTab)
    ? defaultTab
    : filteredTabItems[0]?.key;
  const hasSingleTab = filteredTabItems.length === 1;
  const singleTabContent = filteredTabItems[0]?.children || null;

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {showHeader ? (
        <Card size="small" styles={{ body: { padding: 12 } }}>
          <Flex justify="space-between" align="flex-start" gap={10} wrap="wrap">
            <Space direction="vertical" size={2} style={{ minWidth: 0 }}>
              <Title level={4} style={{ margin: 0 }}>
                {title}
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {subtitle}
              </Text>
            </Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              {t('communicationsHub.actions.refresh')}
            </Button>
          </Flex>
        </Card>
      ) : null}

      {filteredTabItems.length === 0 ? (
        <Card size="small" styles={{ body: { padding: 12 } }}>
          <Empty description={t('communicationsHub.messages.emptyTabs')} />
        </Card>
      ) : hasSingleTab ? (
        singleTabContent
      ) : (
        <Tabs defaultActiveKey={resolvedDefaultTab} items={filteredTabItems} />
      )}

      <Modal
        open={isDraftPreviewOpen}
        onCancel={() => setIsDraftPreviewOpen(false)}
        title={t('communicationsHub.massmail.table.messages.preview.title')}
        footer={
          <Space>
            <Button size="small" onClick={() => setIsDraftPreviewOpen(false)}>
              {t('communicationsHub.massmail.table.messages.preview.close')}
            </Button>
            {isDraftMessage(draftPreview) ? (
              <Button
                size="small"
                type="primary"
                icon={<SendOutlined />}
                onClick={() => handleSendDraftInline(draftPreview)}
              >
                {t('communicationsHub.massmail.table.messages.actions.send')}
              </Button>
            ) : null}
          </Space>
        }
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text strong>{t('communicationsHub.massmail.table.messages.preview.subject')}</Text>
          <Text>{draftPreview?.subject || '-'}</Text>
          <Text strong>{t('communicationsHub.massmail.table.messages.preview.status')}</Text>
          <Text>
            {draftPreview?.status || t('communicationsHub.massmail.table.messages.status.draft')}
          </Text>
          <Text strong>{t('communicationsHub.massmail.table.messages.preview.updatedAt')}</Text>
          <Text>
            {draftPreview?.update_date
              ? new Date(draftPreview.update_date).toLocaleString('ru-RU')
              : '-'}
          </Text>
          <Text strong>{t('communicationsHub.massmail.table.messages.preview.content')}</Text>
          <TextArea rows={8} value={draftPreview?.content || ''} readOnly />
        </Space>
      </Modal>
    </Space>
  );
}
