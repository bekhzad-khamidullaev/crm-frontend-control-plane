import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpsChainPanel } from '../../src/pages/operations.jsx';

const getDealOpsChain = vi.fn();
const createDealServiceTicket = vi.fn();

vi.mock('../../src/lib/api/deals.js', async () => {
  const actual = await vi.importActual('../../src/lib/api/deals.js');
  return {
    ...actual,
    getDealOpsChain: (...args) => getDealOpsChain(...args),
    createDealServiceTicket: (...args) => createDealServiceTicket(...args),
  };
});

describe('OpsChainPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ops chain rows and creates service ticket', async () => {
    getDealOpsChain.mockResolvedValue({
      count: 1,
      summary: {
        deals: 1,
        with_invoice: 1,
        with_received_payment: 0,
        with_service_ticket: 0,
      },
      results: [
        {
          deal_id: 17,
          deal_name: 'Enterprise onboarding',
          deal_ticket: 'D-17',
          invoice_numbers: ['INV-17'],
          latest_payment_status: { code: 'guaranteed' },
          payment_progress_percent: 30,
          service_ticket: null,
        },
      ],
    });
    createDealServiceTicket.mockResolvedValue({
      created: true,
      request: { id: 501, ticket: 'REQ-501' },
    });

    render(<OpsChainPanel />);

    expect(await screen.findByText(/Enterprise onboarding/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Create ticket/i }));

    await waitFor(() => {
      expect(createDealServiceTicket).toHaveBeenCalledWith(17, {});
    });
  });
});
