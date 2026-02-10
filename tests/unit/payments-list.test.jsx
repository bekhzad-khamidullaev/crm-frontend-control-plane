import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PaymentsList from '../../src/modules/payments/PaymentsList';
import * as paymentsApi from '../../src/lib/api/payments';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/payments');
vi.mock('../../src/router', () => ({
  navigate: vi.fn(),
}));

vi.mock('../../components/ui-EnhancedTable.jsx', () => ({
  default: ({ columns, dataSource, loading, _rowSelection, _onChange }) => (
    <div data-testid="enhanced-table">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataSource.map((record) => (
              <tr key={record.id}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(record[col.dataIndex], record) : record[col.dataIndex]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ),
}));

vi.mock('../../components/ui-TableToolbar.jsx', () => ({
  default: ({ title, onSearch, onCreate, onRefresh, searchPlaceholder }) => (
    <div data-testid="table-toolbar">
      <h1>{title}</h1>
      <input
        data-testid="search-input"
        placeholder={searchPlaceholder}
        onChange={(e) => onSearch(e.target.value)}
      />
      <button onClick={onCreate}>Create</button>
      <button onClick={onRefresh}>Refresh</button>
    </div>
  ),
}));

vi.mock('../../components/ui-BulkActions.jsx', () => ({
  default: ({ selectedRowKeys, onDelete, onStatusChange, onExport }) => (
    <div data-testid="bulk-actions">
      {selectedRowKeys.length > 0 && (
        <>
          <span>Selected: {selectedRowKeys.length}</span>
          <button onClick={() => onDelete(selectedRowKeys)}>Delete</button>
          <button onClick={() => onStatusChange(selectedRowKeys)}>Change Status</button>
          <button onClick={() => onExport(selectedRowKeys)}>Export</button>
        </>
      )}
    </div>
  ),
}));

vi.mock('../../components/QuickActions.jsx', () => ({
  default: ({ record, onView, onEdit, onDelete }) => (
    <div data-testid={`quick-actions-${record.id}`}>
      <button onClick={() => onView(record)}>View</button>
      <button onClick={() => onEdit(record)}>Edit</button>
      <button onClick={() => onDelete(record)}>Delete</button>
    </div>
  ),
}));

describe('PaymentsList', () => {
  const mockPayments = [
    {
      id: 1,
      amount: 1000,
      currency_name: 'RUB',
      status: 'r',
      deal: 1,
      deal_name: 'Deal 1',
      payment_date: '2024-01-15',
      contract_number: 'CONTRACT-001',
      invoice_number: 'INV-123',
      order_number: 'ORD-456',
    },
    {
      id: 2,
      amount: 2000,
      currency_name: 'USD',
      status: 'g',
      deal: 2,
      deal_name: 'Deal 2',
      payment_date: '2024-01-20',
      contract_number: 'CONTRACT-002',
      invoice_number: 'INV-456',
      order_number: 'ORD-789',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    paymentsApi.getPayments.mockResolvedValue({
      count: mockPayments.length,
      results: mockPayments,
    });
  });

  describe('Initial Render', () => {
    it('should render payments list title', async () => {
      render(<PaymentsList />);

      expect(screen.getByText('Платежи')).toBeInTheDocument();
    });

    it('should fetch and display payments on mount', async () => {
      render(<PaymentsList />);

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalledWith({
          page: 1,
          page_size: 10,
          search: undefined,
          status: undefined,
        });
      });

      expect(screen.getByText('Deal 1')).toBeInTheDocument();
      expect(screen.getByText('Deal 2')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      paymentsApi.getPayments.mockImplementation(() => new Promise(() => {}));

      render(<PaymentsList />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle empty payments list', async () => {
      paymentsApi.getPayments.mockResolvedValue({
        count: 0,
        results: [],
      });

      render(<PaymentsList />);

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalled();
      });
    });

    it('should handle API errors gracefully', async () => {
      paymentsApi.getPayments.mockRejectedValue(new Error('Network error'));

      render(<PaymentsList />);

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalled();
      });
    });
  });

  describe('Table Columns', () => {
    it('should display all column headers', async () => {
      render(<PaymentsList />);

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalled();
      });

      expect(screen.getByText('Платеж')).toBeInTheDocument();
      expect(screen.getByText('Сделка')).toBeInTheDocument();
      expect(screen.getByText('Статус')).toBeInTheDocument();
      expect(screen.getByText('Дата платежа')).toBeInTheDocument();
      expect(screen.getByText('Действия')).toBeInTheDocument();
    });

    it('should display payment amounts with currency', async () => {
      render(<PaymentsList />);

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalled();
      });

      expect(screen.getByText(/1.*000.*RUB/)).toBeInTheDocument();
      expect(screen.getByText(/2.*000.*USD/)).toBeInTheDocument();
    });

    it('should display payment dates formatted', async () => {
      render(<PaymentsList />);

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalled();
      });

      expect(screen.getByText(/15\.01\.2024/)).toBeInTheDocument();
      expect(screen.getByText(/20\.01\.2024/)).toBeInTheDocument();
    });

  });

  describe('Search Functionality', () => {
    it('should filter payments by search text', async () => {
      render(<PaymentsList />);

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalled();
      });

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'INV-123' } });

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'INV-123',
          })
        );
      });
    });

    it('should debounce search input', async () => {
      render(<PaymentsList />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should not call API for every keystroke immediately
      expect(paymentsApi.getPayments).toHaveBeenCalledTimes(1); // Initial load
    });
  });

  describe('Pagination', () => {
    it('should fetch payments with pagination parameters', async () => {
      render(<PaymentsList />);

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 1,
            page_size: 10,
          })
        );
      });
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate to create payment page', async () => {
      render(<PaymentsList />);

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalled();
      });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      expect(router.navigate).toHaveBeenCalledWith('/payments/new');
    });

    it('should navigate to payment detail on view', async () => {
      render(<PaymentsList />);

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalled();
      });

      const viewButton = screen.getAllByText('Просмотр')[0];
      fireEvent.click(viewButton);

      expect(router.navigate).toHaveBeenCalledWith('/payments/1');
    });

    it('should navigate to edit payment page', async () => {
      render(<PaymentsList />);

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalled();
      });

      const editButton = screen.getAllByText('Редактировать')[0];
      fireEvent.click(editButton);

      expect(router.navigate).toHaveBeenCalledWith('/payments/1/edit');
    });
  });

  describe('Delete Functionality', () => {
    it('should allow delete action', async () => {
      render(<PaymentsList />);

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalled();
      });

      const deleteButton = screen.getAllByText('Удалить')[0];
      fireEvent.click(deleteButton);
    });  });

  describe('Refresh Functionality', () => {
    it('should refresh payments list', async () => {
      render(<PaymentsList />);

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(paymentsApi.getPayments).toHaveBeenCalledTimes(2);
      });
    });
  });
});
