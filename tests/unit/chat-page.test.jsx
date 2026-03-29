import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatPage from '../../src/pages/chat-page.jsx';

const getOmnichannelTimeline = vi.fn();
const sendOmnichannelMessage = vi.fn();
const getOmnichannelConversationContext = vi.fn();
const updateOmnichannelConversationContext = vi.fn();
const runOmnichannelConversationAction = vi.fn();
const readStoredLicenseFeatures = vi.fn();
const readStoredLicenseState = vi.fn();
const shouldEnforceLicenseFeatures = vi.fn();

vi.mock('../../src/lib/api/compliance.js', () => ({
  getOmnichannelTimeline: (...args) => getOmnichannelTimeline(...args),
  sendOmnichannelMessage: (...args) => sendOmnichannelMessage(...args),
  getOmnichannelConversationContext: (...args) => getOmnichannelConversationContext(...args),
  updateOmnichannelConversationContext: (...args) => updateOmnichannelConversationContext(...args),
  runOmnichannelConversationAction: (...args) => runOmnichannelConversationAction(...args),
}));

vi.mock('../../src/lib/api/licenseFeatures.js', () => ({
  readStoredLicenseFeatures: () => readStoredLicenseFeatures(),
}));

vi.mock('../../src/lib/api/licenseState.js', () => ({
  readStoredLicenseState: () => readStoredLicenseState(),
  shouldEnforceLicenseFeatures: (...args) => shouldEnforceLicenseFeatures(...args),
}));

