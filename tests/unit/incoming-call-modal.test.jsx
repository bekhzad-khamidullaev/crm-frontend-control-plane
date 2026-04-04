import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/api/client.js', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../../src/shared/api/generated/services/VoIpColdCallsService.ts', () => ({
  VoIpColdCallsService: {
    voipIncomingContext: vi.fn(),
  },
}));

vi.mock('../../src/lib/telephony/runtimeConfig.js', () => ({
  loadTelephonyRuntimeConfig: vi.fn(async () => ({ sipConfig: { routeMode: 'embedded' } })),
}));

vi.mock('../../src/lib/telephony/SIPClient.js', () => ({
  default: {
    callSession: {},
    answerCall: vi.fn(),
    rejectCall: vi.fn(),
  },
}));

vi.mock('../../src/lib/api/telephony.js', () => ({
  rejectActiveCall: vi.fn(),
}));

vi.mock('../../src/router.js', () => ({
  navigate: vi.fn(),
}));

import IncomingCallModal from '../../src/modules/calls/IncomingCallModal.jsx';
import { api } from '../../src/lib/api/client.js';
import { VoIpColdCallsService } from '../../src/shared/api/generated/services/VoIpColdCallsService.ts';
import { navigate } from '../../src/router.js';
import { loadTelephonyRuntimeConfig } from '../../src/lib/telephony/runtimeConfig.js';

const baseCallData = {
  phoneNumber: '998946447477',
  callerName: 'Тест Клиент',
  callId: '1774255956.373',
};

describe('IncomingCallModal unified flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadTelephonyRuntimeConfig.mockResolvedValue({ sipConfig: { routeMode: 'embedded' } });
    api.get.mockResolvedValue({ results: [] });
  });

  it('opens lead creation stage only after answer for unknown number', async () => {
    VoIpColdCallsService.voipIncomingContext.mockResolvedValue({
      matched_entity: null,
      recent_interactions: [],
      existing_open_lead: null,
      lead_defaults: {
        first_name: 'Новый',
      },
    });
    api.post.mockResolvedValue({ id: 10 });

    const onAnswer = vi.fn();
    const onDismiss = vi.fn();

    render(
      <IncomingCallModal
        visible
        callData={baseCallData}
        onAnswer={onAnswer}
        onReject={vi.fn()}
        onDismiss={onDismiss}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Ответить')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ответить').closest('button'));

    await waitFor(() => {
      expect(screen.getByText('Создать лид')).toBeInTheDocument();
      expect(screen.getByLabelText('Телефон')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Создать лид').closest('button'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/leads/',
        expect.objectContaining({
          body: expect.objectContaining({
            phone: baseCallData.phoneNumber,
          }),
        }),
      );
    });

    expect(onAnswer).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/leads/10');
  });

  it('shows matched entity card stage after answer', async () => {
    VoIpColdCallsService.voipIncomingContext.mockResolvedValue({
      matched_entity: {
        type: 'contact',
        id: 15,
        data: {
          id: 15,
          first_name: 'Алишер',
          last_name: 'Тестов',
          phone: baseCallData.phoneNumber,
        },
      },
      recent_interactions: [],
      existing_open_lead: null,
    });

    render(
      <IncomingCallModal
        visible
        callData={baseCallData}
        onAnswer={vi.fn()}
        onReject={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Ответить')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ответить').closest('button'));

    await waitFor(() => {
      expect(screen.getAllByText('Открыть карточку').length).toBeGreaterThan(0);
      expect(screen.getByText('Алишер Тестов')).toBeInTheDocument();
    });
  });
});
