import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as paymentsAPI from '../../src/lib/api/payments';
import PaymentsList from '../../src/modules/payments/PaymentsList';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/payments');
vi.mock('../../src/router');
vi.mock('../../src/lib/utils/export');
vi.mock('../../src/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock custom components
vi.mock('../../src/components/ui-EnhancedTable.jsx', () => ({
  default: ({ dataSource, columns, loading, pagination, onChange }) => (
    <div data-testid="enhanced-table">
      {loading && <div>Загрузка...</div>}
      <table>
        <tbody>
          {dataSource.map((item) => (
            <tr key={item.id}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(item[col.dataIndex], item) : item[col.dataIndex]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => onChange({ ...pagination, current: pagination.current + 1 })}>Next</button>
    </div>
  ),
}));

vi.mock('../../src/components/ui-TableToolbar.jsx', () => ({
  default: ({ onSearch, onCreate, onRefresh, title }) => (
    <div>
      <h1>{title}</h1>
      <input
        data-testid="search-input"
        placeholder="Поиск..."
        onChange={(e) => onSearch(e.target.value)}
      />
      <button onClick={onCreate}>Создать платеж</button>
      <button onClick={onRefresh}>Обновить</button>
    </div>
  ),
}));

const mockPayments = [
  {
    id: 1,
    amount: 1000,
    currency_name: 'RUB',
    status: 'r',
    payment_date: '2024-01-15',
    deal_name: 'Deal 1',
  },
  {
    id: 2,
    amount: 2000,
    currency_name: 'USD',
    status: 'g',
    payment_date: '2024-01-16',
    deal_name: 'Deal 2',
  },
];

describe('PaymentsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      expect(screen.getByText(/Загрузка.../)).toBeInTheDocument();
    });

    it('should display payment data after loading', async () => {
      render(<PaymentsList />);
      await waitFor(() => {
        expect(screen.getByText('Платежи')).toBeInTheDocument();
      });
      expect(screen.getByText(/1.*000.*₽|1.*000.*RUB/)).toBeInTheDocument();
      expect(screen.getByText(/2.*000.*\$|2.*000.*USD/)).toBeInTheDocument();
    });
  });

  describe('Table Columns', () => {
    it('should display payment dates in Russian format', async () => {
      render(<PaymentsList />);
      await waitFor(() => {
        expect(screen.getByText('15.01.2024')).toBeInTheDocument();
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
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'payment1' } });

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
      const createButton = screen.getByText('Создать платеж');
      fireEvent.click(createButton);
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
      const refreshButton = screen.getByText('Обновить');
      fireEvent.click(refreshButton);
      await waitFor(() => expect(paymentsAPI.getPayments).toHaveBeenCalledTimes(2));
    });
  });
});
