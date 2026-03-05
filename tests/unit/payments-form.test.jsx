import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../../src/lib/api/client';
import * as paymentsApi from '../../src/lib/api/payments';
import PaymentForm from '../../src/modules/payments/PaymentForm';

// Mock dependencies
vi.mock('../../src/lib/api/payments');
vi.mock('../../src/lib/api/client');
vi.mock('../../src/router');
vi.mock('../../src/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock custom components
vi.mock('../../src/components/ui-ReferenceSelect', () => ({
  default: ({ value, onChange, placeholder, id, 'data-testid': testId }) => (
    <select
      id={id}
      data-testid={testId}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      <option value="RUB">RUB</option>
      <option value="USD">USD</option>
    </select>
  ),
}));

vi.mock('../../src/components/EntitySelect', () => ({
  default: ({ value, onChange, placeholder, id, 'data-testid': testId }) => (
    <select
      id={id}
      data-testid={testId}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      <option value="5">Important Deal</option>
    </select>
  ),
}));

vi.mock('../../src/components/ui-DatePicker.jsx', () => ({
  DatePicker: ({ value, onChange, id }) => (
    <input
      id={id}
      type="date"
      value={value ? value.format('YYYY-MM-DD') : ''}
      onChange={(e) => onChange(dayjs(e.target.value))}
    />
  ),
}));

describe('PaymentForm', () => {
  const mockPayment = {
    id: 1,
    amount: 1500,
    currency: 'RUB',
    status: 'r',
    deal: 5,
    payment_date: '2024-01-15',
    contract_number: 'C123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    paymentsApi.createPayment.mockResolvedValue({});
    paymentsApi.getPayment.mockResolvedValue(mockPayment);
    client.getDeals.mockResolvedValue({ results: [{ id: 5, name: 'Important Deal' }] });
  });

  describe('Create Mode', () => {
    it('should have all required form fields', () => {
      render(<PaymentForm />);
      
      expect(screen.getByLabelText(/сумма/i)).toBeInTheDocument();
      expect(screen.getByTestId('currency-select')).toBeInTheDocument();
      expect(screen.getByLabelText(/статус/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/сделка/i)).toBeInTheDocument();
    });

    it('should validate required fields on submit', async () => {
      render(<PaymentForm />);
      
      const submitButton = screen.getByRole('button', { name: /создать/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // "Введите сумму" vs "Введите сумму" (capitalization doesn't matter with /i)
        expect(screen.getByText(/введите сумму|выберите сделку/i)).toBeInTheDocument();
      });
    });

    it('should create payment with valid data', async () => {
      render(<PaymentForm />);
      
      fireEvent.change(screen.getByLabelText(/сумма/i), { target: { value: '2000' } });
      fireEvent.change(screen.getByTestId('currency-select'), { target: { value: 'USD' } });
      fireEvent.change(screen.getByLabelText(/статус/i), { target: { value: 'g' } });
      fireEvent.change(screen.getByTestId('deal-select'), { target: { value: '5' } });

      fireEvent.click(screen.getByRole('button', { name: /создать/i }));

      await waitFor(() => {
        expect(paymentsApi.createPayment).toHaveBeenCalledWith(expect.objectContaining({
          amount: 2000,
          currency: 'USD',
          status: 'g',
          deal: '5',
        }));
      });
    });
  });

  describe('Edit Mode', () => {
    it('should load payment data on mount', async () => {
      render(<PaymentForm id={1} />);
      
      await waitFor(() => {
        expect(paymentsApi.getPayment).toHaveBeenCalledWith(1);
      });

      expect(screen.getByLabelText(/сумма/i).value).toBe('1500');
    });
  });
});
