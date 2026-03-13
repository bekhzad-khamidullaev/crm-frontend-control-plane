import { CopyOutlined, RobotOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Select, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { getAIAssistProviders, runAIAssist } from '../lib/api/integrations/ai.js';

const { Text } = Typography;
const { TextArea } = Input;

const USE_CASES = [
  { value: 'lead_summary', label: 'Сводка по лиду' },
  { value: 'next_action', label: 'Следующие действия' },
  { value: 'email_reply', label: 'Черновик ответа клиенту' },
  { value: 'deal_analysis', label: 'Анализ сделки' },
  { value: 'custom', label: 'Произвольный запрос' },
];
const idsEqual = (left, right) => String(left) === String(right);
const normalizeOptionValue = (value, options = []) => {
  const matched = options.find((option) => idsEqual(option?.value, value));
  return matched ? matched.value : value;
};

function AIAssistantPanel({
  entityType,
  entityId,
  contextData = {},
  initialInput = '',
  defaultUseCase = 'next_action',
}) {
  const { message } = App.useApp();
  const [providers, setProviders] = useState([]);
  const [providerId, setProviderId] = useState('');
  const [useCase, setUseCase] = useState(defaultUseCase);
  const [inputText, setInputText] = useState(initialInput);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [outputText, setOutputText] = useState('');
  const [modelInfo, setModelInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProviders = async () => {
      setProvidersLoading(true);
      try {
        const data = await getAIAssistProviders();
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setProviders(list);
        const defaultProvider = list.find((item) => item.is_default) || list[0];
        setProviderId(defaultProvider?.id || '');
      } catch {
        if (!active) return;
        setProviders([]);
      } finally {
        if (active) setProvidersLoading(false);
      }
    };

    loadProviders();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setUseCase(defaultUseCase);
    setInputText(initialInput || '');
    setSystemPrompt('');
    setOutputText('');
    setModelInfo('');
  }, [entityType, entityId, defaultUseCase, initialInput]);

  const providerHint = useMemo(() => {
    const selected = providers.find((item) => idsEqual(item.id, providerId));
    if (!selected) return 'Будет использован провайдер по умолчанию на сервере';
    return `${selected.name}${selected.model ? ` • ${selected.model}` : ''}`;
  }, [providers, providerId]);
  const providerOptions = useMemo(
    () => [{ value: '__default__', label: 'По умолчанию' }, ...providers.map((item) => ({ value: item.id, label: item.name }))],
    [providers],
  );
  const normalizedProviderValue = useMemo(
    () => normalizeOptionValue(providerId || '__default__', providerOptions),
    [providerId, providerOptions],
  );

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      message.warning('Введите задачу для AI ассистента');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        use_case: useCase,
        input_text: inputText.trim(),
        crm_context: {
          entity_type: entityType,
          entity_id: entityId,
          ...contextData,
        },
      };

      if (providerId) payload.provider_id = providerId;
      if (useCase === 'custom' && systemPrompt.trim()) {
        payload.system_prompt = systemPrompt.trim();
      }

      const result = await runAIAssist(payload);
      setOutputText(result?.output_text || '');
      const provider = result?.provider_name || result?.provider || '';
      const model = result?.model || '';
      setModelInfo([provider, model].filter(Boolean).join(' • '));
    } catch (error) {
      const details = error?.details || {};
      const messageText =
        details?.error || details?.detail || error?.message || 'Не удалось получить ответ от AI';
      message.error(messageText);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      message.success('Ответ AI скопирован в буфер обмена');
    } catch {
      message.error('Не удалось скопировать текст');
    }
  };

  return (
    <Card
      title={
        <Space>
          <RobotOutlined />
          AI ассистент CRM
        </Space>
      }
    >
      <Form layout="vertical">
        <Form.Item label="Сценарий">
          <Select
            value={useCase}
            onChange={setUseCase}
            options={USE_CASES}
            placeholder="Выберите сценарий"
          />
        </Form.Item>

        <Form.Item label="Провайдер" extra={providerHint}>
          <Select
            value={normalizedProviderValue}
            onChange={(value) => setProviderId(value === '__default__' ? '' : value)}
            loading={providersLoading}
            options={providerOptions}
          />
        </Form.Item>

        <Form.Item label="Запрос">
          <TextArea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            rows={6}
            placeholder="Опишите задачу: что проанализировать или сгенерировать"
          />
        </Form.Item>

        {useCase === 'custom' && (
          <Form.Item label="System prompt (опционально)">
            <TextArea
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              rows={3}
              placeholder="Дополнительные правила для модели"
            />
          </Form.Item>
        )}

        <Space style={{ marginBottom: 12 }}>
          <Button type="primary" onClick={handleGenerate} loading={loading}>
            Сгенерировать
          </Button>
          {outputText && (
            <Button icon={<CopyOutlined />} onClick={handleCopy}>
              Копировать ответ
            </Button>
          )}
          {modelInfo && <Text type="secondary">{modelInfo}</Text>}
        </Space>

        <Form.Item label="Ответ AI">
          <TextArea value={outputText} readOnly rows={10} placeholder="Здесь появится ответ AI" />
        </Form.Item>
      </Form>
    </Card>
  );
}

export default AIAssistantPanel;
