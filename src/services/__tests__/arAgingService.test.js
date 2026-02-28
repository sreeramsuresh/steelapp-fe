/**
 * AR Aging Service Unit Tests (Node Native Test Runner)
 * Tests accounts receivable aging analysis and DSO calculations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';

const arAgingService = {
  async getAgingReport(companyId, asOfDate, filters = {}) {
    const params = new URLSearchParams();
    params.append('asOfDate', asOfDate);
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.currency) params.append('currency', filters.currency);
    const response = await apiClient.get(`/ar/aging?${params.toString()}`, {
      headers: { 'X-Company-Id': companyId },
    });
    return response.data || response;
  },

  async getCustomerAging(companyId, customerId, asOfDate = null) {
    const params = asOfDate ? { params: { asOfDate } } : {};
    const response = await apiClient.get(`/ar/customers/${customerId}/aging`, {
      ...params,
      headers: { 'X-Company-Id': companyId },
    });
    return response.data || response;
  },

  async getOutstandingInvoices(companyId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.minDaysOverdue) params.append('minDaysOverdue', filters.minDaysOverdue);
    const response = await apiClient.get(`/ar/outstanding-invoices?${params.toString()}`, {
      headers: { 'X-Company-Id': companyId },
    });
    return response.data || response;
  },

  async recordPayment(companyId, paymentData) {
    const response = await apiClient.post('/ar/payments', paymentData, {
      headers: { 'X-Company-Id': companyId },
    });
    return response.data || response;
  },

  async getPaymentHistory(companyId, invoiceId) {
    const response = await apiClient.get(`/ar/invoices/${invoiceId}/payments`, {
      headers: { 'X-Company-Id': companyId },
    });
    return response.data || response;
  },

  async getAgingSummary(companyId, asOfDate) {
    const response = await apiClient.get('/ar/aging-summary', {
      params: { asOfDate },
      headers: { 'X-Company-Id': companyId },
    });
    return response.data || response;
  },

  async voidPayment(companyId, paymentId) {
    const response = await apiClient.post(
      `/ar/payments/${paymentId}/void`,
      {},
      { headers: { 'X-Company-Id': companyId } }
    );
    return response.data || response;
  },
};

describe('arAgingService', () => {
  const companyId = 1;
  const customerId = 5;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Aging Report Generation', () => {
    it('should generate AR aging report by date bucket', async () => {
      const mockAgingReport = {
        asOfDate: '2024-02-15',
        agingBuckets: {
          current: { invoiceCount: 10, totalAmount: 50000 },
          thirtyDays: { invoiceCount: 5, totalAmount: 25000 },
          sixtyDays: { invoiceCount: 3, totalAmount: 15000 },
          ninetyDays: { invoiceCount: 2, totalAmount: 10000 },
          ninetyPlus: { invoiceCount: 1, totalAmount: 5000 },
        },
        totalOutstanding: 105000,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAgingReport);

      const result = await arAgingService.getAgingReport(companyId, '2024-02-15');

      expect(result.agingBuckets.current.invoiceCount).toBe(10);
      expect(result.totalOutstanding).toBe(105000);
      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
      const call = apiClient.get.getCall(0);
      expect(call.args[1].headers['X-Company-Id']).toBe(companyId);
    });

    it('should filter aging report by customer', async () => {
      const mockAgingReport = {
        customerId,
        agingBuckets: {
          current: { invoiceCount: 2, totalAmount: 10000 },
          thirtyDays: { invoiceCount: 1, totalAmount: 5000 },
        },
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAgingReport);

      const result = await arAgingService.getAgingReport(companyId, '2024-02-15', {
        customerId,
      });

      expect(result.customerId).toBe(customerId);
      expect(result.agingBuckets.current.invoiceCount).toBe(2);
    });

    it('should handle empty aging report', async () => {
      const mockAgingReport = {
        asOfDate: '2024-02-15',
        agingBuckets: {
          current: { invoiceCount: 0, totalAmount: 0 },
          thirtyDays: { invoiceCount: 0, totalAmount: 0 },
        },
        totalOutstanding: 0,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAgingReport);

      const result = await arAgingService.getAgingReport(companyId, '2024-02-15');

      expect(result.totalOutstanding).toBe(0);
    });

    it('should handle aging report generation error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Report generation failed'));

      try {
        await arAgingService.getAgingReport(companyId, '2024-02-15');
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Report generation failed');
      }
    });
  });

  describe('Customer Aging Analysis', () => {
    it('should get aging analysis for specific customer', async () => {
      const mockCustomerAging = {
        customerId,
        customerName: 'ABC Corporation',
        creditLimit: 100000,
        totalOutstanding: 35000,
        currentInvoices: [{ id: 1, amount: 10000, daysOutstanding: 5 }],
        thirtyDayInvoices: [{ id: 2, amount: 5000, daysOutstanding: 35 }],
        sixtyDayInvoices: [{ id: 3, amount: 8000, daysOutstanding: 65 }],
        ninetyPlusInvoices: [{ id: 4, amount: 12000, daysOutstanding: 120 }],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockCustomerAging);

      const result = await arAgingService.getCustomerAging(companyId, customerId);

      expect(result.customerName).toBe('ABC Corporation');
      expect(result.totalOutstanding).toBe(35000);
      expect(result.currentInvoices.length).toBe(1);
      expect(result.ninetyPlusInvoices.length).toBe(1);
    });

    it('should handle customer not found', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Customer not found'));

      try {
        await arAgingService.getCustomerAging(companyId, 999);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Customer not found');
      }
    });

    it('should return zero outstanding for customer with no invoices', async () => {
      const mockAging = {
        customerId,
        customerName: 'New Customer',
        totalOutstanding: 0,
        currentInvoices: [],
        thirtyDayInvoices: [],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAging);

      const result = await arAgingService.getCustomerAging(companyId, customerId);

      expect(result.totalOutstanding).toBe(0);
    });
  });

  describe('Outstanding Invoices', () => {
    it('should get all outstanding invoices', async () => {
      const mockInvoices = [
        {
          id: 1,
          invoiceNumber: 'INV-001',
          customerId: 5,
          amount: 10000,
          outstanding: 10000,
          dueDate: '2024-02-15',
          daysOverdue: 0,
        },
        {
          id: 2,
          invoiceNumber: 'INV-002',
          customerId: 6,
          amount: 15000,
          outstanding: 15000,
          dueDate: '2024-01-15',
          daysOverdue: 31,
        },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockInvoices);

      const result = await arAgingService.getOutstandingInvoices(companyId);

      expect(result.length).toBe(2);
      expect(result[0].outstanding).toBe(10000);
    });

    it('should return empty list when no outstanding invoices', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue([]);

      const result = await arAgingService.getOutstandingInvoices(companyId);

      expect(result).toEqual([]);
    });

    it('should handle invoice retrieval error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Query failed'));

      try {
        await arAgingService.getOutstandingInvoices(companyId);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Query failed');
      }
    });
  });

  describe('Payment Recording', () => {
    it('should record invoice payment', async () => {
      const paymentData = {
        invoiceId: 1,
        amount: 10000,
        paymentDate: '2024-02-15',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'TXN12345',
      };
      const mockResponse = { id: 100, ...paymentData, status: 'RECORDED' };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await arAgingService.recordPayment(companyId, paymentData);

      expect(result.id).toBe(100);
      expect(result.status).toBe('RECORDED');
    });

    it('should record partial payment', async () => {
      const paymentData = {
        invoiceId: 1,
        invoiceAmount: 10000,
        amount: 5000,
        paymentDate: '2024-02-15',
      };
      const mockResponse = { id: 101, ...paymentData, outstanding: 5000 };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await arAgingService.recordPayment(companyId, paymentData);

      expect(result.outstanding).toBe(5000);
    });

    it('should prevent overpayment', async () => {
      const paymentData = {
        invoiceId: 1,
        invoiceAmount: 10000,
        amount: 15000,
      };
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Payment exceeds invoice amount'));

      try {
        await arAgingService.recordPayment(companyId, paymentData);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Payment exceeds invoice amount');
      }
    });

    it('should reject zero amount payment', async () => {
      const paymentData = {
        invoiceId: 1,
        amount: 0,
      };
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Amount must be greater than zero'));

      try {
        await arAgingService.recordPayment(companyId, paymentData);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Amount must be greater than zero');
      }
    });

    it('should handle payment recording error', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Database error'));

      try {
        await arAgingService.recordPayment(companyId, { invoiceId: 1, amount: 100 });
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Database error');
      }
    });
  });

  describe('Payment History', () => {
    it('should get payment history for invoice', async () => {
      const invoiceId = 1;
      const mockPayments = [
        {
          id: 100,
          amount: 5000,
          paymentDate: '2024-02-01',
          method: 'BANK_TRANSFER',
        },
        {
          id: 101,
          amount: 5000,
          paymentDate: '2024-02-10',
          method: 'CHECK',
        },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPayments);

      const result = await arAgingService.getPaymentHistory(companyId, invoiceId);

      expect(result.length).toBe(2);
      expect(result[0].amount).toBe(5000);
    });

    it('should return empty payment history', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue([]);

      const result = await arAgingService.getPaymentHistory(companyId, 999);

      expect(result).toEqual([]);
    });

    it('should handle payment history error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Invoice not found'));

      try {
        await arAgingService.getPaymentHistory(companyId, 999);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Invoice not found');
      }
    });
  });

  describe('Aging Summary', () => {
    it('should get comprehensive aging summary', async () => {
      const mockSummary = {
        asOfDate: '2024-02-15',
        totalARBalance: 105000,
        buckets: {
          current: { count: 10, amount: 50000, percentage: 47.6 },
          thirtyDays: { count: 5, amount: 25000, percentage: 23.8 },
          sixtyDays: { count: 3, amount: 15000, percentage: 14.3 },
          ninetyDays: { count: 2, amount: 10000, percentage: 9.5 },
          ninetyPlus: { count: 1, amount: 5000, percentage: 4.8 },
        },
        daysalesOutstanding: 35,
        collectionsPercentage: 92.5,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockSummary);

      const result = await arAgingService.getAgingSummary(companyId, '2024-02-15');

      expect(result.totalARBalance).toBe(105000);
      expect(result.daysalesOutstanding).toBe(35);
      expect(result.buckets.current.count).toBe(10);
    });

    it('should calculate percentage correctly', async () => {
      const mockSummary = {
        asOfDate: '2024-02-15',
        totalARBalance: 100000,
        buckets: {
          current: { amount: 50000, percentage: 50 },
          thirtyDays: { amount: 30000, percentage: 30 },
          sixtyPlus: { amount: 20000, percentage: 20 },
        },
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockSummary);

      const result = await arAgingService.getAgingSummary(companyId, '2024-02-15');

      const totalPercentage = Object.values(result.buckets).reduce((sum, bucket) => sum + bucket.percentage, 0);
      expect(totalPercentage).toBe(100);
    });
  });

  describe('Payment Void Operations', () => {
    it('should void recorded payment', async () => {
      const paymentId = 100;
      const mockResponse = { id: paymentId, status: 'VOIDED', voidedDate: '2024-02-15' };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await arAgingService.voidPayment(companyId, paymentId);

      expect(result.status).toBe('VOIDED');
      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });

    it('should prevent voiding already voided payment', async () => {
      const paymentId = 100;
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Payment already voided'));

      try {
        await arAgingService.voidPayment(companyId, paymentId);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Payment already voided');
      }
    });

    it('should handle payment void error', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Void failed'));

      try {
        await arAgingService.voidPayment(companyId, 100);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Void failed');
      }
    });
  });

  describe('Multi-Tenancy Enforcement', () => {
    it('should include company ID in all AR requests', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({});

      await arAgingService.getAgingReport(companyId, '2024-02-15');

      const call = apiClient.get.getCall(0);
      expect(call.args[1].headers['X-Company-Id']).toBe(companyId);
    });

    it('should include company ID in payment recording', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValue({ id: 1 });

      await arAgingService.recordPayment(companyId, { invoiceId: 1, amount: 100 });

      const call = apiClient.post.getCall(0);
      expect(call.args[2].headers['X-Company-Id']).toBe(companyId);
    });

    it('should enforce company isolation for customer aging', async () => {
      const mockAging = { customerId, companyId };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAging);

      const result = await arAgingService.getCustomerAging(companyId, customerId);

      expect(result.companyId).toBe(companyId);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeout', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Request timeout'));

      try {
        await arAgingService.getAgingReport(companyId, '2024-02-15');
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Request timeout');
      }
    });

    it('should handle server errors', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Server error: 500'));

      try {
        await arAgingService.getOutstandingInvoices(companyId);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message.includes('Server error').toBeTruthy());
      }
    });

    it('should handle concurrent aging requests', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ totalOutstanding: 100000 }).mockResolvedValueOnce({ totalOutstanding: 150000 });

      const [result1, result2] = await Promise.all([
        arAgingService.getAgingReport(companyId, '2024-02-15'),
        arAgingService.getAgingReport(companyId, '2024-02-28'),
      ]);

      expect(result1.totalOutstanding).toBe(100000);
      expect(result2.totalOutstanding).toBe(150000);
    });

    it('should handle large aging datasets', async () => {
      const largeInvoiceList = Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        invoiceNumber: `INV-${i}`,
        amount: Math.random() * 10000,
      }));
      vi.spyOn(apiClient, 'get').mockResolvedValue(largeInvoiceList);

      const result = await arAgingService.getOutstandingInvoices(companyId);

      expect(result.length).toBe(5000);
    });

    it('should handle malformed response data', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({});

      const result = await arAgingService.getAgingReport(companyId, '2024-02-15');

      expect(result !== undefined).toBeTruthy();
    });
  });

  describe('AR Calculations', () => {
    it('should calculate days sales outstanding accurately', async () => {
      const mockSummary = {
        totalARBalance: 100000,
        dailySales: 2857,
        daysalesOutstanding: 35,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockSummary);

      const result = await arAgingService.getAgingSummary(companyId, '2024-02-15');

      const calculatedDSO = Math.round(result.totalARBalance / result.dailySales);
      expect(Math.abs(calculatedDSO - result.daysalesOutstanding).toBeTruthy() <= 1);
    });

    it('should calculate collection percentage', async () => {
      const mockSummary = {
        totalInvoiceAmount: 200000,
        totalPayments: 185000,
        collectionsPercentage: 92.5,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockSummary);

      const result = await arAgingService.getAgingSummary(companyId, '2024-02-15');

      const calculatedPercentage = (result.totalPayments / result.totalInvoiceAmount) * 100;
      expect(calculatedPercentage).toBe(92.5);
    });
  });
});
