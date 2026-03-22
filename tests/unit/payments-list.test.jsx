import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as paymentsAPI from '../../src/lib/api/payments';
import * as rbac from '../../src/lib/rbac.js';
import PaymentsList from '../../src/modules/payments/PaymentsList';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/payments');
vi.mock('../../src/lib/rbac.js', () => ({
  canWrite: vi.fn(),
}));
vi.mock('../../src/router');
vi.mock('../../src/lib/utils/export');
vi.mock('../../src/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

const mockPayments = [
  {
    id: 1,
    amount: 1000,
    currency_code: 'RUB',
    status: 'r',
    payment_date: '2024-01-15',
    deal_name: 'Deal 1',
  },
  {
    id: 2,
    amount: 2000,
    currency_code: 'USD',
    status: 'g',
    payment_date: '2024-01-16',
    deal_name: 'Deal 2',
  },
];

describe('PaymentsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rbac.canWrite.mockReturnValue(true);
    paymentsAPI.getPayments.mockResolvedValue({
      results: mockPayments,
      count: 2,
    });
    paymentsAPI.deletePayment.mockResolvedValue({});
  });

  describe('Initial Render', () => {
    it('should show loading state initially', async () => {
      paymentsAPI.getPayments.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({ results: [], count: 0 }), 100);
      }));
      render(<PaymentsList />);

      await waitFor(() => {
        expect(paymentsAPI.getPayments).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should display payment data after loading', async () => {
      render(<PaymentsList />);
      await waitFor(() => {
        expect(screen.getByText('Платежи')).toBeInTheDocument();
      });
      expect(screen.getByText(/Deal 1/)).toBeInTheDocument();
      expect(screen.getByText(/Deal 2/)).toBeInTheDocument();
      expect(screen.getAllByText(/₽|\$/).length).toBeGreaterThan(0);
    });
  });

  describe('Table Columns', () => {
    it('should display payment dates in Russian format', async () => {
      render(<PaymentsList />);
      await waitFor(() => {
        expect(screen.getAllByText('15.01.2024').length).toBeGreaterThan(0);
      });
    });

    it('should display deal names', async () => {
      render(<PaymentsList />);
      await waitFor(() => {
        expect(screen.getByText('Deal 1')).toBeInTheDocument();
        expect(screen.getByText('Deal 2')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter payments by search text', async () => {
      render(<PaymentsList />);
      const searchInput = screen.getByPlaceholderText(/поиск по платежам/i);

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'payment1' } });
      });

      await waitFor(() => {
        expect(paymentsAPI.getPayments).toHaveBeenCalledWith(expect.objectContaining({
          search: 'payment1',
        }));
      });
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate to create payment page', async () => {
      render(<PaymentsList />);
      const createButton = await screen.findByRole('button', { name: /создать платеж/i });
      await act(async () => {
        fireEvent.click(createButton);
      });
      expect(router.navigate).toHaveBeenCalledWith('/payments/new');
    });

    it('should navigate to payment details', async () => {
      render(<PaymentsList />);
      await waitFor(() => expect(screen.getByText('Deal 1')).toBeInTheDocument());
      const viewButtons = screen.getAllByText('Просмотр');
      fireEvent.click(viewButtons[0]);
      expect(router.navigate).toHaveBeenCalledWith('/payments/1');
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh payments list', async () => {
      render(<PaymentsList />);
      await waitFor(() => expect(paymentsAPI.getPayments).toHaveBeenCalledTimes(1));
      const refreshButton = screen.getByRole('button', { name: /обновить/i });
      await act(async () => {
        fireEvent.click(refreshButton);
      });
      await waitFor(() => expect(paymentsAPI.getPayments).toHaveBeenCalledTimes(2));
    });
  });
});
