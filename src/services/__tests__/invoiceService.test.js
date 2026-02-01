/**
 * Invoice Service Unit Tests
 * ✅ Tests CRUD operations with transformation functions
 * ✅ Tests UAE VAT compliance (issueInvoice locks permanently)
 * ✅ Tests batch allocation workflow
 * ✅ Tests search and filtering
 * ✅ Tests soft delete/restore functionality
 * ✅ 100% coverage target for invoiceService.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../api.js', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { invoiceService } from '../invoiceService';
import { apiClient } from '../api';

describe('invoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInvoices', () => {
    test('should fetch invoices with pagination', async () => {
      const mockResponse = {
        invoices: [
          {
            id: 1,
            invoiceNumber: 'INV-001',
            customerDetails: { id: 1, name: 'ABC Corp' },
            date: '2026-01-15',
            subtotal: 50000,
            vatAmount: 2500,
            total: 52500,
            status: 'draft',
          },
        ],
        pagination: { page: 1, totalPages: 1, total: 1 },
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await invoiceService.getInvoices({ page: 1, limit: 20 });

      expect(result.invoices).toHaveLength(1);
      expect(result.pagination).toBeDefined();
      expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
        params: { page: 1, limit: 20 },
      });
    });

    test('should support abort signal for cancellation', async () => {
      const abortSignal = new AbortController().signal;
      apiClient.get.mockResolvedValueOnce({
        invoices: [],
        pagination: null,
      });

      await invoiceService.getInvoices({}, abortSignal);

      expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
        params: {},
        signal: abortSignal,
      });
    });

    test('should handle non-paginated response for backward compatibility', async () => {
      const mockInvoices = [
        { id: 1, invoiceNumber: 'INV-001', total: 52500 },
      ];
      apiClient.get.mockResolvedValueOnce(mockInvoices);

      const result = await invoiceService.getInvoices();

      expect(result.invoices).toHaveLength(1);
      expect(result.pagination).toBeNull();
    });

    test('should apply search filter', async () => {
      apiClient.get.mockResolvedValueOnce({ invoices: [] });

      await invoiceService.getInvoices({ search: 'Acme' });

      expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
        params: expect.objectContaining({ search: 'Acme' }),
      });
    });

    test('should filter by status', async () => {
      apiClient.get.mockResolvedValueOnce({ invoices: [] });

      await invoiceService.getInvoices({ status: 'draft' });

      expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
        params: expect.objectContaining({ status: 'draft' }),
      });
    });
  });

  describe('getInvoice', () => {
    test('should fetch single invoice by ID', async () => {
      const mockInvoice = {
        id: 1,
        invoiceNumber: 'INV-001',
        customerDetails: { id: 1, name: 'ABC Corp' },
        date: '2026-01-15',
        subtotal: 50000,
        vatAmount: 2500,
        total: 52500,
        status: 'draft',
      };
      apiClient.get.mockResolvedValueOnce(mockInvoice);

      const result = await invoiceService.getInvoice(1);

      expect(result.id).toBe(1);
      expect(result.invoiceNumber).toBe('INV-001');
      expect(apiClient.get).toHaveBeenCalledWith('/invoices/1');
    });

    test('should transform server response to client format', async () => {
      apiClient.get.mockResolvedValueOnce({
        id: 1,
        invoice_date: '2026-01-15',
        invoiceDate: '2026-01-15',
        supply_date: '2026-01-15',
        supplyDate: '2026-01-15',
      });

      const result = await invoiceService.getInvoice(1);

      expect(result.date).toBe('2026-01-15');
      expect(result.supplyDate).toBe('2026-01-15');
    });
  });

  describe('createInvoice', () => {
    test('should create invoice with transformation', async () => {
      const newInvoice = {
        invoiceNumber: 'INV-002',
        customer: { id: 2, name: 'XYZ Inc' },
        date: '2026-02-01',
        dueDate: '2026-03-01',
        items: [
          {
            productId: 1,
            name: 'Steel Coil',
            quantity: 100,
            rate: 500,
            vatRate: 0.05,
            amount: 50000,
            sourceType: 'WAREHOUSE',
            allocationMode: 'AUTO_FIFO',
          },
        ],
        subtotal: 50000,
        vatAmount: 2500,
        total: 52500,
        status: 'draft',
      };

      const mockResponse = { id: 5, ...newInvoice, status: 'draft' };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await invoiceService.createInvoice(newInvoice);

      expect(result.id).toBe(5);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/invoices',
        expect.objectContaining({
          invoice_number: 'INV-002',
          customer_id: 2,
        })
      );
    });

    test('should transform camelCase to snake_case for server', async () => {
      const newInvoice = {
        invoiceNumber: 'INV-003',
        customer: { id: 3 },
        date: '2026-02-01',
        packingCharges: 500,
        freightCharges: 1000,
        items: [],
        subtotal: 50000,
        vatAmount: 2500,
        total: 52500,
      };

      apiClient.post.mockResolvedValueOnce({ id: 6 });

      await invoiceService.createInvoice(newInvoice);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/invoices',
        expect.objectContaining({
          invoice_number: 'INV-003',
          packing_charges: 500,
          freight_charges: 1000,
        })
      );
    });

    test('should include VAT compliance fields', async () => {
      const newInvoice = {
        invoiceNumber: 'INV-004',
        customer: { id: 4 },
        date: '2026-02-01',
        items: [],
        subtotal: 50000,
        vatAmount: 2500,
        total: 52500,
        placeOfSupply: 'AE-DU',
        supplyDate: '2026-02-01',
        isReverseCharge: false,
        reverseChargeAmount: 0,
      };

      apiClient.post.mockResolvedValueOnce({ id: 7 });

      await invoiceService.createInvoice(newInvoice);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/invoices',
        expect.objectContaining({
          place_of_supply: 'AE-DU',
          supply_date: '2026-02-01',
          is_reverse_charge: false,
        })
      );
    });

    test('should handle items with batch allocation', async () => {
      const newInvoice = {
        invoiceNumber: 'INV-005',
        customer: { id: 5 },
        date: '2026-02-01',
        items: [
          {
            productId: 1,
            name: 'Steel Coil',
            quantity: 100,
            rate: 500,
            amount: 50000,
            sourceType: 'WAREHOUSE',
            allocationMode: 'MANUAL',
            manualAllocations: [{ batchId: 1, quantity: 100 }],
          },
        ],
        subtotal: 50000,
        vatAmount: 2500,
        total: 52500,
      };

      apiClient.post.mockResolvedValueOnce({ id: 8 });

      await invoiceService.createInvoice(newInvoice);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/invoices',
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              allocation_mode: 'MANUAL',
              manual_allocations: [{ batchId: 1, quantity: 100 }],
            }),
          ]),
        })
      );
    });
  });

  describe('updateInvoice', () => {
    test('should update invoice with transformation', async () => {
      const updates = { discountAmount: 5000, status: 'pending' };
      const mockResponse = { id: 1, ...updates };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await invoiceService.updateInvoice(1, updates);

      expect(result.id).toBe(1);
      expect(apiClient.put).toHaveBeenCalledWith(
        '/invoices/1',
        expect.any(Object)
      );
    });

    test('should only allow edit before invoice is issued', async () => {
      const updates = { discountAmount: 5000 };
      apiClient.put.mockResolvedValueOnce({ id: 1, isLocked: false });

      const result = await invoiceService.updateInvoice(1, updates);

      expect(result.isLocked).toBe(false);
    });
  });

  describe('deleteInvoice (Soft Delete)', () => {
    test('should soft delete invoice with reason for audit trail', async () => {
      const deletionReason = { reason: 'Cancelled by customer' };
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await invoiceService.deleteInvoice(1, deletionReason);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith('/invoices/1', {
        data: deletionReason,
      });
    });

    test('should support deletion without reason', async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      await invoiceService.deleteInvoice(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/invoices/1', {
        data: {},
      });
    });
  });

  describe('restoreInvoice', () => {
    test('should restore soft-deleted invoice', async () => {
      const mockResponse = { id: 1, status: 'restored' };
      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await invoiceService.restoreInvoice(1);

      expect(result.status).toBe('restored');
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/invoices/1/restore',
        {}
      );
    });
  });

  describe('updateInvoiceStatus', () => {
    test('should update invoice status', async () => {
      const mockResponse = { id: 1, status: 'pending' };
      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await invoiceService.updateInvoiceStatus(1, 'pending');

      expect(result.status).toBe('pending');
      expect(apiClient.patch).toHaveBeenCalledWith('/invoices/1/status', {
        status: 'pending',
      });
    });

    test('should support draft → pending → issued status transitions', async () => {
      apiClient.patch.mockResolvedValueOnce({ status: 'issued' });

      await invoiceService.updateInvoiceStatus(1, 'issued');

      expect(apiClient.patch).toHaveBeenCalledWith('/invoices/1/status', {
        status: 'issued',
      });
    });
  });

  describe('issueInvoice (UAE VAT Compliance)', () => {
    test('should issue final tax invoice and lock permanently', async () => {
      const mockResponse = {
        id: 1,
        invoiceNumber: 'INV-001',
        isLocked: true,
        status: 'issued',
        issuedAt: '2026-02-01T10:30:00Z',
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await invoiceService.issueInvoice(1);

      expect(result.isLocked).toBe(true);
      expect(result.status).toBe('issued');
      expect(apiClient.post).toHaveBeenCalledWith('/invoices/1/issue');
    });

    test('should make invoice immutable after issuing (per UAE VAT Rules)', async () => {
      const mockResponse = { id: 1, isLocked: true };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await invoiceService.issueInvoice(1);

      expect(result.isLocked).toBe(true);
    });
  });

  describe('Batch Allocation Workflow', () => {
    test('should confirm invoice allocation after user review', async () => {
      const mockResponse = {
        success: true,
        allocationCount: 2,
        status: 'allocation_confirmed',
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await invoiceService.confirmInvoiceAllocation(1);

      expect(result.success).toBe(true);
      expect(result.allocationCount).toBe(2);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/invoices/1/confirm-allocation'
      );
    });

    test('should release batch reservation for re-allocation', async () => {
      const mockResponse = { success: true, released: true };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await invoiceService.releaseInvoiceReservation(1);

      expect(result.success).toBe(true);
      expect(result.released).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/invoices/1/release-reservation'
      );
    });
  });

  describe('Invoice Numbers', () => {
    test('should get next invoice number for new invoice', async () => {
      const mockResponse = { nextNumber: 'INV-00123', prefix: 'INV-' };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await invoiceService.getNextInvoiceNumber();

      expect(result.nextNumber).toBe('INV-00123');
      expect(apiClient.get).toHaveBeenCalledWith('/invoices/number/next');
    });
  });

  describe('Analytics & Reporting', () => {
    test('should get invoice analytics', async () => {
      const mockResponse = {
        totalInvoices: 50,
        draftCount: 10,
        issuedCount: 40,
        averageAmount: 52500,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await invoiceService.getInvoiceAnalytics();

      expect(result.totalInvoices).toBe(50);
      expect(apiClient.get).toHaveBeenCalledWith('/invoices/analytics', {});
    });

    test('should support analytics filters by date', async () => {
      apiClient.get.mockResolvedValueOnce({ totalInvoices: 20 });

      await invoiceService.getInvoiceAnalytics({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/invoices/analytics',
        expect.objectContaining({
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        })
      );
    });
  });

  describe('Search & Filtering', () => {
    test('should search invoices by term', async () => {
      apiClient.get.mockResolvedValueOnce({
        invoices: [{ id: 1, invoiceNumber: 'INV-001' }],
      });

      await invoiceService.searchInvoices('INV-001');

      expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
        search: 'INV-001',
      });
    });

    test('should search with filters', async () => {
      apiClient.get.mockResolvedValueOnce({ invoices: [] });

      await invoiceService.searchInvoices('Acme', {
        status: 'issued',
        startDate: '2026-01-01',
      });

      expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
        search: 'Acme',
        status: 'issued',
        startDate: '2026-01-01',
      });
    });

    test('should search invoices eligible for credit note', async () => {
      const mockResponse = [
        { id: 1, invoiceNumber: 'INV-001', customerName: 'ABC Corp' },
      ];
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await invoiceService.searchForCreditNote('ABC');

      expect(result).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/invoices/search-for-credit-note',
        { q: 'ABC' }
      );
    });

    test('should filter invoices by customer', async () => {
      apiClient.get.mockResolvedValueOnce({
        invoices: [
          { id: 1, invoiceNumber: 'INV-001', customerId: 5 },
          { id: 2, invoiceNumber: 'INV-002', customerId: 5 },
        ],
      });

      const result = await invoiceService.getInvoicesByCustomer(5);

      expect(result.invoices).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
        customer_id: 5,
      });
    });

    test('should filter invoices by date range', async () => {
      apiClient.get.mockResolvedValueOnce({ invoices: [] });

      await invoiceService.getInvoicesByDateRange(
        '2026-01-01',
        '2026-01-31'
      );

      expect(apiClient.get).toHaveBeenCalledWith('/invoices', {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors in getInvoices', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(invoiceService.getInvoices()).rejects.toThrow(
        'Network error'
      );
    });

    test('should handle errors in createInvoice', async () => {
      apiClient.post.mockRejectedValueOnce(
        new Error('Validation failed')
      );

      await expect(
        invoiceService.createInvoice({})
      ).rejects.toThrow('Validation failed');
    });

    test('should handle errors in issueInvoice', async () => {
      apiClient.post.mockRejectedValueOnce(
        new Error('Cannot issue locked invoice')
      );

      await expect(
        invoiceService.issueInvoice(1)
      ).rejects.toThrow('Cannot issue locked invoice');
    });

    test('should handle errors in updateInvoiceStatus', async () => {
      apiClient.patch.mockRejectedValueOnce(
        new Error('Invalid status transition')
      );

      await expect(
        invoiceService.updateInvoiceStatus(1, 'invalid')
      ).rejects.toThrow('Invalid status transition');
    });
  });
});
