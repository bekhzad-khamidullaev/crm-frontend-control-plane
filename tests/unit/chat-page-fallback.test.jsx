import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatPage from '../../src/pages/chat-page.jsx';

const getOmnichannelTimeline = vi.fn();
const sendOmnichannelMessage = vi.fn();
const getOmnichannelConversationContext = vi.fn();
const updateOmnichannelConversationContext = vi.fn();
const runOmnichannelConversationAction = vi.fn();
const getChatMessages = vi.fn();

vi.mock('../../src/lib/api/compliance.js', () => ({
  getOmnichannelTimeline: (...args) => getOmnichannelTimeline(...args),
  sendOmnichannelMessage: (...args) => sendOmnichannelMessage(...args),
  getOmnichannelConversationContext: (...args) => getOmnichannelConversationContext(...args),
  updateOmnichannelConversationContext: (...args) => updateOmnichannelConversationContext(...args),
  runOmnichannelConversationAction: (...args) => runOmnichannelConversationAction(...args),
}));

vi.mock('../../src/lib/api/chat.js', () => ({
  getChatMessages: (...args) => getChatMessages(...args),
}));

vi.mock('../../src/lib/hooks/useTheme.js', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('../../src/modules/communications/CommunicationsHub.jsx', () => ({
  default: () => <div data-testid="communications-hub" />,
}));

describe('ChatPage legacy fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('loads legacy chat-messages when omnichannel timeline is empty', async () => {
    getOmnichannelTimeline.mockResolvedValue({ count: 0, results: [], summary: {} });
    getChatMessages.mockResolvedValue({
      count: 1,
      results: [
        {
          id: 501,
          content: 'Legacy чат сообщение',
          owner: { id: 17, username: 'legacy.agent' },
          creation_date: '2026-03-30T12:00:00Z',
          content_type: 42,
          object_id: 9001,
        },
      ],
    });

    render(<ChatPage />);

    expect(await screen.findByText(/Включён fallback на CRM Chat/i)).toBeInTheDocument();
    expect(screen.getAllByText(/legacy\.agent/i).length).toBeGreaterThan(0);
    expect(getChatMessages).toHaveBeenCalled();
  });

  it('shows contact name in conversation list instead of raw participant id', async () => {
    getOmnichannelTimeline.mockResolvedValue({
      count: 1,
      summary: { total: 1 },
      results: [
        {
          id: 9001,
          channel: '11',
          channel_type: 'whatsapp',
          channel_name: 'WA Main',
          direction: 'in',
          sender_id: '+998901112233',
          recipient_id: '555001',
          text: 'Здравствуйте',
          status: 'received',
          queue_state: 'new',
          queue_bucket: 'queue',
          sla_status: 'ok',
          created_at: '2026-04-02T10:00:00Z',
          participant_contact: {
            id: 501,
            name: 'Ali Valiyev',
            secondary: '+998901112233',
            phone_e164: '+998901112233',
            telegram_username: 'ali_uz',
          },
        },
      ],
    });
    getChatMessages.mockResolvedValue({ count: 0, results: [] });

    render(<ChatPage />);

    expect(await screen.findByText('Ali Valiyev')).toBeInTheDocument();
  });
});
