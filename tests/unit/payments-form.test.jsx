import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as clientApi from '../../src/lib/api/client';
import * as paymentsApi from '../../src/lib/api/payments';
import * as rbac from '../../src/lib/rbac';
import PaymentForm from '../../src/modules/payments/PaymentForm';

vi.mock('../../src/lib/rbac', () => ({
  canWrite: vi.fn(),
}));

vi.mock('../../src/lib/api/payments', () => ({
  createPayment: vi.fn(),
  getPayment: vi.fn(),
  updatePayment: vi.fn(),
}));

vi.mock('../../src/lib/api/client', () => ({
  getDeals: vi.fn(),
  getDeal: vi.fn(),
}));

vi.mock('../../src/router', () => ({
  navigate: vi.fn(),
}));

vi.mock('../../src/components/ReferenceSelect', () => ({
  default: ({ value, onChange, placeholder, id }) => (
    <select id={id} data-testid="currency-select" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      <option value="USD">USD</option>
    </select>
  ),
}));

vi.mock('../../src/components/EntitySelect', () => ({
  default: ({ value, onChange, placeholder, id, 'data-testid': testId }) => (
    <select id={id} data-testid={testId || 'deal-select'} value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      <option value="5">Deal #5</option>
    </select>
  ),
}));

describe('PaymentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rbac.canWrite.mockReturnValue(true);
    clientApi.getDeals.mockResolvedValue({ results: [] });
    paymentsApi.getPayment.mockResolvedValue({
      id: 1,
      amount: 1500,
      status: 'r',
      deal: 5,
      payment_date: '2024-01-15',
    });
  });

  it('renders create form fields', () => {
    render(<PaymentForm />);

    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByText('Статус *')).toBeInTheDocument();
    expect(screen.getByTestId('currency-select')).toBeInTheDocument();
    expect(screen.getByText(/новый платеж/i)).toBeInTheDocument();
  });

  it('loads data in edit mode', async () => {
    render(<PaymentForm id={1} />);

    await waitFor(() => {
      expect(paymentsApi.getPayment).toHaveBeenCalledWith(1);
    });
  });

  it('renders permission denied state without write permission', () => {
    rbac.canWrite.mockReturnValue(false);

    render(<PaymentForm />);

    expect(screen.getByText('Недостаточно прав')).toBeInTheDocument();
    expect(screen.getByText('У вас нет прав для создания или редактирования платежей.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /создать|сохранить/i })).not.toBeInTheDocument();
  });
});
