import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../../src/lib/api/client.js', () => ({
  api: apiMock,
}));

import {
  getWhatsAppConversations,
  getWhatsAppMessages,
  sendWhatsAppMessage,
  getWhatsAppStats,
} from '../../src/lib/api/integrations/whatsapp.js';

describe('whatsapp integration helper parity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests omnichannel timeline with whatsapp channel filter', async () => {
    apiMock.get.mockResolvedValue({ results: [] });

    await getWhatsAppConversations({ limit: 50 });

    expect(apiMock.get).toHaveBeenCalledWith('/api/settings/omnichannel/timeline/', {
      params: { limit: 50, channel: 'whatsapp' },
    });
  });

  it('uses getWhatsAppMessages alias for the same endpoint', async () => {
    apiMock.get.mockResolvedValue({ results: [] });

    await getWhatsAppMessages({ page: 2 });

    expect(apiMock.get).toHaveBeenCalledWith('/api/settings/omnichannel/timeline/', {
      params: { page: 2, channel: 'whatsapp' },
    });
  });

  it('posts normalized send payload to omnichannel endpoint', async () => {
    apiMock.post.mockResolvedValue({ status: 'ok' });

    await sendWhatsAppMessage({
      channel_id: 10,
      recipient_id: '+998901112233',
      text: 'hi',
    });

    expect(apiMock.post).toHaveBeenCalledWith('/api/settings/omnichannel/send/', {
      body: {
        channel: 'whatsapp',
        channel_id: 10,
        to: '+998901112233',
        text: 'hi',
      },
    });
  });

  it('calculates total/inbound/outbound stats', async () => {
    apiMock.get.mockResolvedValue({
      results: [
        { direction: 'in' },
        { direction: 'out' },
        { direction: 'in' },
      ],
    });

    const stats = await getWhatsAppStats();

    expect(stats).toEqual({
      total: 3,
      inbound: 2,
      outbound: 1,
    });
  });
});
