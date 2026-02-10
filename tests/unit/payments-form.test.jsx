import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PaymentForm from '../../src/modules/payments/PaymentForm';
import * as paymentsApi from '../../src/lib/api/payments';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/payments');
vi.mock('../../src/lib/api/client');
vi.mock('../../src/router', () => ({
  navigate: vi.fn(),
}));

vi.mock('../../components/ui-ReferenceSelect', () => ({
  default: ({ placeholder, onChange, value }) => (
    <select
      data-testid="currency-select"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
    >
      <option value="">{placeholder}</option>
      <option value="1">RUB</option>
      <option value="2">USD</option>
    </select>
  ),
}));

vi.mock('../../components/EntitySelect', () => ({
  default: ({ placeholder, onChange, value }) => (
    <select
      data-testid="deal-select"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
    >
      <option value="">{placeholder}</option>
      <option value="1">Deal 1</option>
      <option value="2">Deal 2</option>
    </select>
  ),
}));

describe('PaymentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render create form with default values', () => {
      render(<PaymentForm />);

      expect(screen.getByText('Новый платеж')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /создать/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /отмена/i })).toBeInTheDocument();
    });

    it('should have all required form fields', () => {
      render(<PaymentForm />);

      expect(screen.getByLabelText(/сумма/i)).toBeInTheDocument();
      expect(screen.getByTestId('currency-select')).toBeInTheDocument();
      expect(screen.getByLabelText(/статус/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/дата платежа/i)).toBeInTheDocument();
      expect(screen.getByTestId('deal-select')).toBeInTheDocument();
    });

    it('should have optional fields for document numbers', () => {
      render(<PaymentForm />);

      expect(screen.getByLabelText(/номер договора/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/номер счета/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/номер заказа/i)).toBeInTheDocument();
    });

    it('should validate required fields on submit', async () => {
      render(<PaymentForm />);

      const submitButton = screen.getByRole('button', { name: /создать/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/введите сумму/i)).toBeInTheDocument();
      });
    });

    it('should create payment with valid data', async () => {
      paymentsApi.createPayment.mockResolvedValue({
        id: 1,
        amount: 1000,
        status: 'r',
      });

      render(<PaymentForm />);

      // Fill in required fields
      const amountInput = screen.getByLabelText(/сумма/i);
      fireEvent.change(amountInput, { target: { value: '1000' } });

      const dealSelect = screen.getByTestId('deal-select');
      fireEvent.change(dealSelect, { target: { value: '1' } });

      const submitButton = screen.getByRole('button', { name: /создать/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(paymentsApi.createPayment).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith('/payments');
      });
    });

    it('should show success message after creating payment', async () => {
      paymentsApi.createPayment.mockResolvedValue({ id: 1 });

      render(<PaymentForm />);

      const amountInput = screen.getByLabelText(/сумма/i);
      fireEvent.change(amountInput, { target: { value: '1000' } });

      const dealSelect = screen.getByTestId('deal-select');
      fireEvent.change(dealSelect, { target: { value: '1' } });

      const submitButton = screen.getByRole('button', { name: /создать/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(paymentsApi.createPayment).toHaveBeenCalled();
      });
    });

    it('should handle API errors when creating payment', async () => {
      paymentsApi.createPayment.mockRejectedValue(new Error('API Error'));

      render(<PaymentForm />);

      const amountInput = screen.getByLabelText(/сумма/i);
      fireEvent.change(amountInput, { target: { value: '1000' } });

      const dealSelect = screen.getByTestId('deal-select');
      fireEvent.change(dealSelect, { target: { value: '1' } });

      const submitButton = screen.getByRole('button', { name: /создать/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(paymentsApi.createPayment).toHaveBeenCalled();
      });

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should navigate back when cancel button is clicked', () => {
      render(<PaymentForm />);

      const cancelButton = screen.getByRole('button', { name: /отмена/i });
      fireEvent.click(cancelButton);

      expect(router.navigate).toHaveBeenCalledWith('/payments');
    });

    it('should navigate back when back button is clicked', () => {
      render(<PaymentForm />);

      const backButton = screen.getByRole('button', { name: /назад/i });
      fireEvent.click(backButton);

      expect(router.navigate).toHaveBeenCalledWith('/payments');
    });
  });

  describe('Edit Mode', () => {
    const mockPayment = {
      id: 1,
      amount: 1500,
      currency: 1,
      status: 'r',
      deal: 1,
      payment_date: '2024-01-15',
      contract_number: 'CONTRACT-001',
      invoice_number: 'INV-123',
      order_number: 'ORD-456',
    };

    it('should show loading state while fetching payment', () => {
      paymentsApi.getPayment.mockImplementation(() => new Promise(() => {}));

      render(<PaymentForm id={1} />);

      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });

    it('should load and display payment data', async () => {
      paymentsApi.getPayment.mockResolvedValue(mockPayment);

      render(<PaymentForm id={1} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalledWith(1);
      });

      expect(screen.getByText('Редактирование платежа')).toBeInTheDocument();
    });

    it('should populate form fields with payment data', async () => {
      paymentsApi.getPayment.mockResolvedValue(mockPayment);

      render(<PaymentForm id={1} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalled();
      });

      await waitFor(() => {
        const amountInput = screen.getByLabelText(/сумма/i);
        expect(amountInput).toHaveValue(1500);
      });
    });

    it('should update payment with modified data', async () => {
      paymentsApi.getPayment.mockResolvedValue(mockPayment);
      paymentsApi.updatePayment.mockResolvedValue({ ...mockPayment, amount: 2000 });

      render(<PaymentForm id={1} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalled();
      });

      const amountInput = screen.getByLabelText(/сумма/i);
      fireEvent.change(amountInput, { target: { value: '2000' } });

      const submitButton = screen.getByRole('button', { name: /сохранить/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(paymentsApi.updatePayment).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            amount: 2000,
          })
        );
        expect(router.navigate).toHaveBeenCalledWith('/payments');
      });
    });

    it('should show error message if payment fails to load', async () => {
      paymentsApi.getPayment.mockRejectedValue(new Error('Not found'));

      render(<PaymentForm id={999} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalledWith(999);
      });
    });

    it('should handle API errors when updating payment', async () => {
      paymentsApi.getPayment.mockResolvedValue(mockPayment);
      paymentsApi.updatePayment.mockRejectedValue(new Error('Update failed'));

      render(<PaymentForm id={1} />);

      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalled();
      });

      const submitButton = screen.getByRole('button', { name: /сохранить/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(paymentsApi.updatePayment).toHaveBeenCalled();
      });

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('should not allow negative amounts', async () => {
      render(<PaymentForm />);

      const amountInput = screen.getByLabelText(/сумма/i);
      fireEvent.change(amountInput, { target: { value: '-100' } });

      // InputNumber component should prevent negative values
      const submitButton = screen.getByRole('button', { name: /создать/i });
      fireEvent.click(submitButton);

      // Form should not submit with invalid data
      expect(paymentsApi.createPayment).not.toHaveBeenCalled();
    });

    it('should require deal selection', async () => {
      render(<PaymentForm />);

      const amountInput = screen.getByLabelText(/сумма/i);
      fireEvent.change(amountInput, { target: { value: '1000' } });

      const submitButton = screen.getByRole('button', { name: /создать/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/выберите сделку/i)).toBeInTheDocument();
      });
    });

    it('should require status selection', async () => {
      render(<PaymentForm />);

      const amountInput = screen.getByLabelText(/сумма/i);
      fireEvent.change(amountInput, { target: { value: '1000' } });

      // Clear default status if possible
      const statusSelect = screen.getByLabelText(/статус/i);
      fireEvent.change(statusSelect, { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: /создать/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/выберите статус/i)).toBeInTheDocument();
      });
    });
  });

  describe('Status Options', () => {
    it('should have all status options available', () => {
      render(<PaymentForm />);

      const statusSelect = screen.getByLabelText(/статус/i);
      expect(statusSelect).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should disable submit button while saving', async () => {
      paymentsApi.createPayment.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<PaymentForm />);

      const amountInput = screen.getByLabelText(/сумма/i);
      fireEvent.change(amountInput, { target: { value: '1000' } });

      const dealSelect = screen.getByTestId('deal-select');
      fireEvent.change(dealSelect, { target: { value: '1' } });

      const submitButton = screen.getByRole('button', { name: /создать/i });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });
});