vi.mock('../../src/lib/hooks/useTheme.js', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

describe('ChatPage unified inbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readStoredLicenseState.mockReturnValue({ installed: true, status: 'active', enforcement_mode: 'strict' });
    shouldEnforceLicenseFeatures.mockImplementation((state) => state?.enforcement_mode === 'strict');
    getOmnichannelConversationContext.mockResolvedValue({
      state: { status: 'open', next_action: '', internal_notes: [] },
      metrics: { messages_total: 0, inbound: 0, outbound: 0 },
    });
    updateOmnichannelConversationContext.mockResolvedValue({
      state: { status: 'open', next_action: '', internal_notes: [] },
      metrics: { messages_total: 0, inbound: 0, outbound: 0 },
    });
    runOmnichannelConversationAction.mockResolvedValue({
      success: true,
      state: { status: 'open', next_action: '', internal_notes: [] },
      result: {},
    });
  });

  it('shows license state when unified inbox entitlement is missing', async () => {
    readStoredLicenseFeatures.mockReturnValue([]);
    getOmnichannelTimeline.mockResolvedValue({ count: 0, results: [], summary: {} });

    render(<ChatPage />);

    expect(await screen.findByText(/Unified Inbox недоступен/i)).toBeInTheDocument();
  });

  it('does not pre-block inbox in warn mode when features are missing', async () => {
    readStoredLicenseFeatures.mockReturnValue([]);
    readStoredLicenseState.mockReturnValue({ installed: false, status: 'missing', enforcement_mode: 'warn' });
    shouldEnforceLicenseFeatures.mockReturnValue(false);
    getOmnichannelTimeline.mockResolvedValue({ count: 0, results: [], summary: {} });

    render(<ChatPage />);

    expect(await screen.findByText(/Unified Inbox is empty/i)).toBeInTheDocument();
    expect(screen.queryByText(/Unified Inbox недоступен/i)).not.toBeInTheDocument();
  });

  it('shows loading state before inbox data resolves', () => {
    readStoredLicenseFeatures.mockReturnValue(['integrations.core']);
    getOmnichannelTimeline.mockImplementation(() => new Promise(() => {}));

    render(<ChatPage />);

    expect(screen.getByText(/Unified Inbox is loading/i)).toBeInTheDocument();
  });

  it('shows empty state when the inbox returns no conversations', async () => {
    readStoredLicenseFeatures.mockReturnValue(['integrations.core']);
    getOmnichannelTimeline.mockResolvedValue({ count: 0, results: [], summary: {} });

    render(<ChatPage />);

    expect(await screen.findByText(/Unified Inbox is empty/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Обновить/i })).toBeInTheDocument();
  });

  it('shows error state when timeline loading fails', async () => {
    readStoredLicenseFeatures.mockReturnValue(['integrations.core']);
    getOmnichannelTimeline.mockRejectedValue(new Error('boom'));

    render(<ChatPage />);

    expect(await screen.findByText(/Не удалось загрузить inbox/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Повторить/i })).toBeInTheDocument();
  });

  it('renders conversations and sends outbound message for supported channel', async () => {
    const inboundAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const outboundAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    readStoredLicenseFeatures.mockReturnValue(['integrations.core']);
    getOmnichannelTimeline.mockResolvedValue({
      count: 2,
      summary: { total: 2, queue: 1, active: 0, resolved: 0, breached: 1 },
      results: [
        {
          id: 11,
          channel: 7,
          channel_type: 'whatsapp',
          channel_name: 'WA Main',
          conversation_key: '7:998901234567',
          participant_id: '998901234567',
          direction: 'in',
          external_id: 'wamid.1',
          sender_id: '998901234567',
          recipient_id: '555001',
          text: 'Здравствуйте',
          status: 'received',
          queue_state: 'waiting',
          sla_status: 'breached',
          created_at: inboundAt,
        },
        {
          id: 12,
          channel: 7,
          channel_type: 'whatsapp',
          channel_name: 'WA Main',
          conversation_key: '7:998901234567',
          participant_id: '998901234567',
          direction: 'out',
          external_id: 'wamid.2',
          sender_id: '555001',
          recipient_id: '998901234567',
          text: 'Чем можем помочь?',
          status: 'sent',
          queue_state: 'waiting',
          sla_status: 'ok',
          created_at: outboundAt,
        },
      ],
    });
    sendOmnichannelMessage.mockResolvedValue({ success: true });

    render(<ChatPage />);

    expect(await screen.findByText(/Messenger-first workspace/i)).toBeInTheDocument();
    expect(screen.queryAllByText(/998901234567/i).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText(/Ответить в диалоге/i), {
      target: { value: 'Готово, подключаю менеджера' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Отправить/i }));

    await waitFor(() => {
      expect(sendOmnichannelMessage).toHaveBeenCalledWith({
        channel: 'whatsapp',
        channel_id: 7,
        to: '998901234567',
        text: 'Готово, подключаю менеджера',
      });
    });
  });

  it('loads context and runs create_contact and create_deal quick actions', async () => {
    readStoredLicenseFeatures.mockReturnValue(['integrations.core']);
    getOmnichannelTimeline.mockResolvedValue({
      count: 1,
      summary: { total: 1, queue: 1, active: 0, resolved: 0, breached: 0 },
      results: [
        {
          id: 21,
          channel: 9,
          channel_type: 'telegram',
          channel_name: 'TG Main',
          conversation_key: '9:crm_user',
          participant_id: 'crm_user',
          direction: 'in',
          sender_id: 'crm_user',
          recipient_id: 'crm-bot',
          text: 'Нужна помощь',
          status: 'received',
          queue_state: 'waiting',
          sla_status: 'ok',
          created_at: '2026-03-22T11:00:00Z',
        },
      ],
    });
    getOmnichannelConversationContext.mockResolvedValue({
      state: { status: 'open', next_action: '', internal_notes: [] },
      metrics: { messages_total: 1, inbound: 1, outbound: 0 },
    });

    render(<ChatPage />);

    await waitFor(() => {
      expect(getOmnichannelConversationContext).toHaveBeenCalledWith({
        channel_id: 9,
        participant_id: 'crm_user',
        conversation_key: '9:crm_user',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /Create lead/i }));
    await waitFor(() => expect(runOmnichannelConversationAction).toHaveBeenCalledTimes(1));
    expect(runOmnichannelConversationAction).toHaveBeenNthCalledWith(1, {
      channel_id: 9,
      participant_id: 'crm_user',
      conversation_key: '9:crm_user',
      action: 'create_lead',
    });

    fireEvent.click(screen.getByRole('button', { name: /Create contact/i }));
    await waitFor(() => expect(runOmnichannelConversationAction).toHaveBeenCalledTimes(2));
    expect(runOmnichannelConversationAction).toHaveBeenNthCalledWith(2, {
      channel_id: 9,
      participant_id: 'crm_user',
      conversation_key: '9:crm_user',
      action: 'create_contact',
    });

    fireEvent.click(screen.getByRole('button', { name: /Create deal/i }));
    await waitFor(() => expect(runOmnichannelConversationAction).toHaveBeenCalledTimes(3));
    expect(runOmnichannelConversationAction).toHaveBeenNthCalledWith(3, {
      channel_id: 9,
      participant_id: 'crm_user',
      conversation_key: '9:crm_user',
      action: 'create_deal',
    });
  });

  it('shows 24h compliance warning and blocks composer for expired Meta window', async () => {
    readStoredLicenseFeatures.mockReturnValue(['integrations.core']);
    getOmnichannelTimeline.mockResolvedValue({
      count: 1,
      summary: { total: 1, queue: 1, active: 0, resolved: 0, breached: 0 },
      results: [
        {
          id: 31,
          channel: 5,
          channel_type: 'whatsapp',
          channel_name: 'WA Main',
          conversation_key: '5:998901111111',
          participant_id: '998901111111',
          direction: 'in',
          sender_id: '998901111111',
          recipient_id: '555001',
          text: 'Проверьте заказ',
          status: 'received',
          queue_state: 'waiting',
          sla_status: 'ok',
          created_at: '2026-01-01T10:00:00Z',
        },
      ],
    });

    render(<ChatPage />);

    expect(await screen.findByText(/24h compliance window истекло/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Отправить/i })).toBeDisabled();
    expect(sendOmnichannelMessage).not.toHaveBeenCalled();
  });

  it('applies conversation segment filters (clients / tasks / team)', async () => {
    readStoredLicenseFeatures.mockReturnValue(['integrations.core']);
    getOmnichannelTimeline.mockResolvedValue({
      count: 3,
      summary: { total: 3, queue: 3, active: 0, resolved: 0, breached: 0 },
      results: [
        {
          id: 41,
          channel: 11,
          channel_type: 'whatsapp',
          channel_name: 'WA Clients',
          conversation_key: '11:client-1',
          participant_id: 'client-1',
          direction: 'in',
          sender_id: 'client-1',
          recipient_id: 'crm',
          text: 'Нужна консультация по тарифу',
          status: 'received',
          queue_state: 'waiting',
          sla_status: 'ok',
          created_at: '2026-03-22T11:00:00Z',
        },
        {
          id: 42,
          channel: 12,
          channel_type: 'telegram',
          channel_name: 'Team Chat',
          conversation_key: '12:team-1',
          participant_id: 'team-1',
          direction: 'in',
          sender_id: 'team-1',
          recipient_id: 'crm',
          text: 'Команда: нужен апдейт по релизу',
          status: 'received',
          queue_state: 'waiting',
          sla_status: 'ok',
          created_at: '2026-03-22T11:10:00Z',
        },
        {
          id: 43,
          channel: 13,
          channel_type: 'telegram',
          channel_name: 'Tasks',
          conversation_key: '13:task-1',
          participant_id: 'task-1',
          direction: 'in',
          sender_id: 'task-1',
          recipient_id: 'crm',
          text: 'Задача по проекту просрочена',
          status: 'received',
          queue_state: 'waiting',
          sla_status: 'ok',
          created_at: '2026-03-22T11:20:00Z',
        },
      ],
    });

    render(<ChatPage />);

    expect(await screen.findByText(/Messenger-first workspace/i)).toBeInTheDocument();
    expect(screen.queryAllByText('client-1').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('team-1').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('task-1').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('radio', { name: 'Задачи' }));
    expect(screen.queryAllByText('client-1')).toHaveLength(0);
    expect(screen.queryAllByText('team-1')).toHaveLength(0);
    expect(screen.queryAllByText('task-1').length).toBeGreaterThan(0);
  });
});
