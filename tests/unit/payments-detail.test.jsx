import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as paymentsApi from '../../src/lib/api/payments';
import PaymentDetail from '../../src/modules/payments/PaymentDetail';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/payments');
vi.mock('../../src/lib/rbac.js', () => ({
  canWrite: vi.fn(() => true),
}));
vi.mock('../../src/router', () => ({
  navigate: vi.fn(),
}));

describe('PaymentDetail', () => {
  const mockPayment = {
    id: 1,
    amount: 1500.50,
    currency_name: 'RUB',
    status: 'r',
    deal: 5,
    deal_name: 'Important Deal',
    payment_date: '2024-01-15',
    contract_number: 'CONTRACT-001',
    invoice_number: 'INV-123',
    order_number: 'ORD-456',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should show loading state while fetching payment', () => {
      paymentsApi.getPayment.mockImplementation(() => new Promise(() => {}));
      render(<PaymentDetail id={1} />);
      expect(document.querySelector('.ant-skeleton')).toBeTruthy();
    });

    it('should display payment data after loading', async () => {
      paymentsApi.getPayment.mockResolvedValue(mockPayment);
      render(<PaymentDetail id={1} />);
      
      await waitFor(() => {
        expect(screen.getByText('Платеж')).toBeInTheDocument();
      });

      // formatCurrency(1500.50, 'RUB') -> "1 500,50 ₽" (or similar)
      // We use broad regex to be safe with spaces/symbols
      expect(screen.getByText(/1.*500.*₽|1.*500.*RUB/)).toBeInTheDocument();
    });
  });

  describe('Payment Information Display', () => {
    beforeEach(async () => {
      paymentsApi.getPayment.mockResolvedValue(mockPayment);
    });

    it('should display payment amount with currency', async () => {
      render(<PaymentDetail id={1} />);
      await waitFor(() => {
        expect(screen.getByText(/1.*500.*₽|1.*500.*RUB/)).toBeInTheDocument();
      });
    });

    it('should display payment date formatted', async () => {
      render(<PaymentDetail id={1} />);
      await waitFor(() => {
        expect(screen.getByText('15.01.2024')).toBeInTheDocument();
      });
    });

    it('should display deal information', async () => {
      render(<PaymentDetail id={1} />);
      await waitFor(() => {
        expect(screen.getByText('Important Deal')).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    beforeEach(() => {
      paymentsApi.getPayment.mockResolvedValue(mockPayment);
    });

    it('should navigate back to payments list', async () => {
      render(<PaymentDetail id={1} />);
      await waitFor(() => expect(screen.getByText('Назад')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Назад'));
      expect(router.navigate).toHaveBeenCalledWith('/payments');
    });

    it('should show delete confirmation modal', async () => {
      render(<PaymentDetail id={1} />);
      await waitFor(() => expect(screen.getByText('Удалить')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Удалить'));
      expect(screen.getByText('Удалить платеж?')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should handle zero amount', async () => {
      paymentsApi.getPayment.mockResolvedValue({ ...mockPayment, amount: 0 });
      render(<PaymentDetail id={1} />);
      await waitFor(() => {
        expect(screen.getByText(/0.*₽|0.*RUB/)).toBeInTheDocument();
      });
    });

    it('should fall back to plain numeric formatting when currency metadata is missing', async () => {
      paymentsApi.getPayment.mockResolvedValue({ ...mockPayment, currency_name: null });
      render(<PaymentDetail id={1} />);
      await waitFor(() => {
        expect(screen.getByText(/1.*500/)).toBeInTheDocument();
      });
    });
  });
});
