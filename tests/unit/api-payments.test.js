import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as paymentsApi from '../../src/lib/api/payments';
import { api } from '../../src/lib/api/client';

// Mock the API client
vi.mock('../../src/lib/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Payments API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPayments', () => {
    it('should fetch payments with default parameters', async () => {
      const mockResponse = {
        count: 2,
        results: [
          { id: 1, amount: 1000, status: 'r' },
          { id: 2, amount: 2000, status: 'g' },
        ],
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await paymentsApi.getPayments();

      expect(api.get).toHaveBeenCalledWith('/api/payments/', { params: {} });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch payments with pagination parameters', async () => {
      const mockResponse = { count: 100, results: [] };
      api.get.mockResolvedValue(mockResponse);

      await paymentsApi.getPayments({ page: 2, page_size: 20 });

      expect(api.get).toHaveBeenCalledWith('/api/payments/', {
        params: { page: 2, page_size: 20 },
      });
    });

    it('should fetch payments with search parameter', async () => {
      const mockResponse = { count: 1, results: [{ id: 1, amount: 1000 }] };
      api.get.mockResolvedValue(mockResponse);

      await paymentsApi.getPayments({ search: 'invoice-123' });

      expect(api.get).toHaveBeenCalledWith('/api/payments/', {
        params: { search: 'invoice-123' },
      });
    });

    it('should fetch payments with status filter', async () => {
      const mockResponse = { count: 1, results: [{ id: 1, status: 'r' }] };
      api.get.mockResolvedValue(mockResponse);

      await paymentsApi.getPayments({ status: 'r' });

      expect(api.get).toHaveBeenCalledWith('/api/payments/', {
        params: { status: 'r' },
      });
    });

    it('should fetch payments with deal filter', async () => {
      const mockResponse = { count: 1, results: [{ id: 1, deal: 5 }] };
      api.get.mockResolvedValue(mockResponse);

      await paymentsApi.getPayments({ deal: 5 });

      expect(api.get).toHaveBeenCalledWith('/api/payments/', {
        params: { deal: 5 },
      });
    });

    it('should handle API errors gracefully', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await expect(paymentsApi.getPayments()).rejects.toThrow('Network error');
    });
  });

  describe('getPayment', () => {
    it('should fetch a single payment by ID', async () => {
      const mockPayment = {
        id: 1,
        amount: 1000,
        status: 'r',
        deal: 5,
      };
      api.get.mockResolvedValue(mockPayment);

      const result = await paymentsApi.getPayment(1);

      expect(api.get).toHaveBeenCalledWith('/api/payments/1/');
      expect(result).toEqual(mockPayment);
    });

    it('should handle non-existent payment ID', async () => {
      api.get.mockRejectedValue(new Error('Not found'));

      await expect(paymentsApi.getPayment(999)).rejects.toThrow('Not found');
    });
  });

  describe('createPayment', () => {
    it('should create a new payment with required fields', async () => {
      const paymentData = {
        amount: 1500.50,
        currency: 1,
        status: 'r',
        deal: 10,
        payment_date: '2024-01-15',
      };
      const mockResponse = { id: 1, ...paymentData };
      api.post.mockResolvedValue(mockResponse);

      const result = await paymentsApi.createPayment(paymentData);

      expect(api.post).toHaveBeenCalledWith('/api/payments/', { body: paymentData });
      expect(result).toEqual(mockResponse);
    });

    it('should create payment with optional fields', async () => {
      const paymentData = {
        amount: 2000,
        currency: 1,
        status: 'g',
        deal: 5,
        contract_number: 'CONTRACT-001',
        invoice_number: 'INV-123',
        order_number: 'ORD-456',
      };
      const mockResponse = { id: 2, ...paymentData };
      api.post.mockResolvedValue(mockResponse);

      const result = await paymentsApi.createPayment(paymentData);

      expect(api.post).toHaveBeenCalledWith('/api/payments/', { body: paymentData });
      expect(result).toEqual(mockResponse);
    });

    it('should handle validation errors', async () => {
      const invalidData = { amount: -100 };
      api.post.mockRejectedValue(new Error('Validation error'));

      await expect(paymentsApi.createPayment(invalidData)).rejects.toThrow('Validation error');
    });
  });

  describe('updatePayment', () => {
    it('should update a payment with full data', async () => {
      const updateData = {
        amount: 2500,
        currency: 1,
        status: 'r',
        deal: 5,
        payment_date: '2024-01-20',
      };
      const mockResponse = { id: 1, ...updateData };
      api.put.mockResolvedValue(mockResponse);

      const result = await paymentsApi.updatePayment(1, updateData);

      expect(api.put).toHaveBeenCalledWith('/api/payments/1/', { body: updateData });
      expect(result).toEqual(mockResponse);
    });

    it('should handle update errors', async () => {
      api.put.mockRejectedValue(new Error('Update failed'));

      await expect(paymentsApi.updatePayment(1, {})).rejects.toThrow('Update failed');
    });
  });

  describe('patchPayment', () => {
    it('should partially update a payment', async () => {
      const patchData = { status: 'g' };
      const mockResponse = { id: 1, amount: 1000, status: 'g' };
      api.patch.mockResolvedValue(mockResponse);

      const result = await paymentsApi.patchPayment(1, patchData);

      expect(api.patch).toHaveBeenCalledWith('/api/payments/1/', { body: patchData });
      expect(result).toEqual(mockResponse);
    });

    it('should update only specified fields', async () => {
      const patchData = { contract_number: 'NEW-CONTRACT-001' };
      api.patch.mockResolvedValue({ id: 1, contract_number: 'NEW-CONTRACT-001' });

      await paymentsApi.patchPayment(1, patchData);

      expect(api.patch).toHaveBeenCalledWith('/api/payments/1/', { body: patchData });
    });
  });

  describe('deletePayment', () => {
    it('should delete a payment by ID', async () => {
      api.delete.mockResolvedValue(undefined);

      await paymentsApi.deletePayment(1);

      expect(api.delete).toHaveBeenCalledWith('/api/payments/1/');
    });

    it('should handle delete errors', async () => {
      api.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(paymentsApi.deletePayment(1)).rejects.toThrow('Delete failed');
    });
  });

  describe('getPaymentSummary', () => {
    it('should fetch payment summary with default parameters', async () => {
      const mockSummary = {
        total_amount: 10000,
        by_currency: { RUB: 8000, USD: 2000 },
      };
      api.get.mockResolvedValue(mockSummary);

      const result = await paymentsApi.getPaymentSummary();

      expect(api.get).toHaveBeenCalledWith('/api/payments/summary/', { params: {} });
      expect(result).toEqual(mockSummary);
    });

    it('should fetch payment summary with date range', async () => {
      const mockSummary = { total_amount: 5000 };
      api.get.mockResolvedValue(mockSummary);

      await paymentsApi.getPaymentSummary({
        date_from: '2024-01-01',
        date_to: '2024-01-31',
      });

      expect(api.get).toHaveBeenCalledWith('/api/payments/summary/', {
        params: { date_from: '2024-01-01', date_to: '2024-01-31' },
      });
    });

    it('should fetch payment summary with period', async () => {
      api.get.mockResolvedValue({ total_amount: 10000 });

      await paymentsApi.getPaymentSummary({ period: 'month' });

      expect(api.get).toHaveBeenCalledWith('/api/payments/summary/', {
        params: { period: 'month' },
      });
    });
  });

  describe('Utility Functions', () => {
    describe('getPaymentsByDeal', () => {
      it('should fetch payments filtered by deal ID', async () => {
        const mockResponse = { count: 3, results: [] };
        api.get.mockResolvedValue(mockResponse);

        await paymentsApi.getPaymentsByDeal(5);

        expect(api.get).toHaveBeenCalledWith('/api/payments/', {
          params: { deal: 5 },
        });
      });

      it('should include additional parameters', async () => {
        api.get.mockResolvedValue({ count: 0, results: [] });

        await paymentsApi.getPaymentsByDeal(5, { status: 'r' });

        expect(api.get).toHaveBeenCalledWith('/api/payments/', {
          params: { deal: 5, status: 'r' },
        });
      });
    });

    describe('getPaymentsByContact', () => {
      it('should fetch payments filtered by contact ID', async () => {
        const mockResponse = { count: 2, results: [] };
        api.get.mockResolvedValue(mockResponse);

        await paymentsApi.getPaymentsByContact(10);

        expect(api.get).toHaveBeenCalledWith('/api/payments/', {
          params: { contact: 10 },
        });
      });
    });

    describe('getPaymentsByStatus', () => {
      it('should fetch payments by status', async () => {
        const mockResponse = { count: 5, results: [] };
        api.get.mockResolvedValue(mockResponse);

        await paymentsApi.getPaymentsByStatus('r');

        expect(api.get).toHaveBeenCalledWith('/api/payments/', {
          params: { status: 'r' },
        });
      });
    });

    describe('getPaymentsByDateRange', () => {
      it('should fetch payments within date range', async () => {
        const mockResponse = { count: 10, results: [] };
        api.get.mockResolvedValue(mockResponse);

        await paymentsApi.getPaymentsByDateRange('2024-01-01', '2024-01-31');

        expect(api.get).toHaveBeenCalledWith('/api/payments/', {
          params: { date_from: '2024-01-01', date_to: '2024-01-31' },
        });
      });

      it('should include additional parameters', async () => {
        api.get.mockResolvedValue({ count: 0, results: [] });

        await paymentsApi.getPaymentsByDateRange('2024-01-01', '2024-01-31', {
          status: 'r',
          deal: 5,
        });

        expect(api.get).toHaveBeenCalledWith('/api/payments/', {
          params: {
            date_from: '2024-01-01',
            date_to: '2024-01-31',
            status: 'r',
            deal: 5,
          },
        });
      });
    });

    describe('getPaymentsThisMonth', () => {
      it('should fetch payments for current month', async () => {
        const mockResponse = { count: 15, results: [] };
        api.get.mockResolvedValue(mockResponse);

        await paymentsApi.getPaymentsThisMonth();

        expect(api.get).toHaveBeenCalledWith('/api/payments/', {
          params: expect.objectContaining({
            date_from: expect.any(String),
            date_to: expect.any(String),
          }),
        });
      });
    });

    describe('getPaymentsToday', () => {
      it('should fetch payments for today', async () => {
        const mockResponse = { count: 5, results: [] };
        api.get.mockResolvedValue(mockResponse);

        await paymentsApi.getPaymentsToday();

        const today = new Date().toISOString().split('T')[0];
        expect(api.get).toHaveBeenCalledWith('/api/payments/', {
          params: { date_from: today, date_to: today },
        });
      });
    });

    describe('markPaymentCompleted', () => {
      it('should mark payment as completed', async () => {
        const mockResponse = { id: 1, status: 'completed' };
        api.patch.mockResolvedValue(mockResponse);

        const result = await paymentsApi.markPaymentCompleted(1);

        expect(api.patch).toHaveBeenCalledWith('/api/payments/1/', {
          body: { status: 'completed' },
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('markPaymentFailed', () => {
      it('should mark payment as failed', async () => {
        const mockResponse = { id: 1, status: 'failed' };
        api.patch.mockResolvedValue(mockResponse);

        const result = await paymentsApi.markPaymentFailed(1);

        expect(api.patch).toHaveBeenCalledWith('/api/payments/1/', {
          body: { status: 'failed' },
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('refundPayment', () => {
      it('should mark payment as refunded', async () => {
        const mockResponse = { id: 1, status: 'refunded' };
        api.patch.mockResolvedValue(mockResponse);

        const result = await paymentsApi.refundPayment(1);

        expect(api.patch).toHaveBeenCalledWith('/api/payments/1/', {
          body: { status: 'refunded' },
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getTotalRevenue', () => {
      it('should calculate total revenue for period', async () => {
        const mockSummary = { total_amount: 50000 };
        api.get.mockResolvedValue(mockSummary);

        const result = await paymentsApi.getTotalRevenue('2024-01-01', '2024-01-31');

        expect(api.get).toHaveBeenCalledWith('/api/payments/summary/', {
          params: { date_from: '2024-01-01', date_to: '2024-01-31' },
        });
        expect(result).toBe(50000);
      });

      it('should return 0 if no total_amount', async () => {
        api.get.mockResolvedValue({});

        const result = await paymentsApi.getTotalRevenue('2024-01-01', '2024-01-31');

        expect(result).toBe(0);
      });
    });

    describe('getRevenueByCurrency', () => {
      it('should return revenue grouped by currency', async () => {
        const mockSummary = {
          by_currency: { RUB: 30000, USD: 20000 },
        };
        api.get.mockResolvedValue(mockSummary);

        const result = await paymentsApi.getRevenueByCurrency('2024-01-01', '2024-01-31');

        expect(result).toEqual({ RUB: 30000, USD: 20000 });
      });

      it('should return empty object if no by_currency data', async () => {
        api.get.mockResolvedValue({});

        const result = await paymentsApi.getRevenueByCurrency('2024-01-01', '2024-01-31');

        expect(result).toEqual({});
      });
    });

    describe('getMonthlySummary', () => {
      it('should fetch monthly summary for current year', async () => {
        const mockSummary = { total_amount: 100000 };
        api.get.mockResolvedValue(mockSummary);

        const result = await paymentsApi.getMonthlySummary();

        const year = new Date().getFullYear();
        expect(api.get).toHaveBeenCalledWith('/api/payments/summary/', {
          params: {
            date_from: `${year}-01-01`,
            date_to: `${year}-12-31`,
            period: 'month',
          },
        });
        expect(result).toEqual(mockSummary);
      });
    });
  });
});
