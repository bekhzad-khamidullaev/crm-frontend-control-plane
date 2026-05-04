import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as paymentsAPI from '../../src/lib/api/payments';
import PaymentsList from '../../src/modules/payments/PaymentsList';
import * as router from '../../src/router';

vi.mock('antd', () => {
  const MockApp = ({ children }) => <div>{children}</div>;
  MockApp.useApp = () => ({
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  });

  const MockButton = ({ children, onClick, icon, danger, type: variant, ...props }) => (
    <button type="button" onClick={onClick} {...props}>
      {icon}
      {children}
    </button>
  );

  const MockSpace = ({ children }) => <div>{children}</div>;
  const MockCard = ({ children }) => <div>{children}</div>;
  const MockDropdown = ({ children }) => <div>{children}</div>;
  const MockPopconfirm = ({ children }) => <div>{children}</div>;
  const MockSelect = ({ value, options = [], onChange, placeholder }) => (
    <select
      aria-label={placeholder || 'select'}
      data-testid="status-filter"
      value={value || ''}
      onChange={(event) => onChange?.(event.target.value || null)}
    >
      <option value="">Все</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
  const MockTable = ({ dataSource, columns, loading, pagination, onChange, locale }) => (
    <div data-testid="payments-table">
      {loading ? <div>Загрузка...</div> : null}
      {!loading && (!dataSource || dataSource.length === 0) ? <div>{locale?.emptyText}</div> : null}
      <table>
        <tbody>
          {(dataSource || []).map((item) => (
            <tr key={item.id}>
              {columns.map((column) => (
                <td key={column.key || column.dataIndex}>
                  {column.render ? column.render(item[column.dataIndex], item) : item[column.dataIndex]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={() =>
          onChange?.({
            current: (pagination?.current || 1) + 1,
            pageSize: pagination?.pageSize || 10,
          })
        }
      >
        Next
      </button>
    </div>
  );

  return {
    App: MockApp,
    Button: MockButton,
    Card: MockCard,
    Dropdown: MockDropdown,
    Popconfirm: MockPopconfirm,
    Select: MockSelect,
    Space: MockSpace,
    Table: MockTable,
    Typography: {
      Text: ({ children }) => <span>{children}</span>,
      Title: ({ children }) => <h1>{children}</h1>,
    },
  };
});

// Mock dependencies
vi.mock('../../src/lib/api/payments');
vi.mock('../../src/router');
vi.mock('../../src/lib/utils/export');
vi.mock('../../src/lib/rbac.js', () => ({
  canWrite: vi.fn(() => true),
}));
vi.mock('../../src/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('../../src/shared/ui/EntityListToolbar', () => ({
  EntityListToolbar: ({ searchValue, onSearchChange, onRefresh }) => (
    <div>
      <input
        data-testid="search-input"
        placeholder="Поиск..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <button type="button" onClick={onRefresh}>
        Обновить
      </button>
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
    router.navigate.mockReset();
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
      const createButton = screen.getByRole('button', { name: /создать платеж/i });
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
