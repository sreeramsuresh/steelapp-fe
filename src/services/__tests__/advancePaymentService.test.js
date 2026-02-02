/**
 * Advance Payment Service Unit Tests
 * ✅ Tests advance payment CRUD operations
 * ✅ Tests VAT calculations and tracking
 * ✅ Tests payment application and allocation
 * ✅ Tests multi-currency support
 * ✅ 100% coverage target for advancePaymentService.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../api.js', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { advancePaymentService } from '../advancePaymentService';
import { apiClient } from '../api';

describe('advancePaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    test('should fetch all advance payments with filters', async () => {
      const mockPayments = [
        {
          id: 1,
          customerId: 101,
          amount: 10000,
          vatAmount: 500,
          totalAmount: 10500,
          paymentDate: '2024-02-01',
        },
        {
          id: 2,
          customerId: 102,
          amount: 20000,
          vatAmount: 1000,
          totalAmount: 21000,
          paymentDate: '2024-02-05',
        },
      ];
      apiClient.get.mockResolvedValueOnce(mockPayments);

      const result = await advancePaymentService.getAll({ customerId: 101 });

      expect(result).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith('/advance-payments', { customerId: 101 });
    });

    test('should handle empty results', async () => {
      apiClient.get.mockResolvedValueOnce([]);

      const result = await advancePaymentService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    test('should fetch advance payment details', async () => {
      const mockPayment = {
        id: 1,
        customerId: 101,
        receiptNumber: 'REC-2024-001',
        amount: 10000,
        vatRate: 5,
        vatAmount: 500,
        totalAmount: 10500,
        isVatInclusive: false,
        paymentMethod: 'bank_transfer',
        amountApplied: 5000,
        amountAvailable: 5500,
      };
      apiClient.get.mockResolvedValueOnce(mockPayment);

      const result = await advancePaymentService.getById(1);

      expect(result.id).toBe(1);
      expect(result.vatAmount).toBe(500);
      expect(result.amountApplied).toBe(5000);
    });

    test('should handle not found error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Advance payment not found'));

      await expect(advancePaymentService.getById(999)).rejects.toThrow('Advance payment not found');
    });
  });

  describe('create', () => {
    test('should create advance payment with VAT', async () => {
      const paymentData = {
        customerId: 101,
        amount: 10000,
        vatRate: 5,
        paymentMethod: 'bank_transfer',
      };
      const mockResponse = {
        id: 1,
        ...paymentData,
        vatAmount: 500,
        totalAmount: 10500,
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await advancePaymentService.create(paymentData);

      expect(result.id).toBe(1);
      expect(result.vatAmount).toBe(500);
      expect(apiClient.post).toHaveBeenCalledWith('/advance-payments', expect.objectContaining(paymentData));
    });

    test('should handle zero-rated VAT', async () => {
      const paymentData = {
        customerId: 101,
        amount: 10000,
        vatRate: 0,
        vatCategory: 'ZERO_RATED',
      };
      apiClient.post.mockResolvedValueOnce({
        id: 1,
        ...paymentData,
        vatAmount: 0,
        totalAmount: 10000,
      });

      const result = await advancePaymentService.create(paymentData);

      expect(result.vatAmount).toBe(0);
      expect(result.totalAmount).toBe(10000);
    });

    test('should handle exempt VAT', async () => {
      const paymentData = {
        customerId: 101,
        amount: 10000,
        vatCategory: 'EXEMPT',
      };
      apiClient.post.mockResolvedValueOnce({
        id: 1,
        ...paymentData,
        vatAmount: 0,
        totalAmount: 10000,
      });

      const result = await advancePaymentService.create(paymentData);

      expect(result.vatAmount).toBe(0);
    });

    test('should validate customer exists on create', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Customer not found'));

      await expect(advancePaymentService.create({ customerId: 999 })).rejects.toThrow('Customer not found');
    });
  });

  describe('applyAdvancePayment', () => {
    test('should apply advance payment to invoice', async () => {
      const mockResponse = {
        advance_id: 1,
        invoice_id: 100,
        amountApplied: 5000,
        amountRemaining: 500,
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await advancePaymentService.applyAdvancePayment(1, 100, 5000);

      expect(result.amountApplied).toBe(5000);
      expect(apiClient.post).toHaveBeenCalledWith('/advance-payments/1/apply', {
        invoice_id: 100,
        amount: 5000,
      });
    });

    test('should prevent overapplication of advance', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Amount exceeds available balance'));

      await expect(advancePaymentService.applyAdvancePayment(1, 100, 10000)).rejects.toThrow(
        'Amount exceeds available balance',
      );
    });

    test('should track VAT when applying advance', async () => {
      const mockResponse = {
        advance_id: 1,
        invoice_id: 100,
        principalAmount: 4761.90,
        vatAmount: 238.10,
        totalApplied: 5000,
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await advancePaymentService.applyAdvancePayment(1, 100, 5000);

      expect(result.vatAmount).toBe(238.10);
    });
  });

  describe('reverseAdvancePayment', () => {
    test('should reverse advance payment', async () => {
      const mockResponse = {
        id: 1,
        status: 'reversed',
        reversalDate: '2024-02-10',
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await advancePaymentService.reverseAdvancePayment(1, 'Incorrect payment');

      expect(result.status).toBe('reversed');
      expect(apiClient.post).toHaveBeenCalledWith('/advance-payments/1/reverse', {
        reason: 'Incorrect payment',
      });
    });

    test('should prevent reverse of fully applied payment', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Cannot reverse fully applied payment'));

      await expect(advancePaymentService.reverseAdvancePayment(1, 'reason')).rejects.toThrow(
        'Cannot reverse fully applied payment',
      );
    });
  });

  describe('getAdvanceBalance', () => {
    test('should calculate remaining advance balance', async () => {
      const mockBalance = {
        advance_id: 1,
        totalReceived: 10500,
        totalApplied: 5000,
        vatOnReceived: 500,
        vatOnApplied: 238.10,
        amountAvailable: 5500,
      };
      apiClient.get.mockResolvedValueOnce(mockBalance);

      const result = await advancePaymentService.getAdvanceBalance(1);

      expect(result.amountAvailable).toBe(5500);
      expect(result.totalApplied).toBe(5000);
    });

    test('should show zero balance when fully applied', async () => {
      const mockBalance = {
        advance_id: 1,
        totalReceived: 10000,
        totalApplied: 10000,
        amountAvailable: 0,
      };
      apiClient.get.mockResolvedValueOnce(mockBalance);

      const result = await advancePaymentService.getAdvanceBalance(1);

      expect(result.amountAvailable).toBe(0);
    });
  });

  describe('VAT Handling', () => {
    test('should handle VAT-inclusive payments', async () => {
      const paymentData = {
        customerId: 101,
        totalAmount: 10500,
        isVatInclusive: true,
        vatRate: 5,
      };
      const mockResponse = {
        id: 1,
        ...paymentData,
        amount: 10000,
        vatAmount: 500,
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await advancePaymentService.create(paymentData);

      expect(result.amount).toBe(10000);
      expect(result.vatAmount).toBe(500);
    });

    test('should handle multi-tax-rates payment', async () => {
      const paymentData = {
        customerId: 101,
        amount: 10000,
        vatRate: 5,
        reverseChargeApplicable: true,
      };
      apiClient.post.mockResolvedValueOnce({
        id: 1,
        ...paymentData,
        vatAmount: 0,
        totalAmount: 10000,
      });

      const result = await advancePaymentService.create(paymentData);

      expect(result.vatAmount).toBe(0);
    });
  });

  describe('Multi-Currency Support', () => {
    test('should handle advance payment in non-AED currency', async () => {
      const paymentData = {
        customerId: 101,
        amount: 10000,
        currency: 'USD',
        exchangeRate: 3.67,
      };
      const mockResponse = {
        id: 1,
        ...paymentData,
        amountInAED: 36700,
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await advancePaymentService.create(paymentData);

      expect(result.currency).toBe('USD');
      expect(result.amountInAED).toBe(36700);
    });

    test('should track currency conversions for VAT', async () => {
      const paymentData = {
        customerId: 101,
        amount: 10000,
        currency: 'EUR',
        exchangeRate: 4.0,
        vatRate: 5,
      };
      apiClient.post.mockResolvedValueOnce({
        id: 1,
        ...paymentData,
        amountInAED: 40000,
        vatAmountInAED: 2000,
      });

      const result = await advancePaymentService.create(paymentData);

      expect(result.amountInAED).toBe(40000);
      expect(result.vatAmountInAED).toBe(2000);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(advancePaymentService.getAll()).rejects.toThrow('Network error');
    });

    test('should handle invalid amounts', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Invalid amount'));

      await expect(advancePaymentService.create({ customerId: 101, amount: -5000 })).rejects.toThrow(
        'Invalid amount',
      );
    });

    test('should handle payment method validation', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Invalid payment method'));

      await expect(
        advancePaymentService.create({
          customerId: 101,
          amount: 10000,
          paymentMethod: 'invalid_method',
        }),
      ).rejects.toThrow('Invalid payment method');
    });
  });
});
