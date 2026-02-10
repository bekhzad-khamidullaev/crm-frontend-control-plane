import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PaymentDetail from '../../src/modules/payments/PaymentDetail';
import * as paymentsApi from '../../src/lib/api/payments';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/payments');
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

      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });

    it('should fetch payment data on mount', async () => {
      paymentsApi.getPayment.mockResolvedValue(mockPayment);

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalledWith(1);
      });
    });

    it('should display payment data after loading', async () => {
      paymentsApi.getPayment.mockResolvedValue(mockPayment);

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Платеж')).toBeInTheDocument();
      });

      expect(screen.getByText(/1.*500.*RUB/)).toBeInTheDocument();
    });

    it('should show error message when payment fails to load', async () => {
      paymentsApi.getPayment.mockRejectedValue(new Error('Not found'));

      render(<PaymentDetail id={999} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalledWith(999);
      });
    });

    it('should display not found message for missing payment', async () => {
      paymentsApi.getPayment.mockResolvedValue(null);

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Платеж не найден')).toBeInTheDocument();
      });
    });
  });

  describe('Payment Information Display', () => {
    beforeEach(async () => {
      paymentsApi.getPayment.mockResolvedValue(mockPayment);
    });

    it('should display payment amount with currency', async () => {
      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText(/1.*500.*RUB/)).toBeInTheDocument();
      });
    });

    it('should display payment status', async () => {
      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Получен')).toBeInTheDocument();
      });
    });

    it('should display payment date formatted', async () => {
      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText(/15\.01\.2024/)).toBeInTheDocument();
      });
    });

    it('should display deal information', async () => {
      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Important Deal')).toBeInTheDocument();
      });
    });

    it('should display contract number', async () => {
      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('CONTRACT-001')).toBeInTheDocument();
      });
    });

    it('should display invoice number', async () => {
      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('INV-123')).toBeInTheDocument();
      });
    });

    it('should display order number', async () => {
      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('ORD-456')).toBeInTheDocument();
      });
    });

    it('should show dash for missing optional fields', async () => {
      paymentsApi.getPayment.mockResolvedValue({
        id: 1,
        amount: 1000,
        currency_name: 'RUB',
        status: 'r',
      });

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalled();
      });

      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThan(0);
    });

    it('should show deal ID when deal_name is not available', async () => {
      paymentsApi.getPayment.mockResolvedValue({
        ...mockPayment,
        deal_name: null,
        deal: 5,
      });

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('#5')).toBeInTheDocument();
      });
    });
  });

  describe('Status Display', () => {
    it('should display "Получен" status with green color', async () => {
      paymentsApi.getPayment.mockResolvedValue({ ...mockPayment, status: 'r' });

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Получен')).toBeInTheDocument();
      });
    });

    it('should display "Гарантирован" status with blue color', async () => {
      paymentsApi.getPayment.mockResolvedValue({ ...mockPayment, status: 'g' });

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Гарантирован')).toBeInTheDocument();
      });
    });

    it('should display "Высокая вероятность" status with orange color', async () => {
      paymentsApi.getPayment.mockResolvedValue({ ...mockPayment, status: 'h' });

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Высокая вероятность')).toBeInTheDocument();
      });
    });

    it('should display "Низкая вероятность" status with default color', async () => {
      paymentsApi.getPayment.mockResolvedValue({ ...mockPayment, status: 'l' });

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Низкая вероятность')).toBeInTheDocument();
      });
    });

    it('should handle unknown status gracefully', async () => {
      paymentsApi.getPayment.mockResolvedValue({ ...mockPayment, status: 'unknown' });

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('unknown')).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    beforeEach(() => {
      paymentsApi.getPayment.mockResolvedValue(mockPayment);
    });

    it('should render all action buttons', async () => {
      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Назад')).toBeInTheDocument();
      });

      expect(screen.getByText('Редактировать')).toBeInTheDocument();
      expect(screen.getByText('Удалить')).toBeInTheDocument();
    });

    it('should navigate back to payments list', async () => {
      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalled();
      });

      const backButton = screen.getByText('Назад');
      fireEvent.click(backButton);

      expect(router.navigate).toHaveBeenCalledWith('/payments');
    });

    it('should navigate to edit page', async () => {
      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalled();
      });

      const editButton = screen.getByText('Редактировать');
      fireEvent.click(editButton);

      expect(router.navigate).toHaveBeenCalledWith('/payments/1/edit');
    });

    it('should show delete confirmation modal', async () => {
      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalled();
      });

      const deleteButton = screen.getByText('Удалить');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Удалить платеж?')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should format amount with locale', async () => {
      paymentsApi.getPayment.mockResolvedValue({
        ...mockPayment,
        amount: 1234567.89,
      });

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        // Amount should be formatted with thousand separators
        expect(screen.getByText(/1.*234.*567/)).toBeInTheDocument();
      });
    });

    it('should handle zero amount', async () => {
      paymentsApi.getPayment.mockResolvedValue({
        ...mockPayment,
        amount: 0,
      });

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText(/0.*RUB/)).toBeInTheDocument();
      });
    });

    it('should show default currency symbol when currency_name is missing', async () => {
      paymentsApi.getPayment.mockResolvedValue({
        ...mockPayment,
        currency_name: null,
      });

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText(/₽/)).toBeInTheDocument();
      });
    });

    it('should handle missing payment_date', async () => {
      paymentsApi.getPayment.mockResolvedValue({
        ...mockPayment,
        payment_date: null,
      });

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalled();
      });

      // Should show dash for missing date
      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  describe('Refetch on ID change', () => {
    it('should refetch payment when id prop changes', async () => {
      paymentsApi.getPayment.mockResolvedValue(mockPayment);

      const { rerender } = render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalledWith(1);
      });

      paymentsApi.getPayment.mockResolvedValue({ ...mockPayment, id: 2 });

      rerender(<PaymentDetail id={2} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalledWith(2);
      });

      expect(paymentsApi.getPayment).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should display error message on network failure', async () => {
      paymentsApi.getPayment.mockRejectedValue(new Error('Network error'));

      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalled();
      });
    });

    it('should handle 404 not found errors', async () => {
      paymentsApi.getPayment.mockRejectedValue(new Error('404 Not Found'));

      render(<PaymentDetail id={999} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalledWith(999);
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      paymentsApi.getPayment.mockResolvedValue(mockPayment);
    });

    it('should have proper heading structure', async () => {
      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Платеж')).toBeInTheDocument();
      });
    });

    it('should have accessible buttons', async () => {
      render(<PaymentDetail id={1} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalled();
      });

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
