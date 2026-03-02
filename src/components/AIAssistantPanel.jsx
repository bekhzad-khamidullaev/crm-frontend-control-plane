import { Copy, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { getAIAssistProviders, runAIAssist } from '../lib/api/integrations/ai.js';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Label } from './ui/label.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.jsx';
import { Textarea } from './ui/textarea.jsx';
import { toast } from './ui/use-toast.js';

const USE_CASES = [
  { value: 'lead_summary', label: 'Сводка по лиду' },
  { value: 'next_action', label: 'Следующие действия' },
  { value: 'email_reply', label: 'Черновик ответа клиенту' },
  { value: 'deal_analysis', label: 'Анализ сделки' },
  { value: 'custom', label: 'Произвольный запрос' },
];

function AIAssistantPanel({
  entityType,
  entityId,
  contextData = {},
  initialInput = '',
  defaultUseCase = 'next_action',
}) {
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
      } catch (error) {
        // Non-admin users may not have access to provider settings in some environments.
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
    // Reset draft when switching CRM entity (e.g., another lead/deal/contact card).
    setUseCase(defaultUseCase);
    setInputText(initialInput || '');
    setSystemPrompt('');
    setOutputText('');
    setModelInfo('');
  }, [entityType, entityId, defaultUseCase, initialInput]);

  const providerHint = useMemo(() => {
    const selected = providers.find((item) => item.id === providerId);
    if (!selected) return 'Будет использован провайдер по умолчанию на сервере';
    return `${selected.name}${selected.model ? ` • ${selected.model}` : ''}`;
  }, [providers, providerId]);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast({
        title: 'Пустой запрос',
        description: 'Введите задачу для AI ассистента',
        variant: 'destructive',
      });
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
      toast({
        title: 'Ошибка AI запроса',
        description: messageText,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      toast({ title: 'Скопировано', description: 'Ответ AI скопирован в буфер обмена' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось скопировать текст', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          AI ассистент CRM
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Сценарий</Label>
            <Select value={useCase} onValueChange={setUseCase}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите сценарий" />
              </SelectTrigger>
              <SelectContent>
                {USE_CASES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Провайдер</Label>
            <Select
              value={providerId || '__default__'}
              onValueChange={(value) => setProviderId(value === '__default__' ? '' : value)}
              disabled={providersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="По умолчанию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">По умолчанию</SelectItem>
                {providers.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{providerHint}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Запрос</Label>
          <Textarea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            rows={6}
            placeholder="Опишите задачу: что проанализировать или сгенерировать"
          />
        </div>

        {useCase === 'custom' && (
          <div className="space-y-2">
            <Label>System prompt (опционально)</Label>
            <Textarea
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              rows={3}
              placeholder="Дополнительные правила для модели"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleGenerate} loading={loading}>
            Сгенерировать
          </Button>
          {outputText && (
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              Копировать ответ
            </Button>
          )}
          {modelInfo && <span className="self-center text-xs text-muted-foreground">{modelInfo}</span>}
        </div>

        <div className="space-y-2">
          <Label>Ответ AI</Label>
          <Textarea value={outputText} readOnly rows={10} placeholder="Здесь появится ответ AI" />
        </div>
      </CardContent>
    </Card>
  );
}

export default AIAssistantPanel;
