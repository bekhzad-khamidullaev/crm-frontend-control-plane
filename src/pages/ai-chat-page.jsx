import { RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { App, Avatar, Button, Card, Empty, Input, Select, Space, Spin, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { getAIAssistProviders, runAIAssist } from '../lib/api/integrations/ai.js';
import { getLocale, t } from '../lib/i18n/index.js';
import { useTheme } from '../lib/hooks/useTheme.js';
import { hasAnyFeature } from '../lib/rbac.js';
import { getFeatureRestrictionReason } from '../lib/api/licenseRestrictionState.js';
import LicenseRestrictedAction from '../components/LicenseRestrictedAction.jsx';

const { Text } = Typography;
const { TextArea } = Input;

const idsEqual = (left, right) => String(left) === String(right);
const normalizeOptionValue = (value, options = []) => {
  const matched = options.find((option) => idsEqual(option?.value, value));
  return matched ? matched.value : value;
};

const AI_CHAT_COPY = {
  ru: {
    defaultProviderLabel: 'По умолчанию',
    defaultProviderHint: 'Используется AI провайдер по умолчанию',
    suggestedPrompt:
      'Дай краткий обзор по {entityType} #{entityId}: ключевые риски и следующие шаги.',
    emptyDescription:
      'Спросите AI про отчеты, статистику, лиды, сделки и задачи в рамках ваших прав',
    placeholder: 'Например: Покажи краткий срез по моим активным сделкам и рискам на эту неделю',
    sendLabel: 'Отправить',
    loadingLabel: 'AI анализирует контекст CRM...',
    validationPrefix: 'Проверьте запрос:',
    validationFallback:
      'Не удалось отправить запрос AI. Проверьте введенные данные и попробуйте еще раз.',
    genericError: 'Не удалось получить ответ от AI',
    errorPrefix: 'Ошибка',
    contextLabel: 'Контекст',
    responseFallback: 'Не удалось получить ответ.',
    crmNoDataReply:
      'Недостаточно данных в CRM для точного ответа. Уточните сущность, период или фильтры.',
  },
  uz: {
    defaultProviderLabel: 'Sukut bo‘yicha',
    defaultProviderHint: 'Sukut bo‘yicha AI provayder ishlatiladi',
    suggestedPrompt:
      '{entityType} #{entityId} bo‘yicha qisqa sharh bering: asosiy risklar va keyingi qadamlar.',
    emptyDescription:
      'Ruxsatlaringiz doirasida AI’dan hisobotlar, statistika, lidlar, bitimlar va vazifalar haqida so‘rang',
    placeholder:
      'Masalan: Mening faol bitimlarim va bu haftadagi risklar bo‘yicha qisqa ko‘rinishni ko‘rsat',
    sendLabel: 'Yuborish',
    loadingLabel: 'AI CRM kontekstini tahlil qilmoqda...',
    validationPrefix: 'So‘rovni tekshiring:',
    validationFallback:
      'AI so‘rovini yuborib bo‘lmadi. Kiritilgan ma’lumotlarni tekshirib qayta urinib ko‘ring.',
    genericError: 'AI javobi olinmadi',
    errorPrefix: 'Xato',
    contextLabel: 'Kontekst',
    responseFallback: 'Javobni olib bo‘lmadi.',
    crmNoDataReply:
      'Aniq javob uchun CRMda ma’lumot yetarli emas. Iltimos, obyekt, davr yoki filtrlarga aniqlik kiriting.',
  },
  en: {
    defaultProviderLabel: 'Default',
    defaultProviderHint: 'The default AI provider will be used',
    suggestedPrompt: 'Give a short overview of {entityType} #{entityId}: key risks and next steps.',
    emptyDescription:
      'Ask AI about reports, statistics, leads, deals, and tasks within your permissions',
    placeholder: 'For example: Show a short summary of my active deals and risks for this week',
    sendLabel: 'Send',
    loadingLabel: 'AI is analyzing the CRM context...',
    validationPrefix: 'Check the request:',
    validationFallback:
      'The AI request could not be validated. Please check the fields and try again.',
    genericError: 'Could not get a response from AI',
    errorPrefix: 'Error',
    contextLabel: 'Context',
    responseFallback: 'Could not get a response.',
    crmNoDataReply:
      'Not enough CRM data for an accurate answer. Please clarify entity, period, or filters.',
  },
};

const getChatCopy = (locale) => {
  const normalized = String(locale || 'ru').toLowerCase();
  if (normalized.startsWith('uz')) return AI_CHAT_COPY.uz;
  if (normalized.startsWith('en')) return AI_CHAT_COPY.en;
  return AI_CHAT_COPY.ru;
};

const detectMessageLanguage = (text, localeFallback = 'ru') => {
  const value = String(text || '').trim();
  if (!value) return localeFallback;
  if (/[а-яё]/i.test(value)) return 'ru';
  if (/[o‘’`ʻğçşḥq]/i.test(value) || /\b(iltimos|bo'yicha|bo‘yicha|ma'lumot|ma’lumot)\b/i.test(value))
    return 'uz';
  if (/[a-z]/i.test(value)) return 'en';
  return localeFallback;
};

const getCopyByLanguage = (lang) => {
  if (String(lang).startsWith('uz')) return AI_CHAT_COPY.uz;
  if (String(lang).startsWith('en')) return AI_CHAT_COPY.en;
  return AI_CHAT_COPY.ru;
};

const collectValidationMessages = (value, path = [], acc = [], seen = new Set()) => {
  if (value === null || value === undefined) return acc;

  if (typeof value === 'string') {
    const text = value.trim();
    if (!text || /^validation failed$/i.test(text) || /^http\s+\d+/i.test(text)) return acc;
    const finalText = path.length ? `${path.join('.')} — ${text}` : text;
    if (!seen.has(finalText)) {
      seen.add(finalText);
      acc.push(finalText);
    }
    return acc;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectValidationMessages(item, path, acc, seen));
    return acc;
  }

  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (nested === null || nested === undefined) continue;
      if (key === 'detail' || key === 'message' || key === 'error') {
        collectValidationMessages(nested, path, acc, seen);
        continue;
      }
      if (key === 'non_field_errors' || key === 'errors') {
        collectValidationMessages(nested, path, acc, seen);
        continue;
      }
      collectValidationMessages(nested, [...path, key], acc, seen);
    }
  }

  return acc;
};

const formatAiErrorMessage = (error, copy) => {
  const details = error?.details || error?.body || error?.response?.data || null;
  const validationMessages = collectValidationMessages(details);
  if (validationMessages.length) {
    return `${copy.validationPrefix} ${validationMessages.join('; ')}`;
  }

  const status = Number(error?.status || error?.response?.status || 0);
  const message = String(error?.message || '').trim();
  if (
    status === 400 ||
    status === 422 ||
    /^http\s+4\d\d/i.test(message) ||
    /validation failed/i.test(message)
  ) {
    return copy.validationFallback;
  }

  if (message && !/^http\s+\d+/i.test(message)) {
    return message;
  }

  return copy.genericError;
};

const normalizeAssistantOutput = (output, copy) => {
  const text = String(output || '').trim();
  if (!text) return copy.responseFallback;

  if (
    /^validation failed$/i.test(text) ||
    /^http\s+4\d\d/i.test(text) ||
    /^[a-zа-яё\u0400-\u04ff'‘’`]+:\s*validation failed$/i.test(text) ||
    /validation failed/i.test(text)
  ) {
    return copy.validationFallback;
  }

  return text;
};

const getErrorDiagnostics = (error) => {
  const details = error?.details || error?.body || error?.response?.data || null;
  const messages = collectValidationMessages(details).map((item) => item.toLowerCase());
  const rawMessage = String(error?.message || '').toLowerCase();
  return { messages, rawMessage };
};

const hasUseCaseChoiceError = (error) => {
  const { messages, rawMessage } = getErrorDiagnostics(error);
  return (
    messages.some((item) => item.includes('use_case') && item.includes('valid choice')) ||
    (rawMessage.includes('use_case') && rawMessage.includes('valid choice'))
  );
};

const hasChatHistoryFieldError = (error) => {
  const { messages, rawMessage } = getErrorDiagnostics(error);
  return (
    messages.some(
      (item) =>
        item.includes('chat_history') &&
        (item.includes('unexpected') || item.includes('unknown') || item.includes('not allowed'))
    ) ||
    (rawMessage.includes('chat_history') &&
      (rawMessage.includes('unexpected') ||
        rawMessage.includes('unknown') ||
        rawMessage.includes('not allowed')))
  );
};

const parseLicenseFeatureRestriction = (error) => {
  const payload = error?.details || error?.body || error?.response?.data || error || null;
  const code = String(payload?.code || payload?.details?.code || '').trim();
  if (code !== 'LICENSE_FEATURE_DISABLED') return null;
  return String(
    payload?.feature || payload?.details?.feature || payload?.details?.details?.feature || ''
  )
    .trim()
    .toLowerCase();
};

const buildCrmSystemPrompt = (copy) => `You are an AI assistant inside Enterprise CRM.
Rules:
1) Answer only using the provided CRM context and the current conversation.
2) Do not provide generic theory, fictional numbers, or assumptions not grounded in CRM context.
3) If context is insufficient, respond exactly with: "${copy.crmNoDataReply}"
4) When possible, give concise actionable steps tied to CRM entities (leads, contacts, deals, tasks, projects, analytics) present in context.
5) Keep the response language aligned with the user message language.
6) Never claim access to data that is not present in CRM context.`;

const parseAiContextFromHash = () => {
  const hash = typeof window !== 'undefined' ? String(window.location.hash || '') : '';
  const [, query = ''] = hash.split('?');
  const params = new URLSearchParams(query);
  const entityType = (params.get('entity_type') || '').trim().toLowerCase();
  const rawEntityId = (params.get('entity_id') || '').trim();
  const entityId = rawEntityId ? Number(rawEntityId) : null;
  return {
    entityType: entityType || '',
    entityId: Number.isFinite(entityId) ? entityId : null,
  };
};

export default function AIChatPage() {
  const { message } = App.useApp();
  const { theme } = useTheme();
  const locale = getLocale();
  const copy = getChatCopy(locale);
  const canUseAiAssist = hasAnyFeature('ai.assist');
  const [providers, setProviders] = useState([]);
  const [providerId, setProviderId] = useState('');
  const [providersLoading, setProvidersLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState([]);
  const [chatContext, setChatContext] = useState(() => parseAiContextFromHash());
  const [licenseBlocked, setLicenseBlocked] = useState(() => !hasAnyFeature('ai.assist'));

  const bg = theme === 'dark' ? '#141a22' : '#ffffff';
  const border = theme === 'dark' ? '#2d3343' : '#f0f0f0';
  const botBg = theme === 'dark' ? '#1d2633' : '#f5faff';
  const userBg = theme === 'dark' ? '#223044' : '#e6f7ff';
  const aiAssistRestrictionReason = useMemo(
    () => getFeatureRestrictionReason('ai.assist', t),
    [],
  );

  useEffect(() => {
    if (!canUseAiAssist) {
      setProviders([]);
      setProviderId('');
      setProvidersLoading(false);
      setLicenseBlocked(true);
      return undefined;
    }

    let active = true;
    const loadProviders = async () => {
      setProvidersLoading(true);
      try {
        const data = await getAIAssistProviders();
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setLicenseBlocked(false);
        setProviders(list);
        setProviderId('');
      } catch (error) {
        if (!active) return;
        if (parseLicenseFeatureRestriction(error) === 'ai.assist') {
          setLicenseBlocked(true);
        }
        setProviders([]);
      } finally {
        if (active) setProvidersLoading(false);
      }
    };
    loadProviders();
    return () => {
      active = false;
    };
  }, [canUseAiAssist]);

  useEffect(() => {
    const syncContext = () => {
      setChatContext(parseAiContextFromHash());
    };
    window.addEventListener('hashchange', syncContext);
    syncContext();
    return () => window.removeEventListener('hashchange', syncContext);
  }, []);

  useEffect(() => {
    if (!chat.length && !inputText && chatContext.entityType && chatContext.entityId) {
      setInputText(
        copy.suggestedPrompt
          .replace('{entityType}', chatContext.entityType)
          .replace('{entityId}', chatContext.entityId)
      );
    }
  }, [chatContext, chat.length, inputText, copy.suggestedPrompt]);

  const providerOptions = useMemo(
    () => [
      { value: '__default__', label: copy.defaultProviderLabel },
      ...providers.map((item) => ({ value: item.id, label: item.name })),
    ],
    [copy.defaultProviderLabel, providers]
  );
  const normalizedProviderValue = useMemo(
    () => normalizeOptionValue(providerId || '__default__', providerOptions),
    [providerId, providerOptions]
  );
  const providerHint = useMemo(() => {
    const selected = providers.find((item) => idsEqual(item.id, providerId));
    if (!selected) return copy.defaultProviderHint;
    return `${selected.name}${selected.model ? ` • ${selected.model}` : ''}`;
  }, [copy.defaultProviderHint, providers, providerId]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || loading || licenseBlocked) return;
    const replyCopy = getCopyByLanguage(detectMessageLanguage(text, locale));

    const nextUserMessage = { role: 'user', text, ts: Date.now() };
    const nextHistory = [...chat, nextUserMessage];
    setChat(nextHistory);
    setInputText('');
    setLoading(true);

    try {
      const payload = {
        use_case: 'crm_chat',
        input_text: text,
        crm_context: {
          ui_scope: 'crm_global',
          source: 'ai_chat_page',
          locale: String(locale || 'ru'),
          route_hash: typeof window !== 'undefined' ? String(window.location.hash || '') : '',
          ...(chatContext.entityType ? { entity_type: chatContext.entityType } : {}),
          ...(chatContext.entityId ? { entity_id: chatContext.entityId } : {}),
        },
        system_prompt: buildCrmSystemPrompt(replyCopy),
        chat_history: nextHistory.map((entry) => ({
          role: entry.role,
          text: entry.text,
        })),
      };
      if (providerId) payload.provider_id = providerId;

      let result;
      try {
        result = await runAIAssist(payload);
      } catch (firstError) {
        if (hasUseCaseChoiceError(firstError)) {
          const fallbackPayload = {
            ...payload,
            use_case: 'custom',
          };
          try {
            result = await runAIAssist(fallbackPayload);
          } catch (secondError) {
            if (hasChatHistoryFieldError(secondError)) {
              const minimalPayload = {
                ...fallbackPayload,
              };
              delete minimalPayload.chat_history;
              result = await runAIAssist(minimalPayload);
            } else {
              throw secondError;
            }
          }
        } else if (hasChatHistoryFieldError(firstError)) {
          const fallbackPayload = {
            ...payload,
          };
          delete fallbackPayload.chat_history;
          result = await runAIAssist(fallbackPayload);
        } else {
          throw firstError;
        }
      }

      const output = normalizeAssistantOutput(result?.output_text, replyCopy);
      const modelMeta = [result?.provider_name || result?.provider || '', result?.model || '']
        .filter(Boolean)
        .join(' • ');
      setChat((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: output,
          ts: Date.now(),
          meta: modelMeta,
        },
      ]);
    } catch (error) {
      if (parseLicenseFeatureRestriction(error) === 'ai.assist') {
        setLicenseBlocked(true);
      }
      const messageText = formatAiErrorMessage(error, replyCopy);
      setChat((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `${replyCopy.errorPrefix}: ${messageText}`,
          ts: Date.now(),
        },
      ]);
      message.error(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={
        <Space>
          <RobotOutlined />
          AI Chat CRM
        </Space>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      style={{ background: bg, borderColor: border }}
    >
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <LicenseRestrictedAction restricted={licenseBlocked} reason={aiAssistRestrictionReason} feature="ai.assist" block>
          <Select
            value={normalizedProviderValue}
            onChange={(value) => setProviderId(value === '__default__' ? '' : value)}
            loading={providersLoading}
            options={providerOptions}
            disabled={licenseBlocked}
          />
        </LicenseRestrictedAction>
        <Text type="secondary">{providerHint}</Text>
        {chatContext.entityType && chatContext.entityId ? (
          <Text type="secondary">
            {copy.contextLabel}: {chatContext.entityType} #{chatContext.entityId}
          </Text>
        ) : null}
      </Space>

      <div
        style={{
          border: `1px solid ${border}`,
          borderRadius: 8,
          padding: 12,
          minHeight: 320,
          maxHeight: 520,
          overflowY: 'auto',
          background: theme === 'dark' ? '#0f141c' : '#fafafa',
        }}
      >
        {chat.length === 0 ? (
          <Empty description={copy.emptyDescription} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            {chat.map((item, idx) => {
              const isUser = item.role === 'user';
              return (
                <div
                  key={`${item.ts}_${idx}`}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    gap: 8,
                  }}
                >
                  {!isUser && <Avatar icon={<RobotOutlined />} />}
                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: isUser ? userBg : botBg,
                      border: `1px solid ${border}`,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <div>{item.text}</div>
                    {item.meta ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.meta}
                      </Text>
                    ) : null}
                  </div>
                  {isUser && <Avatar icon={<UserOutlined />} />}
                </div>
              );
            })}
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Spin size="small" />
                <Text type="secondary">{copy.loadingLabel}</Text>
              </div>
            ) : null}
          </Space>
        )}
      </div>

      <Space.Compact style={{ width: '100%' }}>
        <LicenseRestrictedAction restricted={licenseBlocked} reason={aiAssistRestrictionReason} feature="ai.assist" block>
          <TextArea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder={copy.placeholder}
            disabled={licenseBlocked}
            autoSize={{ minRows: 2, maxRows: 5 }}
            onPressEnter={(event) => {
              if (!event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
          />
        </LicenseRestrictedAction>
        <LicenseRestrictedAction restricted={licenseBlocked} reason={aiAssistRestrictionReason} feature="ai.assist">
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            disabled={licenseBlocked}
            onClick={sendMessage}
            style={{ height: 'auto' }}
          >
            {copy.sendLabel}
          </Button>
        </LicenseRestrictedAction>
      </Space.Compact>
      {licenseBlocked ? (
        <Text type="secondary">
          {aiAssistRestrictionReason}
        </Text>
      ) : null}
    </Card>
  );
}
